
import React, { useState } from 'react'; 
import PropTypes from 'prop-types';

import numeral from 'numeral'; 
import moment from 'moment';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css'; 

const reactDataGridNumberFormatter = ({ value }) => numeral(value).format('0,0.00');
const reactDataGridDateFormatter = ({ value }) => moment(value).format('DD-MMM-YY');

const columns = [
    { key: 'monedaSimbolo', name: 'Mon', resizable: true, sortable: true, sortDescendingFirst: false, frozen: true, width: 60, cellClass: 'text-center' },
    { key: 'companiaAbreviatura', name: 'Compañía', resizable: true, sortable: true, sortDescendingFirst: false, frozen: true, width: 100 },
    { key: 'origen', name: 'Origen', resizable: true, sortable: true, sortDescendingFirst: false, frozen: true, width: 100 },
    { key: 'numeroCuota', name: '#Cuota', resizable: true, sortable: true, sortDescendingFirst: false, frozen: true, width: 80, cellClass: 'text-center' },
    { key: 'aseguradoAbreviatura', name: 'Asegurado', sortable: true, sortDescendingFirst: false, resizable: true, width: 150 },
    { key: 'fecha', name: 'Fecha', resizable: true, formatter: reactDataGridDateFormatter, sortable: true, sortDescendingFirst: false, width: 100, cellClass: 'text-center' },
    { key: 'fechaVencimiento', name: 'F venc', resizable: true, formatter: reactDataGridDateFormatter, sortable: true, sortDescendingFirst: false, width: 100, cellClass: 'text-center' },
    { key: 'montoCuota', name: 'Monto cuota', formatter: reactDataGridNumberFormatter, resizable: true, sortable: true, sortDescendingFirst: false, width: 160, cellClass: 'text-right' },
    { key: 'montoCobrado', name: 'Ya cobrado', formatter: reactDataGridNumberFormatter, resizable: true, sortable: true, sortDescendingFirst: false, width: 160, cellClass: 'text-right' },
    { key: 'saldo2', name: 'Saldo', formatter: reactDataGridNumberFormatter, resizable: true, width: 160, sortable: true, sortDescendingFirst: false, cellClass: 'text-right' },
];

const Lista = ({ items, setSelectedItems }) => {

    const [ selectedIndexes, setSelectedIndexes ] = useState([]); 

    const onRowsSelected = rows => {
        // cuando el usuario selecciona un row, su indice (y el row) viene en rows. Si el usuario selecciona todos los rows, 
        // todos los indices vienen en rows 
        // agregamos los rows seleccionados (sus indices) a una variable en el state 

        // primero eliminamos algún indice en el array que ya haya sido seleccionado antes. Esto puede ocurrir cuando el usuario selecciona 
        // todos los items. Si, por ejemplo, había seleccionado el item #3 y luego selecciona todos, el item #3 se selecciona otra vez 
        const selectedRows = rows.filter(x => { return !selectedIndexes.some(y => { return (y === x) }) });
        const selectedRowIndexes = selectedIndexes.concat(selectedRows.map(r => r.rowIdx));
        
        setSelectedIndexes(selectedRowIndexes);
        setSelectedItems(selectedRowIndexes);       // para regresar el array de selected items (indexes) al parent component 
    };

    const onRowsDeselected = rows => {
        // cuando el usuario deselecciona un row, su indice viene en rows. Además, si deselecciona todos los rows, sus inidices vienen 
        // en rows 
        const deselectedIndexes = rows.map(r => r.rowIdx); 
        const selectedRowIndexes = selectedIndexes.filter(x => { return !deselectedIndexes.some(y => { return (y === x) }) });
        setSelectedIndexes(selectedRowIndexes);
        setSelectedItems(selectedRowIndexes);       // para regresar el array de selected items (indexes) al parent component 
    };

    return (
        <div className="div-react-data-grid">
            <ReactDataGrid
                columns={columns}
                rowGetter={i => items[i]}
                rowsCount={items.length}
                minHeight={400} 
                
                rowSelection={{
                    showCheckbox: true,
                    enableShiftSelect: true,
                    // cada vez que el usuario selecciona un item en la lista, se ejecuta esta función para mantener estos items en el state 
                    onRowsSelected: onRowsSelected,
                    // cada vez que el usuario deselecciona un item en la lista, se ejecuta esta función para eliminar el item de la lista en el state 
                    onRowsDeselected: onRowsDeselected,
                    selectBy: {
                        // para pasar la lista de items (indexes) seleccionados al grid 
                        indexes: selectedIndexes
                    }
                }}
            />
        </div>
    )
}

Lista.propTypes = {
    items: PropTypes.array.isRequired, 
    setSelectedItems: PropTypes.func.isRequired
};

export default Lista; 