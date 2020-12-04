
import React from 'react' 
import PropTypes from 'prop-types';

import numeral from 'numeral'; 
import moment from 'moment'; 

import Table from 'react-bootstrap/lib/Table';

const TableRow = ({ item }) => { 

    return (
        <tr>
            <td>{item.monedas.simbolo}</td>
            <td>{item.companias.abreviatura}</td>
            <td>{item.ramos.abreviatura}</td>
            <td>{moment(item.cumulos.desde).format('DD-MM-YYYY')}</td>
            <td>{moment(item.cumulos.hasta).format('DD-MM-YYYY')}</td>
            <td>{item.cumulos.origen}</td>
            <td>{item.numero}</td>
            <td>{item.tiposCumulo.zonas.abreviatura}</td>
            <td>{numeral(item.cumulos.sumaAsegurada).format("0,0.0")}</td>
            <td>{numeral(item.cumulos.montoAceptado).format("0,0.0")}</td>
            <td>{numeral(item.cumulos.montoCedido).format("0,0.0")}</td>
            <td>{numeral(item.cumulos.cumulo).format("0,0.0")}</td>
        </tr>
    )
}

TableRow.propTypes = {
    item: PropTypes.object.isRequired
};

function ConsultaCumulosLista_Table({ items }) { 

    const tableStyle = { height: '350px', overflow: 'auto', marginTop: '20px' }; 

    return ( 
        <div style={tableStyle}>

            <Table striped bordered condensed hover>
                <thead>
                    <tr>
                        <th>Mon</th>
                        <th>Compañía</th>
                        <th>Ramo</th>
                        <th>Desde</th>
                        <th>Hasta</th>
                        <th>Origen</th>
                        <th>Número</th>
                        <th>Zona</th>
                        <th>Suma aseg</th>
                        <th>Monto aceptado</th>
                        <th>Monto cedido</th>
                        <th>Cúmulo</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        items.map(x => <TableRow key={x._id} item={x} />)
                    }

                </tbody>
            </Table>
        </div>
    )
}

ConsultaCumulosLista_Table.propTypes = {
    items: PropTypes.array.isRequired, 
}

export default ConsultaCumulosLista_Table; 