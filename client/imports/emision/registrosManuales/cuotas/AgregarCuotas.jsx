
import { Mongo } from 'meteor/mongo';

import moment from 'moment';
import lodash from 'lodash';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useForm } from "react-hook-form";

import { Modal, Button } from 'react-bootstrap';
import { Grid, Row, Col } from 'react-bootstrap';

import Message from '../Message';
import { MessageModal } from '/client/imports/genericReactComponents/MessageModal';

import { convertFromStringToDate } from '/imports/funciones/DateFunctions';
import validarItemVsSimpleSchema from '/client/imports/general/validarItemVsSimpleSchema';

import { cuotas_formValidation_schema } from './cuotas_formValidation_schema'; 

const AgregarCuotas = ({ setShowAgregarCuotasModal, item, cuotas, setCuotas, setUserMadeChanges }) => {

    const formDefaultValues = {
        cantidadCuotas: "",
        fecha1raCuota: "",
        diasVencimiento: "",
        cantidadDias: "",
        cantidadMeses: ""
    }; 

    const { register, handleSubmit } = useForm({ defaultValues: formDefaultValues });

    const [showModal, setShowModal] = useState(true);
    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' });

    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageModalShowSpinner, setMessageModalShowSpinner] = useState(false);
    const [messageModalTitle, setMessageModalTitle] = useState("");
    const [messageModalMessage, setMessageModalMessage] = useState({ type: '', message: '', show: false });

    const handleMessageDismiss = () => {
        setShowMessage({ show: false, type: '', message: '' });
    }

    const handleModalClose = () => {
        // esta función pone en false el state que permite abrir el modal en el component principal (que contiene a este) 
        setShowAgregarCuotasModal(false);
        setShowModal(false);
    }

    // ===============================================================================================
    // OnSubmit 
    // =============================================================================================== 
    const onSubmit = (data) => {

        // para mostrar un (sub) modal que muestra un spinner y un mensaje final para este proceso 
        setShowMessageModal(true);
        setMessageModalShowSpinner(true);
        setMessageModalTitle("Registros manuales ... Construyendo las cuotas");

        // get a clone from data 
        const values = Object.assign({}, data);

        // antes de validar debemos convertir fechas y numbers desde strings 
        const values2 = convertirValoresParaValidar(values);

        // esta función recibe un item (object) y lo valida contra su schema (simpl_schema)
        const validarResult = validarItemVsSimpleSchema(values2, cuotas_formValidation_schema);

        if (validarResult.error) {
            setShowMessage({ show: true, type: 'danger', message: validarResult.message });

            setMessageModalMessage({
                type: 'danger',
                message: `Aparentemente, existen <em>errores de validación</em> en los datos. <br /> 
                          Por favor cierre este cuadro de diálogo y revise el mensaje de error arriba en la página.  
                         `,
                show: true
            });

            setMessageModalShowSpinner(false);
            return;
        }

        const result = calcularCuotas(item, values2, cuotas); 

        if (result.error) { 
            setShowMessage({ show: true, type: 'danger', message: result.message });

            setMessageModalMessage({
                type: 'danger',
                message: `Hemos encontrado errores al intentar construir las cuotas para el regitro manual. <br /> 
                          Por favor cierre este cuadro de diálogo y revise el mensaje de error arriba en el diálogo.  
                         `,
                show: true
            });

            setMessageModalShowSpinner(false);
            return;
        }

        // determinamos la cantidad de cuotas que este proceso ha construido y agregado 
        const countAgregadas = result.cuotas.filter(x => x.docState === 1);
        const countAgregadas2 = countAgregadas && Array.isArray(countAgregadas) ? countAgregadas.length : 0; 

        const countEliminadas = result.cuotas.filter(x => x.docState === 1);
        const countEliminadas2 = countEliminadas && Array.isArray(countEliminadas) ? countEliminadas.length : 0; 

        setShowMessage({ show: false, type: 'success', message: "" });
        setMessageModalMessage({
            type: 'success',
            message: `Ok, las cuotas de pago para el <em>registro manual</em>, han sido construidas y agregadas en forma exitosa.<br /><br /> 
                      En total, este proceso ha calculado <b>${countAgregadas2.toString()}</b> cuotas para el <em>registro manual</em>. <br />
                      Además,  <b>${countEliminadas2.toString()}</b> cuotas han sido <em>marcadas</em> para ser eliminadas 
                      pues existían previamente. <br /><br /> 
                      No olvide hacer un <em>click</em> en <b><em>Grabar</em></b> para grabar las cuotas. 
                     `,
            show: true
        });

        // el arreglo de cuotas puede tener cuotas; el usuario puede decidir determinar cuotas aún si estas *ya existen* 
        // en un caso tal, las cuotas anteriores serían eliminadas y las nuevas agregadas 
        setCuotas(result.cuotas); 
        setUserMadeChanges(true);               // para que el proceso sepa que el usuario hizo cambios y se deben grabar 
        setMessageModalShowSpinner(false);
    }

    return (
        <>
            {/* backdrop='static' impide que se cierre el modal si el usuario hace un click fuera del mismo  */}
            <Modal show={showModal} 
                   onHide={() => handleModalClose()} 
                //    bsSize="large" 
                   backdrop="static">

                <Modal.Header closeButton>
                    <Modal.Title>{`scrwebm - Registros Manuales - Construir cuotas`}</Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    <Grid fluid={true}>
                        <Row>
                            <Col sm={12} smOffset={0}>
                                {showMessage.show
                                    ?
                                    <div style={{ marginTop: '15px' }}>
                                        <Message type={showMessage.type}
                                            message={showMessage.message}
                                            handleMessageDismiss={handleMessageDismiss} />
                                    </div>
                                    :
                                    null
                                }
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={12} smOffset={0}>
                                {/* para mostrar un modal que muestra un spinner y luego un mensaje al final 
                                    super apropiado para que el usuario espere por un proceso en el server y luego pueda ver un 
                                    mensaje con el resultado */}
                                {
                                    showMessageModal &&
                                    <MessageModal messageModalTitle={messageModalTitle}
                                        showMessageModal={showMessageModal}
                                        setShowMessageModal={setShowMessageModal}
                                        messageModalShowSpinner={messageModalShowSpinner}
                                        messageModalMessage={messageModalMessage}
                                        setMessageModalMessage={setMessageModalMessage}
                                    >
                                    </MessageModal>
                                }
                            </Col>
                        </Row>

                        <Row>
                            <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }} id="form1">

                                <Row>
                                    <Col sm={4} smOffset={0} >
                                        <div className="form-group">
                                            <label style={{ fontSize: '13px' }}>Cantidad</label>
                                            <input type="number" className="form-control input-sm" min="1" max="25" {...register("cantidadCuotas")} />
                                        </div>
                                    </Col>
                                    <Col sm={4} smOffset={0} >
                                        <div className="form-group">
                                            <label style={{ fontSize: '13px' }}>Fecha de la 1ra cuota</label>
                                            <input type="date" className="form-control input-sm" {...register("fecha1raCuota")} />
                                        </div>
                                    </Col>
                                    <Col sm={4} smOffset={0} >
                                        <div className="form-group">
                                            <label style={{ fontSize: '13px' }}>Días de vencimiento</label>
                                            <input type="number" className="form-control input-sm" min="0" max="365" {...register("diasVencimiento")} />
                                        </div>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col sm={10} smOffset={1} >
                                        <fieldset className="scheduler-border" style={{ fontSize: 'x-small' }}>
                                            <legend className="scheduler-border-xsm">Cantidad de días (o meses) entre cuotas: </legend>

                                            <Col sm={4} smOffset={1} >
                                                <div className="form-group">
                                                    <label style={{ fontSize: '13px' }}>Días</label>
                                                    <input type="number" className="form-control input-sm" min="0" max="365" {...register("cantidadDias")} />
                                                </div>
                                            </Col>

                                            <Col sm={4} smOffset={1} >
                                                <div className="form-group">
                                                    <label style={{ fontSize: '13px' }}>Meses</label>
                                                    <input type="number" className="form-control input-sm" min="0" max="365" {...register("cantidadMeses")} />
                                                </div>
                                            </Col>
                                        </fieldset>
                                    </Col>
                                </Row>

                            </form>
                        </Row>

                    </Grid>

                </Modal.Body>

                <Modal.Footer>
                    <>
                        <Button bsStyle="primary" 
                                bsSize="small" 
                                form="form1"
                                type="submit"
                                style={{ minWidth: '100px', marginRight: '20px' }}>
                            Construir cuotas
                        </Button>

                        <Button bsStyle="warning" 
                                bsSize="small" 
                                onClick={() => handleModalClose()} 
                                style={{ minWidth: '100px', marginRight: '20px' }}>
                            Cerrar este diálogo
                        </Button>
                    </>
                </Modal.Footer>
            </Modal>
        </>
    )
}

