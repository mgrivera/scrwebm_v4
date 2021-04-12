
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

function FormGenerales({ formValues, onInputChange, onListChange }) { 

    return (
        <Grid fluid={true}>

            <Row style={{ marginTop: '20px' }}>
                <Col sm={2} smOffset={0} >
                    <FieldGroup
                        id="periodoCobros1"
                        name="periodoCobros1"
                        value={formValues.periodoCobros1}
                        type="date"
                        label="Período de cobro"
                        required
                        onChange={(e) => onInputChange(e)} />
                </Col>
                <Col sm={2} smOffset={0} >
                    <FieldGroup
                        id="periodoCobros2"
                        name="periodoCobros2"
                        value={formValues.periodoCobros2}
                        type="date"
                        label="&nbsp;&nbsp;"
                        required
                        onChange={(e) => onInputChange(e)} />
                </Col>
                <Col sm={2} smOffset={0} />
                <Col sm={3} smOffset={0} >
                    <FieldGroup
                        id="tipoNegocio"
                        name="tipoNegocio"
                        componentClass="select"
                        multiple
                        placeholder="Seleccione un (varios) tipo de negocio"
                        value={formValues.tipoNegocio}
                        label="Tipo de negocio"
                        onChange={(e) => onListChange(e)}>
                        <option value="fac">Facultativo</option>
                        <option value="cuenta">Proporcionales</option>
                        <option value="capa">No proporcionales</option>
                        <option value="sinFac">Siniestros (facultativo)</option>
                    </FieldGroup>
                </Col>
                <Col sm={3} smOffset={0} />
            </Row>
        
        </Grid>
    )
}

FormGenerales.propTypes = {
    formValues: PropTypes.object.isRequired,
    onInputChange: PropTypes.func.isRequired, 
    onListChange: PropTypes.func.isRequired
};

export default FormGenerales; 