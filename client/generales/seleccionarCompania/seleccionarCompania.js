

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

// importamos el module generales, pues está en  imports ... 
import scrwebmGenerales from '/client/imports/generales/generalesAngularModule'; 

angular.module(scrwebmGenerales.name).controller("SeleccionarCompaniaController", ['$scope', '$modal',
  function ($scope, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      var companiaSeleccionada = {};

      $scope.seleccionarCompania_ui_grid = {
          enableSorting: false,
          showColumnFooter: false,
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
                  companiaSeleccionada = {};

                  if (row.isSelected)
                      companiaSeleccionada = row.entity;
                  else
                      return;
              });
          }
      };

      $scope.seleccionarCompania_ui_grid.columnDefs = [
            {
                name: 'nombre',
                field: 'nombre',
                displayName: 'Compañía',
                width: 300,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: false,
                type: 'string'
            }
      ];

      // las empresasUsuarias y compañía seleccionada ya están en miniMongo ...
      $scope.helpers({
          empresasUsuarias: () => {
            return EmpresasUsuarias.find({}, { sort: { nombre: 1 }});
          },
      });

      $scope.seleccionarCompania_ui_grid.data = $scope.empresasUsuarias;

      let ciaSeleccionadaAntes = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

      if (ciaSeleccionadaAntes && ciaSeleccionadaAntes.companiaID) {
          // el usuario ya tenía una compañía seleccionada; lo indicamos ...
          $scope.empresasUsuarias.forEach(function (compania, index) {
              if (compania._id == ciaSeleccionadaAntes.companiaID) {
                  //$scope.gridOptions.selectRow(2, true);

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: "La compañía <b><em>" + compania.nombre + "</em></b> está ahora seleccionada."
                  });
              }
          });
      };


      $scope.seleccionarCompania = function () {
          if (!companiaSeleccionada || _.isEmpty(companiaSeleccionada)) {
              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: "Ud. debe seleccionar una compañía en la lista.<br />" +
                       "Aparentemente, Ud. no ha seleccionado aún una compañía en la lista."
              });
          }
          else {

              // eliminamos cualquier cia seleccionada que pueda tener ahora el usuario
              var companiasAhoraSeleccionadas = CompaniaSeleccionada.find({ userID: Meteor.userId() }).fetch();         // debería ser una sola!
              companiasAhoraSeleccionadas.forEach(function (item) {
                  CompaniaSeleccionada.remove(item._id);
              });

              CompaniaSeleccionada.insert({ userID: Meteor.userId(), companiaID: companiaSeleccionada._id });

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'info',
                  msg: "Ok, la compañía <b><em>" + companiaSeleccionada.nombre + "</em></b> ha sido seleccionada."
              });


              DialogModal($modal,
                  "<em>Selección de compañías</em>",
                  "Ok, la compañía <b><em>" + companiaSeleccionada.nombre + "</em></b> ha sido seleccionada.",
                  false).then();
          }
      }
  }
]);
