
import React, { useState, useEffect } from 'react'; 
import PropTypes from 'prop-types';

import Spinner from '/client/imports/genericReactComponents/Spinner';
import Message from '/client/imports/genericReactComponents/Message';

import { Modal, Button } from 'react-bootstrap';
import { Tabs, Tab } from 'react-bootstrap';

import Lista from './Lista';
import Detalles from './Detalles';
import Nuevo from './Nuevo'; 

const PersonasRegistro = ({ companiaSeleccionada, toogleOpenPersonasModal, catalogosEditar }) => { 

    const [showModal, setShowModal] = useState(true);
    const [currentTab, setCurrentTab] = useState(1);
    const [showSpinner, setShowSpinner] = useState(false);
    const [items, setItems] = useState([]);
    const [clickedRow, setClickedRow] = useState(-1);

    const [message, setMessage] = useState({
        type: '',
        message: '',
        show: false
    })

    const handleTabSelect = (key) => setCurrentTab(key);

    const handleModalClose = () => {
        setShowModal(false);

        // esta es la función que hace el toogle en angular; la recibimos aquí para ejecutarla cuando el usuario decide cerrar el modal 
        toogleOpenPersonasModal();
    }

    const handleModalClose_keepChanges = () => {

        // en este caso agregamos los cambios, si los hay, al array original de personas 
        companiaSeleccionada.personas.length = 0; 
        items.forEach(p => companiaSeleccionada.personas.push(p)); 

        setShowModal(false);

        // esta es la función que hace el toogle en angular; la recibimos aquí para ejecutarla cuando el usuario decide cerrar el modal 
        toogleOpenPersonasModal();
    }

    useEffect(() => {
        setShowSpinner(true);

        // hacemos un clone de la compañía y su array de personas; solo si el usuario cierra y mantiene los cambios, 
        // los regresamos; de otra forma, no alteramos el array original de personas
        const personas = []; 
        
        companiaSeleccionada.personas.forEach(p => personas.push(p)); 

        setItems(personas);

        setShowSpinner(false);
    }, [])

    return (
        <>
            {/* backdrop='static' impide que se cierre el modal si el usuario hace un click fuera del mismo  */}
            <Modal show={showModal} onHide={() => handleModalClose()} bsSize="large" backdrop="static">

                <Modal.Header closeButton>
                    <Modal.Title>{`scrwebm - Compañías - Personas - ${companiaSeleccionada.nombre}`}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {showSpinner && <Spinner />}
                    {message.show && <Message message={message} setMessage={setMessage} />}
                    <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">
                        <Tab eventKey={1} title="Lista" style={{ padding: '10px' }}>
                            <Lista items={items}
                                   setCurrentTab={setCurrentTab}
                                   setMessage={setMessage}
                                   setClickedRow={setClickedRow} 
                                   catalogosEditar={catalogosEditar} />
                        </Tab>

                        <Tab eventKey={2} title="Detalles" style={{ padding: '10px' }}>
                            {(currentTab === 2) &&
                                <Detalles items={items} 
                                          setItems={setItems}
                                          clickedRow={clickedRow}
                                          setMessage={setMessage}
                                          setCurrentTab={setCurrentTab} 
                                          catalogosEditar={catalogosEditar} />}
                        </Tab>

                        { 
                            // mostramos un tab Nuevo *solo* si el usuario no tiene asignado el rol catalogos_consulta 
                            catalogosEditar && 
                            <Tab eventKey={3} title="Nuevo" style={{ padding: '10px' }}>
                                {(currentTab === 3) &&
                                    <Nuevo items={items}
                                        setItems={setItems}
                                        setMessage={setMessage}
                                        setCurrentTab={setCurrentTab} />}
                            </Tab>
                        }
                    </Tabs>
                </Modal.Body>

                <Modal.Footer>
                    <>
                        {   
                            // si el usuario tiene el rol catalogos_consulta no mostramos los links que permiten Editar 
                            catalogosEditar && 
                        
                            <Button bsStyle="primary" bsSize="small" onClick={() => handleModalClose_keepChanges()} disabled={!items.some(x => x.docState)}>
                                Cerrar - mantener cambios
                            </Button>
                        }
                        <Button bsStyle="warning" bsSize="small" onClick={() => handleModalClose()}>Cerrar</Button>
                    </>
                </Modal.Footer>
            </Modal>
        </>
    )
}

PersonasRegistro.propTypes = {
    companiaSeleccionada: PropTypes.object.isRequired,
    toogleOpenPersonasModal: PropTypes.func.isRequired, 
    // si el usuario tiene este rol asignado, puede consultar las personas por aquí, pero los links que permiten guardar los 
    // cambios no se muestran 
    catalogosEditar: PropTypes.bool.isRequired
};

export default PersonasRegistro; 