
import { Meteor } from 'meteor/meteor';

import React, { useState, useEffect } from 'react'; 
import PropTypes from 'prop-types';

// import { useTracker } from "meteor/react-meteor-data";

import { Modal, Button } from 'react-bootstrap';
import { Tabs, Tab } from 'react-bootstrap';

import Message from '/client/imports/genericReactComponents/Message';
import Spinner from '/client/imports/genericReactComponents/Spinner';

import Lista from './Lista';
import ListaPlantillas from './ListaPlantillas';
import Configuracion from './Configuracion'; 
import Notas from './Notas'; 

import { Consulta_MontosPendientesCobro_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesCobro_Vencimientos';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';
import { Filtros } from '/imports/collections/otros/filtros';

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

    const [companiaSeleccionada, setCompaniaSeleccionada] = useState({});
    const [user, setUser] = useState({});

    // datos del usuario, compañía seleccionada, emails, etc.; sirven para firmar el Email, etc. 
    // Importante: se guardan en Filtros, como si fueran uno ... 
    const [datosConfiguracion, setDatosConfiguracion] = useState({}); 

    const handleModalClose = () => { 
        setShowModal(false); 

        // esta es la función que hace el toogle en angular; la recibimos aquí para ejecutarla cuando el usuario decide cerrar el modal 
        toogleAbrirGenerarEmailsModal(); 
    }

    // el el siguiente useEffect() preparamos los datos de configuración: nombre de la compañía seleccionada, datos del user, 
    // email, etc. 
    // Nótese que estos datos luego se guardan como un filtro. Si el usuario modifica algo, lo puede ver la próxima vez. 
    // La excepción es el nombre de la compañía seleccionada, que no se puede cambiar 
    useEffect(() => { 
        setShowSpinner(true); 
        // Primero leemos la empresa usuaria seleccionada 
        const empresaSeleccionadaUsuario = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        let empresaSeleccionada = null;

        if (empresaSeleccionadaUsuario) {
            empresaSeleccionada = EmpresasUsuarias.findOne(empresaSeleccionadaUsuario.companiaID);
            setCompaniaSeleccionada(empresaSeleccionada);
        }

        // leemos los datos de configuración del proceso, que guardamos como si fuera un filtro 
        const filtro = Filtros.findOne({ nombre: 'consultas_MontosPendientesDeCobro_Emails', userId: Meteor.userId() });
        
        // Segundo, leemos el usuario y sus datos personales; nótese que debemos esperar por un subscription 
        Meteor.subscribe('userData', () => { 

            const user = Meteor.user({ fields: { emails: 1, personales: 1 } });
            setUser(user); 

            // preparamos los datos de configuración 

            // si existe un filtro anterior, lo usamos; nótese que siempre usamos la compañia seleccionada, pues puede cambiar 
            if (filtro) {
                filtro.filtro.nombreCompania = empresaSeleccionada.nombre; 
                setDatosConfiguracion(filtro.filtro);
            } else { 
                const configuracion = {
                    nombreCompania: empresaSeleccionada.nombre,
                    enviarSoloEmailsCC: false,
                    emailSubject: `Montos pendientes de pago a ${empresaSeleccionada.nombre}`, 

                    usuario: {
                        titulo: user?.personales?.titulo,
                        nombre: user?.personales?.nombre,
                        cargo: user?.personales?.cargo
                    },
                    copiar_1: {
                        copiar: true,
                        email: user?.emails[0]?.address
                    },
                    copiar_2: {
                        copiar: false,
                        email: ''
                    }
                };
                setDatosConfiguracion(configuracion);
            }
            
            setShowSpinner(false); 
        })
    }, [])

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
                message: `Ok, las plantillas, para construir los correos de cobranza, fueron leídas y serán mostradas en una 
                          lista cuando Ud. cierre esta ventana. <br /><br />
                          Ahora Ud. debe seleccionar en la lista, las cuotas para las cuales desea construir emails. 
                          Luego hacer un click en el botón para buscar y asignar las personas y sus direcciones de correo. 
                          `,
                show: true
            });

            setPlantillas(result.files);
            setMessageModalShowSpinner(false);
        })
    }, [])

    const leerEmailAddresses = () => { 
        // enviamos la lista al server para leer las direcciones de correo para *cada* entidad (riesgo, contrato, siniestro) 

        // para mostrar un (sub) modal que muestra un spinner y un mensaje final para este proceso 
        setShowMessageModal(true);
        setMessageModalShowSpinner(true);
        setMessageModalTitle("Emails de cobranza - Leer direcciones de correo");

        if (!selectedItems || !Array.isArray(selectedItems) || !selectedItems.length) { 
            const message = `Aparentemente, no se han seleccionado registros en la lista. <br /> 
                             Este proceso intentará construir y enviar emails para los registros seleccionados en la lista. <br /> 
                             Ud. debe seleccionar, al menos, un registro en la lista antes de intentar ejecutar esta función.`
            setMessageModalMessage({
                type: 'danger',
                message,
                show: true
            });

            setMessageModalShowSpinner(false);

            return;
        }

        // construimos un array con los items que el usuario seleccionó en la lista. Nota: en items están los montos pendientes y en 
        // selectedItems están los indices de los items seleccionados ... 
        const selectedRows = items.filter((item, idx) => { 
            return selectedItems.some(x => x === idx); 
        })

        // Nota Importante: la idea es que solo se muestren ahora los items seleccionados por el usuario antes. Si, por ejemplo, 
        // habían 350 items en la lista y el usuario selecciona solo 9, solo estos se deben mostrar en la lista 
        Meteor.call("consultas.montosPendientesCobroVencimientos.leerEmailAddresses", selectedRows, (error, result) => {

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

            setMessageModalMessage({
                type: 'info',
                message: result.message,
                show: true
            });

            setItems(result.finalRows);         // estos son *solo* los rows seleccionados por el usuario, pero ahora con las personas (si existen) 

            // seleccionamos en el grid *solo* los rows que tienen un email 
            const indexes = []; 

            result.finalRows.forEach((r, i) => { 
                if (r.persona?.email) { 
                    indexes.push(i); 
                }
            }); 
            setSelectedItems(indexes);
            setMessageModalShowSpinner(false);
        })
    }

    const generarEmails = () => { 

        // para mostrar un (sub) modal que muestra un spinner y un mensaje final para este proceso 
        setShowMessageModal(true);
        setMessageModalShowSpinner(true);
        setMessageModalTitle("Emails de cobranza - Construir emails");

        if (!selectedItems.length) {
            const message = `Aparentemente, <b>no se han seleccionado</b> registros en la lista. <br /><br />
                             Este proceso intentará construir y enviar emails para los registros seleccionados en la lista. <br /><br />
                             Ud. debe seleccionar, al menos, un registro en la lista antes de intentar ejecutar esta función.`
            setMessageModalMessage({
                type: 'danger',
                message,
                show: true
            });

            setMessageModalShowSpinner(false);

            return;
        }

        if (!selectedPlantillas.length) {
            const message = `Aparentemente, Ud. no ha seleccionado una plantilla (html) en la lista. <br /> <br />
                             Este proceso usa la plantilla que Ud. seleccione, para construir el email que se enviará a los 
                             registros seleccionados. <br /> <br />
                             Ud. debe seleccionar una plantilla en la lista antes de intentar ejecutar esta función.`
            setMessageModalMessage({
                type: 'danger',
                message,
                show: true
            });

            setMessageModalShowSpinner(false);

            return;
        }

        // siempre debemos asegurarnos que el usuario seleccione *solo* rows con emails asociados 
        // en selectedItems están los rows de registros seleccionados; en items están los rows 
        const selectedRows = []; 
        selectedItems.forEach(x => selectedRows.push(items[x])); 
        
        const hayPersonasSinEmail = selectedRows.some(x => !x.persona?.email);

        if (hayPersonasSinEmail) {
            const message = `En los registros que Ud. ha seleccionado en la lista, hay cuotas <b>sin</b> dirección de correo asociada; 
                             por favor revise. <br /><br />
                             Cada cuota que Ud. seleccione en la lista, debe tener asociada una persona que tenga una dirección de correo. <br /><br />
                             Ud. puede ver las personas asociadas y sus direcciones de correo si hace un <em>scrolling</em> a la derecha, 
                             hacia el final de la lista. 
                             `
            setMessageModalMessage({
                type: 'danger',
                message,
                show: true
            });

            setMessageModalShowSpinner(false);

            return;
        }

        const plantillaHtml = plantillas[selectedPlantillas[0]]; 

        const dropBoxFilePath = "/html/emails/cobranzaMontosPendientes"; 
        Meteor.call("consultas.montosPendientesCobroVencimientos.generarEmailsCobranza", 
            dropBoxFilePath, plantillaHtml, selectedRows, datosConfiguracion, (error, result) => {

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

            setMessageModalMessage({
                type: 'info',
                message: result.message,
                show: true
            });

            setMessageModalShowSpinner(false);
        })
    }

    useEffect(() => {
        // aquí leemos el resultado de la consulta para el usuario y ponemos estos items en el state. 
        // de aqui en adelante, los items producto de la consulta están en el array items, en el state ... 
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
                    {(showSpinner) && <Spinner />}
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
                        <Tab eventKey={1} title="1) Lista">
                            {currentTab === 1 && <Lista items={items} selectedItems={selectedItems} setSelectedItems={setSelectedItems} />}
                        </Tab>

                        <Tab eventKey={2} title="2) Plantillas">
                            {currentTab === 2 && <ListaPlantillas plantillas={plantillas} setSelectedPlantillas={setSelectedPlantillas} />}
                        </Tab>

                        <Tab eventKey={3} title="3) Configuración">
                            {currentTab === 3 && <Configuracion datosConfiguracion={datosConfiguracion} 
                                                                setDatosConfiguracion={setDatosConfiguracion} 
                                                                companiaSeleccionada={companiaSeleccionada}
                                                                user={user} />}
                        </Tab>

                        <Tab eventKey={4} title="Notas">
                            {currentTab === 4 && <Notas />}
                        </Tab>
                    </Tabs>
                </Modal.Body>

                <Modal.Footer>
                    <>
                        <Button bsStyle="primary" bsSize="small" onClick={() => leerEmailAddresses()}>1) Leer direcciones de correo</Button>
                        <Button bsStyle="primary" bsSize="small" onClick={() => generarEmails()}>2) Generar Emails</Button>
                        &nbsp;&nbsp;&nbsp;&nbsp;
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