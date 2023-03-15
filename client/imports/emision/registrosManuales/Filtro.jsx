
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { useForm } from "react-hook-form";

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';

const Filtro = ({ filtroAnterior, ejecutarAplicarFiltro, handleTabSelect, setCurrentItem, setCuotas }) => {

    const { register, handleSubmit, reset } = useForm();

    const nuevo = () => {
        setCuotas([]);        
        setCurrentItem({});              // item seleccionado en la lista; nuevo: vacío 
        handleTabSelect(3); 
    }
    
    useEffect(() => {
        // inicializamos el filtro con uno que se haya indicado antes 
        if (filtroAnterior) {
            reset(filtroAnterior);
        }
    }, [filtroAnterior]);

    const onSubmit = (data) => {
        const values = Object.assign({}, data);
        ejecutarAplicarFiltro(values);
    }

    const limpiarFiltro = () => {
        const initialFormValues = {
            fecha1: '',
            fecha2: ''
        };

        reset(initialFormValues);
    }

    return (
        <form style={{ marginTop: '20px' }} onSubmit={handleSubmit(onSubmit)}>
            <Grid fluid={true}>
                <Row style={{ marginTop: "25px" }}>
                    <Col sm={1} smOffset={0} />
                    <Col sm={2} smOffset={0}>
                        <div className="form-group">
                            <label style={{ fontSize: '13px' }}>Fecha</label>
                            <input type="date" className="form-control input-sm" {...register("fecha1")} />
                        </div>
                    </Col>
                    <Col sm={2} smOffset={0}>
                        <div className="form-group">
                            <label style={{ fontSize: '13px' }}>&nbsp;&nbsp;</label>
                            <input type="date" className="form-control input-sm" {...register("fecha2")} />
                        </div>
                    </Col>
                    <Col sm={2} smOffset={0} />
                    <Col sm={2} smOffset={0} />
                    <Col sm={2} smOffset={0} />
                </Row>

                <div style={{ display: 'flex', marginTop: "20px" }}>
                    <div style={{ flex: '50%', textAlign: 'left' }}>
                        <Button bsStyle="default" bsSize="small" onClick={limpiarFiltro}>Limpiar filtro</Button>
                    </div>
                    <div style={{ flex: '50%', textAlign: 'right' }}>
                        <Button bsStyle="default" bsSize="small" onClick={nuevo}>Nuevo</Button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <Button bsStyle="primary" bsSize="small" type="submit">Aplicar filtro</Button>
                    </div>
                </div>
            </Grid>
        </form>
    )
}

Filtro.propTypes = {
    filtroAnterior: PropTypes.object.isRequired, 
    ejecutarAplicarFiltro: PropTypes.func.isRequired, 
    handleTabSelect: PropTypes.func.isRequired, 
    setCurrentItem: PropTypes.func.isRequired, 
    setCuotas: PropTypes.func.isRequired
};

export default Filtro; 