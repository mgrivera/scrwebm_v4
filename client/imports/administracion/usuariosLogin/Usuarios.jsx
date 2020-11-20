
import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { Tabs, Tab } from 'react-bootstrap';

import Detalles from './Detalles';
import ToolBar from '/client/imports/genericReactComponents/ToolBar';
import Lista from './Lista';
import Notas from './Notas';
import Spinner from '/client/imports/genericReactComponents/Spinner';
import Message from '/client/imports/genericReactComponents/Message';

const Usuarios = () => {

    const [data, setData] = useState({
        items: []
    })

    const [clickedRow, setClickedRow] = useState({});

    const [loaders, setLoaders] = useState({
        primeraLectura: true,       // para saber cuando se están leyendo los items cuando se abre esta función
        loadingItems: true,
        savingToDB: false           // para mostrar el spinner cuando el usuario edita los datos y ejecuta un meteor method 
    })

    const [message, setMessage] = useState({
        type: '',
        message: '',
        show: false
    })

    const [currentTab, setCurrentTab] = useState(1);

    useTracker(() => {
        // Note that this subscription will get cleaned up
        // when your component is unmounted or deps change.
        const handle = Meteor.subscribe('usuarios');
        const loading = !handle.ready(); 

        if (!loading && loaders.primeraLectura) { 
            // la idea es saber cuando se abre esta página y se leen los items por 1ra. vez
            setLoaders(state => ({ ...state, primeraLectura: false }));
        }
        setLoaders(state => ({ ...state, loadingItems: loading }));
    }, []);

    useTracker(() => { 
        const items = Meteor.users.find().fetch(); 
        setData({ ...data, items: items });
    }, []);

    const handleTabSelect = (key) => setCurrentTab(key);

    const LoadingData = [loaders.loadingItems].some(x => x);

    return (
        // recordCount y catalogos *solo* se cargan 1 vez, cuando la página se abre; 
        // la idea es que al abrirse la página, solo se muestre el spinner, sin el resto de la página; luego, se mostrará 
        // toda la página y el spinner ... 

        (loaders.loadingItems && loaders.primeraLectura) ? (
            <Spinner />
        ) :
            (
                <div className="ui-viewBorder-left-aligned">

                    <ToolBar title="Usuarios" />
                    {(LoadingData || loaders.savingToDB) && <Spinner />}
                    {message.show && <Message message={message} setMessage={setMessage} />}

                    <div className="ui-viewBorder-left-aligned">
                        <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">
                            <Tab eventKey={1} title="Lista">
                                <div>
                                    <Lista data={data}
                                           setCurrentTab={setCurrentTab}
                                           setClickedRow={setClickedRow} />
                                </div>
                            </Tab>

                            <Tab eventKey={2} title="Detalles">
                                {(currentTab === 2) &&
                                    <Detalles clickedRow={clickedRow}
                                              setMessage={setMessage}
                                              setLoaders={setLoaders}
                                              setCurrentTab={setCurrentTab} />}
                            </Tab>

                            <Tab eventKey={3} title="Notas">
                                {(currentTab === 3) && <Notas />}
                            </Tab>
                        </Tabs>
                    </div>
                </div >
            )
    )
}

export default Usuarios; 