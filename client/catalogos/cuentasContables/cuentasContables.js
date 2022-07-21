
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 

import angular from 'angular'; 
import lodash from 'lodash';

import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { userHasRole } from '/client/imports/generales/userHasRole';

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CuentasContables } from '/imports/collections/catalogos/cuentasContables';
import { replaceAllInstances } from '/imports/funciones/texto/replaceAllInstances'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

angular.module("scrwebm")
       .controller("CuentasContablesController", ['$scope', '$uibModal', 
function ($scope, $uibModal) {

    $scope.catalogosEditar = userHasRole('catalogos') ||
                             userHasRole('catalogos_generales') ? true : false; 

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {};

    if (companiaSeleccionada) {
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1, abreviatura: 1, } });
    }

    // para mostrar un ddl con los tipos de cuenta posible 
    $scope.tiposCuentaContable = [
        { tipo: "T", descripcion: "T", },
        { tipo: "D", descripcion: "D", },
    ]

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) {
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }
    else {
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    $scope.cuentasContables_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        enableFiltering: true,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (colDef.field === "cuentaEditada") {
                        rowEntity.cuenta = replaceAllInstances(rowEntity.cuentaEditada, " ", "");
                    }
                    if (!rowEntity.docState) {
                        rowEntity.docState = 2;
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

    $scope.cuentasContables_ui_grid.columnDefs = [
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
            enableFiltering: false,
            width: 25
        },
        {
            name: 'cuentaEditada',
            field: 'cuentaEditada',
            displayName: 'Cuenta (editada)',
            width: 180,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            enableFiltering: true,
            type: 'string'
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
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'totDet',
            field: 'totDet',
            displayName: 'Tot/Det',
            width: 70,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposCuentaContable,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposCuentaContable:"tipo":"descripcion"',

            enableFiltering: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cuenta',
            field: 'cuenta',
            displayName: 'Cuenta',
            width: 140,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false,
            width: 25
        }
    ]

    $scope.showProgress = true;

    // ---------------------------------------------------------
    // subscriptions ...
    const subscriptionHandle = Meteor.subscribe('cuentasContables', () => {

        $scope.helpers({
            cuentasContables: () => {
                return CuentasContables.find({ cia: companiaSeleccionadaDoc._id }, { sort: { cuentaContable: 1 } });
            },
        })

        $scope.cuentasContables_ui_grid.data = $scope.cuentasContables;

        $scope.showProgress = false;
        $scope.$apply();
    })
    // ---------------------------------------------------------

    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.cuentasContables, (x) => { return x._id === item._id; });
        }
        else if (item.docState && item.docState === 3) {
            // permitimos hacer un 'undelete' de un item que antes se había eliminado en la lista (antes de grabar) ...
            delete item.docState;
        }
        else {
            item.docState = 3;
        }
    }

    $scope.nuevo = function () {
        $scope.cuentasContables.push({
            _id: new Mongo.ObjectID()._str,
            cia: companiaSeleccionadaDoc._id,
            docState: 1
        });
    }

    $scope.save = function () {
        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        var editedItems = lodash.filter($scope.cuentasContables, function (item) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar en el servidor
        var isValid = false;
        var errores = [];

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = CuentasContables.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    CuentasContables.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + CuentasContables.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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
        $scope.cuentasContables_ui_grid.data = [];
        $scope.cuentasContables = [];

        Meteor.call('cuentasContables.save', editedItems, (err, result) => {

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
                cuentasContables: () => {
                    return CuentasContables.find({ cia: companiaSeleccionadaDoc._id }, { sort: { cuentaContable: 1 } });
                },
            })

            $scope.cuentasContables_ui_grid.data = $scope.cuentasContables;

            $scope.showProgress = false;
            $scope.$apply();
        })
    }

    $scope.importarDesdeExcel = function () {

        // para abrir un modal que permita al usuario leer un doc excel desde el cliente e importar cada row
        // como una cuenta contable
        $uibModal.open({
            templateUrl: 'client/catalogos/cuentasContables/importarDesdeExcelModal.html',
            controller: 'CuentasContablesImportarDesdeExcel_Controller',
            size: 'lg',
            resolve: {
                cuentasContables: () => {
                    return $scope.cuentasContables;
                },
                cuentasContables_ui_grid: () => {
                    return $scope.cuentasContables_ui_grid;
                },
                ciaSeleccionada: () => {
                    return companiaSeleccionadaDoc;
                },
            },
        }).result.then(
            function () {
                return true;
            },
            function () {
                return true;
            })
    }

    $scope.exportarExcel = function () {

        $uibModal.open({
            templateUrl: 'client/catalogos/cuentasContables/exportarExcelModal.html',
            controller: 'CuentasContablesExportarExcel_Controller',
            size: 'md',
            resolve: {
                ciaSeleccionada: () => {
                    return companiaSeleccionadaDoc;
                },
            },
        }).result.then(
            function () {
                return true;
            },
            function () {
                return true;
            })
    }

    $scope.$on('$destroy', function () {
        subscriptionHandle.stop();
    })
}])