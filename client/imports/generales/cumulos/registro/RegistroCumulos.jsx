
import { Meteor } from 'meteor/meteor'; 

import React, { useState, useEffect } from 'react'; 
import PropTypes from 'prop-types';

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';

const RegistroCumulos = (props) => { 

    const [ companiaSeleccionada, setCompaniaSeleccionada ] = useState({}); 

    // Similar to componentDidMount and componentDidUpdate:
    useEffect(() => {
        // leemos la compañía seleccionada y actualizamos el state 
        const companiaSeleccionadaID = CompaniaSeleccionada.findOne({ userID: Meteor.userId() }, { fields: { companiaID: 1 } });
        let companiaSeleccionada = {};

        if (companiaSeleccionadaID) {
            companiaSeleccionada = EmpresasUsuarias.findOne(companiaSeleccionadaID.companiaID, { fields: { nombre: 1 } });
        } else {
            companiaSeleccionada = { _id: "999", nombre: "No hay una compañía seleccionada ..." };
        }

        setCompaniaSeleccionada(companiaSeleccionada)
    }, [companiaSeleccionada._id]);


    return (
        <div className="ui-viewBorder-left-aligned"> 
            <Grid fluid={true}>
                <Row className="show-grid">
                    <Col sm={12}>
                        <p>Ok, este es un row ... </p>
                    </Col>
                </Row>

                <Row className="show-grid">
                    <Col sm={12}>
                        <p>Ok, este es otro row ... </p>
                    </Col>
                </Row>








                <Row style={{ paddingBottom: '0' }}>
                    <Col sm={6}>
                        <div style={{ textAlign: 'left' }}>
                            {/* el siguiente link es hidden; para ir a la otra página (list) */}
                            <a href={props.url}
                                ref={a => this.linkElement = a}>
                                regresar ...
                            </a>
                        </div>
                    </Col>
                    <Col sm={6}>
                        <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                            <span style={{ color: 'dodgerblue' }}>{companiaSeleccionada.nombre}</span>
                        </div>
                    </Col>
                </Row>









            </Grid>
        </div>
    )
}

export default RegistroCumulos; 

RegistroCumulos.propTypes = {
    origen: PropTypes.string.isRequired,
    entityId: PropTypes.string.isRequired,
    subEntityId: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
};