
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import lodash from 'lodash'; 

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';
import { Monedas } from '/imports/collections/catalogos/monedas';
import { Ramos } from '/imports/collections/catalogos/ramos';
import { Asegurados } from '/imports/collections/catalogos/asegurados';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { Companias } from '/imports/collections/catalogos/companias';
import { Filtros } from '/imports/collections/otros/filtros';

import { Tabs, Tab } from 'react-bootstrap';

import Detalles from './Detalles';
import ToolBar from '/client/imports/genericReactComponents/ToolBar';
import Filtro from './Filtro'; 
import Lista from './Lista';
import Notas from './Notas';
import Spinner from '/client/imports/genericReactComponents/Spinner';
import Alerts from '/client/imports/reactComponents/Alerts'; 

const RegistrosManuales = () => {

    const [companiaSeleccionada, setCompaniaSeleccionada] = useState({}); 

    // mantenemos el item en 3 forma diferentes 
    const [clickedRow, setClickedRow] = useState({});       // este es el item tal viene de la lista, cuando el usuario hace un click 
    const [currentItem, setCurrentItem] = useState({});      // este es el item tal como viene del db 
    const [formValues, setFormValues] = useState({});       // este es el item *transformado* para mostrarlo en la forma 

    const [cuotas, setCuotas] = useState([]);           // para mantener las cuotas del item seleccionado 
    
    const [pageData, setPageData] = useState({
        page: 0,
        pageSize: 20,
        recordCount: 0,
        cantPages: 0,
        items: [],
        // cuando el usuario hace un refresh, pasamos el flag al method que lee los items en el server 
        // para que lea desde el item 0 hasta la página actual. Por ejemplo, si el usuario había leído hasta la pág 5, 
        // volvemos a leer todos los items *hasta* la pág 5 ... Para hacer ésto, debemos pasar el flag al method en el server 
        refresh: false
    })
    
    const [loaders, setLoaders] = useState({
        loadingItems: false,        // para saber cuando el usuario aplica un filtro y se leen los items desde el db 
        savingToDB: false           // para mostrar el spinner cuando el usuario edita los datos y ejecuta un meteor method 
    })

    // style: // danger / warning / success / info
    const [alert, setAlert] = useState({ show: false, style: "", title: "", message: "" }); 
    const [currentTab, setCurrentTab] = useState(1);
    const [filtroAnterior, setFiltroAnterior] = useState({}); 
    const [filtro, setFiltro] = useState({}); 
    const [userMadeChanges, setUserMadeChanges] = useState(false); 

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
        const filtro = Filtros.findOne({ nombre: 'emision.registrosManuales', userId: Meteor.userId() });

        // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
        if (filtro && filtro.filtro) {
            setFiltroAnterior(filtro.filtro);
        }
    }, []); 

    const handleTabSelect = (key) => setCurrentTab(key);

    const LoadingData = [loaders.loadingItems].some(x => x);

    // para leer los tipos de cúmulo y las zonas definidas para éstos 
    const catalogosLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('emision.registrosManuales.loadCatalogos');
        return !handle.ready();
    }, []);

    const monedas = useTracker(() => Monedas.find({}, { sort: { descripcion: 1 }}).fetch(), []);
    const ramos = useTracker(() => Ramos.find({}, { sort: { descripcion: 1 } }).fetch(), []);
    const asegurados = useTracker(() => Asegurados.find({}, { sort: { nombre: 1 } }).fetch(), []);
    const companias = useTracker(() => Companias.find({}, { sort: { nombre: 1 } }).fetch(), []);

    // =========================================================================================================
    // para aplicar el filtro que indica el usuario 
    const ejecutarAplicarFiltro = (formValues) => {

        setLoaders({ ...loaders, loadingItems: true });

        // aplicarFiltro regresa un promise ... 
        // 1 es la página; ahora leemos la 1ra página 
        aplicarFiltro(formValues, setFiltro, companiaSeleccionada, pageData.pageSize)
            .then((resolve) => {
                // importante: actualizamos la cantidad de registros leídos (luego de aplicar el filtro!). Esto lo debemos mostrar al usuario 
                // y también los necesitamos para saber hasta cuando debemos leer

                // calculamos la cantidad máxima de páginas y pasamos como un prop 
                const recordCount = resolve.recordCount;
                const pageSize = pageData.pageSize;

                let cantPages = Math.floor(recordCount / pageSize);
                cantPages = (recordCount % pageSize) ? cantPages + 1 : cantPages; // si hay un resto, agregamos 1 página 

                setPageData({ ...pageData, page: 1, cantPages, recordCount, items: resolve.items }); 
                setLoaders({ ...loaders, loadingItems: false });
                handleTabSelect(2);             // mostramos el tab #2: lista ... 
            })
            .catch((err) => {
                const title = "Ha ocurrido un error al intentar ejecutar el proceso";

                const alert = { show: true, style: 'danger', title: title, message: err.message }
                setAlert(alert);
                setLoaders({ ...loaders, loadingItems: false });

                return;
            })
    }

    // =====================================================================================================
    // para leer (normalmente, 20 items más) una nueva página desde el db 
    const leerItems = (page, leerResto) => {

        setLoaders({ ...loaders, loadingItems: true });

        // readItemsFromDB regresa un promise ...
        readItemsFromDB(filtro, companiaSeleccionada, page, leerResto, pageData.recordCount, pageData.pageSize)
            .then((resolve) => {
                // agregamos la nueva página a los items que ya se habían leído 
                const items = pageData.items;

                resolve.items.forEach(i => items.push(i));

                if (leerResto) {
                    // al leer el resto, se leen *todas* las páginas (que queden) 
                    page = pageData.cantPages;
                }

                setPageData({ ...pageData, page, items })
                setLoaders({ ...loaders, loadingItems: false });
                handleTabSelect(2);             // mostramos el tab #2: lista ... 
            })
            .catch((err) => {
                const title = "Ha ocurrido un error al intentar ejecutar el proceso";

                const alert = { show: true, style: 'danger', title: title, message: err.message }
                setAlert(alert);
                setLoaders({ ...loaders, loadingItems: false });

                return;
            })
    }

    // =====================================================================================================
    // para leer (normalmente, 20 items más) una nueva página desde el db 
    const refreshItems = () => {

        const { page, pageSize, recordCount } = pageData; 

        // calculamos el limit (la cantidad de registros a leer); escencialmente, los registros que *ya* habíamos leído 
        let limit = page * pageSize; 
        if (limit > recordCount) { 
            limit = recordCount; 
        }

        setLoaders({ ...loaders, loadingItems: true });

        // readItemsFromDB regresa un promise ...
        refreshItemsFromDB(filtro, companiaSeleccionada, limit)
            .then((resolve) => {
                // nótese que *sustiuimos los items; no agregamos una página, sino que eliminamos los que habíamos leído y los agregamos nuevamente  
                const items = [];           
                resolve.items.forEach(i => items.push(i));

                setPageData({ ...pageData, items })
                setLoaders({ ...loaders, loadingItems: false });
                handleTabSelect(2);             // mostramos el tab #2: lista ... 
            })
            .catch((err) => {
                const title = "Ha ocurrido un error al intentar ejecutar el proceso";

                const alert = { show: true, style: 'danger', title: title, message: err.message }
                setAlert(alert);
                setLoaders({ ...loaders, loadingItems: false });

                return;
            })
    }

    // =====================================================================================================
    // recibimos el item que el usuario selecciona en la lista;  lo buscamos en mongo (server) y permimos que el usuario 
    // lo edite en la forma 
    const handleClickedRow = (item) => { 

        setLoaders({ ...loaders, loadingItems: true });
        
        leerItemFromDB(item.itemId)
            .then((resolve) => {

                const currentItem = lodash.cloneDeep(resolve.item); 
                const cuotas = resolve.cuotas; 

                setCurrentItem(currentItem);            // item como viene del db                
                setCuotas(cuotas); 

                setLoaders({ ...loaders, loadingItems: false });
                setCurrentTab(3); 
            })
            .catch((err) => {
                const title = "Ha ocurrido un error al intentar ejecutar el proceso";

                const alert = { show: true, style: 'danger', title: title, message: err.message }
                setAlert(alert);
                setLoaders({ ...loaders, loadingItems: false });

                return;
            })
    }

    const handleAlertsDismiss = () => {
        setAlert(state => ({ ...state, show: false }))
    }

    return (
        // recordCount y catalogos *solo* se cargan 1 vez, cuando la página se abre; 
        // la idea es que al abrirse la página, solo se muestre el spinner, sin el resto de la página; luego, se mostrará 
        // toda la página y el spinner ... 

        (catalogosLoading) ? (
            <Spinner />
        ) :
            (
                <div className="ui-viewBorder-left-aligned">

                    <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                        <span style={{ color: 'dodgerblue' }}>{companiaSeleccionada.nombre}</span>
                    </div >

                    <ToolBar title="Registros manuales" />

                    {(LoadingData || loaders.savingToDB) && <Spinner />}

                    {
                        alert.show &&
                        <div style={{ marginTop: '10px' }}>
                            <Alerts style={alert.style} title={alert.title} message={alert.message} onDismiss={handleAlertsDismiss} />
                        </div>
                    }

                    <div className="ui-viewBorder-left-aligned">
                        <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">

                            <Tab eventKey={1} title="Filtro">
                                {(currentTab === 1) &&
                                <div>
                                    <Filtro filtroAnterior={filtroAnterior} 
                                            ejecutarAplicarFiltro={ejecutarAplicarFiltro}
                                            handleTabSelect={handleTabSelect} 
                                            setCurrentItem={setCurrentItem} 
                                            setCuotas={setCuotas} />
                                </div>}
                            </Tab>

                            <Tab eventKey={2} title="Lista">
                                {(currentTab === 2) &&
                                <div style={{ marginTop: '10px' }}>
                                    <Lista setCurrentTab={setCurrentTab}
                                           setLoaders={setLoaders}
                                           pageData={pageData}
                                           setPageData={setPageData}
                                           leerItems={leerItems} 
                                           refreshItems={refreshItems} 
                                           handleClickedRow={handleClickedRow} 
                                           setClickedRow={setClickedRow}
                                           setCuotas={setCuotas} 
                                           setCurrentItem={setCurrentItem} />
                                </div>}
                            </Tab>

                            <Tab eventKey={3} title="Detalles">
                                {(currentTab === 3) &&
                                    <Detalles companiaSeleccionada={companiaSeleccionada}
                                              monedas={monedas} 
                                              ramos={ramos} 
                                              companias={companias} 
                                              asegurados={asegurados} 
                                              setCurrentTab={setCurrentTab} 
                                              userMadeChanges={userMadeChanges} 
                                              setUserMadeChanges={setUserMadeChanges} 
                                              cuotas={cuotas}
                                              setCuotas={setCuotas}
                                              currentItem={currentItem} 
                                              setCurrentItem={setCurrentItem}
                                              />}
                            </Tab>

                            <Tab eventKey={4} title="Notas">
                                {(currentTab === 4) && <Notas />}
                            </Tab>
                        </Tabs>
                    </div>
                </div >
            )
    )
}

