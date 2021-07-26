
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import lodash from 'lodash';
import numeral from 'numeral'; 
import angular from 'angular';

import Papa from 'papaparse';
import saveAs from 'save-as'

import { ContratosProp_Configuracion_Tablas } from '/imports/collections/catalogos/ContratosProp_Configuracion';

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '../methods/_methods/_methods'; 

angular.module("scrwebm").controller("Contrato_Cuentas_CuentasTecnicas_Controller", ['$scope', '$modal', 'uiGridConstants', '$q',
function ($scope, $modal, uiGridConstants, $q) {

    $scope.showProgress = false;

    $scope.contrato = $scope.$parent.$parent.contrato; 
    $scope.companiaSeleccionada = $scope.$parent.$parent.companiaSeleccionada; 
    $scope.definicionCuentaTecnicaSeleccionada = $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada; 
    $scope.definicionCuentaTecnicaSeleccionada_Info = $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada_Info;

    $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        enableFiltering: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2; 
                        $scope.$parent.$parent.dataHasBeenEdited = true; 
                    }
                }    
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        // nótese que usamos 'id', y no '_id', pues estos registros vienen de sql con un id único
        // (y nosotros no agregamos un _id mongo) ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
                    '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: marron; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableFiltering: false, 
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 60,
            cellFilter: 'monedaSimboloFilter',

            sortCellFiltered: true, 
            filterCellFiltered: true, 

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
            
            sortCellFiltered: true, 
            filterCellFiltered: true, 
 
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'tipoContrato',
            field: 'tipoContrato',
            displayName: 'Tipo',
            width: 100,
            cellFilter: 'tipoContratoAbreviaturaFilter',
            
            sortCellFiltered: true, 
            filterCellFiltered: true, 
 
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'serie',
            field: 'serie',
            displayName: 'Serie',
            width: 60,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'primas',
            field: 'primas',
            displayName: 'Primas',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'siniestros',
            field: 'siniestros',
            displayName: 'Siniestros',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem_resumenPrimasSiniestros(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false, 
            width: 25
        },
    ]

    $scope.deleteItem_resumenPrimasSiniestros = (entity) => {

        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.contratosProp_cuentas_resumen, (x) => { return x._id === entity._id; });
        } else { 
            const item = $scope.contratosProp_cuentas_resumen.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }
        }

        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data = [];
        $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data = 
                $scope.contratosProp_cuentas_resumen.filter(x => x.definicionID === definicionSeleccionadaID); 
        
                $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    $scope.leerTablaConfiguracion = () => {
        // contratos proporcionales: leemos la tabla de configuración y regresamos un resumen de las combinaciones
        // mon/ramo/tipo/serie, para que el usuario indique primas y siniestros para cada una ...

        const codigo = $scope.contrato.codigo;
        const contratoID = $scope.contrato._id; 
        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 
        const moneda = $scope.definicionCuentaTecnicaSeleccionada.moneda;
        const ano = $scope.contrato.desde.getFullYear();
        const ciaSeleccionadaID = $scope.companiaSeleccionada._id;

        Contratos_Methods.contratosProporcionales_leerTablaConfiguracion($q, codigo, moneda, ano, ciaSeleccionadaID).then(
            (result) => {
                // el método, aunque su ejecución haya sido correcta, puede reguresar un error ... 
                if (result.error) { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: result.message
                    });
                    return; 
                }

                // en la lista pueden haber items; agregamos *solo* los que no existen (mon/ram/tipo/serie) y dejamos los que 
                // existen ... 
                let yaExistian = 0; 
                let agregados = 0; 

                yaExistian = $scope.contratosProp_cuentas_resumen.filter(x => x.definicionID === definicionSeleccionadaID).length; 

                result.resumenPrimasSiniestros_array.forEach((x) => {

                    const existeEnLaLista = $scope.contratosProp_cuentas_resumen.find(y =>
                        y.definicionID === definicionSeleccionadaID && 
                        y.moneda === x.moneda && 
                        y.ramo === x.ramo && 
                        y.tipoContrato === x.tipo && 
                        y.serie === parseInt(x.serie)
                    )

                    if (!existeEnLaLista) { 
                        const resumenPrimaSiniestros_item = {
                            _id: new Mongo.ObjectID()._str,
                            contratoID: contratoID, 
                            definicionID: definicionSeleccionadaID,
                            moneda: x.moneda,
                            ramo: x.ramo,
                            tipoContrato: x.tipo,
                            serie: parseInt(x.serie),
                            primas: null,
                            siniestros: null,
                            docState: 1, 
                        }
    
                        $scope.contratosProp_cuentas_resumen.push(resumenPrimaSiniestros_item);
                        agregados++; 
                    }
                })

                $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data = [];
                $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data = 
                        $scope.contratosProp_cuentas_resumen.filter(x => x.definicionID === definicionSeleccionadaID); 

                $scope.$parent.$parent.dataHasBeenEdited = true; 

                $scope.$parent.alerts.length = 0;

                const message = `Resumen de primas y siniestros.<br /><br />
                                <b>${yaExistian.toString()}</b> registros ya existían. Fueron mantenidos.<br />
                                <b>${agregados.toString()}</b> registros faltaban. Fueron agregados.`; 

                DialogModal($modal, "<em>Contratos proporcionales</em>", message, false).then();
            },
            (error) => {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: error.message
                });
            }
        )
    }

    $scope.exportarMontosCSV = () => { 

        const items = $scope.contratosProp_cuentas_resumen.filter(x => x.definicionID === definicionSeleccionadaID);
        const result = exportarMontosCSV(items); 

        if (result.error) { 
            const message = `Error: ha ocurrido un error al intentar ejecutar esta función: <br /><br />
                             ${result.message} 
                            `; 
            DialogModal($modal, "<em>Contratos proporcionales</em>", message, false).then();
        }
    }

    $scope.importarMontosCSV = function () {
        // leemos algún riesgo que se haya exportado antes (con un Download) y lo agregamos como un riesgo nuevo ... 
        const inputFile = angular.element("#fileInput");
        if (inputFile) {
            inputFile.click();        // simulamos un click al input (file)
        }
    }

    $scope.downloadFile = function (files) {

        const userSelectedFile = files[0];

        if (!userSelectedFile) {
            DialogModal($modal, "<em>Contratos proporcionales - Importar resumen de primas y siniestros</em>",
                `Aparentemente, Ud. no ha seleccionado un archivo.<br />
                                 Ud. debe seleccionar un archivo que haya sido creado antes 
                                 mediante la opción <em>Exportar</em>, que existe en este mismo menú.`,
                false).then();

            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) {
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }

            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {

            // esta función importa (merge) el contenido del archivo, que es un json, al riesgo en el $scope ... 
            const textFileContent = (e.target.result);

            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) {
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            } 

            downloadFile2(textFileContent); 
        }

        reader.readAsText(userSelectedFile, "ISO-8859-1")
    }

    const downloadFile2 = (textFileContent) => {

        // usamos papaParse para convertir desde texto a json 
        const config = {
            delimiter: "\t",	       
            skipEmptyLines: 'greedy',
            header: true
        };

        const result = Papa.parse(textFileContent, config);
        const errors = result.errors;

        if (errors.length) {
            let message = `Se han encontrado errores al intentar leer el archivo con los registros para actualizar. <br /><br /><ul>`;

            errors.map(x => {
                message += `<li>${JSON.stringify(x)}</li>`;
            });

            message += `<ul>`

            DialogModal($modal, "<em>Contratos proporcionales - Importar resumen de primas y siniestros</em>", message, false).then();
            return;
        }

        const items = result.data.slice();
        
        const contratoID = $scope.contrato._id;
        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id;
        
        for (const item of items) {
            const resumenPrimaSiniestros_item = {
                _id: new Mongo.ObjectID()._str,
                contratoID: contratoID,
                definicionID: definicionSeleccionadaID,
                moneda: item.moneda,
                ramo: item.ramo,
                tipoContrato: item.tipoContrato,
                serie: item.serie ? parseInt(item.serie) : 0,
                primas: item.primas ? parseFloat(item.primas) : 0,
                siniestros: item.siniestros ? parseFloat(item.siniestros) : 0,
                docState: 1,
            }
            $scope.contratosProp_cuentas_resumen.push(resumenPrimaSiniestros_item);
        }

        $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data = [];
        $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data =
            $scope.contratosProp_cuentas_resumen.filter(x => x.definicionID === definicionSeleccionadaID);

        $scope.$parent.$parent.dataHasBeenEdited = true;

        $scope.$parent.alerts.length = 0;

        const message = `Resumen de primas y siniestros.<br /><br />
                         Ok, los registros que existen en el archivo que Ud. ha indicado, se han importado a la lista.
                        `;

        DialogModal($modal, "<em>Contratos proporcionales</em>", message, false).then();
    }

    // --------------------------------------------------------------------------------------
    // ui-grid para el registro de la distribución de primas y siniestros en las compañías
    // del contrato (ie: cifras detalladas *antes* de saldos) ...
    $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        enableFiltering: true, 
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                // actualizamos el docState en el item 
                if (!rowEntity.docState) {
                    rowEntity.docState = 2;
                }

                // actualizamos el docState en el contrato 
                if (newValue != oldValue) { 
                    if (!$scope.contrato.docState) {
                        $scope.contrato.docState = 2;
                        $scope.$parent.$parent.dataHasBeenEdited = true;
                    }    
                }
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        // nótese que usamos 'id', y no '_id', pues estos registros vienen de sql con un id único
        // (y nosotros no agregamos un _id mongo) ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
                    '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: marron; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableFiltering: false, 
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,
            cellFilter: 'companiaAbreviaturaFilter',

            sortCellFiltered: true, 
            filterCellFiltered: true, 
 
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
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',

            filter: {
                condition: ui_grid_filterBy_nosotros, 
            },

            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'boolean'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 70,
            cellFilter: 'monedaSimboloFilter',
            
            sortCellFiltered: true, 
            filterCellFiltered: true, 
 
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
            
            sortCellFiltered: true, 
            filterCellFiltered: true, 
 
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'tipoContrato',
            field: 'tipoContrato',
            displayName: 'Tipo',
            width: 100,
            cellFilter: 'tipoContratoAbreviaturaFilter',
            
            sortCellFiltered: true, 
            filterCellFiltered: true, 
 
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'serie',
            field: 'serie',
            displayName: 'Serie',
            width: 60,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'prima',
            field: 'prima',
            displayName: 'Primas',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'ordenPorc',
            field: 'ordenPorc',
            displayName: 'Orden %',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'primaBruta',
            field: 'primaBruta',
            displayName: 'Prima bruta',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'comisionPorc',
            field: 'comisionPorc',
            displayName: 'Com %',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'comision',
            field: 'comision',
            displayName: 'Comisión',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'imp1Porc',
            field: 'imp1Porc',
            displayName: 'Imp1 %',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'imp1',
            field: 'imp1',
            displayName: 'Imp1',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'imp2Porc',
            field: 'imp2Porc',
            displayName: 'Imp2 %',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'imp2',
            field: 'imp2',
            displayName: 'Imp2',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'imp3Porc',
            field: 'imp3Porc',
            displayName: 'Imp3 %',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'imp3',
            field: 'imp3',
            displayName: 'Imp3',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'primaNetaAntesCorretaje',
            field: 'primaNetaAntesCorretaje',
            displayName: 'Primas',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'corretajePorc',
            field: 'corretajePorc',
            displayName: 'Corr %',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'corretaje',
            field: 'corretaje',
            displayName: 'Corretaje',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'primaNeta',
            field: 'primaNeta',
            displayName: 'Prima neta',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'siniestros',
            field: 'siniestros',
            displayName: 'Siniestros',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'siniestros_suParte',
            field: 'siniestros_suParte',
            displayName: 'Su sntros',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'saldo',
            field: 'saldo',
            displayName: 'Saldo',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'resultadoTecnico',
            field: 'resultadoTecnico',
            displayName: 'Res técnico',
            cellFilter: 'currencyFilterAndNull',        
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem_distribucionPrimasSiniestros(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false, 
            width: 25
        },
    ]

    $scope.deleteItem_distribucionPrimasSiniestros = (entity) => {

        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.contratosProp_cuentas_distribucion, (x) => { return x._id === entity._id; });
        } else { 
            const item = $scope.contratosProp_cuentas_distribucion.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }
        }

        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid.data = [];
        $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid.data = 
                $scope.contratosProp_cuentas_distribucion.filter(x => x.definicionID === definicionSeleccionadaID); 
        
        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    $scope.distribuirMontosPrSinEnCompanias = () => {

        // suscribimos a la tabla de configuracion y efectuamos la distribucion en las compañías
        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 
        const codigo = $scope.contrato.codigo;
        const contratoID = $scope.contrato._id; 
        const moneda = $scope.definicionCuentaTecnicaSeleccionada.moneda;
        const ciaSeleccionadaID = $scope.companiaSeleccionada._id;

        const filtro = {
            codigo: codigo,
            moneda: moneda,
            // quitamos el año del filtro para que el código traiga cualquier seríe que el usuario haya incluído en la 
            // tabla de definición. Un contrato puede ser del 2.018, pero tener series muy posteriores; 
            // ej: 2019, 2020, 2021, 2022, ...
            // ano: { $lte: ano },
            cia: ciaSeleccionadaID,
        };

        $scope.showProgress = true;

        Meteor.subscribe('contratosProp.configuracion.tablas', JSON.stringify(filtro), () => {

            // eliminamos primero los registros que puedan existir en el array en el contrato ...
            $scope.contratosProp_cuentas_distribucion
                .filter(x => x.definicionID === definicionSeleccionadaID)
                .forEach((x) => { 
                    if (x.docState && x.docState === 1) { 
                        lodash.remove($scope.contratosProp_cuentas_distribucion, (y) => { return y._id === x._id; });
                    } else { 
                        $scope.contratosProp_cuentas_distribucion.find(y => y._id === x._id).docState = 3; 
                    }
                })

            // leemos en un array los registros en la tabla de configuración del contrato;
            // nótese que usamos el mismo filtro que usamos en el subscribe
            const tablaConfiguracion = ContratosProp_Configuracion_Tablas.find(filtro).fetch();

            // ahora leemos cada linea, con primas y siniestros, y distribuimos en la compañía particular ...
            $scope.contratosProp_cuentas_resumen.
                  filter((x) => { return x.definicionID === definicionSeleccionadaID; }).
                  filter((x) => { return x.primas || x.siniestros; }).
                  forEach((x) => {
                      // para cada item de primas y siniestros (para año, mon, ramo y tipo), leemos
                      // los registros que corresponden (1 por cada compañía del contrato) en la tabla
                      // de configuración
                      const config_array = lodash.filter(tablaConfiguracion, (t) => {
                          return t.codigo === codigo &&
                          t.moneda === x.moneda &&
                          t.ano === x.serie &&
                          t.cia === ciaSeleccionadaID &&
                          t.ramo === x.ramo &&
                          t.tipoContrato === x.tipoContrato;
                      });

                      config_array.forEach((config) => {
                          const distribucion = {
                              _id: new Mongo.ObjectID()._str,
                              contratoID: contratoID, 
                              definicionID: definicionSeleccionadaID,
                              compania: config.compania,
                              nosotros: config.nosotros,
                              moneda: config.moneda,
                              ramo: config.ramo,
                              tipoContrato: config.tipoContrato,
                              serie: config.ano,

                              prima: x.primas,
                              ordenPorc: config.ordenPorc,
                              comisionPorc: config.comisionPorc,
                              imp1Porc: config.imp1Porc,
                              imp2Porc: config.imp2Porc,
                              imp3Porc: config.imp3Porc,
                              corretajePorc: config.corretajePorc,
                              siniestros: x.siniestros ? x.siniestros : 0,
                              docState: 1, 
                          };

                          $scope.contratosProp_cuentas_distribucion.push(distribucion);
                      })
            })

            // asignamos signos a los montos principales (primas, siniestros, etc.), de acuerdo al tipo de compañía: 
            // nosotros/reaseguradores 
            $scope.contratosProp_cuentas_distribucion.
                filter((x) => { return x.definicionID === definicionSeleccionadaID; }).
                forEach((x) => {

                    let signo = 1; 
                    if (!x.nosotros) { signo = -1; }

                    x.prima = x.prima * signo;
                    x.siniestros = x.siniestros * -signo;
                })      

            // para mostrar las cifras determinadas en el ui-grid
            $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid.data = [];
            $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid.data = 
                    $scope.contratosProp_cuentas_distribucion.filter(x => x.definicionID === definicionSeleccionadaID); 


            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, los valores para la distribución de primas y siniestros en las compañías del contrato,
                      han sido leídos desde la <em>tabla de configuración del contrato</em>.
                     `
            });

            $scope.$parent.$parent.dataHasBeenEdited = true; 

            $scope.showProgress = false;
            $scope.$apply();
        })
    }

    $scope.distribuirMontosPrSinEnCompanias_calcular = () => {
        // calculamos las cifras para las compañías del contrato. Simplemente, recorremos el array de cifras por
        // compañía y calculamos cada cifra en base al porcentaje correspondiente ...

        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        const cifrasPorCompania_array = $scope.contratosProp_cuentas_distribucion.filter((x) => { return x.definicionID === definicionSeleccionadaID; });

        cifrasPorCompania_array.forEach((x) => {

            x.primaBruta = x.prima * x.ordenPorc / 100;
            x.comision = (x.primaBruta && x.comisionPorc) ? (x.primaBruta * x.comisionPorc / 100) * -1 : 0;
            x.imp1 = (x.primaBruta && x.imp1Porc) ? (x.primaBruta * x.imp1Porc / 100) * -1 : 0;
            x.imp2 = (x.primaBruta && x.imp2Porc) ? (x.primaBruta * x.imp2Porc / 100) * -1 : 0;
            x.imp3 = (x.primaBruta && x.imp3Porc) ? (x.primaBruta * x.imp3Porc / 100) * -1 : 0;

            x.primaNetaAntesCorretaje = x.primaBruta;
            x.primaNetaAntesCorretaje += x.comision ? x.comision : 0;
            x.primaNetaAntesCorretaje += x.imp1 ? x.imp1 : 0;
            x.primaNetaAntesCorretaje += x.imp2 ? x.imp2 : 0;
            x.primaNetaAntesCorretaje += x.imp3 ? x.imp3 : 0;

            x.corretaje = (x.primaBruta && x.corretajePorc) ? (x.primaBruta * x.corretajePorc / 100) * -1 : 0;

            x.primaNeta = x.primaNetaAntesCorretaje;
            x.primaNeta += x.corretaje ? x.corretaje : 0;

            x.siniestros_suParte = x.siniestros ? x.siniestros * x.ordenPorc / 100 : 0;

            x.saldo = 0;
            x.saldo += x.primaNeta ? x.primaNeta : 0;
            x.saldo += x.siniestros_suParte;

            x.resultadoTecnico = x.saldo + (x.corretaje ? -x.corretaje : 0);         // el corretaje es, normalmente, de signo contrario al saldo 

            if (!x.docState) { 
                x.docState = 2; 
            }
        })

        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    $scope.distribuirMontosPrSinEnCompanias_obtenerSaldosFinales = () => {

        // finalmente, recorremos el array de cifras y sumarizamos para obtener solo un registro para
        // cada compañía, el cual debe contener una sumarización de las cifras separadas por ramo, serie, etc.
        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 
        const contratoID = $scope.contrato._id; 

        const cifrasPorCompania_array = $scope.contratosProp_cuentas_distribucion
                                            .filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                                            .filter((x) => { return !(x.docState && x.docState === 3); })
                                            .filter((x) => { return x.saldo; });
                                        

        // eliminamos primero los registros que puedan existir en el array ...
        $scope.contratosProp_cuentas_saldos
            .filter(x => x.definicionID === definicionSeleccionadaID)
            .forEach((x) => { 
                if (x.docState && x.docState === 1) { 
                    lodash.remove($scope.contratosProp_cuentas_saldos, (y) => { return y._id === x._id; });
                } else { 
                    $scope.contratosProp_cuentas_saldos.find(y => y._id === x._id).docState = 3; 
                }
            })


        const saldosPorCompania_array = [];

        // nótese que basta con agrupar por compañía, pues solo existe una moneda en el array
        // agrupamos por compañía y creamos un item para cada una
        const sumArray = lodash.groupBy(cifrasPorCompania_array, (x) => { return x.compania + '-' + x.moneda + '-' + x.serie; });

        for (const key in sumArray) {

            const saldosArray = sumArray[key]; 

            const saldo = {
                _id: new Mongo.ObjectID()._str,
                contratoID: contratoID, 
                definicionID: definicionSeleccionadaID,
                compania: saldosArray[0].compania,
                nosotros: saldosArray[0].nosotros,
                moneda: saldosArray[0].moneda,
                serie: saldosArray[0].serie, 

                prima: lodash.sumBy(saldosArray, 'prima'),
                primaBruta: lodash.sumBy(saldosArray, 'primaBruta'),
                comision: lodash.sumBy(saldosArray, 'comision'),
                imp1: lodash.sumBy(saldosArray, 'imp1'),
                imp2: lodash.sumBy(saldosArray, 'imp2'),
                imp3: lodash.sumBy(saldosArray, 'imp3'),
                primaNetaAntesCorretaje: lodash.sumBy(saldosArray, 'primaNetaAntesCorretaje'),
                corretaje: lodash.sumBy(saldosArray, 'corretaje'),
                primaNeta: lodash.sumBy(saldosArray, 'primaNeta'),
                siniestros: lodash.sumBy(saldosArray, 'siniestros'),
                siniestros_suParte: lodash.sumBy(saldosArray, 'siniestros_suParte'),
                saldo: lodash.sumBy(saldosArray, 'saldo'),
                resultadoTecnico: lodash.sumBy(saldosArray, 'resultadoTecnico'),
                docState: 1, 
            };         // solo para que la instrucción que sigue compile en ts ... 
            
            saldosPorCompania_array.push(saldo);
        }   

        saldosPorCompania_array.forEach((x) => {
            $scope.contratosProp_cuentas_saldos.push(x);
        })

        // para mostrar las cifras determinadas en el ui-grid
        $scope.cuentasTecnicas_Saldos_ui_grid.data = [];
        $scope.cuentasTecnicas_Saldos_ui_grid.data = 
                $scope.contratosProp_cuentas_saldos.filter(x => x.definicionID === definicionSeleccionadaID); 

        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    // --------------------------------------------------------------------------------------
    // ui-grid para el registro de la distribución de primas y siniestros en las compañías
    // del contrato (ie: cifras detalladas *antes* de saldos) ...

    $scope.cuentasTecnicas_Saldos_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        enableFiltering: true, 
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                if (newValue != oldValue) { 
                    // actualizamos el docState en el item 
                    if (!rowEntity.docState) {
                        rowEntity.docState = 2;
                    } 

                    // actualizamos el docState en el contrato 
                    if (!$scope.contrato.docState) { 
                        $scope.contrato.docState = 2;
                        $scope.$parent.$parent.dataHasBeenEdited = true; 
                    }
                }         
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        // nótese que usamos 'id', y no '_id', pues estos registros vienen de sql con un id único
        // (y nosotros no agregamos un _id mongo) ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    };

    $scope.cuentasTecnicas_Saldos_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
                    '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: marron; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableFiltering: false, 
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,
            cellFilter: 'companiaAbreviaturaFilter',
            
            sortCellFiltered: true, 
            filterCellFiltered: true, 
 
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
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',

            filter: {
                condition: ui_grid_filterBy_nosotros, 
            },

            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'boolean'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 70,
            cellFilter: 'monedaSimboloFilter',
            
            sortCellFiltered: true, 
            filterCellFiltered: true, 
 
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'serie',
            field: 'serie',
            displayName: 'Serie',
            width: 60,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'prima',
            field: 'prima',
            displayName: 'Primas',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'primaBruta',
            field: 'primaBruta',
            displayName: 'Prima bruta',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'comision',
            field: 'comision',
            displayName: 'Comisión',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'imp1',
            field: 'imp1',
            displayName: 'Imp1',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'imp2',
            field: 'imp2',
            displayName: 'Imp2',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'imp3',
            field: 'imp3',
            displayName: 'Imp3',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'primaNetaAntesCorretaje',
            field: 'primaNetaAntesCorretaje',
            displayName: 'Primas',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'corretaje',
            field: 'corretaje',
            displayName: 'Corretaje',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'primaNeta',
            field: 'primaNeta',
            displayName: 'Prima neta',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'siniestros',
            field: 'siniestros',
            displayName: 'Siniestros',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'siniestros_suParte',
            field: 'siniestros_suParte',
            displayName: 'Su sntros',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'saldo',
            field: 'saldo',
            displayName: 'Saldo',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'resultadoTecnico',
            field: 'resultadoTecnico',
            displayName: 'Res técnico',
            cellFilter: 'currencyFilterAndNull',        
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'delButton',
            displayName: ' ',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem_contrPropSaldos(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false, 
            // pinnedRight: true,
            width: 25
        },
    ]

    $scope.deleteItem_contrPropSaldos = (entity) => {

        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.contratosProp_cuentas_saldos, (x) => { return x._id === entity._id; });
        } else { 
            const item = $scope.contratosProp_cuentas_saldos.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }
        }

        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        $scope.cuentasTecnicas_Saldos_ui_grid.data = [];
        $scope.cuentasTecnicas_Saldos_ui_grid.data = 
                $scope.contratosProp_cuentas_saldos.filter(x => x.definicionID === definicionSeleccionadaID); 
        
        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    $scope.saldosFinales_calcular = () => {

        // determinamos cada saldo final para cada compañía 
        // Nota: normalmente, el usuario no hará un click en esta opción; estos saldos son calculados desde la lista anterior; 
        // sin embargo, en ocasiones, el usuario puede hacer una modificación manual a esta lista y recalcular. Esto no es frecuente ... 

        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id;
        const saldosFinales_array = $scope.contratosProp_cuentas_saldos.filter(x => x.definicionID === definicionSeleccionadaID);

        saldosFinales_array.forEach(x => {

            // TODO: obtener esta orden desde el array de la lista de arriba ... 
            // x.primaBruta = x.prima * x.ordenPorc / 100;
            // x.comision = (x.primaBruta && x.comisionPorc) ? (x.primaBruta * x.comisionPorc / 100) * -1 : 0;
            // x.imp1 = (x.primaBruta && x.imp1Porc) ? (x.primaBruta * x.imp1Porc / 100) * -1 : 0;
            // x.imp2 = (x.primaBruta && x.imp2Porc) ? (x.primaBruta * x.imp2Porc / 100) * -1 : 0;
            // x.imp3 = (x.primaBruta && x.imp3Porc) ? (x.primaBruta * x.imp3Porc / 100) * -1 : 0;

            x.primaNetaAntesCorretaje = x.primaBruta;
            x.primaNetaAntesCorretaje += x.comision ? x.comision : 0;
            x.primaNetaAntesCorretaje += x.imp1 ? x.imp1 : 0;
            x.primaNetaAntesCorretaje += x.imp2 ? x.imp2 : 0;
            x.primaNetaAntesCorretaje += x.imp3 ? x.imp3 : 0;

            // x.corretaje = (x.primaBruta && x.corretajePorc) ? (x.primaBruta * x.corretajePorc / 100) * -1 : 0;

            x.primaNeta = x.primaNetaAntesCorretaje;
            x.primaNeta += x.corretaje ? x.corretaje : 0;

            // x.siniestros_suParte = x.siniestros ? x.siniestros * x.ordenPorc / 100 : 0;

            x.saldo = 0;
            x.saldo += x.primaNeta ? x.primaNeta : 0;
            x.saldo += x.siniestros_suParte;

            // el saldo es ya neto de corretaje. Es decir, no contiene el corretaje. Este monto que sigue, resultado técnico, es el saldo 
            // de la compañía sin la deducción del corretaje ... 
            x.resultadoTecnico = x.saldo + (x.corretaje ? -x.corretaje : 0);   // el corretaje es, normalmente, de signo contrario al saldo 

            if (!x.docState) {
                x.docState = 2;
            }
        })

        // siempre nos aseguramos que el contrato, como un todo, se marque como modificado 
        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    // hacemos el binding entre los arrays en el contrato y los ui-grids 
    const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

    $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data = $scope.contratosProp_cuentas_resumen.filter(x => x.definicionID === definicionSeleccionadaID );
    $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid.data = $scope.contratosProp_cuentas_distribucion.filter(x => x.definicionID === definicionSeleccionadaID );
    $scope.cuentasTecnicas_Saldos_ui_grid.data = $scope.contratosProp_cuentas_saldos.filter(x => x.definicionID === definicionSeleccionadaID );
}])

angular.module("scrwebm").filter('contPr_cuentas_resultadoTecnico', function () {
    return function (value, scope) {
        // este filtro recibe el row y regresa el resultado técnico. Como el corretaje es restado de la prima antes de restar 
        // siniestros, es dificil mostrar este en el grid. Aquí, simplemente, agregamos el corretaje al saldo del row, para 
        // obtener, de la forma más simple, el resultado técnico ... 

        const row = scope.row.entity;

        // normalmente, el corretaje viene con un signo diferente al saldo; por eso basta con sumar para que el corretaje se reste al saldo 
        const resultadoTecnico = (row.saldo ? row.saldo : 0) + (row.corretaje ? row.corretaje : 0); 

        return numeral(resultadoTecnico).format('0,0.00');
    }
})

function ui_grid_filterBy_nosotros(searchTerm, cellValue) {

    // para poder filtrar el ui-grid por nosotros una vez aplicado el filtro para el ddl
    if (searchTerm.toLowerCase() === "si" && cellValue) { 
        return true;
    }

    if (searchTerm.toLowerCase() === "no" && !cellValue) { 
        return true;
    }

    return false;
}

const exportarMontosCSV = (items) => {

    try {
        // eliminamos algunas propiedades que no queremos en el txt (csv) 
        items.forEach(x => delete x.cuentaContableId);

        // papaparse: convertimos el array json a un string csv ...
        const config = {
            quotes: false,
            delimiter: "\t",
            header: true
        };

        let csvString = Papa.unparse(items, config);

        // cambiamos los headers por textos más apropiados (pareciera que ésto no se puede hacer desde el config)
        csvString = csvString.replace("cuentaContable", "cuenta contable");
        csvString = csvString.replace("nombreCuenta", "nombre cuenta contable");
        csvString = csvString.replace("cc_descripcion", "centro cto desc");
        csvString = csvString.replace("cc_abreviatura", "centro cto abrev");

        var blob = new Blob([csvString], { type: "text/plain;charset=utf-8" });
        saveAs(blob, "resumen primas siniestros");

        return { 
            error: false
        }
    }
    catch (err) {
        const message = err.message ? err.message : err.toString();
        return { 
            error: true, 
            message
        }
    }

}