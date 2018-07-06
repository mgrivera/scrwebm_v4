

import lodash from 'lodash';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Companias } from '/imports/collections/catalogos/companias'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller("CompaniasController",
 ['$scope', '$stateParams', '$meteor',
  function ($scope, $stateParams, $meteor) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.tiposCompania = [
                                  { descripcion: 'Ajustador', tipo: 'AJUST' },
                                  { descripcion: 'Corredor de seguros', tipo: 'CORR' },
                                  { descripcion: 'Productor', tipo: 'PROD' },
                                  { descripcion: 'Reasegurador', tipo: 'REA' },
                                  { descripcion: 'Corredor de reaseguro', tipo: 'CORRR' },
                                  { descripcion: 'Compañía de seguro', tipo: 'SEG' },
                             ];

        $scope.emailCobranzas = [
                                    { descripcion: '', numero: null },
                                    { descripcion: '1', numero: 1 },
                                    { descripcion: '2', numero: 2 },
                                    { descripcion: '3', numero: 3 },
                                    { descripcion: '4', numero: 4 },
                                    { descripcion: '5', numero: 5 }
                                 ];

        // -----------------------------------------------------------------
        // Grid de compañpias
        // -----------------------------------------------------------------
        $scope.companiaSeleccionada = {};
        let gridApi = null;

        $scope.companias_ui_grid = {
            enableSorting: true,
            showColumnFooter: false,
            enableCellEdit: false,
            enableCellEditOnFocus: true,
            enableRowSelection: true,
            enableRowHeaderSelection: true,
            multiSelect: false,
            enableSelectAll: false,
            selectionRowHeaderWidth: 35,
            rowHeight: 25,
            onRegisterApi: function (gridApi) {

                // guardamos el row que el usuario seleccione
                gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                    //debugger;
                    $scope.companiaSeleccionada = {};

                    if (row.isSelected) {
                        $scope.companiaSeleccionada = row.entity;

                        $scope.personas_ui_grid.data = [];

                        if ($scope.companiaSeleccionada.personas)
                            $scope.personas_ui_grid.data = $scope.companiaSeleccionada.personas;
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

        $scope.companias_ui_grid.columnDefs = [
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
               enableCellEdit: false,
               enableSorting: true,
               type: 'string'
           },
           {
               name: 'tipo',
               field: 'tipo',
               displayName: 'Tipo',
               width: 120,
               cellFilter: 'mapDropdown:row.grid.appScope.tiposCompania:"tipo":"descripcion"',
               headerCellClass: 'ui-grid-leftCell',
               cellClass: 'ui-grid-leftCell',
               enableColumnMenu: false,
               enableCellEdit: false,
               type: 'string'
           },
           {
               name: 'nosotros',
               field: 'nosotros',
               displayName: 'Nosotros',
               width: 80,
               headerCellClass: 'ui-grid-centerCell',
               cellTemplate:
                    '<input type="checkbox" ng-model="row.entity[col.field]" ng-disabled="true" style="font: xx-small; " />',
               cellClass: 'ui-grid-centerCell',
               enableColumnMenu: false,
               enableCellEdit: false,
               enableSorting: true,
               type: 'boolean'
           },
           {
               name: 'delButton',
               displayName: '',
               cellTemplate: '<span ng-click="grid.appScope.deleteCompania(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
               enableCellEdit: false,
               enableSorting: false,
               width: 25
           }
        ];

        $scope.deleteCompania = (item) => {
            item.docState = 3;
        };

        $scope.nuevo = () => {
            var compania = {
                _id: new Mongo.ObjectID()._str,
                nosotros: false,
                docState: 1 };

            $scope.companias.push(compania);
            $scope.companiaSeleccionada = compania;
        };

        $scope.setIsEdited = (compania) => {
            if (!compania.docState)
              compania.docState = 2;
        };


        // -----------------------------------------------------------------
        // Grid de personas
        // -----------------------------------------------------------------
        let personaSeleccionada = {};

        $scope.personas_ui_grid = {
            enableSorting: false,
            showColumnFooter: false,
            enableCellEdit: false,
            enableCellEditOnFocus: true,
            enableRowSelection: true,
            enableRowHeaderSelection: true,
            multiSelect: false,
            enableSelectAll: false,
            selectionRowHeaderWidth: 35,
            rowHeight: 25,
            onRegisterApi: function (gridApi) {

                // guardamos el row que el usuario seleccione
                gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                    personaSeleccionada = {};

                    if (row.isSelected)
                        personaSeleccionada = row.entity;
                    else
                        return;
                });

                // marcamos el contrato como actualizado cuando el usuario edita un valor
                gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                    if (newValue != oldValue)
                        if (!$scope.companiaSeleccionada.docState)
                            $scope.companiaSeleccionada.docState = 2;
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

        $scope.personas_ui_grid.columnDefs = [
           {
               name: 'titulo',
               field: 'titulo',
               displayName: 'Título',
               width: 60,
               headerCellClass: 'ui-grid-leftCell',
               cellClass: 'ui-grid-leftCell',
               enableColumnMenu: false,
               enableCellEdit: true,
               enableSorting: true,
               type: 'string'
           },
           {
               name: 'nombre',
               field: 'nombre',
               displayName: 'Nombre',
               width: 100,
               headerCellClass: 'ui-grid-leftCell',
               cellClass: 'ui-grid-leftCell',
               enableColumnMenu: false,
               enableCellEdit: true,
               enableSorting: true,
               type: 'string'
           },
           {
               name: 'cargo',
               field: 'cargo',
               displayName: 'Cargo',
               width: 100,
               headerCellClass: 'ui-grid-leftCell',
               cellClass: 'ui-grid-leftCell',
               enableColumnMenu: false,
               enableCellEdit: true,
               enableSorting: true,
               type: 'string'
           },
           {
               name: 'departamento',
               field: 'departamento',
               displayName: 'Departamento',
               width: 100,
               headerCellClass: 'ui-grid-leftCell',
               cellClass: 'ui-grid-leftCell',
               enableColumnMenu: false,
               enableCellEdit: true,
               enableSorting: true,
               type: 'string'
           },
           {
               name: 'email',
               field: 'email',
               displayName: 'Email',
               width: 150,
               headerCellClass: 'ui-grid-leftCell',
               cellClass: 'ui-grid-leftCell',
               enableColumnMenu: false,
               enableCellEdit: true,
               enableSorting: true,
               type: 'string'
           },
           {
               name: 'emailCobranzas',
               field: 'emailCobranzas',
               displayName: 'Email cobranzas',
               width: 100,

               editableCellTemplate: 'ui-grid/dropdownEditor',
               editDropdownIdLabel: 'numero',
               editDropdownValueLabel: 'descripcion',
               editDropdownOptionsArray: $scope.emailCobranzas,
               cellFilter: 'mapDropdown:row.grid.appScope.emailCobranzas:"numero":"descripcion"',

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
               cellTemplate: '<span ng-click="grid.appScope.eliminarPersona(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
               enableCellEdit: false,
               enableSorting: false,
               width: 25
           }
        ];

        $scope.eliminarPersona = (item) => {

            if (!$scope.companiaSeleccionada) {
                DialogModal($modal,
                    "<em>Compañías - Personas</em>",
                    "Seleccione una compañía antes de intentar eliminar una de sus personas.",
                    false).then();
                return;
            };

            lodash.remove($scope.companiaSeleccionada.personas, function(p) { return p._id === item._id; });

            if (!$scope.companiaSeleccionada.docState) {
                $scope.companiaSeleccionada.docState = 2;
            }
        }

        $scope.agregarPersona = () => {

            if (!$scope.companiaSeleccionada) {
                DialogModal($modal,
                    "<em>Compañías - Personas</em>",
                    "Seleccione una compañía antes de intentar agregar una persona.",
                    false).then();
                return;
            }

            var persona = {
                _id: new Mongo.ObjectID()._str,
                titulo: 'Sr.' };

            if (!$scope.companiaSeleccionada.personas) {
                $scope.companiaSeleccionada.personas = [];
            }

            $scope.companiaSeleccionada.personas.push(persona);
            personaSeleccionada = persona;

            $scope.personas_ui_grid.data = $scope.companiaSeleccionada.personas;

            if (!$scope.companiaSeleccionada.docState) {
                $scope.companiaSeleccionada.docState = 2;
            }
        }


      $scope.showProgress = true;

      // ---------------------------------------------------------
      // subscriptions ...
      $meteor.subscribe('companias').then(
          function (subscriptionHandle) {

              $scope.helpers({
                  companias: () => {
                      return Companias.find({}, { sort: { nombre: 1 } });
                  },
              });

              $scope.companias_ui_grid.data = $scope.companias;
              $scope.showProgress = false;
      });


      $scope.save = () => {
          $scope.showProgress = true;

          // eliminamos los items eliminados; del $scope y del collection
          var editedItems = _.filter($scope.companias, function (item) { return item.docState; });

          // nótese como validamos cada item antes de intentar guardar en el servidor
          var isValid = false;
          var errores = [];

          editedItems.forEach(function (item) {
              if (item.docState != 3) {
                  isValid = Companias.simpleSchema().namedContext().validate(item);

                  if (!isValid) {
                      Companias.simpleSchema().namedContext().validationErrors().forEach(function (error) {
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

          // eliminamos la conexión entre angular y meteor
          $scope.companias = [];
          $scope.companias_ui_grid.data = [];

          Meteor.call('companiasSave', editedItems, (err, result)  => {

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
                    companias: () => {
                        return Companias.find({}, { sort: { nombre: 1 } });
                    },
                });

                $scope.companias_ui_grid.data = $scope.companias;
                $scope.personas_ui_grid.data = [];

                $scope.companiaSeleccionada = null;                             // para que se oculte la forma (formly)
                $scope.showProgress = false;
                $scope.$apply();
            })
        }
    }
]);

// ---------------------------------------------------------------------------------------
// para regresar el nombre del tipo
// ---------------------------------------------------------------------------------------
angular.module("scrwebM").filter('tipoCompania', function ($sce) {
    return function (value) {

        if (!value) {
            return 'Indefinido';
        };

        var nombreTipo = '';

        switch (value) {
            case 'AJUST':
                nombreTipo = "Ajustador";
                break;
            case 'CORR':
                nombreTipo = "Corredor seg";
                break;
            case 'PROD':
                nombreTipo = "Productor";
                break;
            case 'REA':
                nombreTipo = "Reasegurador";
                break;
            case 'CORRR':
                nombreTipo = "Corredor reaseg";
                break;
            case 'SEG':
                nombreTipo = "Asegurador";
                break;
            default:
                nombreTipo = "Indefinido";
        };

        return nombreTipo;
    }
});
