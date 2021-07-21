
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import lodash from 'lodash';
import angular from 'angular';

import { ContratosProp_Configuracion_Tablas } from 'imports/collections/catalogos/ContratosProp_Configuracion';

import { DialogModal } from '../../imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '../methods/_methods/_methods'; 

angular.module("scrwebm").controller("Contrato_Cuentas_EntCartSn_Controller", ['$scope', '$modal', 'uiGridConstants', '$q',
function ($scope, $modal, uiGridConstants, $q) {

    $scope.showProgress = false;

    $scope.contrato = $scope.$parent.$parent.contrato; 
    $scope.companiaSeleccionada = $scope.$parent.$parent.companiaSeleccionada; 
    $scope.definicionCuentaTecnicaSeleccionada = $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada; 
    $scope.definicionCuentaTecnicaSeleccionada_Info = $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada_Info;

    $scope.contratoProp_entCartSn_resumen_ui_grid = {
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

    $scope.contratoProp_entCartSn_resumen_ui_grid.columnDefs = [
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
            cellTemplate: '<span ng-click="grid.appScope.deleteItem_contProp_entCartSn_resumen(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false, 
            width: 25
        },
    ]

    $scope.deleteItem_contProp_entCartSn_resumen = (entity) => {

        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.contratosProp_entCartSn_resumen, (x) => { return x._id === entity._id; });
        } else { 
            const item = $scope.contratosProp_entCartSn_resumen.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }
        }

        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        $scope.contratoProp_entCartSn_resumen_ui_grid.data = [];
                $scope.contratoProp_entCartSn_resumen_ui_grid.data = 
                        $scope.contratosProp_entCartSn_resumen.filter(x => x.definicionID === definicionSeleccionadaID); 
        
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
                    $scope.$parent.alerts.length = 0;
                    $scope.$parent.alerts.push({
                        type: 'danger',
                        msg: result.message
                    });
                    return; 
                }
                
                // en la lista pueden haber items; agregamos *solo* los que no existen (mon/ram/tipo/serie) y dejamos los que 
                // existen ... 
                let yaExistian = 0; 
                let agregados = 0; 

                yaExistian = $scope.contratosProp_entCartSn_resumen.filter(x => x.definicionID === definicionSeleccionadaID).length;

                result.resumenPrimasSiniestros_array.forEach((x) => {

                    const existeEnLaLista = $scope.contratosProp_entCartSn_resumen.find(y => 
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
                            monto: null,
                            docState: 1, 
                        }
    
                        $scope.contratosProp_entCartSn_resumen.push(resumenPrimaSiniestros_item);
                        agregados++; 
                    }
                })

                $scope.contratoProp_entCartSn_resumen_ui_grid.data = [];
                $scope.contratoProp_entCartSn_resumen_ui_grid.data = 
                        $scope.contratosProp_entCartSn_resumen.filter(x => x.definicionID === definicionSeleccionadaID); 

                $scope.$parent.$parent.dataHasBeenEdited = true; 

                $scope.$parent.alerts.length = 0;
                
                let message = `Resumen de primas y siniestros.<br /><br />
                                <b>${yaExistian.toString()}</b> registros ya existían. Fueron mantenidos.<br />
                                <b>${agregados.toString()}</b> registros faltaban. Fueron agregados.`; 
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
                
                DialogModal($modal, "<em>Contratos proporcionales</em>", message, false).then();
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

    $scope.distribuirMontosEntCartSnEnCompanias = () => {
        // suscribimos a la tabla de configuracion y efectuamos la distribucion en las compañías

        const codigo = $scope.contrato.codigo;
        const contratoID = $scope.contrato._id; 
        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 
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
            $scope.contratosProp_entCartSn_distribucion
                    .filter(x => x.definicionID === definicionSeleccionadaID)
                    .forEach((x) => { 
                        if (x.docState && x.docState === 1) { 
                            lodash.remove($scope.contratosProp_entCartSn_distribucion, (y) => { return y._id === x._id; });
                        } else { 
                            $scope.contratosProp_entCartSn_distribucion.find(y => y._id === x._id).docState = 3; 
                        }
                    })

            // leemos en un array los registros en la tabla de configuración del contrato;
            // nótese que usamos el mismo filtro que usamos en el subscribe
            const tablaConfiguracion = ContratosProp_Configuracion_Tablas.find(filtro).fetch();

            // ahora leemos cada linea, con primas y siniestros, y distribuimos en la compañía particular ...
            $scope.contratosProp_entCartSn_resumen
                .filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                .filter((x) => { return x.monto && x.monto != 0; })
                .filter((x) => { return !(x.docState && x.docState === 3); })
                .forEach((x) => {
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

                              monto: x.monto,
                              ordenPorc: config.ordenPorc,
                              docState: 1, 
                          };
                          $scope.contratosProp_entCartSn_distribucion.push(distribucion);
                      })
            })

            // asignamos signos a los montos principales (primas, siniestros, etc.), de acuerdo al tipo de compañía: 
            // nosotros/reaseguradores 
            $scope.contratosProp_entCartSn_distribucion
                .filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                .forEach((x) => {

                    let signo = 1; 
                    if (!x.nosotros) { signo = -1; }

                    x.monto = x.monto * signo;
                })      

            // para mostrar las cifras determinadas en el ui-grid
            $scope.contratoProp_entCartSn_distribucion_ui_grid.data = [];
            $scope.contratoProp_entCartSn_distribucion_ui_grid.data =
                    $scope.contratosProp_entCartSn_distribucion.filter((x) => { return x.definicionID === definicionSeleccionadaID; });


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

    $scope.distribuirEntCartSnEnCompanias_calcular = () => {

        // calculamos las cifras para las compañías del contrato. Simplemente, recorremos el array de cifras por
        // compañía y calculamos cada cifra en base al porcentaje correspondiente ...
        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id;  
        $scope.contratosProp_entCartSn_distribucion.filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                                                 .filter((x) => { return (x.monto || x.monto === 0) && (x.ordenPorc || x.ordenPorc === 0); })
                                                 .forEach((x) => 
                                                 { 
                                                     x.monto_suParte = x.monto * x.ordenPorc / 100; 
                                                     if (!x.docState) { x.docState = 2; } 
                                                 }); 

        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }


    $scope.distribuirEntCartSnEnCompanias_obtenerSaldosFinales = () => {

        // finalmente, recorremos el array de cifras y sumarizamos para obtener solo un registro para
        // cada compañía, el cual debe contener una sumarización de las cifras separadas por ramo, serie, etc.

        const contratoID = $scope.contrato._id; 
        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        const cifrasPorCompania_array = $scope.contratosProp_entCartSn_distribucion
                                            .filter((x) => { return x.definicionID === definicionSeleccionadaID; })
                                            .filter((x) => { return !(x.docState && x.docState === 3); })
                                            .filter((x) => { return x.monto_suParte; });

        // eliminamos los registros de saldo que ya puedan existir 
        $scope.contratosProp_entCartSn_montosFinales
                    .filter(x => x.definicionID === definicionSeleccionadaID)
                    .forEach((x) => { 
                        if (x.docState && x.docState === 1) { 
                            lodash.remove($scope.contratosProp_entCartSn_montosFinales, (y) => { return y._id === x._id; });
                        } else { 
                            $scope.contratosProp_entCartSn_montosFinales.find(y => y._id === x._id).docState = 3; 
                        }
                    })


        // cada vez, inicializamos el array para sustituir siempre los registros anteriores por los nuevos
        const saldosPorCompania_array = [];

        // nótese que basta con agrupar por compañía, pues solo existe una moneda en el array
        // agrupamos por compañía y creamos un item para cada una
        const sumArray = lodash.groupBy(cifrasPorCompania_array, (x) => { return x.compania + '-' + x.moneda + '-' + x.serie; });

        for (const key in sumArray) {
            const saldo = {
                _id: new Mongo.ObjectID()._str,
                contratoID: contratoID, 
                definicionID: definicionSeleccionadaID,
                compania: sumArray[key][0].compania,
                nosotros: sumArray[key][0].nosotros,
                moneda: sumArray[key][0].moneda,
                serie: sumArray[key][0].serie, 
                monto: lodash.sumBy(sumArray[key], 'monto_suParte'),
                docState: 1, 
            };         // solo para que la instrucción que sigue compile en ts ... 
            
            saldosPorCompania_array.push(saldo);
        }

        saldosPorCompania_array.forEach((x) => {
            $scope.contratosProp_entCartSn_montosFinales.push(x);
        })

        $scope.contratoProp_entCartSn_montosFinales_ui_grid.data = [];
        $scope.contratoProp_entCartSn_montosFinales_ui_grid.data =
            $scope.contratosProp_entCartSn_montosFinales.filter((x) => { return x.definicionID === definicionSeleccionadaID; });

        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    $scope.contratoProp_entCartSn_distribucion_ui_grid = {
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

    $scope.contratoProp_entCartSn_distribucion_ui_grid.columnDefs = [
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
            cellTemplate: '<span ng-click="grid.appScope.deleteItem_contProp_entCartSn_distribucion(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false, 
            width: 25
        },
    ]

    $scope.deleteItem_contProp_entCartSn_distribucion = (entity) => {

        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.contratosProp_entCartSn_distribucion, (x) => { return x._id === entity._id; });
        } else { 
            const item = $scope.contratosProp_entCartSn_distribucion.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }
        }

        $scope.contratoProp_entCartSn_distribucion_ui_grid.data = [];
        $scope.contratoProp_entCartSn_distribucion_ui_grid.data =
            $scope.contratosProp_entCartSn_distribucion.filter((x) => { return x.definicionID === definicionSeleccionadaID; });


        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    $scope.contratoProp_entCartSn_montosFinales_ui_grid = {
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

    $scope.contratoProp_entCartSn_montosFinales_ui_grid.columnDefs = [
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
            cellTemplate: '<span ng-click="grid.appScope.deleteItem_contProp_entCartSn_montosFinales(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false, 
            // pinnedRight: true,
            width: 25
        },
    ]

    $scope.deleteItem_contProp_entCartSn_montosFinales = (entity) => {

        const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id; 

        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.contratosProp_entCartSn_montosFinales, (x) => { return x._id === entity._id; });
        } else { 
            const item = $scope.contratosProp_entCartSn_montosFinales.find(x => x._id === entity._id); 
            if (item) { item.docState = 3; }
        }

        $scope.contratoProp_entCartSn_montosFinales_ui_grid.data = [];
        $scope.contratoProp_entCartSn_montosFinales_ui_grid.data =
            $scope.contratosProp_entCartSn_montosFinales.filter((x) => { return x.definicionID === definicionSeleccionadaID; });

        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    // hacemos el binding entre los arrays en el contrato y los ui-grids 
    const definicionSeleccionadaID = $scope.definicionCuentaTecnicaSeleccionada._id;

    $scope.contratoProp_entCartSn_resumen_ui_grid.data = $scope.contratosProp_entCartSn_resumen.filter(x => x.definicionID === definicionSeleccionadaID);
    $scope.contratoProp_entCartSn_distribucion_ui_grid.data = $scope.contratosProp_entCartSn_distribucion.filter(x => x.definicionID === definicionSeleccionadaID);
    $scope.contratoProp_entCartSn_montosFinales_ui_grid.data = $scope.contratosProp_entCartSn_montosFinales.filter(x => x.definicionID === definicionSeleccionadaID);
}])

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