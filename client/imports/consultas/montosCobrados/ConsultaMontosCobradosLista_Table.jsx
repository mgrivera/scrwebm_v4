
import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';

import lodash from 'lodash';

import './styles.css';
import 'fixed-data-table-2/dist/fixed-data-table.min.css';

import { Table, Column, ColumnGroup, Cell } from 'fixed-data-table-2';

import { TextCell, SortHeaderCell, DateCellShort, Number2DecimalsCell, BooleanCell } from '/client/imports/genericReactComponents/FixedDataTable_TableCells';

// este es el default sort de la tabla que mostramos al usuario; la idea es que podamos aplicarlo cuando el 
// usuario hace click repetidas veces para ordenar por alguna columna en la lista; primero aplicamos un sort 
// asc, luego desc y, finalmente, usamos el default sort para restablecer el sort inicial de la tabla 
const defaultSort = [
    { key: 'monedaPago.simbolo', sortDir: 'asc' }, 
    { key: 'compania.abreviatura', sortDir: 'asc' }, 
    { key: 'ramo.abreviatura', sortDir: 'asc' }, 
    { key: 'source.origen', sortDir: 'asc' }, 
    { key: 'source.numero', sortDir: 'asc' }
];

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
    const [fixedDataTableDimensions, setFixedDataTableDimensions] = useState({ width: 700, height: 350 }); 

    // para obtener el width del parent div del fixed-data-table y usarlo como width del table 
    const parentRef = useRef(null);

    // --------------------------------------------------------------------------------------------------------------
    // obtenemos el width del parent element del fixed-data-table; la idea es usarlo como width del table 
    let parentHeight = null;
    let parentWidth = null;

    const parentRef_height = parentRef && parentRef.current && parentRef.current.offsetHeight ? parentRef.current.offsetHeight : null; 
    const parentRef_width = parentRef && parentRef.current && parentRef.current.offsetWidth ? parentRef.current.offsetWidth : null; 

    useEffect(() => {
        if (parentRef.current) {
            parentHeight = parentRef.current.offsetHeight;
            parentWidth = parentRef.current.offsetWidth;

            parentHeight -= 10; 
            parentWidth -= 10; 

            setFixedDataTableDimensions({ width: parentWidth, height: parentHeight });
            console.log(JSON.stringify(fixedDataTableDimensions))
        }
    }, [parentRef_height, parentRef_width]);

    useEffect(() => {
        // si había un sort antes de hacer el paging, intentamos mantenerlo 
        const data2 = data.map(x => ({
            monedaSimbolo: x.monedaPago.simbolo, 
            companiaAbreviatura: x.compania.abreviatura, 
            ramoAbreviatura: x.ramo.abreviatura, 
            aseguradoAbreviatura: x.asegurado.abreviatura, 
            sourceOrigen: x.source.origen, 
            sourceNumero: x.source.numero, 
            numero: x.numero, 
            cantidad: x.cantidad, 
            cuotaNumero: `${x.numero.toString()}/${x.cantidad.toString()}`, 
            fecha: x.fecha, 
            fechaVencimiento: x.fechaVencimiento, 
            remesaNumero: x.pago.remesaNumero, 
            remesaFecha: x.pago.fecha, 
            monto: x.monto, 
            montoCobrado: x.pago.monto, 
            completo: x.pago.completo
        })); 

        const items = sortKeys.length ? applySort(data2.slice(), sortKeys) : data2.slice();
        setTableData(items);
    }, [data])

    // Render the UI for your table
    // < div ref = { parentRef } style = {{ border: '1px solid lightgrey', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
    // </div >     

    return (
        <div ref={parentRef} style={{ border: '1px solid lightgrey', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>

            <div style={{ backGround: 'orange', flex: '1' }}>
                <Table
                    groupHeaderHeight={30}
                    rowHeight={30}
                    rowsCount={tableData.length}
                    headerHeight={30}
                    width={fixedDataTableDimensions.width}
                    height={350}
                >
                    <ColumnGroup header={<Cell className="tableGroupHeader">&nbsp;</Cell>} align="center">
                        <Column
                            columnKey="monedaSimbolo"
                            align="center"
                            fixed={true}
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
                            cell={<TextCell className="tableCell-center" data={tableData} />}
                            width={60}
                        />
                        <Column
                            columnKey="companiaAbreviatura"
                            align="left"
                            fixed={true}
                            header={
                                <SortHeaderCell
                                    columnKey="companiaAbreviatura"
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
                            columnKey="ramoAbreviatura"
                            align="left"
                            header={
                                <SortHeaderCell
                                    columnKey="ramoAbreviatura"
                                    sortKeys={sortKeys}
                                    setSortKeys={setSortKeys}
                                    className="tableColHeader-left"
                                    data={tableData}
                                    setTableData={setTableData}
                                    applySort={applySort}>
                                    Ramo
                                </SortHeaderCell>
                            }
                            width={100}
                            cell={<TextCell className="tableCell-left" data={tableData} />}
                        />
                    </ColumnGroup>

                    <ColumnGroup header={<Cell className="tableGroupHeader">Origen</Cell>} align="center">
                        <Column
                            columnKey="sourceOrigen"
                            align="center"
                            header={
                                <SortHeaderCell
                                    columnKey="sourceOrigen"
                                    sortKeys={sortKeys}
                                    setSortKeys={setSortKeys}
                                    className="tableColHeader-center"
                                    data={tableData}
                                    setTableData={setTableData}
                                    applySort={applySort}>
                                    Negocio
                                </SortHeaderCell>
                            }
                            width={80}
                            cell={<TextCell className="tableCell-center" data={tableData} />}
                        />
                        <Column
                            columnKey="sourceNumero"
                            align="center"
                            header={
                                <SortHeaderCell
                                    columnKey="sourceNumero"
                                    sortKeys={sortKeys}
                                    setSortKeys={setSortKeys}
                                    className="tableColHeader-center"
                                    data={tableData}
                                    setTableData={setTableData}
                                    applySort={applySort}>
                                    ##
                                </SortHeaderCell>
                            }
                            width={80}
                            cell={<TextCell className="tableCell-center" data={tableData} />}
                        />
                    </ColumnGroup>

                    <ColumnGroup header={<Cell className="tableGroupHeader">&nbsp;</Cell>} align="center">
                        <Column
                            columnKey="aseguradoAbreviatura"
                            align="left"
                            header={
                                <SortHeaderCell
                                    columnKey="aseguradoAbreviatura"
                                    sortKeys={sortKeys}
                                    setSortKeys={setSortKeys}
                                    className="tableColHeader-left"
                                    data={tableData}
                                    setTableData={setTableData}
                                    applySort={applySort}>
                                    Asegurado
                                </SortHeaderCell>
                            }
                            width={100}
                            cell={<TextCell className="tableCell-left" data={tableData} />}
                        />
                    </ColumnGroup>

                    <ColumnGroup header={<Cell className="tableGroupHeader">Cuota</Cell>} align="center">
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
                            columnKey="cuotaNumero"
                            align="center"
                            header={
                                <SortHeaderCell
                                    columnKey="cuotaNumero"
                                    sortKeys={sortKeys}
                                    setSortKeys={setSortKeys}
                                    className="tableColHeader-center"
                                    data={tableData}
                                    setTableData={setTableData}
                                    applySort={applySort}>
                                    ##
                                </SortHeaderCell>
                            }
                            width={60}
                            cell={<TextCell className="tableCell-center" data={tableData} />}
                        />
                    </ColumnGroup>

                    <ColumnGroup header={<Cell className="tableGroupHeader">Remesa</Cell>} align="center">
                        <Column
                            columnKey="remesaNumero"
                            align="center"
                            header={
                                <SortHeaderCell
                                    columnKey="remesaNumero"
                                    sortKeys={sortKeys}
                                    setSortKeys={setSortKeys}
                                    className="tableColHeader-center"
                                    data={tableData}
                                    setTableData={setTableData}
                                    applySort={applySort}>
                                    Número
                                </SortHeaderCell>
                            }
                            width={100}
                            cell={<TextCell className="tableCell-center" data={tableData} />}
                        />
                        <Column
                            columnKey="remesaFecha"
                            align="center"
                            header={
                                <SortHeaderCell
                                    columnKey="remesaFecha"
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
                    </ColumnGroup>

                    <ColumnGroup header={<Cell className="tableGroupHeader">Montos</Cell>} align="center">
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
                                    Emitido
                                </SortHeaderCell>
                            }
                            width={120}
                            cell={<Number2DecimalsCell className="tableCell-right" data={tableData} />}
                        />
                        <Column
                            columnKey="montoCobrado"
                            align="right"
                            header={
                                <SortHeaderCell
                                    columnKey="montoCobrado"
                                    sortKeys={sortKeys}
                                    setSortKeys={setSortKeys}
                                    className="tableColHeader-right"
                                    data={tableData}
                                    setTableData={setTableData}
                                    applySort={applySort}>
                                    Cobrado
                                </SortHeaderCell>
                            }
                            width={120}
                            cell={<Number2DecimalsCell className="tableCell-right" data={tableData} />}
                        />
                        <Column
                            columnKey="completo"
                            align="center"
                            header={
                                <SortHeaderCell
                                    columnKey="completo"
                                    sortKeys={sortKeys}
                                    setSortKeys={setSortKeys}
                                    className="tableColHeader-center"
                                    data={tableData}
                                    setTableData={setTableData}
                                    applySort={applySort}>
                                    Completo
                                </SortHeaderCell>
                            }
                            width={100}
                            cell={<BooleanCell className="tableCell-center" data={tableData} />}
                        />
                    </ColumnGroup>
                </Table> 
            </div>
        </div>      
    )
}

FixedDataTable2.propTypes = {
    data: PropTypes.array.isRequired,
};

export default FixedDataTable2; 