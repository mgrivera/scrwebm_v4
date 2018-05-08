

angular.module("scrwebM").controller("CausasSiniestroController",
  function ($scope, $stateParams, $meteor) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };


      $scope.causasSiniestro_ui_grid = {
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

      $scope.causasSiniestro_ui_grid.columnDefs = [
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
      let subscriptionHandle = null;

      subscriptionHandle =
      Meteor.subscribe('causasSiniestro', () => {

          $scope.helpers({
              causasSiniestro: () => {
                  return CausasSiniestro.find({}, { sort: { descripcion: 1 } });
              },
          });

          $scope.causasSiniestro_ui_grid.data = $scope.causasSiniestro;

          $scope.showProgress = false;
          $scope.$apply();
      })

      // ---------------------------------------------------------
      $scope.deleteItem = function (item) {
          item.docState = 3;
      }

      $scope.nuevo = function () {
          $scope.causasSiniestro.push({
              _id: new Mongo.ObjectID()._str,
              docState: 1
          });
      }


      $scope.save = function () {

          $scope.showProgress = true;

          // eliminamos los items eliminados; del $scope y del collection
          var editedItems = _.filter($scope.causasSiniestro, function (item) { return item.docState; });

          // nótese como validamos cada item antes de intentar guardar en el servidor

          var isValid = false;
          var errores = [];

          editedItems.forEach(function (item) {
              if (item.docState != 3) {
                  isValid = CausasSiniestro.simpleSchema().namedContext().validate(item);

                  if (!isValid) {
                      CausasSiniestro.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                          errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + ".");
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

          $scope.causasSiniestro = [];
          $scope.causasSiniestro_ui_grid.data = [];

          Meteor.call('causasSiniestroSave', editedItems, (err, result) => {

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

            // nótese como restablecemos el binding entre angular ($scope) y meteor (collection)
            $scope.helpers({
                causasSiniestro: () => {
                    return CausasSiniestro.find({}, { sort: { descripcion: 1 } });
                },
            });

            $scope.causasSiniestro_ui_grid.data = $scope.causasSiniestro;

            $scope.showProgress = false;
            $scope.$apply();
        })
      }
  });
