
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'; 

import moment from "moment"; 
import lodash from "lodash"; 

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { useForm } from "react-hook-form";

import { Grid, Row, Col, Button } from 'react-bootstrap';
import { Navbar, Nav, NavItem } from 'react-bootstrap';

import Message from './Message';

import Distribucion from './distribucionEnCompanias/Distribucion'; 
import AgregarCuotas from './cuotas/AgregarCuotas'; 
import Cuotas from './cuotas/Cuotas'; 

import { MessageModal } from '/client/imports/genericReactComponents/MessageModal';
import { convertFromStringToDate } from '/imports/funciones/DateFunctions'; 
// import validarItemVsSimpleSchema from '/client/imports/general/validarItemVsSimpleSchema';

// import { RegistrosManuales_formValidation_schema } from '/imports/collections/principales/registrosManuales'; 

import { registrosManuales_yup_schema  } from './yup.schema'; 

const Detalles = ({ companiaSeleccionada, monedas, ramos, companias, asegurados, 
                    setCurrentTab, userMadeChanges, setUserMadeChanges, 
                    cuotas, setCuotas, currentItem, setCurrentItem }) => {

    // state para el MessageModal; este es un pequeño modal que muestra un spinner cuando un proceso largo se ejecuta; también un mensaje 
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageModalShowSpinner, setMessageModalShowSpinner] = useState(false);
    const [messageModalTitle, setMessageModalTitle] = useState("");
    const [messageModalMessage, setMessageModalMessage] = useState({ type: '', message: '', show: false });

    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' });

    const [showDistribucionModal, setShowDistribucionModal] = useState(false);
    const [showAgregarCuotasModal, setShowAgregarCuotasModal] = useState(false); 
    const [showCuotasModal, setShowCuotasModal] = useState(false); 

    const handleMessageDismiss = () => {
        setShowMessage({ show: false, type: '', message: '' });
    }

    const formValues = getFormValuesFromItem(currentItem);
    const { register, handleSubmit, reset, getValues, formState: { isDirty } } = useForm({ defaultValues: formValues });

    const editMode = currentItem?._id ? true : false; 

    // ===============================================================================================
    // OnSubmit 
    // =============================================================================================== 
    const onSubmit = (data) => { 
        // para mostrar un (sub) modal que muestra un spinner y un mensaje final para este proceso 
        setShowMessageModal(true);
        setMessageModalShowSpinner(true);
        setMessageModalTitle("Registros manuales ... Grabando el registro");

        // get a clone from data 
        const values = Object.assign({}, data);

        // validamos el item usando Yup 
        const isValid = registrosManuales_yup_schema.isValidSync(values); 
        
        if (!isValid) {
            // nota: aquí sabemos que la validación fallará ... pero queremos obtener el array con mensajes de error 
            registrosManuales_yup_schema.validate(values, { abortEarly: false })
                .catch(errors => {
                    const message = errors.errors.reduce((acum, curr) => `${acum} <br /> ${curr}`); 

                    setShowMessage({ show: true, type: 'danger', message });

                    setMessageModalMessage({
                        type: 'danger',
                        message: `Aparentemente, existen <em>errores de validación</em> en los datos. <br /> 
                          Por favor cierre este cuadro de diálogo y revise el mensaje de error arriba en la página.  
                         `,
                        show: true
                    });

                    setMessageModalShowSpinner(false);
                }); 
        } else { 
            // nota: aquí sabemos que la validación no va a fallar. 
            // *Pero* queremos los valores *transformados* por Yup (ej: desde string a number/date)
            registrosManuales_yup_schema.validate(values, { abortEarly: false })
                .then(data => {
                    if (!editMode) {
                        handleInsertItem(data);
                    } else {
                        // como el item está siendo modificado, asignamos valores a ultUsuario y ultAct
                        const user = Meteor.user();
                        const userName = user.username ? user.username : user.emails[0].address;

                        data.ultAct = new Date(); 
                        data.ultUsuario = userName; 

                        handleUpdateItem(data);
                    }
                }); 
        }
    }

    const handleInsertItem = (item) => {
        Meteor.call('registrosManuales.save.insert', item, (err, result) => {

            if (err) {
                setShowMessage({ show: true, type: 'danger', message: err.message });

                setMessageModalMessage({
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta operación. <br /> 
                              Por favor cierre este cuadro de diálogo y revise el mensaje de error arriba en la página. 
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
                              Por favor cierre este cuadro de diálogo y revise el mensaje de error arriba en la página. 
                             `,
                    show: true
                });

                setMessageModalShowSpinner(false);

                return;
            }

            const currentItem = lodash.cloneDeep(result.item );

            // agregamos el array de distribución al item, si este no viene 
            if (!currentItem.distribucion) {
                currentItem.distribucion = [];
            }

            setCurrentItem(currentItem); 

            // la idea es que la forma entienda que estos son los nuevos *default* values
            // isDirty cambia si cambian esos valores 
            const formValues = getFormValuesFromItem(currentItem);
            reset(formValues); 

            setUserMadeChanges(false);
            
            setShowMessage({ show: false, type: 'success', message: "" });
            setMessageModalMessage({
                type: 'success',
                message: `Ok, el <em>registro manual</em> ha sido registrado en forma exitosa. `,
                show: true
            });
            setMessageModalShowSpinner(false);
        })
    }

    const handleUpdateItem = (item) => {
        Meteor.call('registrosManuales.save.update', item, cuotas, (err, result) => {

            if (err) {
                setShowMessage({ show: true, type: 'danger', message: err.message });

                setMessageModalMessage({
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta operación. <br /> 
                              Por favor cierre este cuadro de diálogo y revise el mensaje de error arriba en la página. 
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
                              Por favor cierre este cuadro de diálogo y revise el mensaje de error arriba en la página. 
                             `,
                    show: true
                });

                setMessageModalShowSpinner(false);

                return;
            }

            const currentItem = lodash.cloneDeep(result.item);

            // agregamos el array de distribución al item, si este no viene 
            if (!currentItem.distribucion) {
                currentItem.distribucion = [];
            }

            setCurrentItem(currentItem); 

            // la idea es que la forma entienda que estos son los nuevos *default* values
            // isDirty cambia si cambian esos valores 
            const formValues = getFormValuesFromItem(currentItem);
            reset(formValues); 

            // las cuotas, si existen y fueron modificadas, siempre regresan luego de haber sido leídas nuevamente desde el db 
            // las actualizamos para que sean refrescadas en forma apropiada 
            setCuotas(result.cuotas); 

            setShowMessage({ show: false, type: 'success', message: "" });
            setMessageModalMessage({
                type: 'success',
                message: `Ok, el <em>registro manual</em> ha sido actualizado en forma exitosa. `,
                show: true
            });
            setMessageModalShowSpinner(false);
            setUserMadeChanges(false);
        })
    }

    const nuevo = () => {
        // getFormValuesFromItem podría traer algunos defaults; por ejemplo: fecha = today 
        const formValues = getFormValuesFromItem({});

        setCuotas([]);                                 
        setCurrentItem({});                 // el item ahora es nuevo                              
        reset(formValues); 
    }

    const handleDeleteItem = (item) => {

        setShowMessageModal(true);
        setMessageModalShowSpinner(true);
        setMessageModalTitle("Registros manuales ... Eliminando el registro");

        Meteor.call('registrosManuales.save.remove', item._id, (err, result) => {

            if (err) {
                setShowMessage({ show: true, type: 'danger', message: err.message });

                setMessageModalMessage({
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta operación. <br /> 
                              Por favor cierre este cuadro de diálogo y revise el mensaje de error arriba en la página. 
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
                              Por favor cierre este cuadro de diálogo y revise el mensaje de error arriba en la página. 
                             `,
                    show: true
                });

                setMessageModalShowSpinner(false);

                return;
            }

            setShowMessage({ show: false, type: 'success', message: "" });
            setMessageModalMessage({
                type: 'success',
                message: `Ok, el <em>registro manual</em> ha sido eliminado en forma exitosa. `,
                show: true
            });
            setMessageModalShowSpinner(false);

            setCuotas([]);
            setCurrentItem({});                 // el item ahora es nuevo                          

            reset({}); 
        })
    }

    const handleRegresar = () => { 
        // regresamos a la lista - Tab #2
        setCurrentTab(2);
    }

    const distribucion = () => { 

        // para tener una copia de los valores *actualizados (ie: iditados)* en la forma y pasarlos al modal 
        const formValues = getValues(); 
        const monto = formValues.monto ? parseFloat(formValues.monto) : 0; 
        
        if (!monto) {
            setShowMessageModal(true);
            setMessageModalShowSpinner(false);
            setMessageModalTitle("Registros manuales ... Distribución");

            setMessageModalMessage({
                type: 'danger',
                message: `Agregar registros de distribución es posible cuando existe un monto. <br /> 
                        Por favor, indique un monto <em>antes</em> de intentar agregar su distribución. <br />
                        `,
                show: true
            });

            return;
        }
        
        setShowDistribucionModal(true); 
    }

    // ============================================================================================================
    // para agregar o modificar un item al array 'distribución' en el registro que se está editando en la forma 
    // editMode indica que el usuario está editanto (no insertando); deleteMode indica que el usuario está editanto y
    // elimina el row 
    const distribucionArray_addEditDeleteItem = (item, editMode, deleteMode) => { 
        if (!currentItem.distribucion) { 
            currentItem.distribucion = []; 
        }

        // editMode: para saber si el usuario está agregando o editando un item en el array 
        if (!editMode) { 
            currentItem.distribucion.push(item); 
        } else if (!deleteMode) { 
            // cuando el usuario edita un item en el array, debemos buscar el original para sustituirlo 
            const index = currentItem.distribucion.findIndex(x => x._id === item._id);
            if (index === -1) {
                // no encontramos el item en el array - esto no debe ocurrir nunca 
                return;
            }

            // ya tenemos el index; ahora sustituimos el item en el array con los nuevos valores 
            currentItem.distribucion[index] = { ...item }; 
        } else { 
            // cuando el usuario elmina un item en el array, debemos buscar el original para eliminarlo 
            const index = currentItem.distribucion.findIndex(x => x._id === item._id);
            if (index === -1) {
                // no encontramos el item en el array - esto no debe ocurrir nunca 
                return;
            }

            // ya tenemos el index del item en el array, lo eliminamos 
            currentItem.distribucion.splice(index, 1);  
        }
    }

    const construirCuotas = () => {
        if (userMadeChanges) {
            setShowMessageModal(true);
            setMessageModalShowSpinner(false);
            setMessageModalTitle("Registros manuales ... Construir cuotas");

            setMessageModalMessage({
                type: 'danger',
                message: `Ud. no puede intentar construir las cuotas cuando el registro está siendo <em>editado</em>. <br /> 
                        Por favor, complete la edición del registro y haga un <em>click</em> en <b><em>Grabar</em></b>. <br /> 
                        Solo luego regrese e intente construir y registrar las cuotas.
                        `,
                show: true
            });

            return; 
        }

        setShowAgregarCuotasModal(true); 
    }

    // ===============================================================================================
    // usamos isDirty para saber si el usuario ha editado los valores en la forma 
    // la idea es modificar Grabar para mostrar Grabar(*), como es nuestra costumbre en el programa 
    useEffect(() => { 

        if(isDirty) { 
            setUserMadeChanges(true); 
        } else { 
            setUserMadeChanges(false); 
        }

    }, [isDirty])

    return (
        <div>

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

            {/* para mostrar el modal que permite al usuario distribuir el monto original en compañías  */}
            {
                showDistribucionModal &&
                <Distribucion setShowDistribucionModal={setShowDistribucionModal}
                            companias={companias}
                            currentItem={currentItem}
                            formValues={formValues}
                            distribucionArray_addEditDeleteItem={distribucionArray_addEditDeleteItem}
                            setUserMadeChanges={setUserMadeChanges} />
            }

            {/* para mostrar el modal que muestra la lista de cuotas   */}

            {
                showCuotasModal &&
                <Cuotas setShowCuotasModal={setShowCuotasModal}
                        companias={companias}
                        monedas={monedas}
                        cuotas={cuotas} />
            }

            {/* para mostrar el modal que permite al usuario distribuir el monto original en compañías  */}
            {
                showAgregarCuotasModal &&
                <AgregarCuotas setShowAgregarCuotasModal={setShowAgregarCuotasModal} 
                               item={currentItem}
                               cuotas={cuotas}
                               setCuotas={setCuotas} 
                               setUserMadeChanges={setUserMadeChanges}/>
            }

            <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>
                <Grid fluid={true}>

                    <Row>
                        <Col sm={10} smOffset={1}>
                            <Navbar collapseOnSelect fluid className="toolBar">

                                <Nav>
                                    <NavItem eventKey={1} href="#" onClick={nuevo}>
                                        Nuevo
                                    </NavItem>
                                </Nav>

                                <Nav pullRight>
                                    <NavItem eventKey={2} href="#" onClick={() => setShowCuotasModal(true)}>Cuotas</NavItem>
                                    <NavItem eventKey={2} href="#" onClick={construirCuotas}>Construir cuotas</NavItem>
                                    <NavItem eventKey={3} href="#" onClick={distribucion}>Distribución</NavItem>

                                    <NavItem eventKey={4} href="#" onClick={handleSubmit(onSubmit)}>
                                        { userMadeChanges ? 
                                            <span style={{ fontStyle: 'italic', color: 'blue', fontWeight: 'bold' }}>Grabar(*)</span>
                                        : 
                                            <span>Grabar</span>
                                        }
                                    </NavItem>

                                    <NavItem eventKey={5} href="#" onClick={handleRegresar}><b><em>Regresar</em></b></NavItem>
                                </Nav>

                            </Navbar>
                        </Col>
                    </Row>

                    <Row style={{ marginTop: '15px' }}>
                        <Col sm={3} smOffset={1} >
                            <div className="form-group">
                                <label style={{ fontSize: '13px' }}>ID</label>
                                <input type="text" className="form-control input-sm" readOnly {...register("_id")} />
                            </div>
                        </Col>
                        <Col sm={3} smOffset={0} >
                        </Col>
                        <Col sm={3} smOffset={0} >
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={1} >
                            <div className="form-group">
                                <label style={{ fontSize: '13px' }}>Compañía</label>
                                <select className="form-control input-sm" {...register("compania")}>
                                    <option key={'abcxyz'} value={''}>{''}</option>
                                    {companias.map(x => (<option key={x._id} value={x._id}>{x.nombre}</option>))}
                                </select>
                            </div>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <div className="form-group">
                                <label style={{ fontSize: '13px' }}>Fecha</label>
                                <input type="date" className="form-control input-sm" {...register("fecha")} />
                            </div>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <div className="form-group">
                                <label style={{ fontSize: '13px' }}>Origen</label>
                                <select className="form-control input-sm" {...register("origen")}>
                                    <option value="fac">Riesgo facultativo</option>
                                    <option value="sinFac">Siniestros (fac)</option>
                                    <option value="prop">Proporcionales</option>
                                    <option value="noProp">No proporcionales</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={1} >
                            <div className="form-group">
                                <label style={{ fontSize: '13px' }}>Código</label>
                                <input type="text" className="form-control input-sm" {...register("codigo")} />
                            </div>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <div className="form-group">
                                <label style={{ fontSize: '13px' }}>Referencia</label>
                                <input type="text" className="form-control input-sm" {...register("referencia")} />
                            </div>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <div className="form-group">
                                <label style={{ fontSize: '13px' }}>Número</label>
                                <input type="number" className="form-control input-sm" {...register("numero")} />
                            </div>
                        </Col>
                    </Row>

                    <Row style={{ marginBottom: '15px' }}>
                        <Col sm={3} smOffset={1} >
                            <label style={{ fontSize: '13px' }}>Moneda</label>
                            <select className="form-control input-sm" {...register("moneda")}>
                                <option key={'abcxyz'} value={''}>{''}</option>
                                {monedas.map(x => (<option key={x._id} value={x._id}>{x.descripcion}</option>))}
                            </select>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <label style={{ fontSize: '13px' }}>Ramo</label>
                            <select className="form-control input-sm" {...register("ramo")}>
                                <option key={'abcxyz'} value={''}>{''}</option>
                                {ramos.map(x => (<option key={x._id} value={x._id}>{x.descripcion}</option>))}
                            </select>
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <label style={{ fontSize: '13px' }}>Asegurado</label>
                            <select className="form-control input-sm" {...register("asegurado")}>
                                <option key={'abcxyz'} value={''}>{''}</option>
                                {asegurados.map(x => (<option key={x._id} value={x._id}>{x.nombre}</option>))}
                            </select>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={3} smOffset={1} >
                            <div className="form-group" /> 
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <div className="form-group" /> 
                        </Col>
                        <Col sm={3} smOffset={0} >
                            <div className="form-group">
                                <label style={{ fontSize: '13px' }}>Monto</label>
                                <input type="number" step="0.01" className="form-control input-sm" {...register("monto")} />
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={9} smOffset={1} >
                            <div className="form-group">
                                <label style={{ fontSize: '13px' }}>Descripción</label>
                                <textarea type="text" rows="3" className="form-control input-sm" {...register("descripcion")} />
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={10} smOffset={1} >
                            {/* cómo el usuario no va a indicar fechas aquí, usamos type=text pues queremos mostrar fechas y horas 
                            en los inputs: ingreso y ultAct  */}
                            <Row style={{ backgroundColor: '#F2F2F2', border: '1px solid darkgray', padding: '10px' }}>
                                <Col sm={3} smOffset={0} style={{ textAlign: 'center' }}>
                                    <label style={{ fontSize: 'x-small' }}>Ingreso</label>
                                    <input type="text" className="form-control input-sm" {...register("ingreso")} readOnly />
                                </Col>

                                <Col sm={3} smOffset={0} style={{ textAlign: 'center' }}>
                                    <label style={{ fontSize: 'x-small' }}>Usuario</label>
                                    <input type="text" className="form-control input-sm" {...register("usuario")} readOnly />
                                </Col>

                                <Col sm={3} smOffset={0} style={{ textAlign: 'center' }}>
                                    <label style={{ fontSize: 'x-small' }}>Ult act</label>
                                    <input type="text" className="form-control input-sm" {...register("ultAct")} readOnly />
                                </Col>

                                <Col sm={3} smOffset={0} style={{ textAlign: 'center' }}>
                                    <label style={{ fontSize: 'x-small' }}>Usuario</label>
                                    <input type="text" className="form-control input-sm" {...register("ultUsuario")} readOnly />
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <Row style={{ marginTop: '15px' }}>
                        <Col sm={3} smOffset={1}>
                            { editMode ? 
                                <Button bsStyle="danger" bsSize="small" onClick={() => handleDeleteItem(currentItem)}>Eliminar</Button>
                            : 
                                <Button bsStyle="danger" bsSize="small" disabled onClick={() => handleDeleteItem(currentItem)}>Eliminar</Button>
                            }
                        </Col>
                        <Col sm={3} smOffset={3} style={{ textAlign: 'right' }}>
                            <Button bsStyle="primary" bsSize="small" type="submit">Grabar</Button>
                        </Col>
                    </Row>
                    
                </Grid>
            </form>
        </div>
    )
}

Detalles.propTypes = {
    companiaSeleccionada: PropTypes.object.isRequired, 
    monedas: PropTypes.array.isRequired, 
    ramos: PropTypes.array.isRequired, 
    companias: PropTypes.array.isRequired, 
    asegurados: PropTypes.array.isRequired, 
    setCurrentTab: PropTypes.func.isRequired,
    userMadeChanges: PropTypes.bool.isRequired,
    setUserMadeChanges: PropTypes.func.isRequired,
    cuotas: PropTypes.array.isRequired, 
    setCuotas: PropTypes.func.isRequired, 
    currentItem: PropTypes.object.isRequired, 
    setCurrentItem: PropTypes.func.isRequired
}

export default Detalles; 

// ------------------------------------------------------------------------------------------------------
// react-form siempre regresa strings, también para fechas y montos. 
// para poder validar usando simpl-schema, debemos convertir estos valores a sus tipos adecuados 
const convertirValoresParaValidar = function (values) { 

    const formValues = { ...values }; 
    let result = null;

    // convertimos algunos valores desde string a date 
    result = convertFromStringToDate(formValues.fecha);
    formValues.fecha = !result?.error ? result.date : undefined;

    // convertimos los montos desde string a number 
    formValues.numero = formValues.numero ? parseInt(formValues.numero) : undefined;
    formValues.monto = formValues.monto ? parseFloat(formValues.monto) : undefined;

    // ponemos undefined cuando el usuario no indica un valor, para que el error sea más natural 
    formValues.compania = formValues.compania ? formValues.compania : undefined;
    formValues.moneda = formValues.moneda ? formValues.moneda : undefined;
    formValues.descripcion = formValues.descripcion ? formValues.descripcion : undefined;

    // ingreso y ultAct vienen formateadas con sus fechas y horas; usamos moment para obtener la fecha 
    // a partir de esos valores que han sido previamente formateados 
    if (formValues.ingreso) {
        const dateValue = moment(formValues.ingreso, 'D-MMM-YYYY h:m a').toDate();
        formValues.ingreso = dateValue;
    } else { 
        formValues.ingreso = undefined; 
    }

    if (formValues.ultAct) {
        const dateValue = moment(formValues.ultAct, 'D-MMM-YYYY h:m a').toDate();
        formValues.ultAct = dateValue;
    } else {
        formValues.ultAct = undefined;
    }

    return formValues; 
}

// ------------------------------------------------------------------------------------------------------
// para completar el registro *antes* de grabar (y luego de validar) 
// aquí agregamos valores que *no existen* y no vienen desde la forma, como cia, _id, ingreso, usuario, etc. 
const completarValoresParaGrabar = function (values, originalItem, companiaSeleccionada, editMode) { 

    const result = lodash.cloneDeep(values); 

    // asignamos un nuevo _id al registro 
    if (!result._id) { 
        result._id = new Mongo.ObjectID()._str;
    }

    // aquí debemos *recuperar* el array distribución; como no está en la forma no viene con el item que el usuario ha editado. 
    // lo recuperamos desde clickedItem. Recordemos que clickItem es el item original que el usuario selecciona en la  lista y es 
    // el que pasamos al modal para editar el array 
    if (originalItem.distribucion) {
        result.distribucion = [];
        originalItem.distribucion.forEach(x => result.distribucion.push(x));
    }
    
    const user = Meteor.user();

    if (!result.ingreso) { 
        result.ingreso = new Date();
        result.usuario = user.username ? user.username : user.emails[0].address;
    }

    if (editMode) { 
        // el usuario está modificando algún registro; agregamos valores para: ultAct y ultUsuario 
        result.ultAct = new Date();
        result.ultUsuario = user.username ? user.username : user.emails[0].address;
    }

    // asignamos una compañía 
    result.cia = companiaSeleccionada._id; 
    
    return result; 
}

// ----------------------------------------------------------------------------------------------------------
// para guardar el filtro en el collection Filtros y que esté listo para la próxima vez
// ---------------------------------------------------------------------------------------------------------- 
const getFormValuesFromItem = (item) => {

    const result = { ...item }; 

    // el default para la fecha es hoy 
    if (!result.fecha) { 
        result.fecha = new Date(); 
    }

    // transformamos el item para poder mostrarlo en la forma. Básicamente, hacemos 2 cosas: 
    // 1) convertimos numbers/dates a strings. 2) eliminamos valores que no usa la forma (ej: cia, etc) 
    result.fecha = result?.fecha ? result.fecha.toISOString().substr(0, 10) : "";
    result.numero = result?.numero ? result.numero.toString() : "";
    result.monto = result?.monto ? result.monto.toString() : "";
    result.ingreso = result?.ingreso ? moment(result.ingreso).format('D-MMM-YYYY h:m a') : "";
    result.ultAct = result?.ultAct ? moment(result.ultAct).format('D-MMM-YYYY h:m a') : "";

    delete result.distribucion;             // el array de distribución, si viene, no es usado en la forma; por eso lo quitamos (similar a cia)
    delete result.cia;

    return result;
}