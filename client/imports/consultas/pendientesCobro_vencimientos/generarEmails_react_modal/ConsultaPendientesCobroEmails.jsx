
import { Meteor } from 'meteor/meteor';

import React, { useState, useEffect } from 'react'; 
import PropTypes from 'prop-types';

import { Modal, Button } from 'react-bootstrap';
import { Tabs, Tab } from 'react-bootstrap';

import Message from '/client/imports/genericReactComponents/Message';
import Spinner from '/client/imports/genericReactComponents/Spinner';

import Lista from './Lista';
import ListaPlantillas from './ListaPlantillas';

import { Consulta_MontosPendientesCobro_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesCobro_Vencimientos';
import { MessageModal } from '/client/imports/genericReactComponents/MessageModal';

const ConsultaPendientesCobroEmails = ({ toogleAbrirGenerarEmailsModal }) => {

    const [showModal, setShowModal] = useState(true);
    const [showSpinner, setShowSpinner] = useState(false);
    const [currentTab, setCurrentTab] = useState(1);
    const [message, setMessage] = useState({ type: '', message: '', show: false })

    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);         // array de indices de los items que el usuario seleccionó en la lista 

    const [plantillas, setPlantillas] = useState([]);
    const [selectedPlantillas, setSelectedPlantillas] = useState([]);         // array de indices de los items que el usuario seleccionó en la lista 

    // state para el MessageModal; este es un pequeño modal que muestra un spinner cuando un proceso largo se ejecuta; también un mensaje 
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageModalShowSpinner, setMessageModalShowSpinner] = useState(false);
    const [messageModalTitle, setMessageModalTitle] = useState("");
    const [messageModalMessage, setMessageModalMessage] = useState({ type: '', message: '', show: false });

    const handleModalClose = () => { 
        setShowModal(false); 

        // esta es la función que hace el toogle en angular; la recibimos aquí para ejecutarla cuando el usuario decide cerrar el modal 
        toogleAbrirGenerarEmailsModal(); 
    }

    // leemos las plantillas que se han registrado para este proceso en el DropBox de la empresa 
    useEffect(() => {

        // para mostrar un (sub) modal que muestra un spinner y un mensaje final para este proceso 
        setShowMessageModal(true);
        setMessageModalShowSpinner(true);
        setMessageModalTitle("Emails de cobranza - Leyendo las plantillas desde DropBox ...");

        // ejecutamos un método que lee y regresa desde dropbox las plantillas para notas de cobertura 
        Meteor.call('plantillas.obtenerListaArchivosDesdeDirectorio', "/html/emails/cobranzaMontosPendientes", (err, result) => {

            if (err) {
                setMessageModalMessage({
                    type: 'danger',
                    message: err.message,
                    show: true
                });

                setMessageModalShowSpinner(false);

                return;
            }

            if (result.error) {
                setMessageModalMessage({
                    type: 'danger',
                    message: result.message,
                    show: true
                });

                setMessageModalShowSpinner(false);

                return;
            }

            // simulamos un click a un link a la página que lee el resultado y lo muestra en la lista ... 
            setMessageModalMessage({
                type: 'info',
                message: `Ok, las plantillas fueron leídas y serán mostradas en una lista cuando Ud. cierre esta ventana. <br />
                          `,
                show: true
            });

            setPlantillas(result.files);
            setMessageModalShowSpinner(false);
        })
    }, [])

    const generarEmails = () => { 

        // para mostrar un (sub) modal que muestra un spinner y un mensaje final para este proceso 
        setShowMessageModal(true);
        setMessageModalShowSpinner(true);
        setMessageModalTitle("Emails de cobranza - Construir emails");

        Meteor.call("consultas.montosPendientesCobroVencimientos.generarEmailsCobranza", selectedPlantillas, selectedItems, (error, result) => {

            if (error) {
                setMessageModalMessage({
                    type: 'danger',
                    message: error.message,
                    show: true
                });

                setMessageModalShowSpinner(false);

                return;
            }

            if (result.error) {
                setMessageModalMessage({
                    type: 'danger',
                    message: result.message,
                    show: true
                });

                setMessageModalShowSpinner(false);

                return;
            }

            // simulamos un click a un link a la página que lee el resultado y lo muestra en la lista ... 
            setMessageModalMessage({
                type: 'info',
                message: result.message,
                show: true
            });

            setMessageModalShowSpinner(false);
        })
    }

    useEffect(() => {
        setShowSpinner(true);

        const montosPendientes = Consulta_MontosPendientesCobro_Vencimientos.find({ user: Meteor.userId() }).fetch();
        const montosPendientes2 = montosPendientes.map((x) => ({ ...x, 
            numeroCuota: `${x.numero.toString()}/${x.cantidad.toString()}`
        }))
        setItems(montosPendientes2);

        setShowSpinner(false);
    }, [])

    const handleTabSelect = (key) => setCurrentTab(key);

    return (
        <>
            {/* backdrop='static' impide que se cierre el modal si el usuario hace un click fuera del mismo  */}
            <Modal show={showModal} onHide={() => handleModalClose()} bsSize="large" backdrop="static">

                <Modal.Header closeButton>
                    <Modal.Title>Montos pendientes de cobro / Generar Emails</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {showSpinner && <Spinner />}
                    {message.show && <Message message={message} setMessage={setMessage} />}

                    {/* desde el modal mostramos, a su vez, un (sub) modal, para mostrar un spinner o un mensaje cuando 
                        ejecutamos procesos algo largos */}
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

                    <Tabs activeKey={currentTab} onSelect={(key) => handleTabSelect(key)} id="controlled-tab-example">
                        <Tab eventKey={1} title="Lista">
                            <Lista items={items} setSelectedItems={setSelectedItems} />
                        </Tab>

                        <Tab eventKey={2} title="Plantillas">
                            <ListaPlantillas plantillas={plantillas} setSelectedPlantillas={setSelectedPlantillas} />
                        </Tab>
                    </Tabs>
                </Modal.Body>

                <Modal.Footer>
                    <>
                        <Button bsStyle="primary" bsSize="small" onClick={() => generarEmails()}>Generar Emails</Button>
                        <Button bsStyle="warning" bsSize="small" onClick={() => handleModalClose()}>Cerrar</Button>
                    </>
                </Modal.Footer>
            </Modal>
        </>
    )
}

ConsultaPendientesCobroEmails.propTypes = {
    // esta es la función que se ejecuta en angular cuando el usuario cierra el modal 
    toogleAbrirGenerarEmailsModal: PropTypes.func.isRequired,
};

export default ConsultaPendientesCobroEmails; 