
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import React, { useState } from 'react'; 
import PropTypes from 'prop-types';

import lodash from 'lodash'; 

import { Row, Col } from 'react-bootstrap';
import { FormGroup, ControlLabel, FormControl, HelpBlock, Checkbox } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

import { Filtros } from '/imports/collections/otros/filtros';

const FieldGroup = ({ id, label, help, ...props }) => {
    return (
        <FormGroup controlId={id} bsSize="small">
            <ControlLabel style={{ fontSize: 'small' }}>{label}</ControlLabel>
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

const Configuracion = ({ datosConfiguracion, companiaSeleccionada, setDatosConfiguracion, user }) => {

    const [formValues, setFormValues] = useState(datosConfiguracion);

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        // nótese que usamos lodash.set() para actualizar el deep path en el object (ej: 'copiar_1.email')
        const values2 = lodash.set(values, name, value);

        setFormValues({ ...values2 });
    }

    const checkBoxOnClick = (e, name) => { 
        // el checkbox es readOnly; cuando el usuario hace un click, hacemos un toogle y guardamos en el state 
        const values = { ...formValues };

        // por alguna razón, aunque dice readOnly en el checkbox, regresa aquí el nuevo valor, cómo si no tuviera el readOnly (???) 
        const value = e.target.checked;

        // nótese que usamos lodash.set() para actualizar el deep path en el object (ej: 'copiar_1.email')
        const values2 = lodash.set(values, name, value); 

        setFormValues(values2);
    }

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        setDatosConfiguracion(() => formValues); 

        // ------------------------------------------------------------------------------------------------------
        // guardamos el filtro indicado por el usuario
        const filtroActual = formValues;
        const filtroExiste = Filtros.find({ nombre: 'consultas_MontosPendientesDeCobro_Emails', userId: Meteor.userId() }).count(); 

        if (filtroExiste) {
            // el filtro existía antes; lo actualizamos
            // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
            Filtros.update(Filtros.findOne({ nombre: 'consultas_MontosPendientesDeCobro_Emails', userId: Meteor.userId() })._id,
                { $set: { filtro: filtroActual } },
                { validate: false });
        }
        else {
            Filtros.insert({
                _id: new Mongo.ObjectID()._str,
                userId: Meteor.userId(),
                nombre: 'consultas_MontosPendientesDeCobro_Emails',
                filtro: filtroActual
            });
        }
    }

    const restablecerConfiguracion = () => { 
        
        // el usuario puede cambiar los datos del user (título, nombre, cargo, email). Permitimos restablecerlos aquí 
        const configuracion = {
            nombreCompania: formValues.nombreCompania,
            enviarSoloEmailsCC: false, 
            emailSubject: `Montos pendientes de pago a ${companiaSeleccionada.nombre}`,

            usuario: {
                titulo: user?.personales?.titulo,
                nombre: user?.personales?.nombre,
                cargo: user?.personales?.cargo
            },
            copiar_1: {
                copiar: true,
                email: user?.emails[0]?.address
            },
            copiar_2: {
                copiar: false,
                email: formValues?.copiar_2?.email
            }
        }; 

        setFormValues(configuracion);
        setDatosConfiguracion(() => configuracion);

        // ------------------------------------------------------------------------------------------------------
        // guardamos el filtro indicado por el usuario
        const filtroActual = configuracion;
        const filtroExiste = Filtros.find({ nombre: 'consultas_MontosPendientesDeCobro_Emails', userId: Meteor.userId() }).count(); 

        if (filtroExiste) {
            // el filtro existía antes; lo actualizamos
            // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
            Filtros.update(Filtros.findOne({ nombre: 'consultas_MontosPendientesDeCobro_Emails', userId: Meteor.userId() })._id,
                { $set: { filtro: filtroActual } },
                { validate: false });
        }
        else {
            Filtros.insert({
                _id: new Mongo.ObjectID()._str,
                userId: Meteor.userId(),
                nombre: 'consultas_MontosPendientesDeCobro_Emails',
                filtro: filtroActual
            });
        }
    }

    return (
        <div style={{ border: '#286090 1px solid', padding: '20px', margin: '25px', borderRadius: '10px' }}>
            <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                    <Row>
                        <Col sm={4} smOffset={0} >
                            <FormGroup>
                                <ControlLabel style={{ fontSize: 'small' }}>Compañía</ControlLabel>
                                <FormControl.Static>
                                    {formValues.nombreCompania}
                                </FormControl.Static>
                            </FormGroup>
                        </Col>
                        <Col sm={8} smOffset={0} >              
                            <FormGroup>
                                <FieldGroup
                                    id="emailSubject"
                                    name="emailSubject"
                                    value={formValues.emailSubject}
                                    type="text"
                                    label="Asunto (del Email)"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={4} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="usuario.titulo"
                                    name="usuario.titulo"
                                    value={formValues?.usuario?.titulo}
                                    type="text"
                                    label="Título"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={4} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="usuario.nombre"
                                    name="usuario.nombre"
                                    value={formValues?.usuario?.nombre}
                                    type="text"
                                    label="Nombre"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={4} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="usuario.cargo"
                                    name="usuario.cargo"
                                    value={formValues?.usuario?.cargo}
                                    type="text"
                                    label="Cargo"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={1} smOffset={2} >
                            <Checkbox checked={formValues?.copiar_1?.copiar}
                                onClick={(e) => checkBoxOnClick(e, "copiar_1.copiar")}
                                style={{ marginTop: '25px' }}
                                readOnly>
                                Copiar?
                            </Checkbox>
                        </Col>
                        <Col sm={4} smOffset={1} >
                            <FormGroup>
                                <FieldGroup
                                    id="copiar_1.email"
                                    name="copiar_1.email"
                                    value={formValues?.copiar_1?.email}
                                    type="email"
                                    label="Email"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={4} smOffset={0} >
                            <Checkbox checked={formValues?.enviarSoloEmailsCC}
                                onClick={(e) => checkBoxOnClick(e, "enviarSoloEmailsCC")}
                                style={{ marginTop: '25px' }}
                                readOnly>
                                Enviar Emails solo a direcciones CC (copias)?
                            </Checkbox>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={1} smOffset={2} >
                            <Checkbox checked={formValues?.copiar_2?.copiar}
                                onClick={(e) => checkBoxOnClick(e, "copiar_2.copiar")}
                                style={{ marginTop: '25px' }}
                                readOnly>
                                Copiar?
                            </Checkbox>
                        </Col>
                        <Col sm={4} smOffset={1} >
                            <FormGroup>
                                <FieldGroup
                                    id="copiar_2.email"
                                    name="copiar_2.email"
                                    value={formValues?.copiar_2?.email}
                                    type="email"
                                    label="Email"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={0}>
                            <Button bsStyle="link" bsSize="small" onClick={restablecerConfiguracion}>Restablecer valores</Button>
                        </Col>
                        <Col sm={3} smOffset={6}>
                            <Button bsStyle="primary" bsSize="small" type="submit">Grabar modificaciones</Button>
                        </Col>
                    </Row>
            </form>
        </div>
    )
}

Configuracion.propTypes = {
    datosConfiguracion: PropTypes.object.isRequired,
    companiaSeleccionada: PropTypes.object.isRequired, 
    user: PropTypes.object.isRequired,
    setDatosConfiguracion: PropTypes.func.isRequired
};

export default Configuracion; 