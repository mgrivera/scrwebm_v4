
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';

import lodash from 'lodash';

import './styles.css';
import 'fixed-data-table-2/dist/fixed-data-table.min.css';

import { Table, Column } from 'fixed-data-table-2';

import { TextCell, SortHeaderCell, Number2DecimalsCell, DateTimeCell, DateCellNotSoShort } from '/client/imports/genericReactComponents/FixedDataTable_TableCells';

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

function FixedDataTable2({ data, handleClickedRow }) {

    const [sortKeys, setSortKeys] = useState([]);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        // si había un sort antes de hacer el paging, intentamos mantenerlo 
        const data2 = data.map(x => ({ 
            _id: x._id, 
            itemId: x.itemId,

            fecha: x.fecha, 
            compania: x.compania,
            moneda: x.moneda,

            origen: x.origen,
            codigo: x.codigo,
            referencia: x.referencia,
            numero: x.numero,

            ramo: x.ramo,
            asegurado: x.asegurado,

            monto: x.monto,

            usuario: x.usuario,
            ingreso: x.ingreso,
            ultUsuario: x.ultUsuario,
            ultAct: x.ultAct
        })); 

        const items = sortKeys.length ? applySort(data2.slice(), sortKeys) : data2.slice();
        setTableData(items);
    }, [data])

    const handleRowClick = (e, index) => {
        // mostramos el item en el tab 2
        const clickedItem = tableData[index];
        handleClickedRow(clickedItem);
    }

    // Render the UI for your table
    return (
        <Table
            rowHeight={30}
            rowsCount={tableData.length}
            headerHeight={30}
            width={1000}
            height={350}
            onRowClick={handleRowClick}
        >
            <Column
                columnKey="compania"
                align="left"
                header={
                    <SortHeaderCell
                        columnKey="compania"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Compañía
                    </SortHeaderCell>
                }
                width={120}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="moneda"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="moneda"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Mon
                    </SortHeaderCell>
                }
                width={50}
                cell={<TextCell className="tableCell-center" data={tableData} />}
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
                width={110}
                cell={<DateCellNotSoShort className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="origen"
                align="left"
                header={
                    <SortHeaderCell
                        columnKey="origen"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Origen
                    </SortHeaderCell>
                }
                width={120}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="codigo"
                align="left"
                header={
                    <SortHeaderCell
                        columnKey="codigo"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Codigo
                    </SortHeaderCell>
                }
                width={170}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="referencia"
                align="left"
                header={
                    <SortHeaderCell
                        columnKey="referencia"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Referencia
                    </SortHeaderCell>
                }
                width={120}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="numero"
                align="left"
                header={
                    <SortHeaderCell
                        columnKey="numero"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Número
                    </SortHeaderCell>
                }
                width={75}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="ramo"
                align="left"
                header={
                    <SortHeaderCell
                        columnKey="ramo"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Ramo
                    </SortHeaderCell>
                }
                width={120}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="asegurado"
                align="left"
                header={
                    <SortHeaderCell
                        columnKey="asegurado"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Asegurado
                    </SortHeaderCell>
                }
                width={120}
                cell={<TextCell className="tableCell-left" data={tableData} />}
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
            <Column
                columnKey="usuario"
                align="left"
                fixed={false}
                header={
                    <SortHeaderCell
                        columnKey="usuario"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Usuario
                    </SortHeaderCell>
                }
                width={120}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="ingreso"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="ingreso"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Ingreso
                    </SortHeaderCell>
                }
                width={120}
                cell={<DateTimeCell className="tableCell-center" data={tableData} />}
            />
            <Column
                columnKey="ultUsuario"
                align="left"
                fixed={false}
                header={
                    <SortHeaderCell
                        columnKey="ultUsuario"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-left"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Ult usuario
                    </SortHeaderCell>
                }
                width={120}
                cell={<TextCell className="tableCell-left" data={tableData} />}
            />
            <Column
                columnKey="ultAct"
                align="center"
                header={
                    <SortHeaderCell
                        columnKey="ultAct"
                        sortKeys={sortKeys}
                        setSortKeys={setSortKeys}
                        className="tableColHeader-center"
                        data={tableData}
                        setTableData={setTableData}
                        applySort={applySort}>
                        Ult actualización
                    </SortHeaderCell>
                }
                width={120}
                cell={<DateTimeCell className="tableCell-center" data={tableData} />}
            />
        </Table>
    )
}

FixedDataTable2.propTypes = {
    data: PropTypes.array.isRequired,
    handleClickedRow: PropTypes.func.isRequired
};

export default FixedDataTable2; 