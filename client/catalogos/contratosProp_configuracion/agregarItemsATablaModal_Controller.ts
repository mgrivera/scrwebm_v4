

import * as angular from 'angular'; 
import * as lodash from 'lodash';

import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 
import { TiposContrato } from 'imports/collections/catalogos/tiposContrato'; 

import { DialogModal } from '../../imports/generales/angularGenericModal'; 

angular.module("scrwebm").controller('AgregarItemsATablaModal_Controller',
['$scope', '$modalInstance', '$modal', 'codigoContrato', 'tablaConfiguracion', 'ciaSeleccionada',
function ($scope, $modalInstance, $modal, codigoContrato, tablaConfiguracion, ciaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = ciaSeleccionada;

    // leemos los catálogos en el $scope
    $scope.monedas = Monedas.find().fetch();
    $scope.companias = Companias.find().fetch();
    $scope.ramos = Ramos.find().fetch();
    $scope.tiposContrato = TiposContrato.find().fetch();

    // construimos una lista con los años que van desde el 2.000 hasta tres años por encima del actual. 
    let listaAnos = []; 
    let anoActual = new Date().getFullYear(); 
    for (let i = (anoActual + 3); i >= 2000; i--) { 
        listaAnos.push({ ano: i } as never); 
    }

    $scope.listaAnos = listaAnos; 

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    let uiGridApi = null;

    $scope.datosItemSeleccionado = ""; 

    // para registrar el sort que el usuario aplica a la lista. Este sort debe ser usado en la function propagar, para que los datos se 
    // propaguen manteniendo este orden que el usuario ha aplicado ... 
    let gridSort = []; 
    let itemSeleccionado = {} as any; 

    $scope.registrosConfiguracion_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {
            uiGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                if (row.isSelected) { 
                    itemSeleccionado = row.entity;

                    // mostramos los detalles del item seleccionado ... 
                    let compania = Companias.findOne(itemSeleccionado.compania); 
                    let moneda = Monedas.findOne(itemSeleccionado.moneda); 
                    let ramo = Ramos.findOne(itemSeleccionado.ramo); 
                    let tipo =  TiposContrato.findOne(itemSeleccionado.tipo); 

                    let compania2 = compania.nosotros ? (`${compania.abreviatura} (Nosotros)`) : compania.abreviatura; 

                    itemSeleccionado = `${compania2} - ${itemSeleccionado.ano.toString()} - ${moneda.simbolo} - ${ramo.abreviatura} - ${tipo.abreviatura}`;
                    $scope.datosItemSeleccionado = itemSeleccionado;  
                }
                else { 
                    return;
                }  
            })
            // marcamos el item como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    if (!rowEntity.docState)
                        rowEntity.docState = 2;
            }) 

            gridApi.core.on.sortChanged( $scope, function(grid, sortColumns){

                // sortColumns is an array containing just the column sorted in the grid
                var name = sortColumns[0].name; // the name of the first column sorted
                var direction = sortColumns[0].sort.direction // the direction of the first column sorted: "desc" or "asc"
      
                // Your logic to do the server sorting
                gridSort.length = 0; 

                for (let item of sortColumns) { 
                    let item2 = { name: item.name, direction: item.sort.direction, }; 
                    gridSort.push(item2 as never); 
                }
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        },
    };

    $scope.registrosConfiguracion_ui_grid.columnDefs = [
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,
            cellFilter: 'companiaAbreviaturaFilter',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'nosotros',
            field: 'nosotros',
            displayName: 'Nosotros',
            width: 80,
            cellFilter: 'boolFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'boolean'
        },
        {
            name: 'ano',
            field: 'ano',
            displayName: 'Año',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 60,
            cellFilter: 'monedaSimboloFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'ramo',
            field: 'ramo',
            displayName: 'Ramo',
            width: 100,
            cellFilter: 'ramoAbreviaturaFilter',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            cellFilter: 'tipoContratoAbreviaturaFilter',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'ordenPorc',
            field: 'ordenPorc',
            displayName: 'Orden (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'comisionPorc',
            field: 'comisionPorc',
            displayName: 'Com (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'imp1Porc',
            field: 'imp1Porc',
            displayName: 'Imp1 (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'imp2Porc',
            field: 'imp2Porc',
            displayName: 'Imp2 (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'imp3Porc',
            field: 'imp3Porc',
            displayName: 'Imp3 (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'corretajePorc',
            field: 'corretajePorc',
            displayName: 'Corr (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ];

    $scope.deleteItem = (entity) => {
        if (entity) {
            lodash.remove(registrosConfiguracionArray, (x: any) => { return x._id === entity._id; });
        }
    }


    $scope.submitted = false;
    let registrosConfiguracionArray = [];
    let registroConfiguracionItem = {};

    $scope.parametrosConfiguracionForm_submit = () => {
        $scope.submitted = true;

        $scope.alerts.length = 0;

        if (!$scope.parametros) {

            let message = `Error: Ud. debe indicar los valores (parámetros) requeridos (año, compañía, moneda, ramo, ...) para la construcción de
                           los <em>registros de configuración</em> del año para el contrato.`; 
            
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);
            return;
        }


        if ($scope.parametrosConfiguracionForm.$valid) {
            $scope.submitted = false;
            $scope.parametrosConfiguracionForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            // creamos un array de compañías, para agregar 'nosotros' y 'abreviatura' a cada compañía (_id);
            // la idea es que luego podamos hacer un sort por estos valores
            let companiasArray = [];

            $scope.parametros.companias.forEach((c) => {
                let companiaItem = lodash.find($scope.companias, (x) => { return x._id === c; });

                companiasArray.push({
                    _id: c,
                    nosotros: companiaItem.nosotros,
                    abreviatura: companiaItem.abreviatura,
                    nombre: companiaItem.nombre,
                } as never);
            })

            // el usuario debió haber seleccionado la compañía 'nosotros'
            let companiaNosotros = lodash.some(companiasArray, (x: any) => { return x.nosotros; });
            if (!companiaNosotros) {
                let message = `Error: Ud. debe seleccionar, en la lista de compañías, la que corresponde a
                <em><b>nosotros</b></em>. Esa es, justamente, nuestra compañía y debe ser
                seleccionada para representar nuestra participación en el contrato.
                `; 
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);
                return;
            }

            // con los valores seleccionados, construimos un array que será mostrado en el ui-grid
            registrosConfiguracionArray = [];

            // ordenamos las compañías por: nosotros y nombre; la idea es que se muestre primero nuestra
            // compañía y luego el resto, ordenadas por su nombre ...
           
            lodash.orderBy(companiasArray, ['nosotros', 'abreviatura'], ['desc', 'asc']).forEach((compania: any) => {
                $scope.parametros.anos.forEach((ano) => { 
                    $scope.parametros.monedas.forEach((moneda) => {
                        $scope.parametros.ramos.forEach((ramo) => {
                            $scope.parametros.tipos.forEach((tipo) => {

                                registroConfiguracionItem = {};

                                registroConfiguracionItem = {
                                    _id: new Mongo.ObjectID()._str,
                                    compania: compania._id,
                                    nosotros: compania.nosotros,
                                    ano: ano,
                                    moneda: moneda,
                                    ramo: ramo,
                                    tipo: tipo,
                                    ordenPorc: null,
                                    comisionPorc: null,
                                    imp1Porc: null,
                                    imp2Porc: null,
                                    imp3Porc: null,
                                    corretajePorc: null,
                                };

                                registrosConfiguracionArray.push(registroConfiguracionItem as never);
                            })
                        })
                    })
                })
            })


            $scope.registrosConfiguracion_ui_grid.data = [];
            $scope.registrosConfiguracion_ui_grid.data = registrosConfiguracionArray;

            let message = `Ok, los registros de configuración para el año y el contrato han sido construídos.<br />
            Ahora Ud. puede indicar los valores apropiados para cada uno.<br /><br />
            Para <em><b>propagar</b></em> los valores indicados a otros registros,
            haga un <em>click</em> en <em>Propagar</em>.
           `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);
        }
    }


    $scope.PropagarCifras = () => {
        // recorremos el array de valores de configuración y 'propagamos' sus cifras; ésto es: dado un valor por el
        // usario para un campo, ejemplo comisionPorc, lo asignamos hacia abajo mientras no exista otro valor ...
        let ordenPorc_anterior = null;
        let comPorc_anterior = null;
        let imp1Porc_anterior = null;
        let imp2Porc_anterior = null;
        let imp3Porc_anterior = null;
        let corrPorc_anterior = null;

        // si el usuario ha aplicado un sort en la lista, lo usamos. La idea es propagar usando el sort que el usuario ha aplicado ... 
        let itemsOrderedArray = []; 

        if (Array.isArray(gridSort) && gridSort.length) { 
            // para ordenar con lodash, creamos dos arrays, uno con los nombres y otro con la dirección del sort 
            let names = []; 
            let directions = []; 

            let sortItem: any; 
            for (sortItem of gridSort) { 
                names.push(sortItem.name as never); 
                directions.push(sortItem.direction as never); 
            }

            // usamos lodash para ordenar por el mismo criterio que indicó el usuario en la lista 
            // (cuando el usuario aplica un sort a la lista, ui-grid, el mismo no se aplica al array original)
            itemsOrderedArray = lodash.orderBy(registrosConfiguracionArray, names, directions); 

        } else { 
            itemsOrderedArray = lodash.clone(registrosConfiguracionArray); 
        }

        itemsOrderedArray.forEach((x: any) => {

            if (!lodash.isFinite(x.ordenPorc)) {
                // lodash.isFinite incluye cualquier número, incluso el cero
                x.ordenPorc = ordenPorc_anterior;
            } else {
                ordenPorc_anterior = x.ordenPorc;
            }

            if (!lodash.isFinite(x.comisionPorc)) {
                x.comisionPorc = comPorc_anterior;
            } else {
                comPorc_anterior = x.comisionPorc;
            }

            if (!lodash.isFinite(x.imp1Porc)) {
                x.imp1Porc = imp1Porc_anterior;
            } else {
                imp1Porc_anterior = x.imp1Porc;
            }

            if (!lodash.isFinite(x.imp2Porc)) {
                x.imp2Porc = imp2Porc_anterior;
            } else {
                imp2Porc_anterior = x.imp2Porc;
            }

            if (!lodash.isFinite(x.imp3Porc)) {
                x.imp3Porc = imp3Porc_anterior;
            } else {
                imp3Porc_anterior = x.imp3Porc;
            }

            if (!lodash.isFinite(x.corretajePorc)) {
                x.corretajePorc = corrPorc_anterior;
            } else {
                corrPorc_anterior = x.corretajePorc;
            }
        })

        // ahora que hicimos el Propagar en el array ordenado, lo pasamos al array original que mostramo en la lista ... 
        registrosConfiguracionArray.length = 0; 
        itemsOrderedArray.forEach((x) => { registrosConfiguracionArray.push(x); }); 

        $scope.registrosConfiguracion_ui_grid.data = [];
        $scope.registrosConfiguracion_ui_grid.data = registrosConfiguracionArray;
    }


    $scope.AgregarRegistrosDeConfiguracion = () => {
        // finalmente, cuando el usuario ejecuta esta función, agregamos estos registros a la tabla de configuración
        let message = `Los registros que Ud. ha construido serán agregados a la
        <em><b>tabla de configuración</b></em> definitiva.<br /><br />
        Estos registros, aunque agregados, no serán permanentes. Ud. deberá hacer un
        <em>click</em> en <em>Grabar</em> para grabar los registros agregados a la
        base de datos. <br /><br />
        Desea continuar y agregar estos registros a la tabla de configuracion?
        `; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        DialogModal($modal, "<em>Contratos - Configuración</em>", message, true).then(
                                () => {
                                    // Ok, vamos a agregar los registros a la tabla de configuración ...
                                    let cantidadRegistrosAgregados = 0;

                                    lodash(registrosConfiguracionArray).sortBy(['ano', 'nosotros', 'compania', 'moneda', 'ramo', 'tipo'], ['asc', 'desc', 'asc', 'asc', 'asc', 'asc']).forEach((x: any) => {

                                        let itemConfiguracion = {
                                            _id: new Mongo.ObjectID()._str,
                                            codigo: codigoContrato,

                                            ano: x.ano,
                                            moneda: x.moneda,
                                            ramo: x.ramo,
                                            tipoContrato: x.tipo,
                                            compania: x.compania,
                                            nosotros: x.nosotros,
                                            ordenPorc: x.ordenPorc,
                                            comisionPorc: x.comisionPorc,
                                            imp1Porc: x.imp1Porc,
                                            imp2Porc: x.imp2Porc,
                                            imp3Porc: x.imp3Porc,
                                            corretajePorc: x.corretajePorc,

                                            cia: ciaSeleccionada._id,
                                            docState: 1,
                                        };

                                        tablaConfiguracion.push(itemConfiguracion);
                                        cantidadRegistrosAgregados++;
                                    })

                                    let message = `Ok, los registros de configuración han sido agregados a la tabla.<br />
                                    En total, <b>${cantidadRegistrosAgregados.toString()}</b> registros
                                    han sido agregados.<br /><br />
                                    Recuerde que Ud. debe cerrar este diálogo y
                                    hacer un <em>click</em> en <em>Grabar</em> para que los registros sean
                                    efectivamente registrados en la base de datos.
                                    `; 
                                    message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
                                    DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);
                                },
                                () => {
                                    return;
                                }
                            );
    }
}
]);
