
import React, { useState } from 'react'; 
import PropTypes from 'prop-types';

import { Grid, Row, Col } from 'react-bootstrap';
import { FormGroup, ControlLabel, FormControl, HelpBlock, Checkbox } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

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

const Configuracion = ({ userPersonalData }) => {

    const { titulo, nombre, cargo } = userPersonalData; 

    const formInitialState = { 
        nombreCompania: '', 
        usuario: { 
            titulo: '', 
            nombre: '', 
            cargo: ''
        }, 
        copiar_1: {
            copiar: true,
            email: ''
        }, 
        copiar_2: {
            copiar: true,
            email: ''
        }
    }

    const [formValues, setFormValues] = useState(formInitialState);

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const handleSubmit = () => { 

    }

    return (
        <div style={{ textAlign: 'left' }}>
            <form onSubmit={(e) => handleSubmit(e)} style={{ marginTop: '20px' }}>
                <Grid fluid={true}>
                    <Row>
                        <Col sm={3} smOffset={3} >
                            <FormGroup>
                                <FieldGroup
                                    id="nombreCompania"
                                    name="nombreCompania"
                                    value={formValues.nombreCompania}
                                    type="text"
                                    label="Compañía"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={3} >
                            <FormGroup>
                                <FieldGroup
                                    id="usuario.titulo"
                                    name="usuario.titulo"
                                    value={formValues.usuario.titulo}
                                    type="text"
                                    label="Título"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="usuario.nombre"
                                    name="usuario.nombre"
                                    value={formValues.usuario.nombre}
                                    type="text"
                                    label="Nombre"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="usuario.cargo"
                                    name="usuario.cargo"
                                    value={formValues.usuario.cargo}
                                    type="text"
                                    label="Cargo"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={0} >
                            <Checkbox checked={formValues.copiar_1.copiar}
                                style={{ marginTop: '25px' }}
                                readOnly>
                                Copiar?
                            </Checkbox>
                        </Col>
                        <Col sm={3} smOffset={3} >
                            <FormGroup>
                                <FieldGroup
                                    id="copiar_1.email"
                                    name="copiar_1.email"
                                    value={formValues.copiar_1.email}
                                    type="email"
                                    label="Email"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={0} >
                            <Checkbox checked={formValues.copiar_2.copiar}
                                style={{ marginTop: '25px' }}
                                readOnly>
                                Copiar?
                            </Checkbox>
                        </Col>
                        <Col sm={3} smOffset={3} >
                            <FormGroup>
                                <FieldGroup
                                    id="copiar_2.email"
                                    name="copiar_2.email"
                                    value={formValues.copiar_2.email}
                                    type="email"
                                    label="Email"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={6} style={{ textAlign: 'right' }}>
                            <Button bsStyle="primary" bsSize="small" type="submit">Grabar</Button>
                        </Col>
                    </Row>
                </Grid>
            </form>
        </div>
    )
}

Configuracion.propTypes = {
    // esta es la función que se ejecuta en angular cuando el usuario cierra el modal 
    userPersonalData: PropTypes.object.isRequired
};

export default Configuracion; 