
import React, { useState } from "react";
import PropTypes from "prop-types";

import { FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap';

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

const FormattedNumberInput = ({ name, value, label, onChange, onFocus, onBlur, step }) => {

    // step es usado para que el Input(number) acepte decimales; por ejemplo, para que acepte hasta 2 decimales, 
    // debemos indicar <input type="number" step="0.01" /> 

    const [isEditing, setIsEditing] = useState(false);

    const onInputChange = (event) => {
        onChange(event);
    }

    const toCurrency = (number) => {
        const formatter = new Intl.NumberFormat();          // para usar el current locale 
        return formatter.format(number);
    }

    const onInputFocus = (e) => {
        // la función puede o no venir; cuando se use este component en elgún lado, se puede o no pasar una función que se ejecute 
        // en focus; es por eso que debemos revisar si la función viene o no 
        if (onFocus) {
            onFocus(e);
        }

        setIsEditing(!isEditing);
    }

    const onInputBlur = (e) => {
        if (onBlur) {
            onBlur(e);
        }

        setIsEditing(!isEditing);
    }

    const inputStep = step ? step : "1"; 

    return (
        <div>
            {isEditing ? (
                        <FieldGroup
                            id={name}
                            name={name}
                            value={value}
                            type="number"
                            step={inputStep}
                            label={label}
                            onChange={(e) => onInputChange(e)} 
                            onBlur={(e) => onInputBlur(e)} />
            ) : (
                        <FieldGroup
                            id={name}
                            name={name}
                            value={toCurrency(value)}
                            type="text"
                            label={label}
                        onFocus={(e) => onInputFocus(e)} readOnly />
                )}
        </div>
    );
}

FormattedNumberInput.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string, 
    onChange: PropTypes.func, 
    onFocus: PropTypes.func, 
    onBlur: PropTypes.func, 
    step: PropTypes.string
};

export default FormattedNumberInput; 