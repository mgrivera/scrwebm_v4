
import { Mongo } from 'meteor/mongo';
import lodash from 'lodash'; 

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { useForm } from "react-hook-form";

import { Grid, Row, Col } from 'react-bootstrap';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

import Spinner from '../Spinner';
import Message from '../Message';

import { distribucion_SimpleSchema, distribucion_formValidation_SimpleSchema } from '/imports/collections/principales/registrosManuales';
import validarItemVsSimpleSchema from '/client/imports/general/validarItemVsSimpleSchema';

import { distribucion_yup_schema } from '../yup.schema'; 

// nota: item es el item original. El array que se maneja a este nivel agrega items al array distribución en el item original 
export default function Detalles({ companias, clickedRow, setCurrentTab, distribucionArray_addEditDeleteItem, 
                                   setUserMadeChanges, setClickedRow, formValues, arrayDistribucion }) {

    const { register, handleSubmit, reset, getValues, setValue, watch, formState: { isDirty } } = useForm({ defaultValues: clickedRow });
    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' });
    const [spinner, setSpinner] = useState(false);

    // const item = Object.assign({}, items[clickedRow]);     // get a clone of object 

    // convertimos algunos nulls/undefined en '', pues los Inputs solo aceptan strings ... 
    // item.grupo = item.grupo === null ? '' : item.grupo;

    const handleMessageDismiss = () => {
        setShowMessage({ show: false, type: '', message: '' });
    }

    const regresarALaLista = () => {
        setCurrentTab(1);
    }

    const calcular = () => { 
        // obtenemos los valores para calcular el monto 
        const ordenPorc = getValues("ordenPorc"); 
        let ordenPorc2 = null; 

        if (ordenPorc) { 
            // el usuario indicó un porcentaje 
            ordenPorc2 = parseFloat(ordenPorc); 
        } else { 
            // el usuario *no* indicó un porcentaje; intentamso determinarlo 
            let sumOfOrdenPorc = arrayDistribucion.reduce((acum, curr) => curr.ordenPorc + acum, 0); 
            if (!sumOfOrdenPorc) { 
                sumOfOrdenPorc = 0; 
            }
            ordenPorc2 = 100 - sumOfOrdenPorc; 
        }
        
        const monto = formValues.monto; 
        const monto2 = parseFloat(monto); 

        if (ordenPorc2 && monto2) { 
            // los montos que creamos aquí son siempre de signo contrario al monto original
            let monto3 = (monto2 * -1) * ordenPorc2 / 100; 

            // el monto debe ser redondeado a 2 decimales
            monto3 = lodash.round(monto3, 2); 

            setValue("ordenPorc", ordenPorc2); 
            setValue("monto", monto3, {shouldDirty: true}); 
        }
    }

    const nuevo = () => {
        const item = {
            _id: "",
            compania: "",
            ordenPorc: "",
            monto: "",
        };

        setClickedRow(item);

        // para que la forma ponga isDirty en false y comience, nuevamente, el ciclo de edicion en la forma 
        reset(item); 
        setShowMessage({ show: false, type: '', message: '' });
    }

    const editMode = clickedRow?._id ? true : false; 

    // TODO: DELETE this code! 
    const onSubmit_borre = (data) => { 

        setSpinner(true); 
        setShowMessage({ show: false, type: 'info', message: "" });

        // get a clone from data 
        const values = Object.assign({}, data);

        // antes de validar debemos convertir fechas y numbers desde strings 
        const values2 = convertirValoresParaValidar(values);

        // esta función recibe un item (object) y lo valida contra su schema (simpl_schema)
        let validarResult = null;
        if (!editMode) {
            // cuando el usuario agrega un registro nuevo usamos un cierto schema para validar; 
            // por ejemplo, valores como: ultAct, ultUsuario y cia no vienen con el registro 
            validarResult = validarItemVsSimpleSchema(values2, distribucion_formValidation_SimpleSchema);
        } else {
            // cuando el usuario edita un registro que ya existía, vienen todos los valores, al menos los requeridos 
            validarResult = validarItemVsSimpleSchema(values2, distribucion_SimpleSchema);
        }

        if (validarResult.error) {
            setShowMessage({ show: true, type: 'danger', message: validarResult.message });
            setSpinner(false); 
            return;
        }

        // luego de la validación, debemos completar (_id, cia, ingreso, ...)
        // TODO: esto debe ser ajustado de acuerdo a: insert/update 
        const values3 = completarValoresParaGrabar(values2);
        distribucionArray_addEditDeleteItem(values3, editMode, false);

        setShowMessage({ show: true, 
                         type: 'success',
                         message: `Ok, los valores fueron actualizados en forma satisfactoria. <br /> 
                                   Para agregar otra compañía haga un <em>click</em> en <b><em>Nuevo</em></b>. 
                                  ` });
        setSpinner(false); 

        // para que la forma ponga isDirty en false y comience, nuevamente, el ciclo de edicion en la forma 
        reset(data); 

        // para que la forma principal, desde la cual se abre este diálogo, sepa que hubo cambios y prenda Grabar(*) 
        setUserMadeChanges(true); 
    }

    // ===============================================================================================
    // OnSubmit 
    // =============================================================================================== 
    const onSubmit = (data) => {
        // para mostrar un (sub) modal que muestra un spinner y un mensaje final para este proceso 
        setSpinner(true);
        setShowMessage({ show: false, type: 'info', message: "" });

        // get a clone from data 
        const values = Object.assign({}, data);

        // validamos el item usando Yup 
        const isValid = distribucion_yup_schema.isValidSync(values);

        if (!isValid) {
            // nota: aquí sabemos que la validación fallará ... pero queremos obtener el array con mensajes de error 
            distribucion_yup_schema.validate(values, { abortEarly: false })
                .catch(errors => {
                    const message = errors.errors.reduce((acum, curr) => `${acum} <br /> ${curr}`);
                    setShowMessage({ show: true, type: 'danger', message });                
                });
        } else {
            // nota: aquí sabemos que la validación no va a fallar. 
            // *Pero* queremos los valores *transformados* por Yup (ej: desde string a number/date)
            distribucion_yup_schema.validate(values, { abortEarly: false })
                .then(data => {
                    if (!editMode) {
                        // handleInsertItem(data);

                        setShowMessage({
                            show: true,
                            type: 'success',
                            message: `Ok, los valores fueron actualizados en forma satisfactoria. <br /> 
                                   Para agregar otra compañía haga un <em>click</em> en <b><em>Nuevo</em></b>. 
                                  ` });
                        setSpinner(false);

                        // estos valores serán usados como defaults en la forma; debemos convertirlos a strings 
                        data.ordenPorc = data?.ordenPorc ? data.ordenPorc.toString() : "";
                        data.monto = data?.monto ? data.monto.toString() : "";

                        // para que la forma ponga isDirty en false y comience, nuevamente, el ciclo de edicion en la forma 
                        reset(data);

                        // para que la forma principal, desde la cual se abre este diálogo, sepa que hubo cambios y prenda Grabar(*) 
                        setUserMadeChanges(true); 
                    } else {
                        // como el item está siendo modificado, asignamos valores a ultUsuario y ultAct
                        // handleUpdateItem(data);

                        setShowMessage({
                            show: true,
                            type: 'success',
                            message: `Ok, los valores fueron actualizados en forma satisfactoria. <br /> 
                                   Para agregar otra compañía haga un <em>click</em> en <b><em>Nuevo</em></b>. 
                                  ` });
                        setSpinner(false);

                        // estos valores serán usados como defaults en la forma; debemos convertirlos a strings 
                        data.ordenPorc = data?.ordenPorc ? data.ordenPorc.toString() : "";
                        data.monto = data?.monto ? data.monto.toString() : "";

                        // para que la forma ponga isDirty en false y comience, nuevamente, el ciclo de edicion en la forma 
                        reset(data);

                        // para que la forma principal, desde la cual se abre este diálogo, sepa que hubo cambios y prenda Grabar(*) 
                        setUserMadeChanges(true); 
                    }
                });
        }
    }

    const handleDeleteItem = () => {
        // TODO: aquí debemos eliminar el item de la lista 
        distribucionArray_addEditDeleteItem(clickedRow, editMode, true);
        // para que la forma principal, desde la cual se abre este diálogo, sepa que hubo cambios y prenda Grabar(*) 
        setUserMadeChanges(true); 

        const item = {
            _id: "",
            compania: "",
            ordenPorc: "",
            monto: "",
        };

        setClickedRow(item);

        // para que la forma ponga isDirty en false y comience, nuevamente, el ciclo de edicion en la forma 
        reset(item); 

        setShowMessage({
            show: true,
            type: 'success',
            message: `Ok, el registro ha sido eliminado de la lista. <br />
                      No olvide que Ud. debe cerrar esta diálogo y hacer un click en <em>Grabar</em> para registrar estos cambios. 
                     `
        });
    }

    // ===============================================================================================
    // usamos isDirty para saber si el usuario ha editado los valores en la forma 
    // la idea es modificar Grabar para mostrar Grabar(*), como es nuestra costumbre en el programa 
    useEffect(() => {

        if (isDirty) {
            setUserMadeChanges(true);
        } else {
            setUserMadeChanges(false);
        }

    }, [isDirty])

    return (
        <div style={{ textAlign: 'left', border: 'solid lightgray 1px', borderRadius: '5px', padding: '10px' }}>

            <Row>
                <Col sm={10} smOffset={1}>
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
                </Col>
            </Row>

            <Row>
                <Col sm={10} smOffset={1}>
                    <Navbar collapseOnSelect fluid className="toolBar">

                        <Nav>
                            <NavItem eventKey={1} href="#" onClick={nuevo}>
                                Nuevo
                            </NavItem>
                        </Nav>

                        <Nav pullRight>
                            <NavItem eventKey={4} href="#" onClick={calcular}>Calcular</NavItem>
                            <NavItem eventKey={5} href="#" onClick={regresarALaLista}><b><em>Regresar a la lista</em></b></NavItem>
                        </Nav>

                    </Navbar>
                </Col>
            </Row>

            <Row>
                <Col sm={10} smOffset={1}>
                    <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>
                        <Grid fluid={true}>

                            <Row style={{ marginTop: '0' }}>
                                <Col sm={5} smOffset={0} >
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>ID</label>
                                        <input type="text" className="form-control input-sm" readOnly {...register("_id")} />
                                    </div>
                                </Col>
                                <Col sm={2} smOffset={0} />

                                <Col sm={5} smOffset={0} >
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>Compañía</label>
                                        <select className="form-control input-sm" {...register("compania")}>
                                            <option key={'abcxyz'} value={''}>{''}</option>
                                            {companias.map(x => (<option key={x._id} value={x._id}>{x.nombre}</option>))}
                                        </select>
                                    </div>
                                </Col>
                            </Row>

                            <Row style={{ marginTop: '15px' }}>
                                <Col sm={5} smOffset={0} >
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>Orden(%)</label>
                                        <input type="number" step="0.01" className="form-control input-sm" {...register("ordenPorc")} />
                                    </div>
                                </Col>
                                <Col sm={2} smOffset={0} />

                                <Col sm={5} smOffset={0} >
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px' }}>Monto</label>
                                        <input type="number" step="0.01" className="form-control input-sm" {...register("monto")} />
                                    </div>
                                </Col>
                            </Row>

                            <br />

                            <Row>
                                <Col sm={5} >
                                    {/* el botón está activo *solo* cuando el usaurio está editando un item que existía antes; no para un item nuevo  */}
                                    { 
                                        clickedRow._id ? 
                                            <Button bsStyle="danger" bsSize="small" onClick={handleDeleteItem}>Eliminar</Button>
                                        : 
                                            <Button bsStyle="danger" bsSize="small" onClick={handleDeleteItem} disabled>Eliminar</Button>
                                    }
                                </Col>
                                <Col sm={2} smOffset={0} />
                                <Col sm={5} smOffset={0} style={{ textAlign: 'right' }} >
                                    {/* el butón está activo *solo* si han habido cambios en los datos en la forma  */}
                                    {
                                        isDirty ? 
                                            <Button bsStyle="primary" bsSize="small" type="submit">Registrar cambios</Button>
                                        : 
                                            <Button bsStyle="primary" bsSize="small" type="submit" disabled>Registrar cambios</Button>
                                    }
                                </Col>
                            </Row>
                        </Grid>
                    </form>
                </Col>
            </Row>
        </div>
    )
}

