


import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

angular.module("scrwebM").controller("Utilitarios_TablaNumerosReferencia_Controller",
 ['$scope', '$stateParams', '$meteor',
  function ($scope, $stateParams, $meteor) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      }

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      if (companiaSeleccionada) {
          var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
      }

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc) {
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      }
      else {
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      }
      // ------------------------------------------------------------------------------------------------

      $scope.numerosReferencia_ui_grid = {
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

      $scope.numerosReferencia_ui_grid.columnDefs = [
               {
                   name: 'docState',
                   field: 'docState',
                   displayName: '',
                   cellTemplate:
                        '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                        '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                        '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
                   enableCellEdit: false,
                   enableColumnMenu: false,
                   enableSorting: false,
                   width: 25
               },
              {
                  name: 'origen',
                  field: 'origen',
                  displayName: 'Origen',
                  width: 120,
                  headerCellClass: 'ui-grid-leftCell',
                  cellClass: 'ui-grid-leftCell',
                  enableColumnMenu: false,
                  enableCellEdit: false,
                  enableSorting: true,
                  type: 'string'
              },
              {
                  name: 'prefijoReferencia',
                  field: 'prefijoReferencia',
                  displayName: 'Prefijo',
                  width: 120,
                  headerCellClass: 'ui-grid-leftCell',
                  cellClass: 'ui-grid-leftCell',
                  enableColumnMenu: false,
                  enableCellEdit: false,
                  enableSorting: true,
                  type: 'string'
              },
              {
                  name: 'ano',
                  field: 'ano',
                  displayName: 'Año',
                  width: 120,
                  headerCellClass: 'ui-grid-centerCell',
                  cellClass: 'ui-grid-centerCell',
                  enableColumnMenu: false,
                  enableCellEdit: false,
                  enableSorting: true,
                  type: 'number'
              },
              {
                  name: 'cia',
                  field: 'cia',
                  displayName: 'Cia usuaria',
                  width: 120,
                  headerCellClass: 'ui-grid-leftCell',
                  cellClass: 'ui-grid-leftCell',
                  cellFilter: 'empresaUsuariaSeleccionadaFilter',
                  enableColumnMenu: false,
                  enableCellEdit: false,
                  enableSorting: true,
                  type: 'string'
              },
              {
                  name: 'consecutivo',
                  field: 'consecutivo',
                  displayName: 'Consecutivo',
                  width: 120,
                  headerCellClass: 'ui-grid-leftCell',
                  cellClass: 'ui-grid-leftCell',
                  enableColumnMenu: false,
                  enableCellEdit: true,
                  enableSorting: true,
                  type: 'number'
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
      let referencias_SubscriptionHandle = null;

      referencias_SubscriptionHandle =
      Meteor.subscribe('referencias', $scope.companiaSeleccionada._id, () => {

          $scope.helpers({
              referencias: () => {
                  return Referencias.find(
                      { cia: $scope.companiaSeleccionada._id, },
                      { sort: { ano: 1, origen: 1, prefijoReferencia: 1, consecutivo: 1, } });
              },
          })

          $scope.numerosReferencia_ui_grid.data = $scope.referencias;
          $scope.showProgress = false;
      })
      // ---------------------------------------------------------

      $scope.deleteItem = function (item) {
          item.docState = 3;
      }

      $scope.save = function () {
          $scope.showProgress = true;

          // eliminamos los items eliminados; del $scope y del collection
          var editedItems = _.filter($scope.referencias, function (item) { return item.docState; });

          // nótese como validamos cada item antes de intentar guardar en el servidor
          var isValid = false;
          var errores = [];

          editedItems.forEach(function (item) {
              if (item.docState != 3) {
                  isValid = Referencias.simpleSchema().namedContext().validate(item);

                  if (!isValid) {
                      Referencias.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                          errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Referencias.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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

          $scope.referencias.length = 0;

          Meteor.call('referenciasSave', editedItems, (err, result) => {

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
            })

            $scope.helpers({
                referencias: () => {
                    return Referencias.find(
                        { cia: $scope.companiaSeleccionada._id, },
                        { sort: { ano: 1, origen: 1, prefijoReferencia: 1, consecutivo: 1, } });
                },
            })

            $scope.numerosReferencia_ui_grid.data = $scope.referencias;

            $scope.showProgress = false;
            $scope.$apply();
        })
      }
  }
])
