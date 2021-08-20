
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'

import React, { useState, useEffect } from 'react'; 
import PropTypes from 'prop-types';
import { useTracker } from 'meteor/react-meteor-data';

import Tabs from 'react-bootstrap/lib/Tabs';      
import Tab from 'react-bootstrap/lib/Tab'; 
import Button from 'react-bootstrap/lib/Button';

import ToolBar from './ToolBar'; 
import Nuevo from './Nuevo'; 
import Spinner from './Spinner'; 
import Lista from './Lista'; 
import Detalles from './Detalles'; 

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { Cumulos } from '/imports/collections/catalogos/cumulos'; 
import { Companias } from '/imports/collections/catalogos/companias';
import { Monedas } from '/imports/collections/catalogos/monedas';
import { Ramos } from '/imports/collections/catalogos/ramos';
import { Asegurados } from '/imports/collections/catalogos/asegurados';

import { MessageModal } from '/client/imports/genericReactComponents/MessageModal';

// en este (client only) collection, recibimos el collection desde el publish más abajo ... 
const CumulosRegistroQuery = new Mongo.Collection('cumulosRegistroQuery');

const RegistroCumulos = ({ modo, origen, entityId, subEntityId, url }) => { 

    // state para el MessageModal; este es un pequeño modal que muestra un spinner cuando un proceso largo se ejecuta; también un mensaje 
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageModalShowSpinner, setMessageModalShowSpinner] = useState(false);
    const [messageModalTitle, setMessageModalTitle] = useState("");
    const [messageModalMessage, setMessageModalMessage] = useState({ type: '', message: '', show: false });

    const [companiaSeleccionada, setCompaniaSeleccionada] = useState({}); 
    const [currentTab, setCurrentTab] = useState(1); 

    // este es el _id del item que el usuario selecciona en la lista para ver sus detalles y editar ... 
    const [itemDetallesId, setItemDetallesId] = useState(null); 

    const defaultValues = { 
        origen,
        entityId,
        subEntityId
    }

    // para leer los tipos de cúmulo y las zonas definidas para éstos 
    const catalogosLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('cumulos');
        return !handle.ready();
    }, []);

    const cumulos = useTracker(() => Cumulos.find({}, { sort: { descripcion: 1 }}).fetch(), []);
    const monedas = useTracker(() => Monedas.find({}, { sort: { descripcion: 1 } }).fetch(), []);
    const companias = useTracker(() => Companias.find({}, { sort: { nombre: 1 } }).fetch(), []);
    const ramos = useTracker(() => Ramos.find({}, { sort: { descripcion: 1 } }).fetch(), []);
    const asegurados = useTracker(() => Asegurados.find({}, { sort: { nombre: 1 } }).fetch(), []);
    const empresasUsuarias = useTracker(() => EmpresasUsuarias.find({}, { sort: { nombreCorto: 1 } }).fetch(), []);

    const cumulosQueryLoading = useTracker(() => { 
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        // para leer los registros de cúmulo que se hayan agregado para el entityId 
        const handle = Meteor.subscribe('cumulosRegistro.query', entityId);
        return !handle.ready();
    }, [ entityId ]); 

    const cumulosRegistroQuery = useTracker(() => CumulosRegistroQuery.find({ entityId }).fetch(), [entityId]);

    // mientras algún subscription handle no sea ready(), mostramos el loading (spinner)... 
    const LoadingData = [catalogosLoading, cumulosQueryLoading].some(x => x); 

    // Similar to componentDidMount and componentDidUpdate:
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
    }, [companiaSeleccionada._id]);

    const handleTabSelect = (key) => setCurrentTab(key); 

    const handleItemDetalles = (itemId) => { 
        // guardamos el _id del item seleccionado en la lista; cambiamos al tab 3: Detalles 
        setItemDetallesId(itemId); 
        setCurrentTab(3); 
    }

    const irANuevo = () => {
        // origen, entityId, subEntityId
        if (origen === "fac" && !(entityId && subEntityId)) { 
            setShowMessageModal(true);
            setMessageModalShowSpinner(false);
            setMessageModalTitle("Registro de cúmulos - No se ha seleccionado un movimiento en el riesgo");

            const message = `Ud. abrió esta función desde el registro de riesgos. <br /> 
                             Para agregar un nuevo registro de cúmulos para el riesgo, Ud. <b>debe</b> seleccionar 
                             antes un movimiento en el riesgo. <br /><br />
                             Este proceso, entonces, le permitirá agregar un nuevo registro de cúmulos y <em>lo asociará</em> 
                             al riesgo y al movimiento. <br /><br />
                             Por favor regrese al registro de riesgos, seleccione un movimiento y luego regrese e intente 
                             agregar un registro de cúmulos para el mismo. 
                            `
            setMessageModalMessage({
                type: 'danger',
                message,
                show: true
            });

            return; 
        }

        handleTabSelect(2); 
    }

    // desabilitamos el tab Nuevo cuando el usuario viene de fac y no ha seleccionado un movimiento 
    const disableTabNuevo = (origen === "fac" && !(entityId && subEntityId)) ? true : false;

    return (
        LoadingData ? (
            <Spinner />
        ) : 
        (
            <div className="ui-viewBorder-left-aligned">

                <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                    <span style={{ color: 'dodgerblue' }}>{companiaSeleccionada.nombre}</span>
                </div >

                {   /* para mostrar un modal que muestra un spinner y luego un mensaje al final 
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

                <ToolBar url={url} />

                <div className="ui-viewBorder-left-aligned">
                    <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">
                        <Tab eventKey={1} title="Lista">

                            {(currentTab === 1) && (
                                <div>
                                    <Lista modo={modo} items={cumulosRegistroQuery} handleItemDetalles={handleItemDetalles} />

                                    { modo != "consulta" && 
                                        <div style={{ textAlign: 'right', marginTop: '20px' }}>
                                            <Button bsStyle="primary" bsSize="small" onClick={irANuevo}>Nuevo</Button>
                                        </div>
                                    }
                                </div>
                            )}
                            
                        </Tab>

                        {modo != "consulta" && 
                        <Tab eventKey={2} title="Nuevo" disabled={disableTabNuevo}>

                                {(currentTab === 2) && (
                                    <Nuevo defaults={defaultValues} 
                                            cumulos={cumulos}
                                            monedas={monedas}
                                            companias={companias}
                                            ramos={ramos}
                                            asegurados={asegurados}
                                            empresasUsuarias={empresasUsuarias}
                                            setCurrentTab={setCurrentTab} />
                                )}
                        </Tab>}

                        <Tab eventKey={3} title="Detalles">
                            {(currentTab === 3) && ( 
                                <Detalles modo={modo} 
                                          itemId={itemDetallesId} 
                                          cumulos={cumulos} 
                                          setCurrentTab={setCurrentTab} 
                                          monedas={monedas}
                                          companias={companias}
                                          ramos={ramos}
                                          asegurados={asegurados}
                                          empresasUsuarias={empresasUsuarias}
                                          /> 
                            )}
                        </Tab>
                    </Tabs>
                </div>
            </div >
        )
    )
}

export default RegistroCumulos; 

RegistroCumulos.propTypes = {
    modo: PropTypes.string.isRequired,      // edicion / consulta
    origen: PropTypes.string.isRequired,
    entityId: PropTypes.string.isRequired,
    subEntityId: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
};