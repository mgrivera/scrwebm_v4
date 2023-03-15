
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';

import lodash from 'lodash';

import '../styles.css';
import 'fixed-data-table-2/dist/fixed-data-table.min.css';

import { Table, Column } from 'fixed-data-table-2';

import { TextCell, SortHeaderCell, Number2DecimalsCell } from '/client/imports/genericReactComponents/FixedDataTable_TableCells';

// este es el default sort de la tabla que mostramos al usuario; la idea es que podamos aplicarlo cuando el 
// usuario hace click repetidas veces para ordenar por alguna columna en la lista; primero aplicamos un sort 
// asc, luego desc y, finalmente, usamos el default sort para restablecer el sort inicial de la tabla 
const defaultSort = [{ key: 'username', sortDir: 'asc' }];

function applySort(data, sortKeys) {

    // lodash necesita dos arrays para hacer el orderBy; uno con los keys y otro con los directions 

    // cuando el usuario elimina el sort (con un tercer click), usamos el default 
    const keysArray = sortKeys.length ? sortKeys : defaultSort;

    const keys = keysArray.map(x => x.key);
    const sortDirs = keysArray.map(x => x.sortDir);

    return lodash.orderBy(data, keys, sortDirs);
}

function FixedDataTable2({ data, setCurrentTab, setClickedRow }) {

    const [sortKeys, setSortKeys] = useState([]);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        // si había un sort antes de hacer el paging, intentamos mantenerlo 
        const data2 = data.map(x => ({
            _id: x._id,
            compania: x.compania,
            companiaNombre: x.companiaNombre, 
            ordenPorc: x.ordenPorc,
            monto: x.monto
        }));

        const items = sortKeys.length ? applySort(data2.slice(), sortKeys) : data2.slice();
        setTableData(items);
    }, [data])

    const handleRowClick = (e, index) => {
        // mostramos el item en el tab 2 (detalles)
        const clickedItem = tableData[index];

        // estos valores serán usados como defaults en la forma; debemos convertirlos a strings 
        clickedItem.ordenPorc = clickedItem?.ordenPorc ? clickedItem.ordenPorc.toString() : "";
        clickedItem.monto = clickedItem?.monto ? clickedItem.monto.toString() : "";

        // este valor no está en el schema; es solo para mostrar el nombre de la compañía en la forma 
        // lo quitamos del item para que la validación pase sin problemas; de otra forma, al validar el 
        // item tendríamos un error del tipo: key no in schema ... 
        delete clickedItem.companiaNombre; 

        setClickedRow(clickedItem);
        setCurrentTab(2);
    }

    // Render the UI for your table
    return (
        <Table
            rowHeight={30}
            rowsCount={tableData.length}
            headerHeight={30}
            width={750}
            height={250}
            onRowClick={handleRowClick}
        >
            <Column
                columnKey="companiaNombre"
                align="left"
                header={
                    <SortHeaderCell
                        columnKey="companiaNombre"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Compañía
                    </SortHeaderCell>
                }
                width={200}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="ordenPorc"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="ordenPorc"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Orden(%)
                    </SortHeaderCell>
                }
                width={120}
                cell={<Number2DecimalsCell className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="monto"
                align="right"
                header={
                    <SortHeaderCell
                        columnKey="monto"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-right"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Monto
                    </SortHeaderCell>
                }
                width={120}
                cell={<Number2DecimalsCell className="tableCell-right" data={tableData} />}
            />
        </Table>
    )
}

FixedDataTable2.propTypes = {
    data: PropTypes.array.isRequired,
    setCurrentTab: PropTypes.func.isRequired, 
    setClickedRow: PropTypes.func.isRequired
};

export default FixedDataTable2; 