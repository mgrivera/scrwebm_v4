
import { Meteor } from 'meteor/meteor'
import lodash from 'lodash'; 

import React, { useState } from 'react'
import PropTypes from 'prop-types';

import { useTracker } from 'meteor/react-meteor-data';

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';

import Button from 'react-bootstrap/lib/Button';

import Spinner from './Spinner';
import Message from './Message';

import { Cumulos_Registro } from '/imports/collections/principales/cumulos_registro';

const FieldGroup = ({ id, label, help, ...props }) => {
    return (
        <FormGroup controlId={id} bsSize="small">
            <ControlLabel>{label}</ControlLabel>
            <FormControl {...props} />
            {help && <HelpBlock>{help}</HelpBlock>}
        </FormGroup>
    );
}

FieldGroup.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    help: PropTypes.string,
};

const inicializarZonas = (cumuloId, cumulos) => {
    // seleccionamos las zonas que corresponden al cúmulo en el item 
    // la idea es usar como opciones en el select de zonas 
    const cumulo = cumuloId ? cumulos.find(x => x._id === cumuloId) : {}; 
    const zonas = cumulo && cumulo.zonas ? cumulo.zonas : []; 
    return zonas;
}

const Detalles = ({ itemId, cumulos, modo }) => {

    const [spinner, setSpinner] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' });

    // options para el select de zonas; cambia cuando el usuario cambia el cúmulo 
    // la 1ra vez, deben ser las zonas para el cúmulo que viene en el item 
    const [zonas, setZonas] = useState([]);
    const [formValues, setFormValues] = useState({})

    // TODO: tenemos que usar un useTracker para leer el item desde cumulos_registro 
    const itemLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('cumulosRegistro', { _id: itemId });
        return !handle.ready();

    }, []);

    useTracker(() => { 
        const item = Cumulos_Registro.findOne(itemId); 
        if (item) { 
            setFormValues(item); 
            setZonas(() => inicializarZonas(item.tipoCumulo, cumulos))
        }
    }, [itemId]); 

    const handleMessageDismiss = () => {
        setShowMessage({ show: false, type: '', message: '' });
    }

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        if (name === "tipoCumulo") {
            // determinamos las zonas para el cúmulo seleccionado 
            setZonas(() => inicializarZonas(value, cumulos))

            // nos aseguramos que la 1ra. de las zonas, para el cúmulo seleccionado, inicialize al state 
            values.zona = (zonas && zonas.length) ? zonas[0]._id : '';
        }

        setFormValues({ ...values, [name]: value });
    }

    const handleOnBlur = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        if (name === "valorARiesgo") {
            if (!values.sumaAsegurada) { values.sumaAsegurada = value }
            if (!values.montoAceptado) { values.montoAceptado = value }
            values.cumulo = values.montoAceptado - values.cesionCuotaParte - values.cesionExcedente - values.cesionFacultativo;
        }

        if (name === "sumaAsegurada") {
            values.montoAceptado = value;
            values.cumulo = values.montoAceptado - values.cesionCuotaParte - values.cesionExcedente - values.cesionFacultativo;
        }

        if (name === "montoAceptado" || name === "cesionCuotaParte" || name === "cesionExcedente" || name === "cesionFacultativo") {
            values.cumulo = values.montoAceptado - values.cesionCuotaParte - values.cesionExcedente - values.cesionFacultativo;
        }

        setFormValues({ ...values, [name]: value });
    } 

    const handleSubmit = (e) => {

        e.preventDefault();

        const userEmail = Meteor.user().emails[0].address;

        // completamos el item para hacer el insert en mongo 
        const values = {
            ...formValues,
            ultAct: new Date(),
            ultUsuario: userEmail,
        };

        // TODO: validar? 

        setSpinner(true);

        Meteor.call('cumulos_registro.save.update', values, (err, result) => {

            if (err) {
                setShowMessage({ show: true, type: 'danger', message: err.message });
                setSpinner(false);

                return;
            }

            if (result.error) {
                setShowMessage({ show: true, type: 'danger', message: result.message });
                setSpinner(false);

                return;
            }

            setSpinner(false);
            setShowMessage({ show: true, type: 'info', message: result.message });
        })
    }

    return (!itemId ? (
        <div style={{ marginTop: '15px' }} >
            <p style={{ color: 'red' }}>
                Ud. debe seleccionar un registro en la lista, para poder ver aquí sus detalles y, si lo desea, editar sus valores.
            </p>
        </div >
    ) : (
        itemLoading ? (
            <div style={{ marginTop: '15px' }} >
                <Spinner />
            </div >
        ) :
            (
                <div>
                    {spinner
                        ?
                        <div style={{ marginTop: '15px' }}>
                            <Spinner />
                        </div>
                        :
                        null
                    }

                    {showMessage.show
                        ?
                        <div style={{ marginTop: '15px' }}>
                            <Message type={showMessage.type}
                                message={showMessage.message}
                                handleMessageDismiss={handleMessageDismiss} />
                        </div>
                        :
                        null
                    }

                    <form onSubmit={(e) => handleSubmit(e)} style={{ marginTop: '20px' }}>
                        <Grid fluid={true}>
                            <Row>
                                <Col sm={4} smOffset={0} >
                                    <FormGroup>
                                        <ControlLabel>Origen</ControlLabel>
                                        <FormControl componentClass="select"
                                            name="origen"
                                            value={formValues.origen}
                                            bsSize="small"
                                            onChange={(e) => onInputChange(e)}>
                                            <option value="fac">fac</option>
                                            <option value="prop">prop</option>
                                            <option value="noProp">noProp</option>
                                        </FormControl>
                                    </FormGroup>
                                </Col>
                                <Col sm={4} smOffset={0} >
                                    <FormGroup>
                                        <ControlLabel>Cúmulo (tipo)</ControlLabel>
                                        <FormControl componentClass="select"
                                            name="tipoCumulo"
                                            value={formValues.tipoCumulo}
                                            bsSize="small"
                                            onChange={(e) => onInputChange(e)}>
                                            {
                                                lodash.sortBy(cumulos, ['descripcion']).map(x => (
                                                    <option key={x._id} value={x._id}>{x.descripcion}</option>)
                                                )

                                            }
                                        </FormControl>
                                    </FormGroup>
                                </Col>
                                <Col sm={4} smOffset={0} >
                                    <FormGroup>
                                        <ControlLabel>Zona</ControlLabel>
                                        <FormControl componentClass="select"
                                            name="zona"
                                            value={formValues.zona}
                                            bsSize="small"
                                            onChange={(e) => onInputChange(e)}>
                                            {
                                                lodash.sortBy(zonas, ['descripcion']).map(x => (
                                                    <option key={x._id} value={x._id}>{x.descripcion}</option>)
                                                )
                                            }
                                        </FormControl>
                                    </FormGroup>
                                </Col>
                            </Row>

                                <Row>
                                    <Col sm={4} smOffset={0} >
                                        <FieldGroup
                                            name="valorARiesgo"
                                            value={formValues.valorARiesgo}
                                            type="number"
                                            label="Valor a riesgo"
                                            onBlur={(e) => handleOnBlur(e)}
                                            onChange={(e) => onInputChange(e)} />
                                    </Col>
                                    <Col sm={4} smOffset={0} >
                                        <FieldGroup
                                            name="sumaAsegurada"
                                            value={formValues.sumaAsegurada}
                                            type="number"
                                            label="Suma asegurada"
                                            onBlur={(e) => handleOnBlur(e)}
                                            onChange={(e) => onInputChange(e)} />
                                    </Col>
                                    <Col sm={4} smOffset={0} >
                                        <FieldGroup
                                            name="montoAceptado"
                                            value={formValues.montoAceptado}
                                            type="number"
                                            label="Monto aceptado"
                                            onBlur={(e) => handleOnBlur(e)}
                                            onChange={(e) => onInputChange(e)} />
                                    </Col>
                                </Row>

                                <Row>
                                    <Col sm={4} smOffset={0} >
                                        <FieldGroup
                                            name="cesionCuotaParte"
                                            value={formValues.cesionCuotaParte}
                                            type="number"
                                            label="Cesión cuota parte"
                                            onBlur={(e) => handleOnBlur(e)}
                                            onChange={(e) => onInputChange(e)} />
                                    </Col>
                                    <Col sm={4} smOffset={0} >
                                        <FieldGroup
                                            name="cesionExcedente"
                                            value={formValues.cesionExcedente}
                                            type="number"
                                            label="Cesión excedente"
                                            onBlur={(e) => handleOnBlur(e)}
                                            onChange={(e) => onInputChange(e)} />
                                    </Col>
                                    <Col sm={4} smOffset={0} >
                                        <FieldGroup
                                            name="cesionFacultativo"
                                            value={formValues.cesionFacultativo}
                                            type="number"
                                            label="Cesión facultativo"
                                            onBlur={(e) => handleOnBlur(e)}
                                            onChange={(e) => onInputChange(e)} />
                                    </Col>
                                </Row>

                                <Row>
                                    <Col sm={4} smOffset={0} />
                                    <Col sm={4} smOffset={0} />
                                    <Col sm={4} smOffset={0} >
                                        <FieldGroup
                                            name="cumulo"
                                            value={formValues.cumulo}
                                            type="number"
                                            label="Cúmulo"
                                            onChange={(e) => onInputChange(e)} />
                                    </Col>
                                </Row>

                            <Row>
                                <Col sm={11} smOffset={1} style={{ textAlign: 'right' }}>
                                    {modo != "consulta" && <Button bsStyle="primary" bsSize="small" type="submit">Grabar</Button>}
                                </Col>
                            </Row>
                        </Grid>
                    </form>
                </div>
            )
    ))
}

Detalles.propTypes = {
    modo: PropTypes.string.isRequired,      // edicion / consulta
    itemId: PropTypes.string.isRequired,
    cumulos: PropTypes.array.isRequired,
};

export default Detalles; 