Detalles.propTypes = {
    companias: PropTypes.array.isRequired,
    clickedRow: PropTypes.object.isRequired,
    setClickedRow: PropTypes.func.isRequired,
    formValues: PropTypes.object.isRequired, 
    setCurrentTab: PropTypes.func.isRequired,
    distribucionArray_addEditDeleteItem: PropTypes.func.isRequired, 
    setUserMadeChanges: PropTypes.func.isRequired, 
    arrayDistribucion: PropTypes.array.isRequired
}; 

// ------------------------------------------------------------------------------------------------------
// react-form siempre regresa strings, también para fechas y montos. 
// para poder validar usando simpl-schema, debemos convertir estos valores a sus tipos adecuados 
const convertirValoresParaValidar = function (values) {

    // convertimos los montos desde string a number 
    values.ordenPorc = values.ordenPorc ? parseFloat(values.ordenPorc) : undefined;
    values.monto = values.monto ? parseFloat(values.monto) : undefined;

    return values;
}

// ------------------------------------------------------------------------------------------------------
// para completar el registro *antes* de grabar (y luego de validar) 
// aquí agregamos valores que *no existen* y no vienen desde la forma, como cia, _id, ingreso, usuario, etc. 
const completarValoresParaGrabar = function (values) {
    // asignamos un nuevo _id al registro 
    if (!values._id) {
        values._id = new Mongo.ObjectID()._str;
    }

    return values;
}