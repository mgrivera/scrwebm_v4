
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import lodash from 'lodash';

import React, { useState, useEffect, useRef } from 'react';

import { useTracker } from 'meteor/react-meteor-data';

import Tabs from 'react-bootstrap/lib/Tabs';
import Tab from 'react-bootstrap/lib/Tab';
import Button from 'react-bootstrap/lib/Button';

import ToolBar from './ToolBar';
import FormGenerales from './FormGenerales';
import FormListas from './FormListas';
import Spinner from '/client/imports/reactComponents/Spinner';
import Alerts from '/client/imports/reactComponents/Alerts';

import { Notas } from './Notas';

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { Filtros } from '/imports/collections/otros/filtros';

import { Monedas } from '/imports/collections/catalogos/monedas';
import { Companias } from '/imports/collections/catalogos/companias';

function ConsultaMontosPagadosFiltro() {

    const [companiaSeleccionada, setCompaniaSeleccionada] = useState({});
    const [currentTab, setCurrentTab] = useState(1);
    const [formValues, setFormValues] = useState({
        periodoPagos1: '',
        periodoPagos2: '',
        monedas: [],
        companias: [], 
        tipoNegocio: []
    });

    // style: // danger / warning / success / info
    const [alert, setAlert] = useState({ show: false, style: "", title: "", message: "" });
    const [showSpinner, setShowSpinner] = useState(false);
    const linkRef = useRef(null);   // creamos un ref para el link que permite pasar a la próxima página 

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
    }, []);

    useEffect(() => {
        // si hay un filtro anterior, lo usamos
        // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
        const filtroAnterior = Filtros.findOne(
            {
                nombre: 'consultas.montosPagados',
                userId: Meteor.userId(),
            });

        // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
        if (filtroAnterior && filtroAnterior.filtro) {
            setFormValues((values) => ({ ...values, ...filtroAnterior.filtro }))
        }
    }, []);

    const handleAlertsDismiss = () => {
        setAlert(state => ({ ...state, show: false }))
    }

    // para leer catálogos que deben estar en el client para la ejecución normal de la consulta 
    const catalogosLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('consulta.montosPagados.catalogos');
        return !handle.ready();
    }, []);

    // mientras algún subscription handle no sea ready(), mostramos el loading (spinner)... 
    const loadingInitialData = [catalogosLoading].some(x => x);

    const handleTabSelect = (key) => setCurrentTab(key);

    // para mantener el state con los valores de la forma (2 formas: filtro generales y filtro listas); 
    // pasamos esta función a las formas para que actualicen el state 
    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    // para mantener el state en listas (select multiple inputs)
    const onListChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selectedValues = selectedOptions.map(x => x.value);

        setFormValues({ ...values, [name]: selectedValues });
    }

    // ====================================================================================================
    // funciones para manejar el state en las listas (para hacer el search en monedas, compañías, ramos, etc.) 

    // ------------ monedas ------------------------------------------
    const monedasFilter = (inputValue) => {
        return Monedas.find({ descripcion: new RegExp(inputValue, 'i') })
            .fetch()
            .map(x => ({ value: x._id, label: x.descripcion }));
    };

    let subscriptionMonedas = {};

    const monedasSearch = inputValue =>
        new Promise(resolve => {
            subscriptionMonedas = Meteor.subscribe('search.monedas', inputValue, () => {
                resolve(monedasFilter(inputValue));
            });
        });

    const monedasHandleChange = option => {
        // agregamos al state el item seleccionado por el usuario en la lista (search)
        const monedas = formValues.monedas;
        const existe = monedas.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        monedas.push(option);
        const monedas2 = lodash.sortBy(monedas, ['label']);

        setFormValues((values) => ({ ...values, monedas: monedas2 }));
    }

    const monedasHandleDeleteFromList = (e, item) => {
        const monedas = formValues.monedas.filter(x => {
            return (x.value != item.value);
        });
        setFormValues((values) => ({ ...values, monedas }));
    }

    // ------------ companias ------------------------------------------
    const companiasFilter = (inputValue) => {
        return Companias.find({ nombre: new RegExp(inputValue, 'i') })
            .fetch()
            .map(x => ({ value: x._id, label: x.nombre }));
    };

    let subscriptionCompanias = {};

    const companiasSearch = inputValue =>
        new Promise(resolve => {
            subscriptionCompanias = Meteor.subscribe('search.companias', inputValue, () => {
                resolve(companiasFilter(inputValue));
            });
        });

    const companiasHandleChange = option => {
        // agregamos al state el item seleccionado por el usuario en la lista (search)
        const companias = formValues.companias;
        const existe = companias.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        companias.push(option);
        const companias2 = lodash.sortBy(companias, ['label']);

        setFormValues((values) => ({ ...values, companias: companias2 }));
    }

    const companiasHandleDeleteFromList = (e, item) => {
        const companias = formValues.companias.filter(x => {
            return (x.value != item.value);
        });
        setFormValues((values) => ({ ...values, companias }));
    }
    // ====================================================================================================

    return (
        loadingInitialData ? (
            <Spinner />
        ) :
            (
                <div className="ui-viewBorder-left-aligned">

                    <div>
                        {/* el siguiente link es hidden; para ir a la otra página (list) */}
                        <a href={`consultas/montosPagados/lista`}
                            ref={linkRef}
                            hidden>
                            go to list page ...
                        </a>
                    </div>

                    <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                        <span style={{ color: 'dodgerblue' }}>{companiaSeleccionada.nombre}</span>
                    </div >

                    <ToolBar title="Consultas / Montos pagados / Filtro" />

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

                    <div className="ui-viewBorder-left-aligned">

                        <form style={{ marginTop: '20px' }}
                            onSubmit={(e) => aplicarFiltro(e,
                                formValues,
                                setAlert,
                                setShowSpinner,
                                linkRef,
                                companiaSeleccionada,
                                subscriptionMonedas,
                                subscriptionCompanias)}>

                            <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">
                                <Tab eventKey={1} title="Generales">

                                    {(currentTab === 1) && (
                                        <div>
                                            <FormGenerales formValues={formValues}
                                                           onInputChange={onInputChange} 
                                                           onListChange={onListChange} 
                                            />
                                        </div>
                                    )}

                                </Tab>

                                <Tab eventKey={2} title="Listas">

                                    {(currentTab === 2) && (
                                        <div>
                                            <FormListas monedas={formValues.monedas}
                                                companias={formValues.companias}
                                                monedasSearch={monedasSearch}
                                                monedasHandleChange={monedasHandleChange}
                                                companiasSearch={companiasSearch}
                                                companiasHandleChange={companiasHandleChange}
                                                monedasHandleDeleteFromList={monedasHandleDeleteFromList}
                                                companiasHandleDeleteFromList={companiasHandleDeleteFromList}
                                                formValues={formValues} 
                                            />
                                        </div>
                                    )}
                                </Tab>

                                <Tab eventKey={3} title="Notas">
                                    {(currentTab === 3) &&
                                        <Notas />
                                    }
                                </Tab>
                            </Tabs>

                            <div style={{ display: 'flex', marginTop: "20px" }}>
                                <div style={{ flex: '50%', textAlign: 'left' }}>
                                    <Button bsStyle="default" bsSize="small" onClick={() => limpiarFiltro(setFormValues)}>Limpiar filtro</Button>
                                </div>
                                <div style={{ flex: '50%', textAlign: 'right' }}>
                                    <Button bsStyle="primary"
                                        type="submit"
                                        bsSize="small">
                                        Aplicar filtro
                                    </Button>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            )
    )
}

