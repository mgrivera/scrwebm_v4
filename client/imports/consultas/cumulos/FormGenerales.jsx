
import React, { useState } from 'react'; 
import PropTypes from 'prop-types';

import { useForm } from "react-hook-form";

import Tabs from 'react-bootstrap/lib/Tabs';
import Tab from 'react-bootstrap/lib/Tab';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import Button from 'react-bootstrap/lib/Button';
import { useEffect } from 'react';

function FormGenerales({ filtroAnterior, ejecutarAplicarFiltro, cumulos, monedas }) {

    const { register, handleSubmit, reset } = useForm();
    const [currentTab, setCurrentTab] = useState(1);

    const handleTabSelect = (key) => setCurrentTab(key);

    const onSubmit =  (data) => { 
        const values = Object.assign({}, data); 
        ejecutarAplicarFiltro(values); 
    }

    const limpiarFiltro = () => {

        const initialFormValues = {
            vigenciaInicial1: '',
            vigenciaInicial2: '',
            vigenciaFinal1: '',
            vigenciaFinal2: '',
            cumulosAl1: '',
            cumulosAl2: '',
            tipoCumulo: '',
            origen: '',  
            monedas: ''
        }; 

        reset(initialFormValues); 
    }

    useEffect(() => { 

        if (filtroAnterior) { 
            reset(filtroAnterior); 
        }

    }, [filtroAnterior]);

    return (

        <>
            <form style={{ marginTop: '20px' }} onSubmit={handleSubmit(onSubmit)}>
                <Grid fluid={true}>

                    <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">

                        <Tab eventKey={1} title="Generales">
                            <Row style={{ marginTop: "25px" }}>
                                <Col sm={1} smOffset={0} />
                                <Col sm={2} smOffset={0}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>Vigencia de inicio</label>
                                        <input type="date" className="form-control input-sm"
                                            {...register("vigenciaInicial1")} />
                                    </div>
                                </Col>
                                <Col sm={2} smOffset={0}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>&nbsp;&nbsp;</label>
                                        <input type="date" className="form-control input-sm"
                                            {...register("vigenciaInicial2")} />
                                    </div>
                                </Col>
                                <Col sm={2} smOffset={0} />
                                <Col sm={2} smOffset={0}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>Vigencia final</label>
                                        <input type="date" className="form-control input-sm"
                                            {...register("vigenciaFinal1")} />
                                    </div>
                                </Col>
                                <Col sm={2} smOffset={0}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>&nbsp;&nbsp;</label>
                                        <input type="date" className="form-control input-sm"
                                            {...register("vigenciaFinal2")} />
                                    </div>
                                </Col>
                            </Row>

                            <Row>
                                <Col sm={1} smOffset={0} />
                                <Col sm={2} smOffset={0} >
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>Cumulos al</label>
                                        <input type="date" className="form-control input-sm"
                                            {...register("cumulosAl1")} />
                                    </div>
                                </Col>
                                <Col sm={2} smOffset={0} >
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>&nbsp;&nbsp;</label>
                                        <input type="date" className="form-control input-sm"
                                            {...register("cumulosAl2")} />
                                    </div>
                                </Col>
                                <Col sm={2} smOffset={0} />
                                <Col sm={2} smOffset={0} />
                                <Col sm={2} smOffset={0} />
                            </Row>
                        </Tab>

                        <Tab eventKey={2} title="Listas">
                            <Row style={{ marginTop: "25px" }}>
                                <Col sm={1} smOffset={0} />
                                <Col sm={2} smOffset={0}>
                                    <label style={{ fontSize: '13px' }}>Tipo de cúmulo</label>
                                    <select {...register("tipoCumulo")} className="form-control input-sm">
                                        <option key={'abcxyz'} value={''}>{''}</option>
                                        {cumulos.map(x => (<option key={x._id} value={x._id}>{x.descripcion}</option>))}
                                    </select>
                                </Col>
                                <Col sm={2} smOffset={0}>
                                    <label style={{ fontSize: '13px' }}>Monedas</label>
                                    <select {...register("moneda")} className="form-control input-sm">
                                        <option key={'abcxyz'} value={''}>{''}</option>
                                        {monedas.map(x => (<option key={x._id} value={x._id}>{x.descripcion}</option>))}
                                    </select>
                                </Col>

                                <Col sm={2} smOffset={0} />

                                <Col sm={2} smOffset={0} >
                                    <label style={{ fontSize: '13px' }}>Origen</label>
                                    <select {...register("origen")} className="form-control input-sm">
                                        <option key={'abcxyz'} value={''}>{''}</option>
                                        <option key="fac" value="fac">Facultativo</option>
                                        <option key="prop" value="prop">Proporcionales</option>
                                        <option key="noProp" value="noProp">No proporcionales</option>
                                        <option key="cont" value="cont">Contratos (prop/no prop)</option>
                                    </select>
                                </Col>
                            </Row>
                        </Tab>

                        <Tab eventKey={3} title="Notas">
                            <div style={{ padding: "25px", height: '250px', overflow: 'auto' }}>
                                <p>
                                    El tipo de cúmulo (terremoto, huracan, motín, ...) <b>debe</b> ser indicado en el filtro, pues
                                    la consulta se puede obtener <b>solo</b> para un tipo de cúmulo. Los tipos de cúmulo se registran
                                    en el menú <em>Catálogos/Generales/Cúmulos</em>.
                                </p>
                                <p>
                                    La consulta puede ser obtenida por tipo de negocio: fac, prop, noProp. Por ejemplo, Ud. puede
                                    pedir en la consulta solo cúmulos asociados a riesgos facultativos o solo para contratos.
                                </p>
                                <p>
                                    Usando el filtro, se puede delimitar riesgos (fac) y contratos por:
                                </p>
                                <ul>
                                    <li>
                                        Fecha de emisión: se debe indicar un período de emisión.
                                    </li>
                                    <li>
                                        Inicio (inicio de vigencia): se debe indicar un período en el cual se inicia un riesgo o contrato.
                                    </li>
                                    <li>
                                        Final (fin de vigencia): se debe indicar un período en el cual termina un riesgo o contrato.
                                    </li>
                                    <li>
                                        Período de vigencia: para seleccionar riesgos o contratos que están vigentes en un período.
                                    </li>
                                </ul>
                            </div>
                        </Tab>
                    </Tabs>

                    <div style={{ display: 'flex', marginTop: "20px" }}>
                        <div style={{ flex: '50%', textAlign: 'left' }}>
                            <Button bsStyle="default" bsSize="small" onClick={limpiarFiltro}>Limpiar filtro</Button>
                        </div>
                        <div style={{ flex: '50%', textAlign: 'right' }}>
                            <Button bsStyle="primary" bsSize="small" type="submit">
                                Aplicar filtro
                            </Button>
                        </div>
                    </div>

                </Grid>
            </form>
        </>

    )
}

FormGenerales.propTypes = {
    filtroAnterior: PropTypes.object.isRequired, 
    ejecutarAplicarFiltro: PropTypes.func.isRequired, 
    cumulos: PropTypes.array.isRequired, 
    monedas: PropTypes.array.isRequired
};

export default FormGenerales; 