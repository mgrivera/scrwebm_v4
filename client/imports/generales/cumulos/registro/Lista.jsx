
import { Meteor } from 'meteor/meteor'

import React, { useState } from 'react' 
import PropTypes from 'prop-types';

import numeral from 'numeral'; 

import './styles.css'; 

import Table from 'react-bootstrap/lib/Table';
import { Modal, Button } from 'react-bootstrap';

import Spinner from './Spinner';
import Message from './Message'; 

const ModalConfirmDelete = ({ showConfirmDeleteModal, setShowConfirmDeleteModal, selectedItemInTable, handleRemoveItem }) => { 

    const handleDeleteItem = () => {
        handleRemoveItem(selectedItemInTable);          // esta función elimina el item 
    }

    return (
        <>
            {/* backdrop='static' impide que se cierre el modal si el usuario hace un click fuera del mismo  */}
            <Modal show={showConfirmDeleteModal} onHide={() => setShowConfirmDeleteModal(false)} bsSize="small">
                <Modal.Header closeButton>
                    <Modal.Title>Desea eliminar el registro?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        Haga un click en Ok para eliminar el registro de la lista.
                    </p>
                </Modal.Body>
                    
                <Modal.Footer>
                    <Button bsStyle="warning" bsSize="small" style={{ minWidth: '75px' }} onClick={() => setShowConfirmDeleteModal(false)}>Cancel</Button>
                    <Button bsStyle="primary" bsSize="small" style={{ minWidth: '75px' }} onClick={() => handleDeleteItem()}>Ok</Button>
                </Modal.Footer>
            </Modal >
        </>
    )
}

ModalConfirmDelete.propTypes = {
    showConfirmDeleteModal: PropTypes.bool.isRequired,
    setShowConfirmDeleteModal: PropTypes.func.isRequired, 
    selectedItemInTable: PropTypes.object.isRequired, 
    handleRemoveItem: PropTypes.func.isRequired
};

const TableRow = ({ item, handleItemDetalles, modo, setShowConfirmDeleteModal, setSelectedItemInTable }) => { 

    const handleDeleteItem =  () => { 
        setShowConfirmDeleteModal(true);        // para que se abra y muestre el modal que pide confirmación al usuario  
        setSelectedItemInTable(item);           // para guardar en el state el item que el usuario quiere eliminar 
    }

    return (
        <tr>
            <td>{item.origen}</td>
            <td>{item.tipoCumulo}</td>
            <td>{item.zona}</td>
            <td>{item.desde ? item.desde.toLocaleDateString() : 'Indef'}</td>
            <td>{item.hasta ? item.hasta.toLocaleDateString() : 'Indef'}</td>
            <td>{numeral(item.valorARiesgo).format("0,0.0")}</td>
            <td>{numeral(item.sumaAsegurada).format("0,0.0")}</td>
            <td>{numeral(item.montoAceptado).format("0,0.0")}</td>
            <td>{numeral(item.cesionCuotaParte).format("0,0.0")}</td>
            <td>{numeral(item.cesionExcedente).format("0,0.0")}</td>
            <td>{numeral(item.cesionFacultativo).format("0,0.0")}</td>
            <td>{numeral(item.cumulo).format("0,0.0")}</td>
            
            <td>
                {/* cuando el usuario quiere editar un item en la lista, debemos hacer dos cosas: 
                    ejecutamos esta función en RegistroCumulos y pasamos el item  */}
                <div style={{ textAlign: 'center' }} onClick={() => handleItemDetalles(item._id)}>
                    <i className="fa fa-pencil"></i>
                </div>
            </td>
            {modo != "consulta" && 
                <td>
                    <div style={{ textAlign: 'center' }} onClick={() => handleDeleteItem()}>
                        <i className="fa fa-close"></i>
                    </div>
                </td>
            }
        </tr>
    )
}

TableRow.propTypes = {
    modo: PropTypes.string.isRequired, 
    item: PropTypes.object.isRequired,
    handleItemDetalles: PropTypes.func.isRequired,
    setShowConfirmDeleteModal: PropTypes.func.isRequired, 
    setSelectedItemInTable: PropTypes.func.isRequired
};

const Lista = ({ items, handleItemDetalles, modo }) => { 

    const [spinner, setSpinner] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' }); 
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false); 
    const [selectedItemInTable, setSelectedItemInTable] = useState({}); 
    
    const handleMessageDismiss = () => {
        setShowMessage({ show: false, type: '', message: '' });
    }

    const handleRemoveItem = (item) => {

        setSpinner(true);

        Meteor.call('cumulos_registro.save.remove', item._id, (err, result) => {

            if (err) {
                setShowMessage({ show: true, type: 'danger', message: err.message });
                setSpinner(false);

                return;
            }

            if (result.error) {
                setShowMessage({ show: true, type: 'danger', message: result.message });
                setSpinner(false);

                return;
            }

            setSpinner(false);
            setShowConfirmDeleteModal(false);       // para cerrar el modal que pidió la confirmación al usuario       
            setShowMessage({ show: true, type: 'info', message: result.message });
        })
    }

    return (
        <div style={{ marginTop: '20px' }}>
            {
                spinner
                    ?
                    <div style={{ marginTop: '15px' }}>
                        <Spinner />
                    </div>
                    :
                    null
            }

            {
                showMessage.show
                    ?
                    <div style={{ marginTop: '15px' }}>
                        <Message type={showMessage.type}
                            message={showMessage.message}
                            handleMessageDismiss={handleMessageDismiss} />
                    </div>
                    :
                    null
            }

            { 
            showConfirmDeleteModal && 
            <ModalConfirmDelete showConfirmDeleteModal={showConfirmDeleteModal} 
                                setShowConfirmDeleteModal={setShowConfirmDeleteModal} 
                                selectedItemInTable={selectedItemInTable} 
                                handleRemoveItem={handleRemoveItem} />
            }

            <div style={{ width: 'auto', height: '350px', overflowX: 'auto' }}>
                <Table striped bordered condensed hover>
                    <thead>
                        <tr>
                            <th>Origen</th>
                            <th>Tipo cúmulo</th>
                            <th>Zona</th>
                            <th>Desde</th>
                            <th>Hasta</th>
                            <th>Valor a riesgo</th>
                            <th>Suma aseg</th>
                            <th>Aceptado</th>
                            <th>Cesión CP</th>
                            <th>Cesión exc</th>
                            <th>Cesión fac</th>
                            <th>Cúmulo</th>
                            <th></th>
                            { modo != "consulta" && <th></th> }
                        </tr>
                    </thead>
                    <tbody>
                        {
                            items.map(x => <TableRow modo={modo} 
                                                    setSpinner={setSpinner} 
                                                    setShowMessage={setShowMessage} 
                                                    handleItemDetalles={handleItemDetalles}
                                                    key={x._id} 
                                                    item={x} 
                                                    setShowConfirmDeleteModal={setShowConfirmDeleteModal} 
                                                    setSelectedItemInTable={setSelectedItemInTable} />)
                        }

                    </tbody>
                </Table>
            </div>
        </div>
    )
}

Lista.propTypes = {
    modo: PropTypes.string.isRequired,      // edicion / consulta
    items: PropTypes.array.isRequired,
    handleItemDetalles: PropTypes.func.isRequired,
};

export default Lista; 