function limpiarFiltro(setFormValues) {

    setFormValues({
        periodoCobros1: '',
        periodoCobros2: '',
    });
}

function aplicarFiltro(e, formValues, setAlert, setShowSpinner, linkRef, companiaSeleccionada, subscriptionMonedas, subscriptionCompanias) {

    e.preventDefault();

    // para guardar, en Filtros, el filtro que acaba de indicar el usuairo 
    guardarFiltro(formValues);

    // agregamos la cia seleccionada al filtro 
    const filtro = { ...formValues, cia: companiaSeleccionada._id };

    setShowSpinner(true);

    // las listas son arrays de objetos: { value, label }. Los convertimos a: [ value, value, value, ... ] pues no necesitamos el label 
    // en el server 
    filtro.companias = filtro.companias.map(x => x.value);
    filtro.monedas = filtro.monedas.map(x => x.value);

    Meteor.call("consulta.montosPagados", filtro, (error, result) => {
        if (error) {
            const title = "Ha ocurrido un error al intentar ejecutar el proceso";

            const alert = { show: true, style: 'danger', title: title, message: error.message }
            setAlert(alert);
            setShowSpinner(false);

            return;
        }

        if (result.error) {
            const title = "Ha ocurrido un error al intentar ejecutar el proceso";

            const alert = { show: true, style: 'danger', title: title, message: result.message }
            setAlert(alert);
            setShowSpinner(false);

            return;
        }

        // ---------------------------------------------------------------------------------------------
        // estos son los subscriptions a monedas y compañías, para los controles del tipo search 
        if (subscriptionMonedas && subscriptionMonedas.stop) { subscriptionMonedas.stop(); }
        if (subscriptionCompanias && subscriptionCompanias.stop) { subscriptionCompanias.stop(); }

        // simulamos un click a un link a la página que lee el resultado y lo muestra en la lista ... 
        linkRef.current.click()
    })
}

function guardarFiltro(values) {
    // guardamos el filtro indicado por el usuario
    const filtro = Filtros.findOne({ nombre: 'consultas.montosPagados', userId: Meteor.userId() }, { fields: { _id: 1 } });
    if (filtro) {
        // el filtro existía antes; lo actualizamos
        // validate false: como el filtro puede ser vacío (ie: {}), simple-schema no permitiría eso; por eso saltamos la validación
        Filtros.update(filtro._id, { $set: { filtro: values } }, { validate: false });
    }
    else {
        Filtros.insert({
            _id: new Mongo.ObjectID()._str,
            userId: Meteor.userId(),
            nombre: 'consultas.montosPagados',
            filtro: values
        })
    }
}

export default ConsultaMontosPagadosFiltro; 