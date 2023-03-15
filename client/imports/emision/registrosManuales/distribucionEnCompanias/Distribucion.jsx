
import React, { useState } from 'react';
import PropTypes, { array } from 'prop-types';

// import Spinner from '/client/imports/genericReactComponents/Spinner';
// import Message from '/client/imports/genericReactComponents/Message';

import { Modal, Button } from 'react-bootstrap';
import { Tabs, Tab } from 'react-bootstrap';

import Lista from './Lista';
import Detalles from './Detalles';
// import Nuevo from './Nuevo';

const Distribucion = ({ setShowDistribucionModal, companias, currentItem, formValues, distribucionArray_addEditDeleteItem, setUserMadeChanges }) => {

    const [showModal, setShowModal] = useState(true);
    const [currentTab, setCurrentTab] = useState(1);
    const [showSpinner, setShowSpinner] = useState(false);
    const [items, setItems] = useState([]);
    const [clickedRow, setClickedRow] = useState({});

    const [message, setMessage] = useState({
        type: '',
        message: '',
        show: false
    })

    const handleTabSelect = (key) => setCurrentTab(key);

    const handleModalClose = () => {
        // esta función pone en false el state que permite abrir el modal en el component principal (que contiene a este) 
        setShowDistribucionModal(false); 
        setShowModal(false);
    }

    // preparamos el array que vamos a mostrar en la lista (fixed-data-table-2) 
    // la idea es agregar el nombre de cada compañía, pues solo viene su _id 
    let arrayDistribucion = []; 
    if (Array.isArray(currentItem.distribucion)) { 
        arrayDistribucion = currentItem.distribucion.map(x => {
            const compania = companias.find(c => c._id === x.compania); 
            let companiaNombre = 'indefinido'; 
            if (compania && compania.abreviatura) { 
                companiaNombre = compania.abreviatura; 
            }
            return { 
                ...x, 
                companiaNombre
            }
        })
    }

    return (
        <>
            {/* backdrop='static' impide que se cierre el modal si el usuario hace un click fuera del mismo  */}
            <Modal show={showModal} onHide={() => handleModalClose()} bsSize="large" backdrop="static">

                <Modal.Header closeButton>
                    <Modal.Title>{`scrwebm - Registros Manuales - Distribución en compañías`}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                   
                    <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">
                        
                        <Tab eventKey={1} title="Lista" style={{ padding: '10px' }}>
                            {
                                currentTab === 1 && 
                                <Lista data={arrayDistribucion}
                                        setCurrentTab={setCurrentTab}
                                        setClickedRow={setClickedRow} />
                            }
                        </Tab>

                        <Tab eventKey={2} title="Detalles" style={{ padding: '10px' }}>
                            {/* Nota: en clickedRow viene el item tal como estaba en la lista, cuando el usuario hizo un click 
                            en formValues están los mismos valores, que están en la forma, pero pudieron, posiblemente, ser editados 
                            por el usuario; es como si formValues es una forma actualizada de clickRow  */}
                            { 
                                currentTab === 2 && 
                                <Detalles companias={companias}
                                        setCurrentTab={setCurrentTab}
                                        clickedRow={clickedRow}
                                        formValues={formValues}
                                        arrayDistribucion={arrayDistribucion}
                                        setClickedRow={setClickedRow}
                                        distribucionArray_addEditDeleteItem={distribucionArray_addEditDeleteItem}
                                        setUserMadeChanges={setUserMadeChanges} />
                            }
                        </Tab>

                    </Tabs>
                </Modal.Body>

                <Modal.Footer>
                    <>
                        <Button bsStyle="warning" bsSize="small" onClick={() => handleModalClose()} style={{ minWidth: '100px', marginRight: '20px' }}>
                            Cerrar este diálogo
                        </Button>
                    </>
                </Modal.Footer>
            </Modal>
        </>
    )
}

Distribucion.propTypes = {
    setShowDistribucionModal: PropTypes.func.isRequired, 
    companias: PropTypes.array.isRequired, 
    currentItem: PropTypes.object.isRequired, 
    distribucionArray_addEditDeleteItem: PropTypes.func.isRequired, 
    setUserMadeChanges: PropTypes.func.isRequired, 
    formValues: PropTypes.object.isRequired
};

export default Distribucion; 