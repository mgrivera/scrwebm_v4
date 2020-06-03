
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

function FormGenerales({ formValues, onInputChange }) { 

    return (

        <>
            <form style={{ marginTop: '20px' }}>
                <Grid fluid={true}>

                    <Row>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="fechaEmision1"
                                name="fechaEmision1"
                                value={formValues.fechaEmision1}
                                type="date"
                                label="Fecha de emisión"
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="fechaEmision2"
                                name="fechaEmision2"
                                value={formValues.fechaEmision2}
                                type="date"
                                label="&nbsp;&nbsp;"
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} />
                        <Col sm={3} smOffset={0} />
                    </Row>
                
                    <Row>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="vigenciaInicial1"
                                name="vigenciaInicial1"
                                value={formValues.vigenciaInicial1}
                                type="date"
                                label="Vigencia de inicio"
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="vigenciaInicial2"
                                name="vigenciaInicial2"
                                value={formValues.vigenciaInicial2}
                                type="date"
                                label="&nbsp;&nbsp;"
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="vigenciaFinal1"
                                name="vigenciaFinal1"
                                value={formValues.vigenciaFinal1}
                                type="date"
                                label="Vigencia final"
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <FieldGroup
                                id="vigenciaFinal2"
                                name="vigenciaFinal2"
                                value={formValues.vigenciaFinal2}
                                type="date"
                                label="&nbsp;&nbsp;"
                                onChange={(e) => onInputChange(e)} />
                        </Col>
                    </Row>

                </Grid>
            </form>
        </>

    )
}

FormGenerales.propTypes = {
    formValues: PropTypes.object.isRequired,
    onInputChange: PropTypes.func.isRequired, 
};

export default FormGenerales; 