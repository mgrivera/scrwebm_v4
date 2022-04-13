
import { Meteor } from 'meteor/meteor'

import angular from 'angular'; 
import lodash from 'lodash';

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

import "./usuariosRoles.html"; 

export default angular.module("scrwebm.administracion.usuariosRoles", [])
                      .controller("UsuariosRolesController", ['$scope', '$meteor', '$uibModal', 
function ($scope, $meteor, $uibModal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    let usuarioSeleccionado = {};

    $scope.usuarios_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                usuarioSeleccionado = {};
                $scope.rolesUsuarioSeleccionado = [];
                $scope.usuariosRoles_ui_grid.data = [];

                if (row.isSelected) {
                    usuarioSeleccionado = row.entity;

                    if (lodash.isArray(usuarioSeleccionado.roles)) {
                        // agregamos los roles del usuario seleccionado al array intermedio para el 2do grid
                        usuarioSeleccionado.roles.forEach(rol => {
                            $scope.rolesUsuarioSeleccionado.push({ name: rol });
                        });
                    }

                    $scope.usuariosRoles_ui_grid.data = $scope.rolesUsuarioSeleccionado
                }
                else
                    return;
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
            displayName: 'Usuario',
            cellFilter: 'userNameOrEmailFilter',
            width: 250,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        }
    ]


    $scope.usuariosRoles_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: false,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function () {
        },
    }

    $scope.usuariosRoles_ui_grid.columnDefs = [
        {
            name: 'name',
            field: 'name',
            displayName: 'Rol',
            width: 200,
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
            cellTemplate: '<span ng-click="grid.appScope.deleteUserRol(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]

    $scope.deleteUserRol = function (item) {
        if (usuarioSeleccionado) {
            lodash.remove(usuarioSeleccionado.roles, r => { return r === item.name; });
            lodash.remove($scope.rolesUsuarioSeleccionado, r => { return r === item; });

            if (!usuarioSeleccionado.docState)
                usuarioSeleccionado.docState = 2;
        }
    }

    let selectedRol = {};
    let roles_ui_grid_gridApi;

    $scope.roles_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            roles_ui_grid_gridApi = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                selectedRol = {};

                if (row.isSelected) {
                    selectedRol = row.entity;

                    // agregamos (si no existe!) el rol seleccionado al array de roles del usuario
                    if (!lodash.isEmpty(usuarioSeleccionado)) {
                        if (!lodash.isArray(usuarioSeleccionado.roles))
                            usuarioSeleccionado.roles = [];

                        // el rol puede ya existir ...
                        if (!lodash.some(usuarioSeleccionado.roles, rol => { return rol === selectedRol.name; })) {
                            usuarioSeleccionado.roles.push(selectedRol.name);
                            $scope.rolesUsuarioSeleccionado.push({ name: selectedRol.name });

                            if (!usuarioSeleccionado.docState)
                                usuarioSeleccionado.docState = 2;

                            $scope.usuariosRoles_ui_grid.data = $scope.rolesUsuarioSeleccionado;
                        }
                    }
                }
                else
                    return;
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

    $scope.roles_ui_grid.columnDefs = [
        {
            name: 'name',
            field: 'name',
            displayName: 'Rol',
            width: 250,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        }
    ]

    $scope.grabar = function () {

        // antes que nada, revisamos que haya algo que grabar
        if (!lodash.some($scope.users, u => { return u.docState; })) {
            DialogModal($uibModal, "<em>Roles de usuarios</em>", "Aparentemente, <em>no se han efectuado cambios</em> en los datos. " +
                "No hay nada que grabar.", false).then();
            return;
        }

        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        var editedItems = lodash.filter($scope.users, function (item) { return item.docState; });

        // eliminamos la conexión entre angular y meteor
        $scope.users = [];
        $scope.usuarios_ui_grid.data = [];

        $meteor.call('usuariosRolesSave', editedItems).then(
            function (data) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: data
                });

                $meteor.subscribe("allUsers").then(
                    function () {
                        // nótese como restablecemos el binding entre angular ($scope) y meteor (collection)
                        $scope.helpers({
                            users: () => {
                                return Meteor.users.find({}, { sort: { 'emails.0.address': 1 } });
                            },
                        });

                        // al volver a hacer el binding en los ui-grids, se eliminan cualquier selección que exista en algunos rows ...
                        $scope.usuarios_ui_grid.data = $scope.users;
                        $scope.showProgress = false;

                        $scope.rolesUsuarioSeleccionado = [];
                        $scope.usuariosRoles_ui_grid.data = $scope.rolesUsuarioSeleccionado;

                        // para deseleccionar los rows que puedan estarlo ...
                        roles_ui_grid_gridApi.grid.selection.selectedCount = 0;
                        roles_ui_grid_gridApi.grid.selection.selectAll = false;
                    },
                    function () {
                    }
                );
            },
            function (err) {

                var errorMessage = err.message ? err.message : err.toString();

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                // nótese como restablecemos el binding entre angular ($scope) y meteor (collection)
                $scope.helpers({
                    users: () => {
                        return Meteor.users.find({}, { sort: { 'emails.0.address': 1 } });
                    },
                });

                editedItems.forEach(function (item) {
                    const itemFoundInScope = lodash.find($scope.users, function (itemInScope) { return itemInScope._id == item._id; });

                    // si el item no está en el $scope, es que, probablemente, no pasó la validación y lo agregamos nuevamente al $scope
                    if (!itemFoundInScope) {
                        $scope.users.push(item);
                    }
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
        
    // Meteor.roles siempre existe en el cliente
    $scope.helpers({
        roles: () => {
            return Meteor.roles.find();
        },
    })

    $scope.roles_ui_grid.data = $scope.roles;

    $scope.rolesUsuarioSeleccionado = [];
    $scope.usuariosRoles_ui_grid.data = $scope.rolesUsuarioSeleccionado;

    $scope.usuariosEditados = function() {
        return lodash.some($scope.users, u => { return u.docState; });
    }

    $scope.$on('$destroy', function () {
        subscriptionHandle.stop();
    })
}])