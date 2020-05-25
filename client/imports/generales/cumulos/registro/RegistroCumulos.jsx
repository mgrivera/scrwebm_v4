
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

// en este (client only) collection, recibimos el collection desde el publish más abajo ... 
const CumulosRegistroQuery = new Mongo.Collection('cumulosRegistroQuery');

const RegistroCumulos = ({ modo, origen, entityId, subEntityId, url }) => { 

    const [companiaSeleccionada, setCompaniaSeleccionada] = useState({}); 
    const [currentTab, setCurrentTab] = useState(1); 

    // este es el _id del item que el usuario selecciona en la lista para ver sus detalles y editar ... 
    const [itemDetallesId, setItemDetallesId] = useState(null); 

    const defaultValues = { 
        origen: origen,
        entityId: entityId,
        subEntityId: subEntityId,
    }

    // para leer los tipos de cúmulo y las zonas definidas para éstos 
    const catalogosLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('cumulos');
        return !handle.ready();
    }, []);

    const cumulos = useTracker(() => Cumulos.find().fetch(), []);

    const cumulosQueryLoading = useTracker(() => { 
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
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

    return (
        LoadingData ? (
            <Spinner />
        ) : 
        (
            <div className="ui-viewBorder-left-aligned">

                <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                    <span style={{ color: 'dodgerblue' }}>{companiaSeleccionada.nombre}</span>
                </div >

                <ToolBar url={url} />

                <div className="ui-viewBorder-left-aligned">
                    <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">
                        <Tab eventKey={1} title="Lista">

                            {(currentTab === 1) && (
                                <div>
                                    <Lista modo={modo} items={cumulosRegistroQuery} handleItemDetalles={handleItemDetalles} />

                                    { modo != "consulta" && 
                                        <div style={{ textAlign: 'right' }}>
                                            <Button bsStyle="primary" bsSize="small" onClick={() => handleTabSelect(2)}>Nuevo</Button>
                                        </div>
                                    }
                                </div>
                            )}
                            
                        </Tab>

                        {modo != "consulta" && 
                        <Tab eventKey={2} title="Nuevo">

                                {(currentTab === 2) && (
                                    <Nuevo defaults={defaultValues} 
                                            cumulos={cumulos} 
                                            ciaSeleccionadaId={companiaSeleccionada._id} />
                                )}
                        </Tab>}

                        <Tab eventKey={3} title="Detalles">
                            {(currentTab === 3) && ( 
                                <Detalles modo={modo} itemId={itemDetallesId} cumulos={cumulos} /> 
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