
import React from 'react';
import PropTypes from 'prop-types';

import { Navbar, Nav, NavItem } from 'react-bootstrap';
import "./styles.css"; 

const ToolBar = ({ title, url, leerMas, leerTodo, setReportPrintModalShow }) => {


    // nótese que muchas opciones en el toolbar solo se muestran cuando se recibe el prop url (para regresar). 
    // Este se usa desde la lista, pero no desde el filtro
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
                    <NavItem eventKey={1} href="#" onClick={() => setReportPrintModalShow(true)}>
                        Reporte&nbsp;&nbsp;<i className="fa fa-print"></i>
                    </NavItem>
                </Nav>
                <Nav pullRight>
                    <NavItem eventKey={2} href="#" onClick={() => leerMas()}>
                        Más
                    </NavItem>
                    <NavItem eventKey={3} href="#" onClick={() => leerTodo()}>
                        Todo
                    </NavItem>
                    <NavItem eventKey={4} href={url}>
                        <span style={{ fontStyle: 'italic' }}>Regresar</span>
                    </NavItem>
                </Nav>
            </Navbar.Collapse>)}
        </Navbar>
    )
}

ToolBar.propTypes = {
    title: PropTypes.string.isRequired, 
    url: PropTypes.string, 
    leerMas: PropTypes.func,
    leerTodo: PropTypes.func,
    setReportPrintModalShow: PropTypes.func
};

export default ToolBar; 