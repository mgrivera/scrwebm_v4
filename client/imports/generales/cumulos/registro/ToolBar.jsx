
import React from 'react';
import PropTypes from 'prop-types';

import { Navbar, Nav, NavItem } from 'react-bootstrap';
import "./styles.css"; 

const ToolBar = ({ url }) => {

    return (
        <Navbar collapseOnSelect fluid>
            <Navbar.Header>
                <Navbar.Brand>
                    <a href="#">Cúmulos / Registro</a>
                </Navbar.Brand>
                <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
                <Nav>

                </Nav>
                <Nav pullRight>
                    <NavItem eventKey={1} href={url}>
                        Regresar ...
                    </NavItem>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    )
}

ToolBar.propTypes = {
    url: PropTypes.string.isRequired
};

export default ToolBar; 