
import React from 'react';
import PropTypes from 'prop-types';

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';

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

function FormListas({ formValues, onInputChange, onListChage, cumulos }) {

    return (
        <>
            <form style={{ marginTop: '20px' }}>
                <Grid fluid={true}>

                    <Row>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="tipoCumulo"
                                name="tipoCumulo"
                                componentClass="select" 
                                placeholder="Seleccione un tipo de cúmulo"
                                value={formValues.tipoCumulo}
                                label="Tipo de cúmulo"
                                onChange={(e) => onInputChange(e)}>
                                    <option value="">Seleccione un tipo de cúmulo</option>
                                    { 
                                        cumulos.map(item => (
                                            <option key={item._id} value={item._id}>{item.descripcion}</option>
                                        ))
                                    }
                            </FieldGroup>
                        </Col>


                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="tipoNegocio"
                                name="tipoNegocio"
                                componentClass="select"
                                multiple 
                                placeholder="Seleccione un (varios) tipo de negocio"
                                value={formValues.tipoNegocio}
                                label="Tipo de negocio"
                                onChange={(e) => onListChage(e)}>
                                    <option value="fac">Facultativo</option>
                                    <option value="prop">Proporcionales</option>
                                    <option value="noProp">No proporcionales</option>
                                    <option value="cont">Contratos (prop/no prop)</option>
                            </FieldGroup>
                        </Col>



                        <Col sm={6} smOffset={0} />
                    </Row>

                </Grid>
            </form>
        </>

    )
}

FormListas.propTypes = {
    formValues: PropTypes.object.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onListChage: PropTypes.func.isRequired, 
    cumulos: PropTypes.array.isRequired,
};

export default FormListas; 