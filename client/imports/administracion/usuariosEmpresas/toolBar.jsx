

import React from "react";
import PropTypes from 'prop-types';

import "./styles.css"; 

import { Navbar, Nav, NavItem } from 'react-bootstrap';

export default function NavBar({ grabar }) {

    function handleSelect(selectedKey) {
        switch (selectedKey) { 
            case 1: 
                grabar(); 
                break; 
        }
    }

    return (
        <Navbar collapseOnSelect fluid className="toolBar_navBar">
            <Navbar.Collapse>
                <Nav onSelect={handleSelect}>
                    <NavItem eventKey={1} className="navBar_button">
                        Grabar
                    </NavItem>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
} 

NavBar.propTypes = {
    grabar: PropTypes.func.isRequired,
}