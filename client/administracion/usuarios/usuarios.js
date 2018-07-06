

import lodash from 'lodash';

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebM").controller("UsuariosDatosPersonalesController",
 ['$scope', '$stateParams', '$meteor', '$modal',
  function ($scope, $stateParams, $meteor, $modal) {

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
          enableCellEditOnFocus: true,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

              usuarioSeleccionado = {};

              if (row.isSelected) {
                    usuarioSeleccionado = row.entity;
                }
                else
                    return;
                });

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
               },
               {
                   name: 'personales.titulo',
                   field: 'personales.titulo',
                   displayName: 'Título',
                   width: 80,
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
                   width: 200,
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
                   width: 200,
                   headerCellClass: 'ui-grid-leftCell',
                   cellClass: 'ui-grid-leftCell',
                   enableColumnMenu: false,
                   enableCellEdit: true,
                   enableSorting: true,
                   type: 'string'
               },
      ];


      $scope.grabar = function () {
          // antes que nada, revisamos que haya algo que grabar
            if (!lodash.some($scope.users, u => { return u.docState; })) {
                DialogModal($modal, "<em>Usuarios</em>",
                                    `Aparentemente, <em>no se han efectuado cambios</em> en los datos.
                                     No hay nada que grabar.`, false).then();
                return;
            };

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

                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
            });
      };

    //   $scope.usersArray = [];
      $scope.showProgress = true;

      $meteor.subscribe("allUsers").then(
          function(subscriptionHandle) {

              $scope.helpers({
                  users: () => {
                      return Meteor.users.find({}, { sort: { 'emails.0.address': 1 }});
                  },
              });

              $scope.usuarios_ui_grid.data = $scope.users;
              $scope.showProgress = false;
          },
          function() {
          }
      );

      $scope.usuariosEditados = function() {
          return lodash.some($scope.users, u => { return u.docState; });
      };
  }
]);
