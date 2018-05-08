

import * as moment from 'moment';
import * as lodash from 'lodash';
import * as angular from 'angular';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 

import { Monedas } from '../../../imports/collections/catalogos/monedas'; 
import { Companias } from '../../../imports/collections/catalogos/companias'; 
import { Ramos } from '../../../imports/collections/catalogos/ramos'; 
import { EmpresasUsuarias } from '../../../imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '../../../imports/collections/catalogos/companiaSeleccionada'; 
import { ContratosProp_Configuracion_Tablas } from '../../../imports/collections/catalogos/ContratosProp_Configuracion';

import { DialogModal } from '../../imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '../methods/_methods/_methods'; 

angular.module("scrwebM").controller("Contrato_Cuentas_ComisionAdicional_Controller",
['$scope', '$state', '$stateParams', '$meteor', '$modal', 'uiGridConstants', '$q',
  function ($scope, $state, $stateParams, $meteor, $modal, uiGridConstants, $q) {

    $scope.showProgress = false;

    $scope.contrato = $scope.$parent.$parent.contrato; 
    $scope.companiaSeleccionada = $scope.$parent.$parent.companiaSeleccionada; 
    $scope.definicionCuentaTecnicaSeleccionada = $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada; 

    let contratoProp_comAdic_resumen_itemSeleccionado = {};

    $scope.contratoProp_comAdic_resumen_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
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

                contratoProp_comAdic_resumen_itemSeleccionado = {};
                if (row.isSelected) {
                    contratoProp_comAdic_resumen_itemSeleccionado = row.entity;
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

    $scope.contratoProp_comAdic_resumen_ui_grid.columnDefs = [
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
            pinnedLeft: true,
            width: 25
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
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'tipoContrato',
            field: 'tipoContrato',
            displayName: 'Tipo',
            width: 100,
            cellFilter: 'tipoContratoAbreviaturaFilter',
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
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
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
            cellTemplate: '<span ng-click="grid.appScope.deleteItem_contProp_comAdic_resumen(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ]

    $scope.deleteItem_contProp_comAdic_resumen = (entity) => {

        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.contratosProp_comAdic_resumen, (x: any) => { return x._id === entity._id; });
        } else { 
            let item: any = $scope.contratosProp_comAdic_resumen.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }; 
        }

        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        $scope.contratoProp_comAdic_resumen_ui_grid.data = [];
                $scope.contratoProp_comAdic_resumen_ui_grid.data = 
                        $scope.contratosProp_comAdic_resumen.filter(x => x.definicionID === definicionSeleccionadaID); 
        
        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    $scope.leerTablaConfiguracion = function() { 
        // contratos proporcionales: leemos la tabla de configuración y regresamos un resumen de las combinaciones
        // mon/ramo/tipo/serie, para que el usuario indique un monto para cada una ...

        if (!$scope.contrato.codigo) {
            DialogModal($modal, "<em>Contratos - Cuotas</em>",
                        `El contrato debe tener un <em>código</em> asignado. Por favor asigne un código al contrato.<br />
                         El <em>código del contrato</em> permite, justamente, relacionar el contrato a una <em>tabla de configuración</em>.`,
                        false).then();
            return;
        }

        let codigo = $scope.contrato.codigo;
        let contratoID = $scope.contrato._id; 
        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 
        let moneda = $scope.definicionCuentaTecnicaSeleccionada.moneda;
        let ano = $scope.contrato.desde.getFullYear();
        let ciaSeleccionadaID = $scope.companiaSeleccionada._id;

        Contratos_Methods.contratosProporcionales_leerTablaConfiguracion($q, codigo, moneda, ano, ciaSeleccionadaID).then(
            (result) => {
                // el método, aunque su ejecución haya sido correcta, puede reguresar un error ... 
                if (result.error) { 
                    $scope.$parent.alerts.length = 0;
                    $scope.$parent.alerts.push({
                        type: 'danger',
                        msg: result.message
                    });
                    return; 
                }
                
                var func = x => x * x;      

                $scope.contratosProp_comAdic_resumen
                    .filter(x => x.definicionID === definicionSeleccionadaID)
                    .forEach((x) => { 
                        if (x.docState && x.docState === 1) { 
                            lodash.remove($scope.contratosProp_comAdic_resumen, (y: any) => { return y._id === x._id; });
                        } else { 
                            $scope.contratosProp_comAdic_resumen.find(y => y._id === x._id).docState = 3; 
                        }
                    })

                result.resumenPrimasSiniestros_array.forEach((x) => {
                    let resumenComAdic_item = {
                        _id: new Mongo.ObjectID()._str,
                        contratoID: contratoID, 
                        definicionID: definicionSeleccionadaID,
                        moneda: x.moneda,
                        ramo: x.ramo,
                        tipoContrato: x.tipo,
                        serie: parseInt(x.serie),
                        monto: null,
                        docState: 1, 
                    }

                    $scope.contratosProp_comAdic_resumen.push(resumenComAdic_item);
                })

                $scope.contratoProp_comAdic_resumen_ui_grid.data = [];
                $scope.contratoProp_comAdic_resumen_ui_grid.data = 
                        $scope.contratosProp_comAdic_resumen.filter(x => x.definicionID === definicionSeleccionadaID); 

                $scope.$parent.$parent.dataHasBeenEdited = true; 

                $scope.$parent.alerts.length = 0;
                $scope.$parent.alerts.push({
                    type: 'info',
                    msg: result.message
                });
            },
            (error) => {
                $scope.$parent.alerts.length = 0;
                $scope.$parent.alerts.push({
                    type: 'danger',
                    msg: error.message
                });
            }
        )
    }


    $scope.distribuirMontosComAdicEnCompanias = () => {
        // suscribimos a la tabla de configuracion y efectuamos la distribucion en las compañías

        let codigo = $scope.contrato.codigo;
        let contratoID = $scope.contrato._id; 
        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 
        let moneda = $scope.definicionCuentaTecnicaSeleccionada.moneda;
        let ano = $scope.contrato.desde.getFullYear();
        let ciaSeleccionadaID = $scope.companiaSeleccionada._id;

        let filtro = {
            codigo: codigo,
            moneda: moneda,
            ano: { $lte: ano },
            cia: ciaSeleccionadaID,
        };

        $scope.showProgress = true;

        Meteor.subscribe('contratosProp.configuracion.tablas', JSON.stringify(filtro), () => {

            // eliminamos primero los registros que puedan existir en el array en el contrato ...
            $scope.contratosProp_comAdic_distribucion
                    .filter(x => x.definicionID === definicionSeleccionadaID)
                    .forEach((x) => { 
                        if (x.docState && x.docState === 1) { 
                            lodash.remove($scope.contratosProp_comAdic_distribucion, (y: any) => { return y._id === x._id; });
                        } else { 
                            $scope.contratosProp_comAdic_distribucion.find(y => y._id === x._id).docState = 3; 
                        }
                    })

            // leemos en un array los registros en la tabla de configuración del contrato;
            // nótese que usamos el mismo filtro que usamos en el subscribe
            let tablaConfiguracion = ContratosProp_Configuracion_Tablas.find(filtro).fetch();

            // ahora leemos cada linea, con primas y siniestros, y distribuimos en la compañía particular ...
            $scope.contratosProp_comAdic_resumen
                .filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                .filter((x) => { return x.monto && x.monto != 0; })
                .filter((x) => { return !(x.docState && x.docState === 3); })
                .forEach((x) => {
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

                              monto: x.monto,
                              ordenPorc: config.ordenPorc,
                              docState: 1, 
                          };
                          $scope.contratosProp_comAdic_distribucion.push(distribucion);
                      })
            })

            // asignamos signos a los montos principales (primas, siniestros, etc.), de acuerdo al tipo de compañía: 
            // nosotros/reaseguradores 
            $scope.contratosProp_comAdic_distribucion
                .filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                .forEach((x) => {

                    let signo = 1; 
                    if (!x.nosotros) { signo = -1; }; 

                    x.monto = x.monto * -signo;
                })      

            // para mostrar las cifras determinadas en el ui-grid
            $scope.contratoProp_comAdic_distribucion_ui_grid.data = [];
            $scope.contratoProp_comAdic_distribucion_ui_grid.data =
                    $scope.contratosProp_comAdic_distribucion.filter((x) => { return x.definicionID === definicionSeleccionadaID; });


            $scope.$parent.alerts.length = 0;
            $scope.$parent.alerts.push({
                type: 'info',
                msg: `Ok, los valores para la distribución de cada monto en las compañías del contrato,
                      han sido leídos desde la <em>tabla de configuración del contrato</em>.
                     `
            });

            $scope.$parent.$parent.dataHasBeenEdited = true; 

            $scope.showProgress = false;
            $scope.$apply();
        })
    }


    $scope.distribuirComAdicEnCompanias_calcular = () => {

        // calculamos las cifras para las compañías del contrato. Simplemente, recorremos el array de cifras por
        // compañía y calculamos cada cifra en base al porcentaje correspondiente ...
        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id;  
        $scope.contratosProp_comAdic_distribucion.filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                                                 .filter((x) => { return (x.monto || x.monto === 0) && (x.ordenPorc || x.ordenPorc === 0); })
                                                 .forEach((x) => 
                                                 { 
                                                     x.monto_suParte = x.monto * x.ordenPorc / 100; 
                                                     if (!x.docState) { x.docState = 2; } 
                                                 }); 

        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }


    $scope.distribuirComAdicEnCompanias_obtenerSaldosFinales = () => {

        // finalmente, recorremos el array de cifras y sumarizamos para obtener solo un registro para
        // cada compañía, el cual debe contener una sumarización de las cifras separadas por ramo, serie, etc.

        let contratoID = $scope.contrato._id; 
        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        let cifrasPorCompania_array = $scope.contratosProp_comAdic_distribucion
                                            .filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                                            .filter((x) => { return !(x.docState && x.docState === 3); })
                                            .filter((x) => { return x.monto_suParte; });

        // eliminamos los registros de saldo que ya puedan existir 
        $scope.contratosProp_comAdic_montosFinales
                    .filter(x => x.definicionID === definicionSeleccionadaID)
                    .forEach((x) => { 
                        if (x.docState && x.docState === 1) { 
                            lodash.remove($scope.contratosProp_comAdic_montosFinales, (y: any) => { return y._id === x._id; });
                        } else { 
                            $scope.contratosProp_comAdic_montosFinales.find(y => y._id === x._id).docState = 3; 
                        }
                    })


        // cada vez, inicializamos el array para sustituir siempre los registros anteriores por los nuevos
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
                compania: sumArray[key][0].compania,
                nosotros: sumArray[key][0].nosotros,
                moneda: sumArray[key][0].moneda,
                serie: sumArray[key][0].serie, 
                monto: lodash.sumBy(sumArray[key], 'monto_suParte'),
                docState: 1, 
            } as never;         // solo para que la instrucción que sigue compile en ts ... 

            saldosPorCompania_array.push(saldo);
        }

        saldosPorCompania_array.forEach((x) => {
            $scope.contratosProp_comAdic_montosFinales.push(x);
        })

        $scope.contratoProp_comAdic_montosFinales_ui_grid.data = [];
        $scope.contratoProp_comAdic_montosFinales_ui_grid.data =
            $scope.contratosProp_comAdic_montosFinales.filter((x) => { return x.definicionID === definicionSeleccionadaID; });

        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    let contratoProp_comAdic_distribucion_itemSeleccionado = {};

    $scope.contratoProp_comAdic_distribucion_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
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

                contratoProp_comAdic_distribucion_itemSeleccionado = {};
                if (row.isSelected) {
                    contratoProp_comAdic_distribucion_itemSeleccionado = row.entity;
                }
                else
                    return;
            })

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2; 
                    }
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

    $scope.contratoProp_comAdic_distribucion_ui_grid.columnDefs = [
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
            pinnedLeft: true,
            width: 25
        },
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
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
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
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'tipoContrato',
            field: 'tipoContrato',
            displayName: 'Tipo',
            width: 100,
            cellFilter: 'tipoContratoAbreviaturaFilter',
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
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
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
            name: 'monto_suParte',
            field: 'monto_suParte',
            displayName: 'Su monto',
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
            cellTemplate: '<span ng-click="grid.appScope.deleteItem_contProp_comAdic_distribucion(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ]

    $scope.deleteItem_contProp_comAdic_distribucion = (entity) => {

        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.contratosProp_comAdic_distribucion, (x: any) => { return x._id === entity._id; });
        } else { 
            let item: any = $scope.contratosProp_comAdic_distribucion.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }; 
        }

        $scope.contratoProp_comAdic_distribucion_ui_grid.data = [];
        $scope.contratoProp_comAdic_distribucion_ui_grid.data =
            $scope.contratosProp_comAdic_distribucion.filter((x) => { return x.definicionID === definicionSeleccionadaID; });


        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    let contratoProp_comAdic_montosFinales_itemSeleccionado = {};

    $scope.contratoProp_comAdic_montosFinales_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
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

                contratoProp_comAdic_montosFinales_itemSeleccionado = {};
                if (row.isSelected) {
                    contratoProp_comAdic_montosFinales_itemSeleccionado = row.entity;
                }
                else
                    return;
            })

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2; 
                    }
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

    $scope.contratoProp_comAdic_montosFinales_ui_grid.columnDefs = [
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
            pinnedLeft: true,
            width: 25
        },
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
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
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
            name: 'monto',
            field: 'monto',
            displayName: 'Su monto',
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
            cellTemplate: '<span ng-click="grid.appScope.deleteItem_contProp_comAdic_montosFinales(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            // pinnedRight: true,
            width: 25
        },
    ]

    $scope.deleteItem_contProp_comAdic_montosFinales = (entity) => {

        let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.contratosProp_comAdic_montosFinales, (x: any) => { return x._id === entity._id; });
        } else { 
            let item: any = $scope.contratosProp_comAdic_montosFinales.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }; 
        }

        $scope.contratoProp_comAdic_montosFinales_ui_grid.data = [];
        $scope.contratoProp_comAdic_montosFinales_ui_grid.data =
            $scope.contratosProp_comAdic_montosFinales.filter((x) => { return x.definicionID === definicionSeleccionadaID; });

        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    // hacemos el binding entre los arrays en el contrato y los ui-grids 
    let definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

    $scope.contratoProp_comAdic_resumen_ui_grid.data = $scope.contratosProp_comAdic_resumen.filter(x => x.definicionID === definicionSeleccionadaID);
    $scope.contratoProp_comAdic_distribucion_ui_grid.data = $scope.contratosProp_comAdic_distribucion.filter(x => x.definicionID === definicionSeleccionadaID);
    $scope.contratoProp_comAdic_montosFinales_ui_grid.data = $scope.contratosProp_comAdic_montosFinales.filter(x => x.definicionID === definicionSeleccionadaID);
}])