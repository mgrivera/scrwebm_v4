
import React from 'react';
import PropTypes from 'prop-types';

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import ListGroup from 'react-bootstrap/lib/ListGroup';
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem';

import './styles.css';

import AsyncSelect from 'react-select/async';

function FormListas({ monedas, 
                      companias, 
                      monedasSearch, 
                      monedasHandleChange, 
                      companiasSearch, 
                      companiasHandleChange, 
                      monedasHandleDeleteFromList, 
                      companiasHandleDeleteFromList }) {

    return (
        <Grid fluid={true}>

            <Row style={{ marginTop: '20px' }}>
                <Col sm={3} smOffset={0} >
                    <AsyncSelect cacheOptions
                        loadOptions={monedasSearch}
                        value={null}
                        placeholder={"Monedas"}
                        onChange={option => monedasHandleChange(option)} />
                </Col>

                <Col sm={3} smOffset={0} >
                    <AsyncSelect cacheOptions
                        loadOptions={companiasSearch}
                        value={null}
                        placeholder={"Compañías"}
                        onChange={option => companiasHandleChange(option)} />
                </Col>

                <Col sm={6} smOffset={0} />
            </Row>

            <Row>
                <Col sm={3} smOffset={0} >
                    <ListGroup className="list-group">
                        {monedas.map(x => (
                            <ListGroupItem key={x.value} onClick={(e) => monedasHandleDeleteFromList(e, x)} className="list-group-item">
                                <span style={{ fontSize: 'small' }}>{x.label}</span>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </Col>

                <Col sm={3} smOffset={0} >
                    <ListGroup className="list-group">
                        {companias.map(x => (
                            <ListGroupItem key={x.value} onClick={(e) => companiasHandleDeleteFromList(e, x)} className="list-group-item">
                                <span>{x.label}</span>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </Col>

                <Col sm={6} smOffset={0} />
            </Row>
        </Grid>
    )
}

FormListas.propTypes = {
    monedas: PropTypes.array.isRequired,
    companias: PropTypes.array.isRequired,
    monedasSearch: PropTypes.func.isRequired,
    monedasHandleDeleteFromList: PropTypes.func.isRequired,
    monedasHandleChange: PropTypes.func.isRequired,
    companiasSearch: PropTypes.func.isRequired,
    companiasHandleChange: PropTypes.func.isRequired,
    companiasHandleDeleteFromList: PropTypes.func.isRequired
};

export default FormListas; 