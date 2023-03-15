
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';

import lodash from 'lodash';

import '../styles.css';
import 'fixed-data-table-2/dist/fixed-data-table.min.css';

import { Table, Column } from 'fixed-data-table-2';

import { TextCell, SortHeaderCell, Number2DecimalsCell, DateCellShort, DocStateCell } from '/client/imports/genericReactComponents/FixedDataTable_TableCells';

// este es el default sort de la tabla que mostramos al usuario; la idea es que podamos aplicarlo cuando el 
// usuario hace click repetidas veces para ordenar por alguna columna en la lista; primero aplicamos un sort 
// asc, luego desc y, finalmente, usamos el default sort para restablecer el sort inicial de la tabla 
const defaultSort = [{ key: 'companiaNombre', sortDir: 'asc' }, { key: 'numero', sortDir: 'asc' }];

function applySort(data, sortKeys) {

    // lodash necesita dos arrays para hacer el orderBy; uno con los keys y otro con los directions 

    // cuando el usuario elimina el sort (con un tercer click), usamos el default 
    const keysArray = sortKeys.length ? sortKeys : defaultSort;

    const keys = keysArray.map(x => x.key);
    const sortDirs = keysArray.map(x => x.sortDir);

    return lodash.orderBy(data, keys, sortDirs);
}

function FixedDataTable2({ data }) {

    const [sortKeys, setSortKeys] = useState([]);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        // si había un sort antes de hacer el paging, intentamos mantenerlo 
        const data2 = data.map(x => {
            const item = {
                _id: x._id,
                companiaNombre: x.companiaNombre, 
                monedaSimbolo: x.monedaSimbolo,
                monedaNombre: x.monedaSimbolo, 
                numero: x.numero,
                cantidad: x.cantidad,
                fechaEmision: x.fechaEmision,
                fecha: x.fecha,

                diasVencimiento: x.diasVencimiento,
                fechaVencimiento: x.fechaVencimiento,
                montoOriginal: x.montoOriginal,
                factor: x.factor,
                monto: x.monto
            }; 

            if (x.docState) { 
                item.docState = x.docState; 
            }

            return item; 
        });

        const items = sortKeys.length ? applySort(data2.slice(), sortKeys) : data2.slice();
        setTableData(items);
    }, [data])

    // Render the UI for your table
    return (
        <Table
            rowHeight={30}
            rowsCount={tableData.length}
            headerHeight={30}
            width={750}
            height={250}
        >
            <Column
                columnKey="docState"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="docState"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        &nbsp; 
                    </SortHeaderCell>
                }
                width={35}
                cell={<DocStateCell className="tableCell-center" data={tableData} />}
            />
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
                width={100}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="monedaSimbolo"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="monedaSimbolo"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Mon
                    </SortHeaderCell>
                }
                width={65}
                cell={<TextCell className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="numero"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="numero"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        ##
                    </SortHeaderCell>
                }
                width={50}
                cell={<TextCell className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="cantidad"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="cantidad"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Cant
                    </SortHeaderCell>
                }
                width={50}
                cell={<TextCell className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="fechaEmision"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="fechaEmision"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        F emisión
                    </SortHeaderCell>
                }
                width={80}
                cell={<DateCellShort className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="fecha"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="fecha"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Fecha
                    </SortHeaderCell>
                }
                width={80}
                cell={<DateCellShort className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="diasVencimiento"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="diasVencimiento"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Días venc
                    </SortHeaderCell>
                }
                width={50}
                cell={<TextCell className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="fechaVencimiento"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="fechaVencimiento"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        F venc
                    </SortHeaderCell>
                }
                width={80}
                cell={<DateCellShort className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="montoOriginal"
                align="right"
                header={
                    <SortHeaderCell
                        columnKey="montoOriginal"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-right"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Monto original
                    </SortHeaderCell>
                }
                width={120}
                cell={<Number2DecimalsCell className="tableCell-right" data={tableData} />}
            />
            <Column
                columnKey="factor"
                align="right"
                header={
                    <SortHeaderCell
                        columnKey="factor"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-right"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Factor
                    </SortHeaderCell>
                }
                width={60}
                cell={<Number2DecimalsCell className="tableCell-right" data={tableData} />}
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
    data: PropTypes.array.isRequired
};

export default FixedDataTable2; 