
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';

import lodash from 'lodash';

import './styles.css';
import 'fixed-data-table-2/dist/fixed-data-table.min.css';

import { Table, Column } from 'fixed-data-table-2';

import { TextCell, SortHeaderCell, BooleanCell, DateCell } from '/client/imports/genericReactComponents/FixedDataTable_TableCells';

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

function FixedDataTable2({ data, setClickedRow, setCurrentTab }) {

    const [sortKeys, setSortKeys] = useState([]);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        // si había un sort antes de hacer el paging, intentamos mantenerlo 
        const data2 = data.map(x => ({ 
            _id: x._id, 
            username: x.username, 
            email: x.emails && x.emails.length && x.emails[0].address ? x.emails[0].address : 'indefinido', 
            verified: x.emails && x.emails.length && x.emails[0].verified ? x.emails[0].verified : false, 
            createdAt: x.createdAt
        })); 

        const items = sortKeys.length ? applySort(data2.slice(), sortKeys) : data2.slice();
        setTableData(items);
    }, [data])

    const handleRowClick = (e, index) => {
        // mostramos el item en el tab 2
        const clickedItem = tableData[index];
        setClickedRow(clickedItem);
        setCurrentTab(2);
    }

    // Render the UI for your table
    return (
        <Table
            rowHeight={30}
            rowsCount={tableData.length}
            headerHeight={30}
            width={850}
            height={350}
            onRowClick={handleRowClick}
        >
            <Column
                columnKey="_id"
                align="left"
                fixed={true}
                header={
                    <SortHeaderCell
                        columnKey="_id"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        _id
                    </SortHeaderCell>
                }
                cell={<TextCell className="tableCell-left" data={tableData} />}
                width={200}
            />
            <Column
                columnKey="username"
                align="left"
                fixed={true}
                header={
                    <SortHeaderCell
                        columnKey="username"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Nombre
                    </SortHeaderCell>
                }
                width={120}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="email"
                align="left"
                header={
                    <SortHeaderCell
                        columnKey="email"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Email
                    </SortHeaderCell>
                }
                width={250}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="verified"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="verified"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Verificado?
                    </SortHeaderCell>
                }
                width={120}
                cell={<BooleanCell className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="createdAt"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="createdAt"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Creado el
                    </SortHeaderCell>
                }
                width={120}
                cell={<DateCell className="tableCell-center" data={tableData} />}
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