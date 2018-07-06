

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

angular.module("scrwebM").controller("EmpresasUsuarias_Controller",
 ['$scope', '$stateParams', '$meteor',
  function ($scope, $stateParams, $meteor) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      }

      $scope.ciasUsuarias_ui_grid = {
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
      }

      $scope.ciasUsuarias_ui_grid.columnDefs = [
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
                   name: 'nombre',
                   field: 'nombre',
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
                   name: 'nombreCorto',
                   field: 'nombreCorto',
                   displayName: 'Nombre corto',
                   width: 100,
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
                   name: 'rif',
                   field: 'rif',
                   displayName: 'Rif',
                   width: 100,
                   headerCellClass: 'ui-grid-leftCell',
                   cellClass: 'ui-grid-leftCell',
                   enableColumnMenu: false,
                   enableCellEdit: true,
                   enableSorting: true,
                   type: 'string'
               },
               {
                   name: 'direccion',
                   field: 'direccion',
                   displayName: 'Dirección',
                   width: 250   ,
                   headerCellClass: 'ui-grid-leftCell',
                   cellClass: 'ui-grid-leftCell',
                   enableColumnMenu: false,
                   enableCellEdit: true,
                   enableSorting: true,
                   type: 'string'
               },
               {
                   name: 'telefono',
                   field: 'telefono',
                   displayName: 'Teléfono',
                   width: 100,
                   headerCellClass: 'ui-grid-leftCell',
                   cellClass: 'ui-grid-leftCell',
                   enableColumnMenu: false,
                   enableCellEdit: true,
                   enableSorting: true,
                   type: 'string'
               },
               {
                   name: 'fax',
                   field: 'fax',
                   displayName: 'Fax',
                   width: 100,
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
      let subscriptionHandle = null;

      subscriptionHandle =
      Meteor.subscribe('empresasUsuarias', () => {

          $scope.helpers({
              empresasUsuarias: () => {
                  // las cuenas bancarias se registran para la cia seleccionada
                  return EmpresasUsuarias.find({}, { sort: { nombre: 1 } });
              },
          });

          $scope.ciasUsuarias_ui_grid.data = $scope.empresasUsuarias;

          let subscriptionHandle2 = null;

          subscriptionHandle2 =
          Meteor.subscribe('companiaSeleccionada', () => {

              $scope.helpers({
                  ciaSeleccionada: () => {
                      // las cuenas bancarias se registran para la cia seleccionada
                      return CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
                  },
              });

              $scope.showProgress = false;
              $scope.$apply();
          })
      })
      // ---------------------------------------------------------


      $scope.deleteItem = function (item) {
          item.docState = 3;
      }

      $scope.nuevo = function () {
          $scope.empresasUsuarias.push({
              _id: new Mongo.ObjectID()._str,
              docState: 1
          });
      }


      $scope.save = function () {

          $scope.showProgress = true;

          // eliminamos los items eliminados; del $scope y del collection
          var editedItems = _.filter($scope.empresasUsuarias, function (item) { return item.docState; });

          // nótese como validamos cada item antes de intentar guardar en el servidor

          var isValid = false;
          var errores = [];

          editedItems.forEach(function (item) {
              if (item.docState != 3)
              {
                  isValid = EmpresasUsuarias.simpleSchema().namedContext().validate(item);

                  if (!isValid) {
                      EmpresasUsuarias.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                          errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + ".");
                      });
                  }
              }
              else
              {
                  // si el usuario intenta eliminar una compañía, rechazamos si el la cia seleccionada
                  if ($scope.ciaSeleccionada && $scope.ciaSeleccionada.companiaID && $scope.ciaSeleccionada.companiaID == item._id) {
                      errores.push("La compañía <b><em>" + item.nombre + "</em></b> no puede ser eliminada, pues es la que ahora está seleccionada para el usuario.");
                  }
              }
          })

          if (errores && errores.length) {
              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                      errores.reduce(function(previous, current) {

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

          $scope.empresasUsuarias = [];
          $scope.ciasUsuarias_ui_grid.data= [];

          Meteor.call('empresasUsuariasSave', editedItems, (err, result) => {

              if (err) {
                  let errorMessage = mensajeErrorDesdeMethod_preparar(err);

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
                    empresasUsuarias: () => {
                        // las cuenas bancarias se registran para la cia seleccionada
                        return EmpresasUsuarias.find({}, { sort: { nombre: 1 } });
                    },
                });

                $scope.ciasUsuarias_ui_grid.data = $scope.empresasUsuarias;

                $scope.showProgress = false;
                $scope.$apply();
            });
      }
  }
]);
