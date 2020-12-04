
import { Meteor } from 'meteor/meteor'
import lodash from 'lodash'; 
import moment from 'moment'; 

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

// import NumericInput from 'react-numeric-input2';

import Spinner from './Spinner';
import Message from './Message';

import { Cumulos_Registro } from '/imports/collections/principales/cumulos_registro';
import validarItemVsSimpleSchema from '/client/imports/general/validarItemVsSimpleSchema';

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

const Detalles = ({ itemId, cumulos, modo, setCurrentTab }) => {

    const [spinner, setSpinner] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' });

    // para saber si el usuario cambió el valor en el input 
    const [inputChanged, setInputChanged] = useState(false); 

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

            // nótese como cambiamos las fechas a strings para que puedan ser recibidas por los inputs 
            item.desde = moment(item.desde).format("YYYY-MM-DD"); 
            item.hasta = moment(item.hasta).format("YYYY-MM-DD"); 

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
        setInputChanged(true);      // para saber que el valor en el input fue editado 
    }

    const handleOnBlur = (e) => {
        // solo continuamos si el usuario cambio el valor en el input 
        if (!inputChanged) {
            return;
        }

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

        // ahora intentamos calcular las primias ... 
        if (name === "primaSeguro") {
            if (!values.primaAceptada) { values.primaAceptada = value }
            values.primaCumulo = values.primaAceptada - values.primaCesionCuotaParte - values.primaCesionExcedente - values.primaCesionFacultativo;
        }

        if (name === "primaAceptada" || name === "primaCesionCuotaParte" || name === "primaCesionExcedente" || name === "primaCesionFacultativo") {
            values.primaCumulo = values.primaAceptada - values.primaCesionCuotaParte - values.primaCesionExcedente - values.primaCesionFacultativo;
        }

        setFormValues({ ...values, [name]: value });
    } 

    // la idea es saber, cada vez que el usuario sale de un input, si lo cambio. Ponemos la variable en false cada vez que se entra a un input 
    const handleOnFocus = () => {
        setInputChanged(false);      // para saber que el valor en el input fue editado; al entrar a un input ponemos el toogle en false
    }; 

    const handleSubmit = (e) => {

        e.preventDefault();

        const userEmail = Meteor.user().emails[0].address;

        // nótese cómo intentamos hacer un clean del item; por ejemplo: los inputs regresan los números como strings, pero 
        // la validación en simpl-schema espera números o, de otra forma, falla. Con esta función convertimos: "100.57" en 100.57 
        const item = { ...formValues };

        // convertimos el string que regresa el Input a un date; no usamos new Date("2020-11-01") pues convertiría a global time
        // en vez de local; moment, en cambio, regresa local time 
        item.desde = moment(item.desde).toDate();
        item.hasta = moment(item.hasta).toDate(); 

        // usamos este método de simpleSchema para, básicamente, convertir los montos en strings to montos (ej: '20.15' --> 20.15)
        const cleanItem = Cumulos_Registro.simpleSchema().clean(item);

        // completamos el item para hacer el insert en mongo 
        const values = {
            ...cleanItem,
            ultAct: new Date(),
            ultUsuario: userEmail,
        };

        // esta función recibe un item (object) y lo valida contra su schema (simpl_schema)
        const validarResult = validarItemVsSimpleSchema(values, Cumulos_Registro.simpleSchema());

        if (validarResult.error) {
            setShowMessage({ show: true, type: 'danger', message: validarResult.message });
            return;
        }

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
                            <Col sm={3} smOffset={8} style={{ textAlign: 'right' }}>
                                <Button bsStyle="link" onClick={() => setCurrentTab(1)}>
                                    <span style={{ fontStyle: 'italic' }}>Regresar a la lista</span>
                                </Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col sm={3} smOffset={0} >
                                <FormGroup>
                                    <ControlLabel>Origen</ControlLabel>
                                    <FormControl componentClass="select"
                                        name="origen"
                                        value={formValues.origen}
                                        bsSize="small"
                                        onFocus={() => handleOnFocus()}
                                        onChange={(e) => onInputChange(e)}>
                                        <option value="fac">fac</option>
                                        <option value="prop">prop</option>
                                        <option value="noProp">noProp</option>
                                    </FormControl>
                                </FormGroup>
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FormGroup>
                                    <ControlLabel>Cúmulo (tipo)</ControlLabel>
                                    <FormControl componentClass="select"
                                        name="tipoCumulo"
                                        value={formValues.tipoCumulo}
                                        bsSize="small"
                                        onFocus={() => handleOnFocus()}
                                        onChange={(e) => onInputChange(e)}>
                                        {
                                            lodash.sortBy(cumulos, ['descripcion']).map(x => (
                                                <option key={x._id} value={x._id}>{x.descripcion}</option>)
                                            )

                                        }
                                    </FormControl>
                                </FormGroup>
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FormGroup>
                                    <ControlLabel>Zona</ControlLabel>
                                    <FormControl componentClass="select"
                                        name="zona"
                                        value={formValues.zona}
                                        bsSize="small"
                                        onFocus={() => handleOnFocus()}
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
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="desde"
                                    name="desde"
                                    value={formValues.desde}
                                    type="date"
                                    label="Desde"
                                    onFocus={() => handleOnFocus()}
                                    onBlur={(e) => handleOnBlur(e)}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="hasta"
                                    name="hasta"
                                    value={formValues.hasta}
                                    type="date"
                                    label="Hasta"
                                    onFocus={() => handleOnFocus()}
                                    onBlur={(e) => handleOnBlur(e)}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="valorARiesgo"
                                    name="valorARiesgo"
                                    value={formValues.valorARiesgo}
                                    type="number"
                                    label="Valor a riesgo"
                                    onFocus={() => handleOnFocus()}
                                    onBlur={(e) => handleOnBlur(e)}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="sumaAsegurada"
                                    name="sumaAsegurada"
                                    value={formValues.sumaAsegurada}
                                    type="number"
                                    label="Suma asegurada"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="primaSeguro"
                                    name="primaSeguro"
                                    value={formValues.primaSeguro}
                                    type="number"
                                    label="Prima del seguro"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="montoAceptado"
                                    name="montoAceptado"
                                    value={formValues.montoAceptado}
                                    type="number"
                                    label="Monto aceptado"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="primaAceptada"
                                    name="primaAceptada"
                                    value={formValues.primaAceptada}
                                    type="number"
                                    label="Prima por monto aceptado"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="cesionCuotaParte"
                                    name="cesionCuotaParte"
                                    value={formValues.cesionCuotaParte}
                                    type="number"
                                    label="Cesión cuota parte"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="primaCesionCuotaParte"
                                    name="primaCesionCuotaParte"
                                    value={formValues.primaCesionCuotaParte}
                                    type="number"
                                    label="Prima por cesión cuota parte"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="cesionExcedente"
                                    name="cesionExcedente"
                                    value={formValues.cesionExcedente}
                                    type="number"
                                    label="Cesión excedente"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="primaCesionExcedente"
                                    name="primaCesionExcedente"
                                    value={formValues.primaCesionExcedente}
                                    type="number"
                                    label="Prima por cesión excedente"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="cesionFacultativo"
                                    name="cesionFacultativo"
                                    value={formValues.cesionFacultativo}
                                    type="number"
                                    label="Cesión facultativo"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="primaCesionFacultativo"
                                    name="primaCesionFacultativo"
                                    value={formValues.primaCesionFacultativo}
                                    type="number"
                                    label="Prima por cesión facultativo"
                                    onBlur={(e) => handleOnBlur(e)}
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="cumulo"
                                    name="cumulo"
                                    value={formValues.cumulo}
                                    type="number"
                                    label="Cúmulo"
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                            <Col sm={3} smOffset={0} >
                                <FieldGroup
                                    id="primaCumulo"
                                    name="primaCumulo"
                                    value={formValues.primaCumulo}
                                    type="number"
                                    label="Prima por monto cúmulo"
                                    onFocus={() => handleOnFocus()}
                                    onChange={(e) => onInputChange(e)} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={11} smOffset={1} style={{ textAlign: 'right' }}>
                                { modo != "consulta" && 
                                  <Button bsStyle="primary" bsSize="small" type="submit">Grabar</Button>
                                }
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
    setCurrentTab: PropTypes.func.isRequired
};

export default Detalles; 