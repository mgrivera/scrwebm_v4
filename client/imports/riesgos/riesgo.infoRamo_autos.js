
import { Mongo } from 'meteor/mongo'; 
import angular from 'angular';
import lodash from 'lodash'; 

import { AutosMarcas } from '/imports/collections/catalogos/autosMarcas'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

import EditarInfoRamo from './infoRamo/editarInfoRamo'; 
// cargamos los files que permiten abrir un modal para que el usuario edite la información ... 
// import '/client/imports/riesgos/infoRamo/editarInfoRamoModal.html'; 

export default angular.module("scrwebm.riesgos.infoRamo", [ EditarInfoRamo.name ]).controller("RiesgoInfoRamo_autos_Controller",
['$scope', '$modal', function ($scope, $modal) {

    $scope.showProgress = true; 

    let movimientoSeleccionado = {}; 
    $scope.numeroMovimientoSeleccinado = 1; 
    
    if ($scope.movimientoSeleccionado) { 
        // NOTA: $scope.movimientoSeleccionado fue definido en $parentScope ... 
        movimientoSeleccionado = $scope.movimientoSeleccionado; 
    }

    $scope.numeroMovimientoSeleccionado = function() {
        return (movimientoSeleccionado && !lodash.isEmpty(movimientoSeleccionado)) ? movimientoSeleccionado.numero : -1;
    }

    // -------------------------------------------------------------------------
    // grid de productores
    // -------------------------------------------------------------------------
    let infoRamoSeleccionado = {};

    $scope.infoRamo_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                infoRamoSeleccionado = {};

                if (row.isSelected) { 
                    infoRamoSeleccionado = row.entity;
                }
                else { 
                    return;
                } 
            })

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!$scope.riesgo.docState) { 
                        $scope.riesgo.docState = 2;
                    }  
                }
            })
        }, 
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },

        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.infoRamo_ui_grid.columnDefs = [
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
            name: 'movimientoID',
            field: 'movimientoID',
            displayName: 'Movimiento',
            width: 80,

            cellFilter: 'numeroMovimientoFilter:row.entity:row.grid.appScope',

            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: 'marca',
            field: 'marca',
            displayName: 'Marca',
            width: 120,

            cellFilter: 'marcaAutoFilter',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: 'modelo',
            field: 'modelo',
            displayName: 'Modelo',
            width: 120,
            cellFilter: 'modeloAutoFilter:row.entity', 
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: 'ano',
            field: 'ano',
            displayName: 'Año',
            width: 80,

            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'number'
        },
        {
            name: 'placa',
            field: 'placa',
            displayName: 'Placa',
            width: 100,

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: 'serialCarroceria',
            field: 'serialCarroceria',
            displayName: 'Serial carrocería',
            width: 180,

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.eliminarInfoRamo(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]


    $scope.agregarInfoRamo = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Info ramo</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar agregar la información que corresponde al ramo.",
                                false).then();

            return;
        }

        $modal.open({
            templateUrl: 'client/html/riesgos/infoRamo/editarInfoRamoModal.html',
            controller: 'InfoRamo_editarItem_ModalController',
            size: 'md',
            resolve: {
                infoRamo: function () {
                    // creasmos un nuevo item y lo pasamos al modal 
                    const infoRamo = {
                        _id: new Mongo.ObjectID()._str, 
                        riesgoID: $scope.riesgo._id, 
                        movimientoID: movimientoSeleccionado._id, 
                        docState: 1
                    }; 

                    return infoRamo;
                },
                autosMarcas: function () {
                    return $scope.autosMarcas;
                },
            }
        }).result.then(
            function (resolve) {
                $scope.riesgos_infoRamo.push(resolve); 

                if (!$scope.riesgo.docState) {
                    $scope.riesgo.docState = 2;
                }

                return true;
            },
            function () {
                return true;
            })
    }

    $scope.editarInfoRamo = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Info ramo</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar agregar la información que corresponde al ramo.",
                                false).then();

            return;
        }

        if (!infoRamoSeleccionado || lodash.isEmpty(infoRamoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Info ramo</em>",
                                "Ud. no ha seleccionado un registro en la lista.<br />" +
                                "Seleccione el registro en la lista que desea editar.",
                                false).then();
            return;
        }

        $modal.open({
            templateUrl: 'client/html/riesgos/infoRamo/editarInfoRamoModal.html',
            controller: 'InfoRamo_editarItem_ModalController',
            size: 'md',
            resolve: {
                infoRamo: function () {
                    // creasmos un nuevo item y lo pasamos al modal 
                    return infoRamoSeleccionado;
                },
                autosMarcas: function () {
                    return $scope.autosMarcas;
                },
            }
        }).result.then(
            function () {
                if (!infoRamoSeleccionado.docState) {
                    infoRamoSeleccionado.docState = 2;
                }

                if (!$scope.riesgo.docState) {
                    $scope.riesgo.docState = 2;
                }

                return true;
            },
            function () {
                return true;
            })
    }

    $scope.eliminarInfoRamo = function (entity) {

        if (entity.docState && entity.docState === 1) {
            lodash.remove($scope.riesgos_infoRamo, (x => x._id === entity._id));

            if (!$scope.riesgo.docState) {
                $scope.riesgo.docState = 2;
            }
        } else { 
            entity.docState = 3; 

            if (!$scope.riesgo.docState) {
                $scope.riesgo.docState = 2;
            }
        }
    }

    $scope.infoRamo_ui_grid.data = [];
    $scope.infoRamo_ui_grid.data = $scope.riesgos_infoRamo;

    $scope.showProgress = false;
}])


// definimos los angular filters que usa el ui-grid 
angular.module("scrwebm.riesgos.infoRamo").filter('marcaAutoFilter', function () {
    return function (marcaID) {
        const marca = AutosMarcas.findOne(marcaID);
        return marca ? marca.marca : "Indefinido";
    };
})

angular.module("scrwebm.riesgos.infoRamo").filter('modeloAutoFilter', function () {
    return function (modeloID, entity) {
        const marca = AutosMarcas.findOne(entity.marca);
        
        const modelos = marca && marca.modelos ? marca.modelos : []; 
        let modelo = modelos.find((x) => x._id === modeloID); 

        if (!modelo) { 
            modelo = "Indefinido"; 
        }
        return modelo.modelo;
    };
})

angular.module("scrwebm.riesgos.infoRamo").filter('numeroMovimientoFilter', function () {
    return function (movimientoID, entity, gridScope) {
        // nótese como leemos el riesgo en el parent scope y luego sus movimientos; así encontramos el número del movimiento 
        const movimientos = gridScope.$parent && gridScope.$parent.riesgo && gridScope.$parent.riesgo.movimientos ?
                                                                           gridScope.$parent.riesgo.movimientos : []; 
        const movimiento = movimientos.find(x => x._id === movimientoID); 

        return movimiento && movimiento.numero ? movimiento.numero : 0;
    };
})