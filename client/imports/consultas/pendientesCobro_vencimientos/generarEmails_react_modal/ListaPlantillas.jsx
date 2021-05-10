
import React, { useState } from 'react';
import PropTypes from 'prop-types';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css';

const columns = [
    { key: 'name', name: 'Nombre', resizable: true, sortable: true, sortDescendingFirst: false, width: 700 }
];

const ListaPlantillas = ({ plantillas, setSelectedPlantillas }) => {

    const [selectedIndexes, setSelectedIndexes] = useState([]);

    const onRowsSelected = rows => {
        // cuando el usuario selecciona un row, su indice (y el row) viene en rows. Si el usuario selecciona todos los rows, 
        // todos los indices vienen en rows 
        // agregamos los rows seleccionados (sus indices) a una variable en el state 

        // cómo queremos seleccionar un solo item, salimos cuando el usuario hace una selección de más de 1 row
        if (rows.length > 1) { 
            return; 
        }

        // primero eliminamos algún indice en el array que ya haya sido seleccionado antes. Esto puede ocurrir cuando el usuario selecciona 
        // todos los items. Si, por ejemplo, había seleccionado el item #3 y luego selecciona todos, el item #3 se selecciona otra vez 
        const selectedRows = rows.filter(x => { return !selectedIndexes.some(y => { return (y === x) }) });

        // aparentemente, no se puede indicar a react-data-grid que se desea seleccionar un solo row (simple selection) 
        // por eso lo hacemos con code ... 

        // para seleccionar varios items 
        //const selectedRowIndexes = selectedIndexes.concat(selectedRows.map(r => r.rowIdx));

        // para seleccionar un solo item 
        const selectedRowIndexes = selectedRows.map(r => r.rowIdx);

        setSelectedIndexes(selectedRowIndexes);
        setSelectedPlantillas(selectedRowIndexes);       // para regresar el array de selected items (indexes) al parent component 
    };

    const onRowsDeselected = rows => {
        // cuando el usuario deselecciona un row, su indice viene en rows. Además, si deselecciona todos los rows, sus inidices vienen 
        // en rows 
        const deselectedIndexes = rows.map(r => r.rowIdx);
        const selectedRowIndexes = selectedIndexes.filter(x => { return !deselectedIndexes.some(y => { return (y === x) }) });
        setSelectedIndexes(selectedRowIndexes);
        setSelectedPlantillas(selectedRowIndexes);       // para regresar el array de selected items (indexes) al parent component 
    };

    return (
        <div className="div-react-data-grid">
            <p style={{ marginTop: '15px' }}>
                Seleccione la plantilla que desea usar para construir los Emails.
            </p>
            <ReactDataGrid
                columns={columns}
                rowGetter={i => plantillas[i]}
                rowsCount={plantillas.length}
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

ListaPlantillas.propTypes = {
    plantillas: PropTypes.array.isRequired,
    setSelectedPlantillas: PropTypes.func.isRequired
};

export default ListaPlantillas;