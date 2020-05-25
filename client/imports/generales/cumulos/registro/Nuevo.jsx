
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import lodash from 'lodash'; 

import React, { useState } from 'react' 
import PropTypes from 'prop-types';

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

const inicializarZonas = cumulos => { 
    // la idea es que la 1ra vez, las zonas deben ser las del 1er cúmulo en el array de cúmulos 
    const cumulo = Array.isArray(cumulos) && cumulos.length ? cumulos[0] : []; 
    const zonas = cumulo.zonas ? cumulo.zonas : [];
    return zonas; 
}

const Nuevo = ({ defaults, cumulos, ciaSeleccionadaId }) => { 

    const [spinner, setSpinner] = useState(false); 
    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' }); 

    // options para el select de zonas; cambia cuando el usuario cambia el cúmulo 
    const [zonas, setZonas] = useState(() => inicializarZonas(cumulos)); 

    const [formValues, setFormValues] = useState({ 
        ...defaults, 
        tipoCumulo: cumulos && cumulos.length ? cumulos[0]._id : '', 
        zona: (zonas && zonas.length) ? zonas[0]._id : '',  
        valorARiesgo: 0, 
        sumaAsegurada: 0,
        montoAceptado: 0,
        cesionCuotaParte: 0,
        cesionExcedente: 0,
        cesionFacultativo: 0,
        cumulo: 0,
    })

    const handleMessageDismiss = () => { 
        setShowMessage({ show: false, type: '', message: '' }); 
    }

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;
        
        if (name === "tipoCumulo") { 
            // determinamos las zonas para el cúmulo seleccionado 
            const tipoCumulo = cumulos.find(x => x._id === value); 
            const zonas = tipoCumulo.zonas ? tipoCumulo.zonas : []; 
            setZonas(zonas); 

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
            _id: new Mongo.ObjectID()._str,
            ...formValues, 
            ingreso: new Date(),
            usuario: userEmail,
            cia: ciaSeleccionadaId,
         }; 

        // TODO: validar? 

        setSpinner(true); 

        Meteor.call('cumulos_registro.save.insert', values, (err, result) => {

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

            // finalmente, reiniciamos la forma para permitir al usuario grabar otro item 
            setFormValues({ 
                ...defaults,
                tipoCumulo: (cumulos && cumulos.length) ? cumulos[0]._id : '', 
                zona: (cumulos && cumulos.length && cumulos.zonas && cumulos.zonas.length) ? cumulos[0].zonas[0]._id : '', 
                valorARiesgo: 0,
                sumaAsegurada: 0,
                montoAceptado: 0,
                cesionCuotaParte: 0,
                cesionExcedente: 0,
                cesionFacultativo: 0,
                cumulo: 0,
            })

            setZonas(() => inicializarZonas(cumulos));      // para que se muestren las zonas del 1er. cúmulo 

            setSpinner(false); 
            setShowMessage({ show: true, type: 'info', message: result.message });
        })
    }

    return (
        <div>
            { spinner 
                ? 
                    <div style={{ marginTop: '15px' }}>
                        <Spinner /> 
                    </div>
                : 
                    null 
            }

            { showMessage.show 
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
                            <Button bsStyle="primary" bsSize="small" type="submit">Grabar</Button>
                        </Col>
                    </Row>
                </Grid>
            </form>
        </div>
    )
}

Nuevo.propTypes = {
    defaults: PropTypes.object.isRequired, 
    cumulos: PropTypes.array.isRequired, 
    ciaSeleccionadaId: PropTypes.string.isRequired
};

export default Nuevo; 