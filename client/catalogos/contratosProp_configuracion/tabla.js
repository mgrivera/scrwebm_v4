

import lodash from 'lodash';
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { ContratosProp_Configuracion_Tablas } from '/imports/collections/catalogos/ContratosProp_Configuracion';
import { ContProp_tablaConf } from '/client/lib/forerunnerDB'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebM").controller("ContratosProp_Configuracion_Tabla_Controller",
['$scope', '$state', '$stateParams', '$meteor', '$modal',
  function ($scope, $state, $stateParams, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    // leemos la compañía seleccionada
    let companiaSeleccionada = $scope.$parent.companiaSeleccionada;

    // leemos los catálogos en el $scope
    $scope.monedas = Monedas.find().fetch();
    $scope.companias = Companias.find().fetch();
    $scope.suscriptores = Suscriptores.find().fetch();
    $scope.ramos = Ramos.find().fetch();

    $scope.codigoContrato = $stateParams.codigoContrato;

    $scope.regresarALista = function () {
        if (lodash.some($scope.contratosProp_configuracion_tablas, (x) => { return x.docState; })) {
            var promise = DialogModal($modal,
                                    "<em>Contratos - Configuración</em>",
                                    `Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em>
                                        y perder los cambios?
                                    `,
                                    true).then(
                function (resolve) {
                    $state.go('catalogos.contrProp_configuracion.contrProp_configuracion_lista');
                },
                function (err) {
                    return true;
                });
            return;
        }
        else
            $state.go('catalogos.contrProp_configuracion.contrProp_configuracion_lista');
    }


    let itemSeleccionado = {};
    let uiGridApi = null;

    $scope.configuracionContrato_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: true,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {
            uiGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado = {};

                if (row.isSelected)
                    itemSeleccionado = row.entity;
                else
                    return;
            });
            // marcamos el item como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    if (!rowEntity.docState)
                        rowEntity.docState = 2;
            });
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        },
    };


    $scope.configuracionContrato_ui_grid.columnDefs = [
            {
                name: 'docState',
                field: 'docState',
                displayName: '',
                cellClass: 'ui-grid-centerCell',
                cellTemplate:
                    '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableColumnMenu: false,
                enableSorting: false,
                pinnedLeft: true,
                width: 25
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
                name: 'compania',
                field: 'compania',
                displayName: 'Compañía',
                width: 100,
                cellFilter: 'companiaAbreviaturaFilter',
                sortCellFiltered: true, 
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
                name: 'moneda',
                field: 'moneda',
                displayName: 'Mon',
                width: 60,
                cellFilter: 'monedaSimboloFilter',
                sortCellFiltered: true, 
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
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: false,
                enableSorting: true,
                pinnedLeft: true,
                type: 'string'
            },
            {
                name: 'tipoContrato',
                field: 'tipoContrato',
                displayName: 'Tipo',
                cellFilter: 'tipoContratoAbreviaturaFilter',
                sortCellFiltered: true, 
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
                cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableSorting: false,
                width: 25
            }
    ];

    $scope.deleteItem = function (item) {
        item.docState = 3;
    }

    $scope.nuevo = function () {
        $scope.contratosProp_configuracion_tablas.push({
            _id: new Mongo.ObjectID()._str,
            codigo: $scope.codigoContrato,
            cia: companiaSeleccionada._id,
            docState: 1,
        });
    }

    // TODO: hacer este subscribe solo cuando venimos del 1er. state, no cuando regresamos de construir registros ... 
    $scope.showProgress = true; 

    // si existen registros en la tabla temporal (frDB) los usamos;  de otra forma, leemos desde la base de datos con un subscribe 
    let existenRegistrosConfiguracion =  ContProp_tablaConf.count({ tipo: 'reg conf', user: Meteor.userId(), }); 

    if (existenRegistrosConfiguracion) { 

        $scope.contratosProp_configuracion_tablas = []; 
        let items = ContProp_tablaConf.find({ tipo: 'reg conf', user: Meteor.userId(), });

        // en vez de leer el contenido desde mongo en server, agregamos ahora desde la tabla en forerunnerDB 
        for (let item of items) { 

            let regConf = { 
                _id: item._id, 
                codigo: item.codigo, 
                ano: item.ano, 
                moneda: item.moneda, 
                ramo: item.ramo, 
                tipoContrato: item.tipoContrato, 
                compania: item.compania, 
                nosotros: item.nosotros, 
                ordenPorc: item.ordenPorc, 
                comisionPorc: item.comisionPorc, 
                imp1Porc: item.imp1Porc, 
                imp2Porc: item.imp2Porc, 
                imp3Porc: item.imp3Porc, 
                corretajePorc: item.corretajePorc, 
                cia: item.cia, 
                docState: item.docState, 
            }; 

            $scope.contratosProp_configuracion_tablas.push(regConf); 
        }

        $scope.configuracionContrato_ui_grid.data = [];
        $scope.configuracionContrato_ui_grid.data = $scope.contratosProp_configuracion_tablas;
        $scope.showProgress = false;
    } else { 
        let filtro = { codigo: $scope.codigoContrato, cia: companiaSeleccionada._id, };
        $scope.subscribe('contratosProp.configuracion.tablas',
                        () => [ JSON.stringify(filtro) ], {
            onReady: function () {
                $scope.helpers({
                    contratosProp_configuracion_tablas: () => {
                        return ContratosProp_Configuracion_Tablas.find(
                            {
                                codigo: $scope.codigoContrato,
                                cia: companiaSeleccionada._id,
                            });
                    },
                });

                $scope.configuracionContrato_ui_grid.data = $scope.contratosProp_configuracion_tablas;

                $scope.showProgress = false;
                $scope.$apply();
            },
            onStop: function(err) {
                if (err) {
                } else {
                }
            }
        })
    }

        
        $scope.agregarItemsATabla = () => {
            // agregamos los registros de la tabla de configuración a un collection en frDB para tenerlos disponibles en 
            // el próx state 
            ContProp_tablaConf.remove({ tipo: 'reg conf', user: Meteor.userId() });

            for (let item of $scope.contratosProp_configuracion_tablas) { 
                item.tipo = 'reg conf'; 
                item.user = Meteor.userId(); 

                ContProp_tablaConf.insert(item);         // nótese como usamos el *mismo* collections para varias cosas en esta función 
            }

            ContProp_tablaConf.save(function (err) {
                if (!err) {
                    // Save was successful
                    $state.go('catalogos.contrProp_configuracion.contratosListaProp_configuracion_tabla_construir', 
                        { codigoContrato: $scope.codigoContrato, });
                } else { 
                    reject(err); 
                }
            }) 
        }


        $scope.save = function () {
             $scope.showProgress = true;

             let editedItems = lodash.filter($scope.contratosProp_configuracion_tablas,
                                        function (item) { return item.docState; });

             // nótese como validamos cada item antes de intentar guardar (en el servidor)
             let isValid = false;
             let errores = [];

             editedItems.forEach((item) => {
                 if (item.docState != 3) {
                     isValid = ContratosProp_Configuracion_Tablas.simpleSchema().namedContext().validate(item);

                     if (!isValid) {
                         ContratosProp_Configuracion_Tablas.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                             errores.push(`El valor '${error.value}' no es adecuado para el
                                           campo <b><em>${ContratosProp_Configuracion_Tablas.simpleSchema().label(error.name)}</b></em>;
                                           error de tipo '${error.type}'.
                                          `);
                         });
                     }
                 }
             });

             if (errores && errores.length) {
                 $scope.alerts.length = 0;
                 $scope.alerts.push({
                     type: 'danger',
                     msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas " +
                          "en la base de datos:<br /><br />" +
                         errores.reduce(function (previous, current) {

                             if (previous == "")
                                 // first value
                                 return current;
                             else
                                 return previous + "<br />" + current;
                         }, "")
                 });

                 $scope.showProgress = false;
                 return;
             };

             Meteor.call('contratosProp_configuracion_tablas_Save', editedItems, function (error, result) {
               if (error) {

                   let errorMessage = mensajeErrorDesdeMethod_preparar(error);

                   $scope.alerts.length = 0;
                   $scope.alerts.push({
                       type: 'danger',
                       msg: errorMessage
                   });

                   $scope.showProgress = false;
                   $scope.$apply();

                   return;
               };

               // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
               // se queda el '*' para registros nuevos en el ui-grid ...
               $scope.contratosProp_configuracion_tablas = [];
               $scope.configuracionContrato_ui_grid.data = [];

               let filtro = { codigo: $scope.codigoContrato, cia: companiaSeleccionada._id, };
               $scope.subscribe('contratosProp.configuracion.tablas',
                                () => [ JSON.stringify(filtro) ], {
                   onReady: function () {
                       $scope.helpers({
                           contratosProp_configuracion_tablas: () => {
                               return ContratosProp_Configuracion_Tablas.find(
                                   {
                                       codigo: $scope.codigoContrato,
                                       cia: companiaSeleccionada._id,
                                   });
                           },
                       });

                       $scope.configuracionContrato_ui_grid.data = $scope.contratosProp_configuracion_tablas;

                       $scope.alerts.length = 0;
                       $scope.alerts.push({
                           type: 'info',
                           msg: result
                       });

                       $scope.showProgress = false;
                       $scope.$apply();
                   },
                   onStop: function(err) {
                       if (err) {
                       } else {
                       }
                   }
               })
           })
      }
  }
]);
