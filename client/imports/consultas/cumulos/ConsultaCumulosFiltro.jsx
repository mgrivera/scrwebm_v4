
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';
import React, { useState, useEffect, useRef } from 'react'; 

import { useTracker } from 'meteor/react-meteor-data';

import ToolBar from './ToolBar'; 
import FormGenerales from './FormGenerales'; 
import Spinner from '/client/imports/reactComponents/Spinner'; 
import Alerts from '/client/imports/reactComponents/Alerts'; 

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { Cumulos } from '/imports/collections/catalogos/cumulos';
import { Monedas } from '/imports/collections/catalogos/monedas';
import { Filtros } from '/imports/collections/otros/filtros';

function ConsultaCumulosFiltro() { 

    const [companiaSeleccionada, setCompaniaSeleccionada] = useState({}); 
    const [filtroAnterior, setFiltroAnterior ] = useState({}); 

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
        const filtro = Filtros.findOne({ nombre: 'consultas.cumulos', userId: Meteor.userId() });

        // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
        if (filtro && filtro.filtro) {
            setFiltroAnterior(filtro.filtro); 
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
    const monedas = useTracker(() => Monedas.find().fetch(), []);

    // mientras algún subscription handle no sea ready(), mostramos el loading (spinner)... 
    const loadingInitialData = [ catalogosLoading ].some(x => x); 

    const ejecutarAplicarFiltro = (formValues) => { 
        aplicarFiltro(formValues, setAlert, setShowSpinner, linkRef, companiaSeleccionada)
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
                    <div>
                        <FormGenerales filtroAnterior={filtroAnterior} 
                                       ejecutarAplicarFiltro={ejecutarAplicarFiltro} 
                                       cumulos={cumulos} 
                                       monedas={monedas} />
                    </div> 
                </div>

            </div>
        )
    )
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