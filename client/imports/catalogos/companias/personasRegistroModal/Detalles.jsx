
import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col } from 'react-bootstrap';
import { FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

import { personas_SimpleSchema } from '/imports/collections/catalogos/companias'; 
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

export default function Detalles({ clickedRow, items, setItems, setMessage, setCurrentTab }) {

    const item = Object.assign({}, items[clickedRow]);     // get a clone of object 

    // convertimos algunos nulls/undefined en '', pues los Inputs solo aceptan strings ... 
    // item.grupo = item.grupo === null ? '' : item.grupo;

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
        const validarResult = validarItemVsSimpleSchema(values, personas_SimpleSchema);

        if (validarResult.error) {
            setMessage({ type: 'danger', message: validarResult.message, show: true });
            return;
        }

        items[clickedRow] = { docState: 2, ...values }; 
        setItems(items); 

        setMessage({ type: 'info', message: `Ok, el registro ha sido actualizado.`, show: true });
        setCurrentTab(1); 
    }

    const handleDeleteItem = () => {
        const values = Object.assign({}, formValues);     // get a clone of object 

        items[clickedRow] = { ...values, docState: 3 };
        setItems(items);

        setMessage({ type: 'info', 
                     message: `Ok, el registro ha sido <em>marcado</em> y será eliminado cuando Ud. cierre el diálogo y 
                               haga un click en <em>Grabar</em>.`, 
                     show: true });
        setCurrentTab(1);
    }

    return (
        <div style={{ textAlign: 'left', border: 'solid lightgray 1px', borderRadius: '5px', padding: '10px' }}>
            <form onSubmit={(e) => handleSubmit(e)}>
                <Grid fluid={true}>
                    <Row>
                        <Col sm={2} smOffset={9} style={{ textAlign: 'right' }}>
                            <div style={{ fontStyle: 'italic' }}>
                                <Button bsStyle="link" onClick={regresarALaLista}>
                                    <span>Regresar a la lista</span>
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={4} smOffset={0} >
                            <FormGroup>
                                <ControlLabel>Id</ControlLabel>
                                <FormControl.Static>
                                    {formValues._id}
                                </FormControl.Static>
                            </FormGroup>
                        </Col>
                        <Col sm={2} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="titulo"
                                    name="titulo"
                                    value={formValues.titulo}
                                    type="text"
                                    label="Título"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={2} smOffset={0} >
                        </Col>
                        <Col sm={4} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="nombre"
                                    name="nombre"
                                    value={formValues.nombre}
                                    type="text"
                                    label="Nombre"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={4} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="cargo"
                                    name="cargo"
                                    value={formValues.cargo}
                                    type="text"
                                    label="Cargo"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={4} smOffset={0} >
                            <FormGroup>
                                <FieldGroup
                                    id="departamento"
                                    name="departamento"
                                    value={formValues.departamento}
                                    type="text"
                                    label="Departamento"
                                    onChange={(e) => onInputChange(e)} />
                            </FormGroup>
                        </Col>
                        <Col sm={4} smOffset={0} >
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
                    </Row>

                    <br />

                    <Row>
                        <Col sm={4} >
                            <Button bsStyle="danger" bsSize="small" onClick={handleDeleteItem}>Eliminar</Button>
                        </Col>
                        <Col sm={3} smOffset={4} style={{ textAlign: 'right' }} >
                            <Button bsStyle="primary" bsSize="small" type="submit">Registrar cambios</Button>
                        </Col>
                    </Row>
                </Grid>
            </form>
        </div>
    )
}

Detalles.propTypes = {
    items: PropTypes.array.isRequired, 
    setItems: PropTypes.func.isRequired, 
    clickedRow: PropTypes.number.isRequired,
    setMessage: PropTypes.func.isRequired,
    setCurrentTab: PropTypes.func.isRequired
};    