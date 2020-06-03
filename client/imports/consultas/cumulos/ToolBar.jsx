
import React from 'react';
import PropTypes from 'prop-types';

import { Navbar, Nav, NavItem } from 'react-bootstrap';
import "./styles.css"; 

const ToolBar = ({ title, url }) => {

    return (
        <Navbar collapseOnSelect fluid>
            <Navbar.Header>
                <Navbar.Brand>
                    <a href="#">{title}</a>
                </Navbar.Brand>
                <Navbar.Toggle />
            </Navbar.Header>
            { url && 
            (<Navbar.Collapse>
                <Nav>

                </Nav>
                <Nav pullRight>
                    <NavItem eventKey={1} href={url}>
                        Regresar ...
                    </NavItem>
                </Nav>
            </Navbar.Collapse>)}
        </Navbar>
    )
}

ToolBar.propTypes = {
    title: PropTypes.string.isRequired, 
    url: PropTypes.string
};

export default ToolBar; 