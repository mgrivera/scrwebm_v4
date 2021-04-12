
import React from 'react'
import PropTypes from 'prop-types';

import { Modal, Button } from 'react-bootstrap';

import Message from '/client/imports/genericReactComponents/Message';
import Spinner from '/client/imports/genericReactComponents/Spinner';

// -------------------------------------------------------------------------------------------------------------------
// para mostrar un spinner y un mensaje final (error/éxito) cuando se ejecuta un proceso desde el modal 
// nos pareció adecuado pues el modal principal puede ser largo y el spinner arriba no se ve; además, 
// tampoco un mensaje final de éxito o error que pueda generar el proceso que se ejecuta ... la mayoría de 
// las veces, el usuario no verá el mensaje final pues queda arriba y hay que hacer scrolling para subir 
const MessageModal = ({ messageModalTitle,
    showMessageModal,
    setShowMessageModal,
    messageModalShowSpinner,
    messageModalMessage,
    setMessageModalMessage }) => {

    const handleClose = () => {
        setShowMessageModal(false);

        setMessageModalMessage({ type: 'info', message: '', show: false });
    }

    return (
        <Modal show={showMessageModal} onHide={handleClose}>

            <Modal.Header closeButton style={{ background: '#88A0B9' }}>
                <Modal.Title>
                    <span style={{ fontSize: 'small' }}>{messageModalTitle}</span>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {messageModalShowSpinner && <Spinner />}
                {messageModalMessage.show && <Message message={messageModalMessage} setMessage={setMessageModalMessage} />}
            </Modal.Body>

            <Modal.Footer>
                <Button bsStyle="warning" bsSize="small" onClick={handleClose}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
    )
}

MessageModal.propTypes = {
    messageModalTitle: PropTypes.string.isRequired,
    showMessageModal: PropTypes.bool.isRequired,
    setShowMessageModal: PropTypes.func.isRequired,
    messageModalShowSpinner: PropTypes.bool.isRequired,
    messageModalMessage: PropTypes.object.isRequired,
    setMessageModalMessage: PropTypes.func.isRequired
};

export { MessageModal }; 