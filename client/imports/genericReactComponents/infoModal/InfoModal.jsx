
import React from 'react'; 
import PropTypes from 'prop-types';

import { Modal, Button } from 'react-bootstrap';

const InfoModal = ({ showInfoModal, setShowInfoModal, infoHeader, infoText }) => { 

    return (
        <Modal show={showInfoModal} onHide={setShowInfoModal}>

            <Modal.Header closeButton style={{ backgroundColor: 'lightslategray' }}>
                <Modal.Title>{infoHeader}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div>
                    <div style={{ textAlign: 'left' }} dangerouslySetInnerHTML={outputHtmlMarkup(infoText)} />
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button onClick={setShowInfoModal}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
    )
}

InfoModal.propTypes = {
    showInfoModal: PropTypes.bool.isRequired,
    setShowInfoModal: PropTypes.func.isRequired, 
    infoHeader: PropTypes.string.isRequired, 
    infoText: PropTypes.string.isRequired
}

export default InfoModal; 

function outputHtmlMarkup(text) {
    return { __html: text };
}