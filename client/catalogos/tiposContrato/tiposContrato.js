
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import angular from 'angular'; 
import lodash from 'lodash'; 

import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 

angular.module("scrwebm").controller("TiposContratoController", ['$scope',  
function ($scope) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.tiposContrato_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
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
        }
    };

    $scope.tiposContrato_ui_grid.columnDefs = [
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
            width: 250,
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
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'prefijoReferencia',
            field: 'prefijoReferencia',
            displayName: 'Prefijo referencia',
            width: 200,
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
    ];

    $scope.showProgress = true;

    // ---------------------------------------------------------
    // subscriptions ...
    Meteor.subscribe('tiposContrato', () => {

        $scope.helpers({
            tiposContrato: () => {
                return TiposContrato.find({}, { sort: { descripcion: 1 } });
            },
        });

        $scope.tiposContrato_ui_grid.data = $scope.tiposContrato;
        $scope.showProgress = false;
    })
    // ---------------------------------------------------------

    $scope.deleteItem = function (item) {
        item.docState = 3;
    };

    $scope.nuevo = function () {
        $scope.tiposContrato.push({
            _id: new Mongo.ObjectID()._str,
            docState: 1
        });
    };

    $scope.save = function () {

        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        var editedItems = lodash.filter($scope.tiposContrato, function (item) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar en el servidor
        var isValid = false;
        var errores = [];

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = TiposContrato.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    TiposContrato.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + TiposContrato.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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

                        if (previous == "")
                            // first value
                            return current;
                        else
                            return previous + "<br />" + current;
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }

        // eliminamos la conexión entre angular y meteor
        $scope.tiposContrato = [];
        $scope.tiposContrato_ui_grid.data = [];

        Meteor.call('tiposContratoSave', editedItems, (err, result) => {

            if (err) {
                const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result
            });

            $scope.helpers({
                tiposContrato: () => {
                    return TiposContrato.find({}, { sort: { descripcion: 1 } });
                },
            });

            $scope.tiposContrato_ui_grid.data = $scope.tiposContrato;

            $scope.showProgress = false;
            $scope.$apply();
        })
    }
}])