AgregarCuotas.propTypes = {
    setShowAgregarCuotasModal: PropTypes.func.isRequired, 
    item: PropTypes.object.isRequired, 
    cuotas: PropTypes.array.isRequired, 
    setCuotas: PropTypes.func.isRequired, 
    setUserMadeChanges: PropTypes.func.isRequired
};

export default AgregarCuotas;        

// ================================================================================================================
// react-form siempre regresa strings, también para fechas y montos. 
// para poder validar usando simpl-schema, debemos convertir estos valores a sus tipos adecuados 
const convertirValoresParaValidar = function (values) {
    let result = null;

    // convertimos algunos valores desde string a date 
    result = convertFromStringToDate(values.fecha1raCuota);
    values.fecha1raCuota = !result?.error ? result.date : undefined;

    // convertimos los montos desde string a number 
    values.cantidadCuotas = values.cantidadCuotas ? parseInt(values.cantidadCuotas) : undefined;
    values.diasVencimiento = values.diasVencimiento ? parseInt(values.diasVencimiento) : undefined;
    values.cantidadDias = values.cantidadDias ? parseInt(values.cantidadDias) : undefined;
    values.cantidadMeses = values.cantidadMeses ? parseInt(values.cantidadMeses) : undefined;

    return values;
}


// ================================================================================================================
// TODO: usar este código como base para determinar las cuotas del registro manual 
// debemos regresarlas en un array que debe ser grabado cuando el usuario haga un click en Grabar desde el 
// registro original ... 
function calcularCuotas(registro, parametros, cuotas) {

    // los montos y números vienen como strings 
    registro.numero = parseInt(registro.numero); 
    registro.monto = parseFloat(registro.monto); 

    // 'marcamos' las cuotas que puedan existir para que sean eliminadas al grabar en el server
    if (cuotas && Array.isArray(cuotas) && cuotas.length) {
        cuotas.forEach(c => c.docState = 3);
    }

    const factor = 1 / parametros.cantidadCuotas;
    const item = { 
        _id: registro._id, 
        numero: registro.numero, 
        origen: registro.origen, 
        compania: registro.compania, 
        moneda: registro.moneda, 
        monto: registro.monto, 
        cia: registro.cia
     }; 

    // primero calculamos las cuotas para la compañía del registro manual 
    const array_cuotas = calcularCuota(item, parametros, factor); 
    array_cuotas.forEach(c => cuotas.push(c)); 

    // ya tenemos las cuotas para la compañía en el registro 
    // ahora agregamos la moneda al array de distribucion y pasamos a la función para determinar las cuotas para cada una 
    const array_distribucion = registro.distribucion.map(x => { 
        return {
            _id: registro._id,
            numero: registro.numero, 
            origen: registro.origen, 
            compania: x.compania, 
            moneda: registro.moneda, 
            monto: x.monto, 
            cia: registro.cia
        }
    })

    // luego, calculamos las cuotas para cada compañía en el array de distribucion 
    array_distribucion.forEach(item => {
        const array_cuotas = calcularCuota(item, parametros, factor); 
        array_cuotas.forEach(c => cuotas.push(c)); 
    })

    return {
        error: false,
        message: "",
        cuotas
    }
}

