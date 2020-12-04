
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import lodash from 'lodash'; 
import moment from 'moment'; 

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

const inicializarZonas = cumulos => { 
    // la idea es que la 1ra vez, las zonas deben ser las del 1er cúmulo en el array de cúmulos 
    const cumulo = Array.isArray(cumulos) && cumulos.length ? cumulos[0] : []; 
    const zonas = cumulo.zonas ? cumulo.zonas : [];
    return zonas; 
}

const Nuevo = ({ defaults, cumulos, ciaSeleccionadaId, setCurrentTab }) => { 

    const [spinner, setSpinner] = useState(false); 
    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' }); 

    // para saber si el usuario cambió el valor en el input 
    const [inputChanged, setInputChanged] = useState(false); 

    // options para el select de zonas; cambia cuando el usuario cambia el cúmulo 
    const [zonas, setZonas] = useState(() => inicializarZonas(cumulos));         

    const [formValues, setFormValues] = useState({ 
        ...defaults, 
        tipoCumulo: cumulos && cumulos.length ? cumulos[0]._id : '', 
        zona: (zonas && zonas.length) ? zonas[0]._id : '',  
        desde: moment(new Date()).format("YYYY-MM-DD"), 
        hasta: moment(new Date()).format("YYYY-MM-DD"), 
        valorARiesgo: 0, 
        sumaAsegurada: 0,
        primaSeguro: 0, 
        montoAceptado: 0,
        primaAceptada: 0, 
        cesionCuotaParte: 0,
        primaCesionCuotaParte: 0, 
        cesionExcedente: 0,
        primaCesionExcedente: 0, 
        cesionFacultativo: 0,
        primaCesionFacultativo: 0, 
        cumulo: 0,
        primaCumulo: 0
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
        setInputChanged(true);      // para saber que el valor en el input fue editado 
    }
    
    const handleOnBlur = (e) => {
        let someInputChanged = false; 

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

            someInputChanged = true; 
        }

        if (name === "sumaAsegurada") {
            values.montoAceptado = value; 
            values.cumulo = values.montoAceptado - values.cesionCuotaParte - values.cesionExcedente - values.cesionFacultativo;

            someInputChanged = true; 
        }

        if (name === "montoAceptado" || name === "cesionCuotaParte" || name === "cesionExcedente" || name === "cesionFacultativo") {
            values.cumulo = values.montoAceptado - values.cesionCuotaParte - values.cesionExcedente - values.cesionFacultativo;

            someInputChanged = true; 
        }

        // ahora intentamos calcular las primias ... 
        if (name === "primaSeguro") {
            if (!values.primaAceptada) { values.primaAceptada = value }
            values.primaCumulo = values.primaAceptada - values.primaCesionCuotaParte - values.primaCesionExcedente - values.primaCesionFacultativo;

            someInputChanged = true; 
        }

        if (name === "primaAceptada" || name === "primaCesionCuotaParte" || name === "primaCesionExcedente" || name === "primaCesionFacultativo") {
            values.primaCumulo = values.primaAceptada - values.primaCesionCuotaParte - values.primaCesionExcedente - values.primaCesionFacultativo;

            someInputChanged = true; 
        }

        if (someInputChanged) { 
            setFormValues({ ...values, [name]: value });
        }
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
            _id: new Mongo.ObjectID()._str,
            ...cleanItem,
            ingreso: new Date(),
            usuario: userEmail,
            cia: ciaSeleccionadaId,
        };

        // esta función recibe un item (object) y lo valida contra su schema (simpl_schema)
        const validarResult = validarItemVsSimpleSchema(values, Cumulos_Registro.simpleSchema());

        if (validarResult.error) {
            setShowMessage({ show: true, type: 'danger', message: validarResult.message });
            return;
        }

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
                zona: (cumulos && cumulos.length && cumulos[0].zonas && cumulos[0].zonas.length) ? cumulos[0].zonas[0]._id : '', 
                desde: moment(new Date()).format("YYYY-MM-DD"),
                hasta: moment(new Date()).format("YYYY-MM-DD"), 
                valorARiesgo: 0,
                sumaAsegurada: 0,
                primaSeguro: 0,
                montoAceptado: 0,
                primaAceptada: 0,
                cesionCuotaParte: 0,
                primaCesionCuotaParte: 0,
                cesionExcedente: 0,
                primaCesionExcedente: 0,
                cesionFacultativo: 0,
                primaCesionFacultativo: 0,
                cumulo: 0,
                primaCumulo: 0
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
                                    onFocus={ () => handleOnFocus() }
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
                                    onFocus={ () => handleOnFocus() }
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
                                    onFocus={ () => handleOnFocus() }
                                    onChange={(e) => onInputChange(e)}>
                                        {
                                            lodash.sortBy(zonas, ['descripcion']).map(x => (
                                                <option key={x._id} value={x._id}>{x.descripcion}</option>)
                                            )
                                        }
                                </FormControl>
                            </FormGroup>
                        </Col>
                        <Col sm={3} smOffset={0} >
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
                                onFocus={ () => handleOnFocus() }
                                onBlur={(e) => handleOnBlur(e)}
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="primaSeguro"
                                name="primaSeguro"
                                value={formValues.primaSeguro}
                                type="number"
                                label="Prima del seguro"
                                onFocus={ () => handleOnFocus() }
                                onBlur={(e) => handleOnBlur(e)}
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
                                onFocus={ () => handleOnFocus() }
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
                                onFocus={ () => handleOnFocus() }
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
                                onFocus={ () => handleOnFocus() }
                                onBlur={(e) => handleOnBlur(e)}
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="primaCesionCuotaParte"
                                name="primaCesionCuotaParte"
                                value={formValues.primaCesionCuotaParte}
                                type="number"
                                label="Prima por cesión cuota parte"
                                onFocus={ () => handleOnFocus() }
                                onBlur={(e) => handleOnBlur(e)}
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="cesionExcedente"
                                name="cesionExcedente"
                                value={formValues.cesionExcedente}
                                type="number"
                                label="Cesión excedente"
                                onFocus={ () => handleOnFocus() }
                                onBlur={(e) => handleOnBlur(e)}
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="primaCesionExcedente"
                                name="primaCesionExcedente"
                                value={formValues.primaCesionExcedente}
                                type="number"
                                label="Prima por cesión excedente"
                                onFocus={ () => handleOnFocus() }
                                onBlur={(e) => handleOnBlur(e)}
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
                                onFocus={ () => handleOnFocus() }
                                onBlur={(e) => handleOnBlur(e)}
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="primaCesionFacultativo"
                                name="primaCesionFacultativo"
                                value={formValues.primaCesionFacultativo}
                                type="number"
                                label="Prima por cesión facultativo"
                                onFocus={ () => handleOnFocus() }
                                onBlur={(e) => handleOnBlur(e)}
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="cumulo"
                                name="cumulo"
                                value={formValues.cumulo}
                                type="number"
                                label="Cúmulo"
                                onFocus={ () => handleOnFocus() }
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="primaCumulo"
                                name="primaCumulo"
                                value={formValues.primaCumulo}
                                type="number"
                                label="Prima por monto cúmulo"
                                onFocus={ () => handleOnFocus() }
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
    ciaSeleccionadaId: PropTypes.string.isRequired, 
    setCurrentTab: PropTypes.func.isRequired
};

export default Nuevo; 