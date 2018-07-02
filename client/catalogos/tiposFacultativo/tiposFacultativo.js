
import { TiposFacultativo } from '/imports/collections/catalogos/tiposFacultativo'; 

angular.module("scrwebM").controller("TiposFacultativoController", ['$scope', '$stateParams', '$meteor',
  function ($scope, $stateParams, $meteor) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.tiposFacultativo_ui_grid = {
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

      $scope.tiposFacultativo_ui_grid.columnDefs = [
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
      $meteor.subscribe('tiposFacultativo').then(function (subscriptionHandle) {

          $scope.helpers({
              tiposFacultativo: () => {
                  return TiposFacultativo.find({}, { sort: { descripcion: 1 } });
              },
          });

          $scope.tiposFacultativo_ui_grid.data = $scope.tiposFacultativo;
          $scope.showProgress = false;
      });
      // ---------------------------------------------------------

      $scope.deleteItem = function (item) {
          item.docState = 3;
      };

      $scope.nuevo = function () {
          $scope.tiposFacultativo.push({
              _id: new Mongo.ObjectID()._str,
              docState: 1
          });

          $scope.tiposFacultativo_ui_grid.data = $scope.tiposFacultativo;
      };


      $scope.save = function () {
          $scope.showProgress = true;

          // eliminamos los items eliminados; del $scope y del collection
          var editedItems = _.filter($scope.tiposFacultativo, function (item) { return item.docState; });

          // nótese como validamos cada item antes de intentar guardar en el servidor
          var isValid = false;
          var errores = [];

          editedItems.forEach(function (item) {
              if (item.docState != 3) {
                  isValid = TiposFacultativo.simpleSchema().namedContext().validate(item);

                  if (!isValid) {
                      TiposFacultativo.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                          errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + TiposFacultativo.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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
          $scope.tiposFacultativo_ui_grid.data = [];
          $scope.tiposFacultativo = [];

          Meteor.call('tiposFacultativoSave', editedItems, (err, result) => {

              if (err) {
                  let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

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
                    tiposFacultativo: () => {
                        return TiposFacultativo.find({}, { sort: { descripcion: 1 } });
                    },
                });

                $scope.tiposFacultativo_ui_grid.data = $scope.tiposFacultativo;

                $scope.showProgress = false;
                $scope.$apply();
            })
      }
  }
]);
