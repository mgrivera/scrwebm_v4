
import { Meteor } from 'meteor/meteor'

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col } from 'react-bootstrap';
import { FormGroup, ControlLabel, FormControl, HelpBlock, Checkbox } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

import { meteorUser_simpleSchema } from '/imports/collections/general/meteorUser';
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

export default function Detalles({ clickedRow, setLoaders, setMessage, setCurrentTab }) {

    const item = Object.assign({}, clickedRow);     // get a clone of object 

    // convertimos algunos nulls/undefined en '', pues los Inputs solo aceptan strings ... 
    // item.grupo = item.grupo === null ? '' : item.grupo;

    item.password = "";
    item.password2 = ""; 

    const [formValues, setFormValues] = useState(item);

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const regresarALaLista = () => {
        setCurrentTab(1);
    }

    const handleSubmit = (e) => {

        e.preventDefault();

        const values = Object.assign({}, formValues);     // get a clone of object 

        // esta función recibe un item (object) y lo valida contra su schema (simpl_schema)
        const validarResult = validarItemVsSimpleSchema(values, meteorUser_simpleSchema);

        if (validarResult.error) {
            setMessage({ type: 'danger', message: validarResult.message, show: true });
            return;
        }

        setLoaders(state => ({ ...state, savingToDB: true }));

        Meteor.call('administracion.usuarios.save.update', values, (err, result) => {

            if (err) {
                setMessage({ type: 'danger', message: err.message, show: true });
                setLoaders(state => ({ ...state, savingToDB: false }));
                return;
            }

            if (result.error) {
                setMessage({ type: 'danger', message: result.message, show: true });
                setLoaders(state => ({ ...state, savingToDB: false }));
                return;
            }

            setMessage({ type: 'info', message: result.message, show: true });
            setLoaders(state => ({ ...state, savingToDB: false }));
        })
    }

    const handleDeleteItem = () => {

        const itemID = formValues._id;

        setLoaders(state => ({ ...state, savingToDB: true }));

        Meteor.call('administracion.usuarios.save.delete', itemID, (err, result) => {

            if (err) {
                setMessage({ type: 'danger', message: err.message, show: true });
                setLoaders(state => ({ ...state, savingToDB: false }));
                return;
            }

            if (result.error) {
                setMessage({ type: 'danger', message: result.message, show: true });
                setLoaders(state => ({ ...state, savingToDB: false }));
                return;
            }

            const formDefaults = {
                _id: '',
                username: '',
                email: '', 
                verified: false, 
                password: '', 
                password2: '', 
                createdAt: new Date()
            };

            setFormValues(formDefaults);        // luego de eliminar, reseteamos la forma para que quede en blanco ... 

            setMessage({ type: 'info', message: result.message, show: true });
            setLoaders(state => ({ ...state, savingToDB: false }));
        })
    }

    return (
        <div style={{ textAlign: 'left' }}>
            <form onSubmit={(e) => handleSubmit(e)} style={{ marginTop: '20px' }}>
                <Grid fluid={true}>
                    <Row>
                        <Col sm={3} smOffset={6} style={{ textAlign: 'right' }}>
                            <Button bsStyle="link" onClick={regresarALaLista}>
                                <span style={{ fontStyle: 'italic' }}>Regresar a la lista</span>
                            </Button>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={3} >
                            <FormGroup>
                                <ControlLabel>Id</ControlLabel>
                                <FormControl.Static>
                                    {formValues._id}
                                </FormControl.Static>
                            </FormGroup>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="username"
                                    name="username"
                                    value={formValues.username}
                                    type="text"
                                    label="Nombre"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={3} >
                            <FormGroup>
                                <FieldGroup
                                    id="email"
                                    name="email"
                                    value={formValues.email}
                                    type="email"
                                    label="Email"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <Checkbox checked={formValues.verified}
                                      style={{ marginTop: '25px' }}
                                      readOnly>
                                Verificado?
                            </Checkbox>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={3} >
                            <FormGroup>
                                <FieldGroup
                                    id="password"
                                    name="password"
                                    value={formValues.password}
                                    type="password"
                                    label="Password" 
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="password2"
                                    name="password2"
                                    value={formValues.passsword2}
                                    type="password"
                                    label="Password (confirmar)"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={3}>
                            <Button bsStyle="danger" bsSize="small" onClick={handleDeleteItem}>Eliminar</Button>
                        </Col>
                        <Col sm={3} smOffset={0} style={{ textAlign: 'right' }}>
                            <Button bsStyle="primary" bsSize="small" type="submit">Grabar</Button>
                        </Col>
                    </Row>
                </Grid>
            </form>
        </div>
    )
}

Detalles.propTypes = {
    clickedRow: PropTypes.object.isRequired,
    setLoaders: PropTypes.func.isRequired,
    setMessage: PropTypes.func.isRequired,
    setCurrentTab: PropTypes.func.isRequired
};    