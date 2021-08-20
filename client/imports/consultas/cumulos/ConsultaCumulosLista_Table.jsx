
import React from 'react' 
import PropTypes from 'prop-types';

import numeral from 'numeral'; 
import moment from 'moment'; 

import Table from 'react-bootstrap/lib/Table';

const TableRow = ({ item }) => { 

    return (
        <tr>
            <td>{item.monedas.simbolo}</td>
            <td>{item.cumulos.abreviatura}</td>
            <td>{item.zonas.abreviatura}</td>
            <td>{item.companias.abreviatura}</td>
            <td>{item.ramos.abreviatura}</td>
            <td>{moment(item.desde).format('DD-MM-YYYY')}</td>
            <td>{moment(item.hasta).format('DD-MM-YYYY')}</td>
            <td>{moment(item.cumulosAl).format('DD-MM-YYYY')}</td>
            <td>{item.origen}</td>
            <td>{`${item.numero}-${item.subNumero}`}</td>
            <td>{numeral(item.valorARiesgo).format("0,0.0")}</td>
            <td>{numeral(item.sumaAsegurada).format("0,0.0")}</td>
            <td>{numeral(item.primaCumulo).format("0,0.0")}</td>
            <td>{numeral(item.cumulo).format("0,0.0")}</td>
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
                        <th>Tipo cúmulo</th>
                        <th>Zona</th>
                        <th>Compañía</th>
                        <th>Ramo</th>
                        <th>Desde</th>
                        <th>Hasta</th>
                        <th>Cúmulos al</th>
                        <th>Origen</th>
                        <th>##</th>
                        <th>Valor a riesgo</th>
                        <th>Suma asegurada</th>
                        <th>Prima cúmulo</th>
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