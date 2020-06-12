
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';
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

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { Cumulos } from '/imports/collections/catalogos/cumulos'; 
import { Filtros } from '/imports/collections/otros/filtros';

function ConsultaCumulosFiltro() { 

    const [companiaSeleccionada, setCompaniaSeleccionada] = useState({}); 
    const [currentTab, setCurrentTab] = useState(1); 
    const [formValues, setFormValues] = useState({
        fechaEmision1: '', 
        fechaEmision2: '', 
        vigenciaInicial1: '', 
        vigenciaInicial2: '', 
        vigenciaFinal1: '', 
        vigenciaFinal2: '', 
        periodoVigencia1: '', 
        periodoVigencia2: '', 
        tipoCumulo: null, 
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
                nombre: 'consultas.cumulos',
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

    // para leer los tipos de cúmulo y las zonas definidas para éstos 
    const catalogosLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('cumulos');
        return !handle.ready();
    }, []);

    const cumulos = useTracker(() => Cumulos.find().fetch(), []);

    // mientras algún subscription handle no sea ready(), mostramos el loading (spinner)... 
    const loadingInitialData = [ catalogosLoading ].some(x => x); 

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

    return (
        loadingInitialData ? (
            <Spinner />
        ) :
            (
            <div className="ui-viewBorder-left-aligned"> 

                <div>
                    {/* el siguiente link es hidden; para ir a la otra página (list) */}
                    <a href={`consultas/cumulos/lista`}
                        ref={linkRef}
                        hidden>
                        go to list page ...
                    </a>
                </div>

                <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                    <span style={{ color: 'dodgerblue' }}>{companiaSeleccionada.nombre}</span>
                </div >

                <ToolBar title="Cúmulos / Consulta / Filtro" />

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
                    <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">
                        <Tab eventKey={1} title="Generales">

                            {(currentTab === 1) && (
                                <div>
                                    <FormGenerales formValues={formValues} 
                                                   onInputChange={onInputChange} />
                                </div>
                            )}

                        </Tab>

                        <Tab eventKey={2} title="Listas">

                            {(currentTab === 2) && (
                                <div>
                                    <FormListas formValues={formValues} 
                                                onInputChange={onInputChange} 
                                                onListChage={onListChange} 
                                                cumulos={cumulos} />
                                </div>
                            )}
                        </Tab>

                        <Tab eventKey={3} title="Notas">
                            {(currentTab === 3) && (
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
                                    </p>
                                </div>
                            )}
                        </Tab>
                    </Tabs>

                    <div style={{ display: 'flex', marginTop: "20px" }}>
                        <div style={{ flex: '50%', textAlign: 'left' }}>
                            <Button bsStyle="default" bsSize="small" onClick={() => limpiarFiltro(setFormValues)}>Limpiar filtro</Button>
                        </div>
                        <div style={{ flex: '50%', textAlign: 'right' }}>
                                <Button bsStyle="primary" 
                                        bsSize="small" 
                                        onClick={() => aplicarFiltro(formValues, setAlert, setShowSpinner, linkRef, companiaSeleccionada)}>
                                            Aplicar filtro
                                </Button>
                        </div>
                    </div>
                </div>

            </div>
        )
    )
}

function limpiarFiltro(setFormValues) { 

    setFormValues({
        fechaEmision1: '',
        fechaEmision2: '',
        vigenciaInicial1: '',
        vigenciaInicial2: '',
        vigenciaFinal1: '',
        vigenciaFinal2: '',
        periodoVigencia1: '',
        periodoVigencia2: '', 
        tipoCumulo: null, 
        tipoNegocio: []
    }); 
}

function aplicarFiltro(formValues, setAlert, setShowSpinner, linkRef, companiaSeleccionada) { 
    // para guardar, en Filtros, el filtro que acaba de indicar el usuairo 
    guardarFiltro(formValues);   
    
    if (!formValues.tipoCumulo) { 
        const message = 'Ud. no ha indicado un <em>tipo de cúmulo</em>. Por favor indique un <em>tipo de cúmulo</em> para completar el filtro.'; 

        const alert = { show: true, style: 'danger', title: 'El filtro no está completo', message: message }
        setAlert(alert); 

        return; 
    }

    // agregamos la cia seleccionada al filtro 
    const filtro = { ...formValues, cia: companiaSeleccionada._id }; 

    setShowSpinner(true); 

    Meteor.call("consulta.cumulos", filtro, (error, result) => { 
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

        // simulamos un click a un link a la página que lee el resultado y lo muestra en la lista ... 
        linkRef.current.click()
    })
}

function guardarFiltro(values) {
    // guardamos el filtro indicado por el usuario
    const filtro = Filtros.findOne({ nombre: 'consultas.cumulos', userId: Meteor.userId() }, { fields: { _id: 1 } });
    if (filtro) {
        // el filtro existía antes; lo actualizamos
        // validate false: como el filtro puede ser vacío (ie: {}), simple-schema no permitiría eso; por eso saltamos la validación
        Filtros.update(filtro._id, { $set: { filtro: values } }, { validate: false });
    }
    else {
        Filtros.insert({
            _id: new Mongo.ObjectID()._str,
            userId: Meteor.userId(),
            nombre: 'consultas.cumulos',
            filtro: values
        })
    }
}

export default ConsultaCumulosFiltro; 