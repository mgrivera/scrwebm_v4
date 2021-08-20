
import { Meteor } from 'meteor/meteor'
import lodash from 'lodash';

import React, { useState } from 'react'
import PropTypes from 'prop-types';

import { useForm } from "react-hook-form";

import { useTracker } from 'meteor/react-meteor-data';

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';

// import NumericInput from 'react-numeric-input2';

import Spinner from './Spinner';
import Message from './Message';

import { Cumulos_Registro } from '/imports/collections/principales/cumulos_registro';
import validarItemVsSimpleSchema from '/client/imports/general/validarItemVsSimpleSchema';
import { convertFromStringToDate } from '/imports/funciones/DateFunctions';

import { MessageModal } from '/client/imports/genericReactComponents/MessageModal';
import { useEffect } from 'react';

const inicializarZonas = (cumuloId, cumulos) => {
    // seleccionamos las zonas que corresponden al cúmulo en el item 
    // la idea es usar como opciones en el select de zonas 
    if (!cumuloId) {
        return [];
    }
    const cumulo = cumulos.find(x => x._id === cumuloId);
    const zonas = cumulo?.zonas ? cumulo.zonas : [];
    return zonas;
}

const Detalles = ({ itemId, cumulos, monedas, ramos, companias, asegurados, empresasUsuarias, modo, setCurrentTab }) => {

    const { register, handleSubmit, reset, getValues, setValue, watch } = useForm();

    const [spinner, setSpinner] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' });

    // options para el select de zonas; cambia cuando el usuario cambia el cúmulo 
    // la 1ra vez, deben ser las zonas para el cúmulo que viene en el item 
    const [zonas, setZonas] = useState([]);

    // state para el MessageModal; este es un pequeño modal que muestra un spinner cuando un proceso largo se ejecuta; también un mensaje 
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageModalShowSpinner, setMessageModalShowSpinner] = useState(false);
    const [messageModalTitle, setMessageModalTitle] = useState("");
    const [messageModalMessage, setMessageModalMessage] = useState({ type: '', message: '', show: false });

    // TODO: tenemos que usar un useTracker para leer el item desde cumulos_registro 
    const itemLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('cumulosRegistro', { _id: itemId });
        return !handle.ready();

    }, []);

    useTracker(() => { 
        const item = Cumulos_Registro.findOne(itemId); 
        if (item) { 

            // nótese como cambiamos las fechas a strings para que puedan ser recibidas por los inputs 
            item.desde = item.desde.toISOString().substr(0, 10);
            item.hasta = item.hasta.toISOString().substr(0, 10);
            item.cumulosAl = item.cumulosAl.toISOString().substr(0, 10);

            // estos son los default values de la forma (react-hooks-form) 
            reset(item); // asynchronously reset your form values
        }
    }, [itemId]); 

    const handleMessageDismiss = () => {
        setShowMessage({ show: false, type: '', message: '' });
    }

    const calcularCumulo = () => {
        // para mostrar un (sub) modal que muestra un spinner y un mensaje final para este proceso 
        setShowMessageModal(true);
        setMessageModalShowSpinner(true);
        setMessageModalTitle("Registro de cúmulos - Calculando el monto del cúmulo ...");

        const values = getValues(); // { test: "test-input", test1: "test1-input" }

        // con los valores de los Inputs en la forma, calculamos el cúmulo 

        // -----------------------------------------------------------------------------------
        // montos del cuota parte 
        const { monto_cp, prima_cp, nuestraOrdenPorc_cp } = values;

        const nuestraOrdenMonto_cp = monto_cp * nuestraOrdenPorc_cp / 100;
        const nuestraOrdenPrima_cp = prima_cp * nuestraOrdenPorc_cp / 100;

        setValue('nuestraOrdenMonto_cp', lodash.round(nuestraOrdenMonto_cp, 2));
        setValue('nuestraOrdenPrima_cp', lodash.round(nuestraOrdenPrima_cp, 2));

        // -----------------------------------------------------------------------------------
        // montos del excedente 
        const { monto_ex, prima_ex, nuestraOrdenPorc_ex } = values;

        const nuestraOrdenMonto_ex = monto_ex * nuestraOrdenPorc_ex / 100;
        const nuestraOrdenPrima_ex = prima_ex * nuestraOrdenPorc_ex / 100;

        setValue('nuestraOrdenMonto_ex', lodash.round(nuestraOrdenMonto_ex, 2));
        setValue('nuestraOrdenPrima_ex', lodash.round(nuestraOrdenPrima_ex, 2));

        // -----------------------------------------------------------------------------------
        // montos del no prop  
        const { monto_noProp, prima_noProp, nuestraOrdenPorc_noProp } = values;

        const nuestraOrdenMonto_noProp = monto_noProp * nuestraOrdenPorc_noProp / 100;
        const nuestraOrdenPrima_noProp = prima_noProp * nuestraOrdenPorc_noProp / 100;

        setValue('nuestraOrdenMonto_noProp', lodash.round(nuestraOrdenMonto_noProp, 2));
        setValue('nuestraOrdenPrima_noProp', lodash.round(nuestraOrdenPrima_noProp, 2));

        // -----------------------------------------------------------------------------------
        // montos del fac
        const { monto_fac, prima_fac, nuestraOrdenPorc_fac } = values;

        const nuestraOrdenMonto_fac = monto_fac * nuestraOrdenPorc_fac / 100;
        const nuestraOrdenPrima_fac = prima_fac * nuestraOrdenPorc_fac / 100;

        setValue('nuestraOrdenMonto_fac', lodash.round(nuestraOrdenMonto_fac, 2));
        setValue('nuestraOrdenPrima_fac', lodash.round(nuestraOrdenPrima_fac, 2));

        // -----------------------------------------------------------------------------------
        // calculamos el monto del cúmulo 
        const { monto_ret } = values;
        const cumulo = nuestraOrdenMonto_cp + nuestraOrdenMonto_ex + nuestraOrdenMonto_noProp + nuestraOrdenMonto_fac - monto_ret;

        // calculamos la prima del cúmulo 
        const { prima_ret } = values;
        const primaCumulo = nuestraOrdenPrima_cp + nuestraOrdenPrima_ex + nuestraOrdenPrima_noProp + nuestraOrdenPrima_fac - prima_ret;

        setValue('cumulo', lodash.round(cumulo, 2));
        setValue('primaCumulo', lodash.round(primaCumulo, 2));

        setSpinner(false);

        // ------------------------------------------------------------------------------------------
        // finalizamos y mostramos el mensaje en el modal 
        const message = `Ok, el cúmulo ha sido calculado. Por favor revise el monto para verificar que luzca correcto. <br /><br />
                         Para grabar el registro debe hacer un <em>click</em> en <em>Grabar</em>.
                        `;
        setMessageModalMessage({ type: 'success', message, show: true });
        setMessageModalShowSpinner(false);
        // ------------------------------------------------------------------------------------------
    }

    const onSubmit = (data) => { 
        // para mostrar un (sub) modal que muestra un spinner y un mensaje final para este proceso 
        setShowMessageModal(true);
        setMessageModalShowSpinner(true);
        setMessageModalTitle("Registro de cúmulos - Actualizando el registro de cúmulos");

        // get a clone from data 
        const values = Object.assign({}, data);

        // convertimos algunos valores desde string a date 
        let result;

        result = convertFromStringToDate(data.desde);
        values.desde = !result?.error ? result.date : values.desde;

        result = convertFromStringToDate(data.hasta);
        values.hasta = !result?.error ? result.date : values.hasta;

        result = convertFromStringToDate(data.cumulosAl);
        values.cumulosAl = !result?.error ? result.date : values.cumulosAl;

        values.ultAct = new Date();
        values.ultUsuario = Meteor.user().emails[0].address;

        // esta función recibe un item (object) y lo valida contra su schema (simpl_schema)
        const validarResult = validarItemVsSimpleSchema(values, Cumulos_Registro.simpleSchema());

        if (validarResult.error) {
            setShowMessage({ show: true, type: 'danger', message: validarResult.message });

            setMessageModalMessage({
                type: 'danger',
                message: `Aparentemente, ha ocurrido un error de validación de los datos en la forma. <br /> 
                          El error es mostrado arriba en la página.  
                         `,
                show: true
            });

            setMessageModalShowSpinner(false);
            return;
        }

        Meteor.call('cumulos_registro.save.update', values, (err, result) => {

            if (err) {
                setShowMessage({ show: true, type: 'danger', message: err.message });

                setMessageModalMessage({
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta operación. <br /> 
                              El mensaje del error es mostrado arriba en la página. <br />
                              Por favor cierre este diálogo y revise el error arriba en la página. 
                             `,
                    show: true
                });

                setMessageModalShowSpinner(false);

                return;
            }

            if (result.error) {
                setShowMessage({ show: true, type: 'danger', message: result.message });

                setMessageModalMessage({
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta operación. <br /> 
                              El mensaje del error es mostrado arriba en la página. <br />
                              Por favor cierre este diálogo y revise el error arriba en la página. 
                             `,
                    show: true
                });

                setMessageModalShowSpinner(false);

                return;
            }

            setShowMessage({ show: false, type: 'success', message: "" });
            setMessageModalMessage({
                type: 'success',
                message: `Ok, el registro de cúmulos ha sido actualizado en la base de datos. `,
                show: true
            });
            setMessageModalShowSpinner(false);
        })
    }

    const tipoCumulo_wacthed = watch("tipoCumulo");

    useEffect(() => { 

        // cuando el usuario cambia el tipo de cúmulo, reinicializamos las zonas 
        const zonasArray = inicializarZonas(tipoCumulo_wacthed, cumulos); 
        setZonas(zonasArray); 

    }, [tipoCumulo_wacthed])
    
    return (!itemId ? (
        <div style={{ marginTop: '15px' }} >
            <p style={{ color: 'red' }}>
                Ud. debe seleccionar un registro en la lista, para poder ver aquí sus detalles y, si lo desea, editar sus valores.
            </p>
        </div >
    ) : (
        itemLoading ? (
            <div style={{ marginTop: '15px' }} >
                <Spinner />
            </div >
        ) :
        (
            <div>
                {spinner
                    ?
                    <div style={{ marginTop: '15px' }}>
                        <Spinner />
                    </div>
                    :
                    null
                }

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

                {/* para mostrar un modal que muestra un spinner y luego un mensaje al final 
                super apropiado para que el usuario espere por un proceso en el server y luego pueda ver un 
                mensaje con el resultado */}
                {showMessageModal &&
                    <MessageModal messageModalTitle={messageModalTitle}
                        showMessageModal={showMessageModal}
                        setShowMessageModal={setShowMessageModal}
                        messageModalShowSpinner={messageModalShowSpinner}
                        messageModalMessage={messageModalMessage}
                        setMessageModalMessage={setMessageModalMessage}
                    >
                    </MessageModal>
                }

                <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>

                    <Grid fluid={true}>
                        <Row style={{ background: '#F8F8F8', border: '1px solid #E7E7E7', borderRadius: '5px' }}>

                            <Col sm={7} style={{ textAlign: 'right' }}>
                            </Col>

                            <Col sm={1} /> 

                            <Col sm={1} style={{ textAlign: 'right' }}>
                                <Button bsStyle="link" onClick={calcularCumulo}>
                                    <span style={{ fontStyle: 'italic' }}>Calcular</span>
                                </Button>
                            </Col>

                            <Col sm={1} style={{ textAlign: 'right' }}>
                                <Button bsStyle="link" onClick={handleSubmit(onSubmit)}>
                                    <span style={{ fontStyle: 'italic' }}>Grabar</span>
                                </Button>
                            </Col>

                            <Col sm={2} style={{ textAlign: 'right' }}>
                                <Button bsStyle="link" onClick={() => setCurrentTab(1)}>
                                    <span style={{ fontStyle: 'italic' }}>Regresar a la lista</span>
                                </Button>
                            </Col>

                        </Row>

                        {/* ========================================================= */}
                        {/* Nuestra referencia */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Nuestra referencia: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={1} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Número</label>
                                    <input type="number" className="form-control input-sm"
                                        {...register("numero", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={1} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>&nbsp;</label>
                                    <input type="number" className="form-control input-sm"
                                        {...register("subNumero", { valueAsNumber: true })} />
                                </div>

                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Código</label>
                                    <input type="text" className="form-control input-sm"
                                        {...register("codigo")} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Referencia</label>
                                    <input type="text" className="form-control input-sm"
                                        {...register("referencia")} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <label style={{ fontSize: '13px' }}>Asegurado</label>
                                <select {...register("asegurado")} className="form-control input-sm">
                                    <option key={'abcxyz'} value={''}>{''}</option>
                                    {asegurados.map(x => (<option key={x._id} value={x._id}>{x.nombre}</option>))}
                                </select>
                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Información general */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Información general: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <label style={{ fontSize: '13px' }}>Moneda</label>
                                <select {...register("moneda")} className="form-control input-sm">
                                    {monedas.map(x => (<option key={x._id} value={x._id}>{x.descripcion}</option>))}
                                </select>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <label style={{ fontSize: '13px' }}>Compañía</label>
                                <select {...register("compania")} className="form-control input-sm">
                                    {companias.map(x => (<option key={x._id} value={x._id}>{x.nombre}</option>))}
                                </select>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <label style={{ fontSize: '13px' }}>Ced original</label>
                                <select {...register("cedenteOriginal")} className="form-control input-sm">
                                    {companias.map(x => (<option key={x._id} value={x._id}>{x.nombre}</option>))}
                                </select>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <label style={{ fontSize: '13px' }}>Ramo</label>
                                <select {...register("ramo")} className="form-control input-sm">
                                    {ramos.map(x => (<option key={x._id} value={x._id}>{x.descripcion}</option>))}
                                </select>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <label style={{ fontSize: '13px' }}>Origen</label>
                                <select {...register("origen")} className="form-control input-sm" readOnly>
                                    <option value="fac">fac</option>
                                    <option value="prop">prop</option>
                                    <option value="noProp">noProp</option>
                                </select>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <label style={{ fontSize: '13px' }}>Empresa usuaria</label>
                                <select {...register("cia")} className="form-control input-sm" readOnly>
                                    {empresasUsuarias.map(x => (<option key={x._id} value={x._id}>{x.nombreCorto}</option>))}
                                </select>
                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Tipo de cúmulo y zona */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Tipo de cúmulo y Zona: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <label style={{ fontSize: '13px' }}>Tipo de cúmulo</label>
                                <select {...register("tipoCumulo")} className="form-control input-sm">
                                    <option key={'abcxyz'} value={''}>{''}</option>
                                    {cumulos.map(x => (<option key={x._id} value={x._id}>{x.descripcion}</option>))}
                                </select>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <label style={{ fontSize: '13px' }}>Zona</label>
                                <select {...register("zona")} className="form-control input-sm">
                                    {zonas.map(x => (<option key={x._id} value={x._id}>{x.descripcion}</option>))}
                                </select>
                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Fechas */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Fechas: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Desde</label>
                                    <input type="date" className="form-control input-sm"
                                        {...register("desde")} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Hasta</label>
                                    <input type="date" className="form-control input-sm"
                                        {...register("hasta")} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Cumulos al</label>
                                    <input type="date" className="form-control input-sm"
                                        {...register("cumulosAl")} />
                                </div>
                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Cifras al 100% */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Cifras al 100%: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Valor a riesgo</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("valorARiesgo", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Suma asegurada</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("sumaAsegurada", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima del seguro</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("primaSeguro", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Límite de cesión</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("limiteCesion", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >

                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Cesión al CP */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Cesión al Cuota Parte: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("monto_cp", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("prima_cp", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Nuestra parte (%)</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenPorc_cp", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto - nuestra parte</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                            {...register("nuestraOrdenMonto_cp", { valueAsNumber: true })} readOnly/>
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima - nuestra parte</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenPrima_cp", { valueAsNumber: true })}  readOnly/>
                                </div>
                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Cesión al Excedente */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Cesion al Excedente: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("monto_ex", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("prima_ex", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Nuestra parte (%)</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenPorc_ex", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto - nuestra parte</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenMonto_ex", { valueAsNumber: true })}  readOnly/>
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima - nuestra parte</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenPrima_ex", { valueAsNumber: true })}  readOnly/>
                                </div>
                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Cesión al No Prop */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Cesión al No Proporcional: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("monto_noProp", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("prima_noProp", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Nuestra parte (%)</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenPorc_noProp", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto - nuestra parte</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenMonto_noProp", { valueAsNumber: true })}  readOnly/>
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima - nuestra parte</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenPrima_noProp", { valueAsNumber: true })}  readOnly/>
                                </div>
                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Facultativo */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Facultativo: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("monto_fac", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("prima_fac", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Nuestra parte (%)</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenPorc_fac", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto - nuestra parte</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenMonto_fac", { valueAsNumber: true })}  readOnly/>
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima - nuestra parte</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("nuestraOrdenPrima_fac", { valueAsNumber: true })}  readOnly/>
                                </div>
                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Retrocesión */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Retrocesión (fac): </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("monto_ret", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("prima_ret", { valueAsNumber: true })} />
                                </div>
                            </Col>
                        </Row>

                        {/* ========================================================= */}
                        {/* Cúmulo */}
                        {/* ========================================================= */}

                        <Row>
                            <Col sm={12}>
                                <hr style={{ marginBottom: '5px', borderTop: '2px solid #bbb' }} />
                                <h4 style={{ margin: '0' }}>Nuestro cúmulo: </h4>
                                <hr style={{ marginTop: '5px', borderTop: '2px solid #bbb' }} />
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Monto</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("cumulo", { valueAsNumber: true })} />
                                </div>
                            </Col>
                            <Col sm={2} smOffset={0} >
                                <div className="form-group">
                                    <label style={{ fontSize: '13px' }}>Prima</label>
                                    <input type="number" className="form-control input-sm" step=".01"
                                        {...register("primaCumulo", { valueAsNumber: true })} />
                                </div>
                            </Col>
                        </Row>

                        {modo != "consulta" &&
                        <Row>
                            <Col sm={11} smOffset={1} style={{ textAlign: 'right' }}>
                                <Button bsStyle="primary" bsSize="small" type="submit">Grabar</Button>
                            </Col>
                        </Row>
                        }
                    </Grid>
                </form>
            </div>
        )
    ))
}

Detalles.propTypes = {
    modo: PropTypes.string.isRequired,      // edicion / consulta
    itemId: PropTypes.string.isRequired,
    cumulos: PropTypes.array.isRequired,
    monedas: PropTypes.array.isRequired,
    companias: PropTypes.array.isRequired,
    ramos: PropTypes.array.isRequired,
    asegurados: PropTypes.array.isRequired,
    empresasUsuarias: PropTypes.array.isRequired,
    setCurrentTab: PropTypes.func.isRequired
};

export default Detalles; 