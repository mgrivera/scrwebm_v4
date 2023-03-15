
import React from 'react'
import PropTypes from 'prop-types';

import { Cell } from 'fixed-data-table-2';

import numeral from 'numeral';
import moment from 'moment'; 

function TextCell({ data, rowIndex, columnKey, ...props }) {

    return (
        <Cell {...props}>
            {data[rowIndex][columnKey]}
        </Cell>
    );
}

// ------------- TextCell -----------------------------------------------
TextCell.propTypes = {
    data: PropTypes.array.isRequired,
    rowIndex: PropTypes.number,
    columnKey: PropTypes.string,
};

// ------------- DateCell -----------------------------------------------
function DateCell({ data, rowIndex, columnKey, ...props }) {

    return (
        <Cell {...props}>
            {data[rowIndex][columnKey].toDateString()}
        </Cell>
    );
}

DateCell.propTypes = {
    data: PropTypes.array.isRequired,
    rowIndex: PropTypes.number,
    columnKey: PropTypes.string,
};

// ------------- DateCell -----------------------------------------------
function DateTimeCell({ data, rowIndex, columnKey, ...props }) {

    const dateValue = data[rowIndex][columnKey]; 

    return (
        <Cell {...props}>
            { 
                moment.isDate(dateValue) ? moment(dateValue).format('D-MMM-YYYY h:m a') : "" 
            }
        </Cell>
    );
}

DateTimeCell.propTypes = {
    data: PropTypes.array.isRequired,
    rowIndex: PropTypes.number,
    columnKey: PropTypes.string,
};

// ------------- DateCellShort -----------------------------------------------
function DateCellShort({ data, rowIndex, columnKey, ...props }) {

    return (
        <Cell {...props}>
            {moment(data[rowIndex][columnKey]).format('D-M-YY')}
        </Cell>
    );
}

DateCellShort.propTypes = {
    data: PropTypes.array.isRequired,
    rowIndex: PropTypes.number,
    columnKey: PropTypes.string,
};

// ------------- DateCellShort -----------------------------------------------
function DateCellNotSoShort({ data, rowIndex, columnKey, ...props }) {

    return (
        <Cell {...props}>
            {moment(data[rowIndex][columnKey]).format('D-MMM-YYYY')}
        </Cell>
    );
}

DateCellNotSoShort.propTypes = {
    data: PropTypes.array.isRequired,
    rowIndex: PropTypes.number,
    columnKey: PropTypes.string,
};


// ------------- DocStateCell -----------------------------------------------
// para mostrar el docState en cada cell: 1 para nuevo; 2 para modificar; ... 
function DocStateCell({ data, rowIndex, columnKey, ...props }) {
    // el valor puede no venir; en ese caso, no mostramos nada en la celda ... 
    // {(value === 0 && <span style={{ color: 'brown', fontSize: '10px' }} className="fa fa-circle-thin" />)}
    const value = data[rowIndex][columnKey];
    return (
        (typeof value === "number") ? 
            <Cell {...props}>
                {(value === 0 && <span style={{ color: 'gray', fontSize: '10px' }} className="fa fa-circle-thin" />)}
                {(value === 1 && <span style={{ color: 'blue', fontSize: '10px' }} className="fa fa-asterisk" />)}
                {(value === 2 && <span style={{ color: 'brown', fontSize: '10px' }} className="fa fa-pencil" />)}
                {(value === 3 && <span style={{ color: 'red', fontSize: '10px' }} className="fa fa-trash" />)}
            </Cell>
        : 
            null
    );
}

DocStateCell.propTypes = {
    data: PropTypes.array.isRequired,
    rowIndex: PropTypes.number,
    columnKey: PropTypes.string,
};

// ------------- BooleanCell -----------------------------------------------
function BooleanCell({ data, rowIndex, columnKey, ...props }) {
    const value = data[rowIndex][columnKey] === true;
    return (
        <Cell {...props}>
            <input type="checkbox" checked={value} disabled />
        </Cell>
    );
}

BooleanCell.propTypes = {
    data: PropTypes.array.isRequired,
    rowIndex: PropTypes.number,
    columnKey: PropTypes.string,
};

function sortDirToogle(sortDir) {
    return sortDir === "asc" ? "desc" : "";
}

// ------------- Number2DecimalCell -----------------------------------------------
function Number2DecimalsCell({ data, rowIndex, columnKey, ...props }) {

    // a veces el monto viene en Nulls; de ser así, no debemos mostrar nada 
    let value = data[rowIndex][columnKey];     

    if (value === null || value === undefined)  { 
        value = ""; 
    } else { 
        value = numeral(data[rowIndex][columnKey]).format("0,0.00"); 
    }

    return (
        <Cell {...props}>
            {value}
        </Cell>
    );
}

Number2DecimalsCell.propTypes = {
    data: PropTypes.array.isRequired,
    rowIndex: PropTypes.number,
    columnKey: PropTypes.string,
};

// ------------- SortHeaderCell -----------------------------------------------
function SortHeaderCell({ columnKey, sortKeys, setSortKeys, ...props }) {

    const handleSortChange = (e) => {
        e.preventDefault();

        const shiftKey = e.shiftKey;        // true si el usuario presiona shift al hacer el click 

        let sortKeys2 = sortKeys.slice();

        if (!shiftKey) {
            // si el usuario presiona shift, es que quiere mantener el sort que ahora existe (y agregar otro)
            sortKeys2 = sortKeys2.filter(x => x.key === columnKey);
        }

        const item = sortKeys2.find(x => x.key === columnKey);

        // si el item existe, hacemos un toogle del sortDir 
        if (item) {
            // al cambiar aquí, cambia en el array???? 
            item.sortDir = sortDirToogle(item.sortDir);

            if (!item.sortDir) {
                // el usuario quitó el sort; eliminamos el item del array 
                sortKeys2 = [];         // click: no deben haber otros items 
            }
        } else {
            // el key no existe en el array, lo agregamos ... 
            sortKeys2.push({ key: columnKey, sortDir: 'asc' })
        }

        setSortKeys(sortKeys2);
        const sortedData = props.applySort(props.data, sortKeys2);      // para aplicar el sort al array 
        props.setTableData(sortedData);
    }

    return (
        <Cell className={props.className}>
            <a href="#" onClick={handleSortChange}>
                {props.children}
                {
                    (sortKeys.find(x => x.key === columnKey) && sortKeys.find(x => x.key === columnKey).sortDir) ?
                        (sortKeys.find(x => x.key === columnKey).sortDir === 'asc' ? '↑' : '↓')
                        : ''
                }
            </a>
        </Cell>
    );
}

SortHeaderCell.propTypes = {
    columnKey: PropTypes.string.isRequired,
    children: PropTypes.string.isRequired,
    sortKeys: PropTypes.array.isRequired,
    setSortKeys: PropTypes.func.isRequired,
    className: PropTypes.string,
    data: PropTypes.array.isRequired,
    setTableData: PropTypes.func.isRequired,
    applySort: PropTypes.func.isRequired
};

export { TextCell, SortHeaderCell, BooleanCell, DocStateCell, DateCell, DateCellShort, DateCellNotSoShort, Number2DecimalsCell, DateTimeCell }