function calcularCuota(registro, parametros, factor) { 

    let fechaProximaCuota = parametros.fecha1raCuota;
    const cuotas = []; 

    for (let i = 1; i <= parametros.cantidadCuotas; i++) {

        const cuota = {};

        cuota._id = new Mongo.ObjectID()._str;

        cuota.source = {
            entityID: registro._id,
            // normalmente agregamos aquí algún _id de un 'sub entity'. Por ejemplo, en Riesgos, su _id es el entityID y el _id del movimiento 
            // es el subEntityID. Pero en registros manuales no tenemos un subEntity. Usamos un punto pues este field es requerido ... 
            subEntityID: ".",
            origen: registro.origen,
            numero: registro.numero
        };

        cuota.compania = registro.compania;

        cuota.moneda = registro.moneda;
        cuota.numero = i;
        cuota.cantidad = parametros.cantidadCuotas;

        cuota.fechaEmision = new Date();
        cuota.fecha = fechaProximaCuota;
        cuota.diasVencimiento = parametros.diasVencimiento;
        cuota.fechaVencimiento = moment(fechaProximaCuota).add(parametros.diasVencimiento, 'days').toDate();

        cuota.montoOriginal = registro.monto;
        cuota.factor = factor;
        cuota.monto = cuota.montoOriginal * factor;

        cuota.cia = registro.cia;
        cuota.docState = 1;

        cuotas.push(cuota);

        // finalmente, calculamos la fecha de la próxima cuota ...
        if (parametros.cantidadCuotas > 1) {
            if (lodash.isNumber(parametros.cantidadDias)) {
                fechaProximaCuota = moment(fechaProximaCuota).add(parametros.cantidadDias, 'days').toDate();
            }
            else if (lodash.isNumber(parametros.cantidadMeses)) {
                fechaProximaCuota = moment(fechaProximaCuota).add(parametros.cantidadMeses, 'months').toDate();
            }
        }
    }

    return cuotas; 
}