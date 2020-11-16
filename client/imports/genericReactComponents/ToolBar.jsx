
import React from 'react';
import PropTypes from 'prop-types';

import { Navbar } from 'react-bootstrap';
import "./styles.toolBar.css";

const ToolBar = ({ title, nombreCiaSeleccionada }) => {

    return (
        <Navbar collapseOnSelect fluid className="toolBar">

            <Navbar.Header>
                <Navbar.Brand>
                    <a href="#home">{title}</a>
                </Navbar.Brand>
                <Navbar.Toggle />
            </Navbar.Header>

            {/* cuando la página corresponde a una entidad que no corresponde a alguna compañía usuaria, no mostramos ninguna; 
                ejemplos típicos son: tipos de proveedor, bancos, monedas, etc. 
                Ejemplos de entidades que si corresponden a una cia usuaria son: códigos de presupuesto, cuentas contables, 
                cuentas bancarias, chequeras, etc.  */}
            {   nombreCiaSeleccionada && 

                <Navbar.Text pullRight>
                    <span style={{ color: '#337AC7', fontStyle: 'italic', paddingRight: '20px' }}>
                        {nombreCiaSeleccionada}
                    </span>
                </Navbar.Text>
            }
            
        </Navbar>
    )
}

ToolBar.propTypes = {
    title: PropTypes.string.isRequired, 
    nombreCiaSeleccionada: PropTypes.string
};

export default ToolBar;  