export default RegistrosManuales; 

// ----------------------------------------------------------------------------------------------------------
// para aplicar el filtro que indica el usuario (leemos la 1ra página desde el db)
// ---------------------------------------------------------------------------------------------------------- 
function aplicarFiltro(formValues, setFiltro, companiaSeleccionada, pageSize) {

    return new Promise((resolve, reject) => {

        // para guardar, en Filtros, el filtro que acaba de indicar el usuairo 
        guardarFiltro(formValues);

        // agregamos la cia seleccionada al filtro 
        const filtro = { ...formValues, cia: companiaSeleccionada._id };
        setFiltro(filtro);

        Meteor.call("emision.registrosManuales.leerItemsFromDB.1estPage", filtro, pageSize, companiaSeleccionada._id, (error, result) => {
            if (error) {
                reject(error);
            }

            if (result.error) {
                reject(result);
            }

            resolve(result);
        })
    })
}

// ----------------------------------------------------------------------------------------------------------
// para leer una nueva página desde el db 
// ---------------------------------------------------------------------------------------------------------- 
function readItemsFromDB(filtro, companiaSeleccionada, page, leerResto, recordCount, pageSize) {

    return new Promise((resolve, reject) => {
        Meteor.call("emision.registrosManuales.leerItemsFromDB.nextPage", filtro, page, leerResto, pageSize, recordCount, companiaSeleccionada._id, (error, result) => {
            if (error) {
                reject(error);
            }

            if (result.error) {
                reject(result);
            }

            resolve(result);
        })
    })
}

