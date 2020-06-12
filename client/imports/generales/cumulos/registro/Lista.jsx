
import { Meteor } from 'meteor/meteor'

import React, { useState } from 'react' 
import PropTypes from 'prop-types';

import numeral from 'numeral'; 

import './styles.css'; 

import Table from 'react-bootstrap/lib/Table';

import Spinner from './Spinner';
import Message from './Message'; 

const TableRow = ({ item, setSpinner, setShowMessage, handleItemDetalles, modo }) => { 

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
            setShowMessage({ show: true, type: 'info', message: result.message });
        })
    }

    return (
        <tr>
            <td>{item.origen}</td>
            <td>{item.tipoCumulo}</td>
            <td>{item.zona}</td>
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
                    <div style={{ textAlign: 'center' }} onClick={() => handleRemoveItem(item)}>
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
    setSpinner: PropTypes.func.isRequired,
    setShowMessage: PropTypes.func.isRequired,
    handleItemDetalles: PropTypes.func.isRequired,
};

const Lista = ({ items, handleItemDetalles, modo }) => { 

    const [spinner, setSpinner] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, type: '', message: '' }); 

    const handleMessageDismiss = () => {
        setShowMessage({ show: false, type: '', message: '' });
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

            <Table striped bordered condensed hover>
                <thead>
                    <tr>
                        <th>Origen</th>
                        <th>Tipo cúmulo</th>
                        <th>Zona</th>
                        <th>Valor a riesgo</th>
                        <th>Suma aseg</th>
                        <th>Aceptado</th>
                        <th>Cesión CP</th>
                        <th>Cesión exc</th>
                        <th>Cesión fac</th>
                        <th>Cúmulo</th>
                        <th></th>
                        {modo != "consulta" && 
                            <th></th>
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        items.map(x => <TableRow modo={modo} 
                                                 setSpinner={setSpinner} 
                                                 setShowMessage={setShowMessage} 
                                                 handleItemDetalles={handleItemDetalles}
                                                 key={x._id} 
                                                 item={x} />)
                    }

                </tbody>
            </Table>
        </div>
    )
}

Lista.propTypes = {
    modo: PropTypes.string.isRequired,      // edicion / consulta
    items: PropTypes.array.isRequired,
    handleItemDetalles: PropTypes.func.isRequired,
};

export default Lista; 