
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';
import React, { useState, useEffect } from 'react'; 

import Tabs from 'react-bootstrap/lib/Tabs';
import Tab from 'react-bootstrap/lib/Tab';
import Button from 'react-bootstrap/lib/Button';

import ToolBar from './ToolBar'; 
import FormGenerales from './FormGenerales'; 

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
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
        tipoCumulo: null
    }); 

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

    const handleTabSelect = (key) => setCurrentTab(key); 

    // para mantener el state con los valores de la forma (2 formas: filtro generales y filtro listas); 
    // pasamos esta función a las formas para que actualicen el state 
    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    return (
        <div className="ui-viewBorder-left-aligned"> 

            <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                <span style={{ color: 'dodgerblue' }}>{companiaSeleccionada.nombre}</span>
            </div >

            <ToolBar title="Cúmulos / Consulta / Filtro" />

            <div className="ui-viewBorder-left-aligned">
                <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">
                    <Tab eventKey={1} title="Generales">

                        {(currentTab === 1) && (
                            <div>
                                <FormGenerales formValues={formValues} onInputChange={onInputChange} />
                            </div>
                        )}

                    </Tab>

                    <Tab eventKey={2} title="Listas">

                        {(currentTab === 2) && (
                            <div>
                            </div>
                        )}
                    </Tab>

                    <Tab eventKey={3} title="Notas">
                        {(currentTab === 3) && (
                            <div>
                            </div>
                        )}
                    </Tab>
                </Tabs>

                <div style={{ display: 'flex', marginTop: "20px" }}>
                    <div style={{ flex: '50%', textAlign: 'left' }}>
                        <Button bsStyle="default" bsSize="small" onClick={() => limpiarFiltro(setFormValues)}>Limpiar filtro</Button>
                    </div>
                    <div style={{ flex: '50%', textAlign: 'right' }}>
                        <Button bsStyle="primary" bsSize="small" onClick={() => aplicarFiltro(formValues)}>Aplicar filtro</Button>
                    </div>
                </div>
            </div>

        </div>
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
        tipoCumulo: null
    }); 
}

function aplicarFiltro(formValues) { 
    // para guardar, en Filtros, el filtro que acaba de indicar el usuairo 
    guardarFiltro(formValues);   
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