// ----------------------------------------------------------------------------------------------------------
// para refrescar los items que se han leído (simplemente, los volvemos a leer)
// ---------------------------------------------------------------------------------------------------------- 
function refreshItemsFromDB(filtro, companiaSeleccionada, limit) {

    return new Promise((resolve, reject) => {
        Meteor.call("emision.registrosManuales.leerItemsFromDB.refresh", filtro, limit, companiaSeleccionada._id, (error, result) => {
            if (error) {
                reject(error);
            }

            if (result.error) {
                reject(result);
            }

            resolve(result);
        })
    })
}

// ----------------------------------------------------------------------------------------------------------
// para leer, desde mongo, el item que el usuario seleccione en la lista 
// ---------------------------------------------------------------------------------------------------------- 
function leerItemFromDB(_id) {

    return new Promise((resolve, reject) => {
        Meteor.call("emision.registrosManuales.leerItemFromDB", _id, (error, result) => {
            if (error) {
                reject(error);
            }

            if (result.error) {
                reject(result);
            }

            resolve(result);
        })
    })
}

// ----------------------------------------------------------------------------------------------------------
// para guardar el filtro en el collection Filtros y que esté listo para la próxima vez 
// ---------------------------------------------------------------------------------------------------------- 
function guardarFiltro(values) {
    // guardamos el filtro indicado por el usuario
    const filtro = Filtros.findOne({ nombre: 'emision.registrosManuales', userId: Meteor.userId() }, { fields: { _id: 1 } });
    if (filtro) {
        // el filtro existía antes; lo actualizamos
        // validate false: como el filtro puede ser vacío (ie: {}), simple-schema no permitiría eso; por eso saltamos la validación
        Filtros.update(filtro._id, { $set: { filtro: values } }, { validate: false });
    }
    else {
        Filtros.insert({
            _id: new Mongo.ObjectID()._str,
            userId: Meteor.userId(),
            nombre: 'emision.registrosManuales',
            filtro: values
        })
    }
}