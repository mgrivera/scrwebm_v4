
import { Meteor } from 'meteor/meteor';

import angular from 'angular'; 
import lodash from 'lodash';

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import "./usuarios.html"; 

export default angular.module("scrwebm.administracion.usuarios", [])
                      .controller("UsuariosDatosPersonalesController", ['$scope', '$meteor', '$uibModal', 
function ($scope, $meteor, $uibModal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.usuarios_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
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
    }

    $scope.usuarios_ui_grid.columnDefs = [
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
            name: '_id',
            field: '_id',
            displayName: '_id',
            width: 150,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'username',
            field: 'username',
            displayName: 'Usuario',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'email',
            field: 'emails[0].address',
            displayName: 'Email',
            width: 180,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'personales.titulo',
            field: 'personales.titulo',
            displayName: 'Título',
            width: 75,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'personales.nombre',
            field: 'personales.nombre',
            displayName: 'Nombre',
            width: 165,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'personales.cargo',
            field: 'personales.cargo',
            displayName: 'Cargo',
            width: 165,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
    ]

    $scope.grabar = function () {
        // antes que nada, revisamos que haya algo que grabar
        if (!lodash.some($scope.users, u => { return u.docState; })) {
            DialogModal($uibModal, "<em>Usuarios</em>",
                `Aparentemente, <em>no se han efectuado cambios</em> en los datos.
                                     No hay nada que grabar.`, false).then();
            return;
        }

        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        var editedItems = lodash.filter($scope.users, function (item) { return item.docState; });

        $meteor.call('usuarios.save', editedItems).then(
            function (data) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: data
                });
                $scope.showProgress = false;
            },
            function (err) {

                const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
            });
    };

    $scope.showProgress = true;

    let subscriptionHandle = null;

    subscriptionHandle = Meteor.subscribe("allUsers", () => {
        $scope.helpers({
            users: () => {
                return Meteor.users.find({}, { sort: { 'emails.0.address': 1 } });
            },
        });

        $scope.usuarios_ui_grid.data = $scope.users;
        $scope.showProgress = false;
    })

    $scope.usuariosEditados = function () {
        return lodash.some($scope.users, u => { return u.docState; });
    };

    $scope.$on('$destroy', function () {
        subscriptionHandle.stop();
    })
}])