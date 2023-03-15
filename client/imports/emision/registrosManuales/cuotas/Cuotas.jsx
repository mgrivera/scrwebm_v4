
import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Modal, Button } from 'react-bootstrap';

import Lista from './Lista';

const Cuotas = ({ setShowCuotasModal, companias, monedas, cuotas }) => {

    const [showModal, setShowModal] = useState(true);

    const handleModalClose = () => {
        // esta función pone en false el state que permite abrir el modal en el component principal (que contiene a este) 
        setShowCuotasModal(false);
        setShowModal(false);
    }

    // preparamos el array que vamos a mostrar en la lista (fixed-data-table-2) 
    // la idea es agregar el nombre de cada compañía, pues solo viene su _id; igual para la moneda 
    let arrayCuotas = [];
    if (Array.isArray(cuotas)) {
        arrayCuotas = cuotas.map(x => {
            const compania = companias.find(c => c._id === x.compania);
            const companiaNombre = compania && compania.abreviatura ? compania.abreviatura : 'indef';

            const moneda = monedas.find(c => c._id === x.moneda);
            const monedaSimbolo = moneda && moneda.simbolo ? moneda.simbolo : 'indef';
            
            return {
                ...x,
                monedaSimbolo, 
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
                    <Lista data={arrayCuotas} />
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

Cuotas.propTypes = {
    setShowCuotasModal: PropTypes.func.isRequired,
    companias: PropTypes.array.isRequired,
    monedas: PropTypes.array.isRequired,
    cuotas: PropTypes.array.isRequired
};

export default Cuotas; 