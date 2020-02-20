

import * as moment from 'moment';
import * as lodash from 'lodash';
import * as numeral from 'numeral'; 
import * as angular from 'angular';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 

import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 
import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 
import { ContratosProp_Configuracion_Tablas } from 'imports/collections/catalogos/ContratosProp_Configuracion';

import { DialogModal } from '../../imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '../methods/_methods/_methods'; 


angular.module("scrwebm").controller("Contrato_Cuentas_CuentasTecnicas_Controller",
['$scope', '$state', '$stateParams', '$meteor', '$modal', 'uiGridConstants', '$q',
  function ($scope, $state, $stateParams, $meteor, $modal, uiGridConstants, $q) {

    $scope.showProgress = false;

    $scope.contrato = $scope.$parent.$parent.contrato; 
    $scope.companiaSeleccionada = $scope.$parent.$parent.companiaSeleccionada; 
    $scope.definicionCuentaTecnicaSeleccionada = $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada; 
    $scope.definicionCuentaTecnicaSeleccionada_Info = $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada_Info;
   
    // ui-grid para el registro del resumen de primas y siniestros para la cuenta técnica
    let contProp_resumenPrimasSiniestros_seleccionado = {};

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

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                contProp_resumenPrimasSiniestros_seleccionado = {};
                if (row.isSelected) {
                    contProp_resumenPrimasSiniestros_seleccionado = row.entity;
                }
                else { 
                    return;
                }  
            })

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
            lodash.remove($scope.contratosProp_cuentas_resumen, (x: any) => { return x._id === entity._id; });
        } else { 
            let item: any = $scope.contratosProp_cuentas_resumen.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }; 
        }

        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data = [];
        $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data = 
                $scope.contratosProp_cuentas_resumen.filter(x => x.definicionID === definicionSeleccionadaID); 
        
                $scope.$parent.$parent.dataHasBeenEdited = true; 
    }



    $scope.leerTablaConfiguracion = () => {
        // contratos proporcionales: leemos la tabla de configuración y regresamos un resumen de las combinaciones
        // mon/ramo/tipo/serie, para que el usuario indique primas y siniestros para cada una ...

        let codigo = $scope.contrato.codigo;
        let contratoID = $scope.contrato._id; 
        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 
        let moneda = $scope.definicionCuentaTecnicaSeleccionada.moneda;
        let ano = $scope.contrato.desde.getFullYear();
        let ciaSeleccionadaID = $scope.companiaSeleccionada._id;

        Contratos_Methods.contratosProporcionales_leerTablaConfiguracion
            ($q, codigo, moneda, ano, ciaSeleccionadaID).then(
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

                    let existeEnLaLista = $scope.contratosProp_cuentas_resumen.find(y => 
                        y.definicionID === definicionSeleccionadaID && 
                        y.moneda === x.moneda && 
                        y.ramo === x.ramo && 
                        y.tipoContrato === x.tipo && 
                        y.serie === parseInt(x.serie)
                    )

                    if (!existeEnLaLista) { 
                        let resumenPrimaSiniestros_item = {
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

                let message = `Resumen de primas y siniestros.<br /><br />
                                <b>${yaExistian.toString()}</b> registros ya existían. Fueron mantenidos.<br />
                                <b>${agregados.toString()}</b> registros faltaban. Fueron agregados.`; 
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
                
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

    // --------------------------------------------------------------------------------------
    // ui-grid para el registro de la distribución de primas y siniestros en las compañías
    // del contrato (ie: cifras detalladas *antes* de saldos) ...
    let contProp_distribucionPrimasSiniestros_seleccionado = {};

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

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                contProp_distribucionPrimasSiniestros_seleccionado = {};
                if (row.isSelected) {
                    contProp_distribucionPrimasSiniestros_seleccionado = row.entity;
                }
                else
                    return;
            })

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                if (newValue != oldValue)
                    if (!$scope.contrato.docState) { 
                        $scope.contrato.docState = 2;
                        $scope.$parent.$parent.dataHasBeenEdited = true; 
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
            lodash.remove($scope.contratosProp_cuentas_distribucion, (x: any) => { return x._id === entity._id; });
        } else { 
            let item: any = $scope.contratosProp_cuentas_distribucion.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }; 
        }

        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid.data = [];
        $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid.data = 
                $scope.contratosProp_cuentas_distribucion.filter(x => x.definicionID === definicionSeleccionadaID); 
        
        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }


    $scope.distribuirMontosPrSinEnCompanias = () => {

        // suscribimos a la tabla de configuracion y efectuamos la distribucion en las compañías
        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 
        let codigo = $scope.contrato.codigo;
        let contratoID = $scope.contrato._id; 
        let moneda = $scope.definicionCuentaTecnicaSeleccionada.moneda;
        let ano = $scope.contrato.desde.getFullYear();
        let ciaSeleccionadaID = $scope.companiaSeleccionada._id;

        let filtro = {
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
                        lodash.remove($scope.contratosProp_cuentas_distribucion, (y: any) => { return y._id === x._id; });
                    } else { 
                        $scope.contratosProp_cuentas_distribucion.find(y => y._id === x._id).docState = 3; 
                    }
                })

            // leemos en un array los registros en la tabla de configuración del contrato;
            // nótese que usamos el mismo filtro que usamos en el subscribe
            let tablaConfiguracion = ContratosProp_Configuracion_Tablas.find(filtro).fetch();

            // ahora leemos cada linea, con primas y siniestros, y distribuimos en la compañía particular ...
            $scope.contratosProp_cuentas_resumen.
                  filter((x) => { return x.definicionID === definicionSeleccionadaID; }).
                  filter((x) => { return x.primas || x.siniestros; }).
                  forEach((x: any) => {
                      // para cada item de primas y siniestros (para año, mon, ramo y tipo), leemos
                      // los registros que corresponden (1 por cada compañía del contrato) en la tabla
                      // de configuración
                      let config_array = lodash.filter(tablaConfiguracion, (t) => {
                          return t.codigo === codigo &&
                          t.moneda === x.moneda &&
                          t.ano === x.serie &&
                          t.cia === ciaSeleccionadaID &&
                          t.ramo === x.ramo &&
                          t.tipoContrato === x.tipoContrato;
                      });

                      config_array.forEach((config) => {
                          let distribucion = {
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
                    if (!x.nosotros) { signo = -1; }; 

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

        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        let cifrasPorCompania_array = $scope.contratosProp_cuentas_distribucion.filter((x) => { return x.definicionID === definicionSeleccionadaID; });

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
        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 
        let contratoID = $scope.contrato._id; 

        let cifrasPorCompania_array = $scope.contratosProp_cuentas_distribucion
                                            .filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                                            .filter((x) => { return !(x.docState && x.docState === 3); })
                                            .filter((x) => { return x.saldo; });
                                        

        // eliminamos primero los registros que puedan existir en el array ...
        $scope.contratosProp_cuentas_saldos
            .filter(x => x.definicionID === definicionSeleccionadaID)
            .forEach((x) => { 
                if (x.docState && x.docState === 1) { 
                    lodash.remove($scope.contratosProp_cuentas_saldos, (y: any) => { return y._id === x._id; });
                } else { 
                    $scope.contratosProp_cuentas_saldos.find(y => y._id === x._id).docState = 3; 
                }
            })


        let saldosPorCompania_array = [];

        // nótese que basta con agrupar por compañía, pues solo existe una moneda en el array
        // agrupamos por compañía y creamos un item para cada una
        let sumArray = lodash.groupBy(cifrasPorCompania_array, (x) => { return x.compania + '-' + x.moneda + '-' + x.serie; });

        for (let key in sumArray) {

            let saldosArray = sumArray[key]; 

            let saldo = {
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
            } as never;         // solo para que la instrucción que sigue compile en ts ... 
            
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
    let contProp_saldo_seleccionado = {};

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

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                contProp_saldo_seleccionado = {};
                if (row.isSelected) {
                    contProp_saldo_seleccionado = row.entity;
                }
                else
                    return;
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

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
            lodash.remove($scope.contratosProp_cuentas_saldos, (x: any) => { return x._id === entity._id; });
        } else { 
            let item: any = $scope.contratosProp_cuentas_saldos.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }; 
        }

        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        $scope.cuentasTecnicas_Saldos_ui_grid.data = [];
        $scope.cuentasTecnicas_Saldos_ui_grid.data = 
                $scope.contratosProp_cuentas_saldos.filter(x => x.definicionID === definicionSeleccionadaID); 
        
        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    // hacemos el binding entre los arrays en el contrato y los ui-grids 
    let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

    $scope.cuentasTecnicas_resumenPrimasSiniestros_ui_grid.data = $scope.contratosProp_cuentas_resumen.filter(x => x.definicionID === definicionSeleccionadaID );
    $scope.cuentasTecnicas_DistribucionPrimasSiniestros_ui_grid.data = $scope.contratosProp_cuentas_distribucion.filter(x => x.definicionID === definicionSeleccionadaID );
    $scope.cuentasTecnicas_Saldos_ui_grid.data = $scope.contratosProp_cuentas_saldos.filter(x => x.definicionID === definicionSeleccionadaID );
}])

angular.module("scrwebm").filter('contPr_cuentas_resultadoTecnico', function () {
    return function (value, scope) {
        // este filtro recibe el row y regresa el resultado técnico. Como el corretaje es restado de la prima antes de restar 
        // siniestros, es dificil mostrar este en el grid. Aquí, simplemente, agregamos el corretaje al saldo del row, para 
        // obtener, de la forma más simple, el resultado técnico ... 

        let row = scope.row.entity;

        // normalmente, el corretaje viene con un signo diferente al saldo; por eso basta con sumar para que el corretaje se reste al saldo 
        let resultadoTecnico = (row.saldo ? row.saldo : 0) + (row.corretaje ? row.corretaje : 0); 

        return numeral(resultadoTecnico).format('0,0.00');
    };
})

function ui_grid_filterBy_nosotros(searchTerm, cellValue, row, column) {

    // para poder filtrar el ui-grid por nosotros una vez aplicado el filtro para el ddl
    if (searchTerm.toLowerCase() === "si" && cellValue) { 
        return true;
    }

    if (searchTerm.toLowerCase() === "no" && !cellValue) { 
        return true;
    }

    return false;
}