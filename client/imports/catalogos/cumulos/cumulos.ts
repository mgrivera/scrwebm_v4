

import * as angular from 'angular'; 
import * as lodash from 'lodash'; 

import { mensajeErrorDesdeMethod_preparar } from '../../generales/mensajeDeErrorDesdeMethodPreparar'; 
import { DialogModal } from '../../generales/angularGenericModal'; 

import { Cumulos } from 'imports/collections/catalogos/cumulos'; 

angular.module("scrwebm").controller("CumulosController", ['$scope', '$modal', function ($scope, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    let cumuloSeleccionado = {} as any;

    $scope.list_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                cumuloSeleccionado = {};

                if (row.isSelected) {
                    cumuloSeleccionado = row.entity;

                    $scope.zonas_ui_grid.data = [];

                    if (cumuloSeleccionado.zonas) { 
                        $scope.zonas_ui_grid.data = cumuloSeleccionado.zonas;
                    }   
                }
                else { 
                    $scope.zonas_ui_grid.data = [];
                    return;
                }   
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
                    }
                }
            });
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.list_ui_grid.columnDefs = [
            {
                name: 'docState',
                field: 'docState',
                displayName: '',
                cellTemplate:
                    '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableColumnMenu: false,
                enableSorting: false,
                width: 25
            },
            {
                name: 'descripcion',
                field: 'descripcion',
                displayName: 'Descripción',
                width: 130,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
            {
                name: 'abreviatura',
                field: 'abreviatura',
                displayName: 'Abreviatura',
                width: 80,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
            {
                name: 'delButton',
                displayName: '',
                cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableSorting: false,
                width: 25
            }
    ]

    $scope.showProgress = true;

    // ---------------------------------------------------------
    // subscriptions ...
    let subscriptionHandle = {};

    subscriptionHandle =
    Meteor.subscribe('cumulos', () => {

        $scope.helpers({
            cumulos: () => {
                return Cumulos.find({}, { sort: { descripcion: 1 } });
            },
        });

        $scope.list_ui_grid.data = $scope.cumulos;
        $scope.zonas_ui_grid.data = [];

        $scope.showProgress = false;
        $scope.$apply();
    })
    // ---------------------------------------------------------

    $scope.deleteItem = function (item) {

        if (item.docState && item.docState === 1) {
            lodash.remove($scope.cumulos, (x: any) => x._id === item._id);
            cumuloSeleccionado = {};
            return; 
        }

        item.docState = 3;
        cumuloSeleccionado = {};
    }

    $scope.nuevo = function () {
        $scope.cumulos.push({
            _id: new Mongo.ObjectID()._str,
            docState: 1
        });

        cumuloSeleccionado = {};
    }


    $scope.zonas_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!cumuloSeleccionado.docState) { 
                        cumuloSeleccionado.docState = 2;
                    }
                }
            });
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.zonas_ui_grid.columnDefs = [
            {
                name: 'descripcion',
                field: 'descripcion',
                displayName: 'Descripción',
                width: 130,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
            {
                name: 'abreviatura',
                field: 'abreviatura',
                displayName: 'Abreviatura',
                width: 80,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
            {
                name: 'delButton',
                displayName: '',
                cellTemplate: '<span ng-click="grid.appScope.eliminarZona(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableSorting: false,
                width: 25
            }
    ]

    $scope.eliminarZona = (item) => {

        if (!cumuloSeleccionado) {
            DialogModal($modal,
                "<em>Cúmulos - Eliminar una zona</em>",
                "Ud. debe seleccionar un cúmulo en la lista, antes de intentar eliminar una de sus zonas.",
                false).then();
            return;
        }

        lodash.remove(cumuloSeleccionado.zonas, function(p: any) { return p._id === item._id; });

        if (!cumuloSeleccionado.docState) {
            cumuloSeleccionado.docState = 2;
        }
    }

    $scope.agregarZona = () => {

        if (!cumuloSeleccionado || lodash.isEmpty(cumuloSeleccionado)) {
            DialogModal($modal,
                "<em>Cúmulos - Agregar una zona</em>",
                "Ud. debe seleccionar un cúmulo en la lista, antes de intentar agregar una zona.",
                false).then();
            return;
        }

        var zona = {
            _id: new Mongo.ObjectID()._str,
        };

        if (!cumuloSeleccionado.zonas) {
            cumuloSeleccionado.zonas = [];
        }

        cumuloSeleccionado.zonas.push(zona);

        $scope.zonas_ui_grid.data = cumuloSeleccionado.zonas;

        if (!cumuloSeleccionado.docState) {
            cumuloSeleccionado.docState = 2;
        }
    }

    $scope.save = function () {

        $scope.showProgress = true;

        var editedItems = $scope.cumulos.filter((item) => { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar en el servidor
        var isValid = false;
        var errores = [];

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = Cumulos.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    Cumulos.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + "." as never);
                    });
                }
            }
        })

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                    errores.reduce(function (previous, current) {

                        if (previous == "") { 
                            // first value
                            return current;
                        } 
                        else { 
                            return previous + "<br />" + current;
                        } 
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }

        cumuloSeleccionado = {};

        $scope.list_ui_grid.data = [];
        $scope.zonas_ui_grid.data = [];

        Meteor.call('cumulos.save', editedItems, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.helpers({
                    cumulos: () => {
                        return Cumulos.find({}, { sort: { descripcion: 1 } });
                    },
                });

                $scope.list_ui_grid.data = $scope.cumulos;

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result
            });

            // nótese como restablecemos el binding entre angular ($scope) y meteor (collection)
            $scope.helpers({
                cumulos: () => {
                    return Cumulos.find({}, { sort: { descripcion: 1 } });
                },
            });

            $scope.list_ui_grid.data = $scope.cumulos;

            $scope.showProgress = false;
            $scope.$apply();
        });
    }

}])