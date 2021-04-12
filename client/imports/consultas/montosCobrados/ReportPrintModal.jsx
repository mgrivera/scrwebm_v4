
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import React, { useState, useEffect } from 'react'; 
import PropTypes from 'prop-types';

import { Modal, Button } from 'react-bootstrap';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Checkbox from 'react-bootstrap/lib/Checkbox';

import Alerts from '/client/imports/reactComponents/Alerts'; 
import Spinner from '/client/imports/reactComponents/Spinner'; 

import { Filtros } from '/imports/collections/otros/filtros';

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

export function ReportPrintModal({ reportPrintModalShow, setReportPrintModalShow, companiaSeleccionada }) { 

    const [formValues, setFormValues] = useState({
        subTitulo: "",
        mostrarColores: false, 
        formatoExcel: false, 
    }); 
    const [alert, setAlert] = useState({ show: false, style: "", title: "", message: "" }); 
    const [showSpinner, setShowSpinner] = useState(false); 
    const [showReportLink, setShowReportLink] = useState(false); 

    useEffect(() => {
        // si hay un filtro anterior, lo usamos
        // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
        const filtroAnterior = Filtros.findOne(
            {
                nombre: 'consultas.montosCobrados.config',
                userId: Meteor.userId(),
            });

        // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
        if (filtroAnterior && filtroAnterior.filtro) {
            setFormValues((values) => ({ ...values, ...filtroAnterior.filtro }))
        }
    }, []); 

    const handleClose = () => setReportPrintModalShow(false); 

    const handleAlertsDismiss = () => setAlert({ show: false, style: "", title: "", message: "" }); 

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const onCheckBoxChange = (name) => {
        const values = { ...formValues };
        // simplemente cambiamos de false a true y viceversa 
        const value = !values[name];
        setFormValues({ ...values, [name]: value });
    }

    const guardarOpciones = () => {

        setShowSpinner(true); 
        guardarFiltro(formValues);   // para guardar, en Filtros, el filtro que acaba de indicar el usuairo 

        Meteor.call('consulta.montosCobrados.report.grabarAMongoOpcionesReporte', formValues, companiaSeleccionada,
            (err, result) => {

                if (err) {
                    const title = "Ha ocurrido un error al intentar efectuar la operación"; 
                    const message = err.message; 

                    setAlert({ show: true, style: "danger", title, message }); 
                    setShowSpinner(false); 

                    return;
                }

                if (result.error) {
                    const title = "Ha ocurrido un error al intentar efectuar la operación";
                    const message = result.message;

                    setAlert({ show: true, style: "danger", title, message });
                    setShowSpinner(false);

                    return;
                }

                const title = "Las opciones han sido registradas";
                const message = result.message;

                setAlert({ show: true, style: "info", title, message });
                setShowReportLink(true);            // para mostrar el link al usuario ... 
                setShowSpinner(false);

                return;
            })
    }

    // construimos el url que se debe usar para obtener el reporte (sql server reporting services - asp.net)
    let reportLink = ""; 
    const scrwebm_net_app_address = Meteor.settings.public.scrwebm_net_app_address;

    reportLink = "#";

    if (scrwebm_net_app_address) {
        reportLink = `${scrwebm_net_app_address}/reports/consultas/montosCobrados/report.aspx?user=${Meteor.userId()}&report=montosCobrados`;
    }
    
    return (
        <Modal show={reportPrintModalShow} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Montos cobrados - Consulta</Modal.Title>
            </Modal.Header>
            <Modal.Body>

                <Grid fluid={true}>

                    <Row style={{ paddingBottom: '0' }}>
                        <Col sm={6}>
                        </Col>
                        <Col sm={6}>
                            <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                                <span style={{ color: 'dodgerblue' }}>{companiaSeleccionada.nombre}</span>
                            </div>
                        </Col>
                    </Row>

                    {
                        showSpinner &&
                        <div style={{ marginTop: '5px', marginBottom: '5px' }}>
                            <Spinner />
                        </div>
                    }

                    {
                        alert.show &&
                        <div style={{ marginTop: '10px' }}>
                            <Alerts style={alert.style} title={alert.title} message={alert.message} onDismiss={handleAlertsDismiss} />
                        </div>
                    }

                    <Row>
                        <Col sm={1} />
                        <Col sm={10}>
                            <form onSubmit={(e) => this.handleFormSubmit(e)}>

                                <Grid fluid={true}>
                                    <Row>
                                        <Col>
                                            <FieldGroup
                                                id="subTitulo"
                                                name="subTitulo"
                                                value={formValues.subTitulo}
                                                type="text"
                                                label="Sub título"
                                                onChange={(e) => onInputChange(e)} />
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col sm={6}>
                                            <Checkbox 
                                                name="mostrarColores"
                                                onChange={() => onCheckBoxChange("mostrarColores")}
                                                checked={formValues.mostrarColores}>
                                                    Mostrar colores
                                            </Checkbox>
                                        </Col>
                                        <Col sm={6}>
                                            <Checkbox label='Resumen'
                                                name="resumen"
                                                onChange={() => onCheckBoxChange("resumen")}
                                                checked={formValues.resumen}>
                                                    Resumen 
                                            </Checkbox>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col sm={6}>
                                            <Checkbox label='Formato Excel'
                                                name="formatoExcel"
                                                onChange={() => onCheckBoxChange("formatoExcel")}
                                                checked={formValues.formatoExcel}>
                                                Formato Excel
                                            </Checkbox>
                                        </Col>
                                        <Col sm={6}>
                                            
                                        </Col>
                                    </Row>
                                </Grid>

                            </form>
                        </Col>
                        <Col sm={1} />
                    </Row>

                    {showReportLink
                        ? (
                            <Row style={{ marginTop: '10px' }}>
                                <Col sm={1} />
                                <Col>
                                    <a href={reportLink} target="_blank" rel="noopener noreferrer">
                                        Obtener reporte ...&nbsp;&nbsp;<i className="fa fa-print"></i>
                                    </a>
                                </Col>
                            </Row>
                        )
                        : null
                    }

                </Grid>
                
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={guardarOpciones} bsStyle="primary" bsSize="small">Grabar opciones del reporte</Button>
                <Button onClick={handleClose} bsStyle="warning" bsSize="small">Cerrar</Button>
            </Modal.Footer>
        </Modal>
    )
}

ReportPrintModal.propTypes = {
    reportPrintModalShow: PropTypes.bool.isRequired, 
    setReportPrintModalShow: PropTypes.func.isRequired,
    companiaSeleccionada: PropTypes.object.isRequired
}

function guardarFiltro(values) {
    // guardamos el filtro indicado por el usuario
    const filtro = Filtros.findOne({ nombre: 'consultas.montosCobrados.config', userId: Meteor.userId() }, { fields: { _id: 1 } });
    if (filtro) {
        // el filtro existía antes; lo actualizamos
        // validate false: como el filtro puede ser vacío (ie: {}), simple-schema no permitiría eso; por eso saltamos la validación
        Filtros.update(filtro._id, { $set: { filtro: values } }, { validate: false });
    }
    else {
        Filtros.insert({
            _id: new Mongo.ObjectID()._str,
            userId: Meteor.userId(),
            nombre: 'consultas.montosCobrados.config',
            filtro: values
        })
    }
}