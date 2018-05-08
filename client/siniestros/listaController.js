

import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

angular.module("scrwebM").controller("SiniestrosListaController",
['$scope', '$stateParams', '$state', '$meteor',
function ($scope, $stateParams, $state, $meteor) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.origen = $stateParams.origen;
      var pageNumber = $stateParams.pageNumber;

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      if (companiaSeleccionada)
          var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc)
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      $scope.nuevo = function () {
          $state.go("siniestro", { origen: 'edicion', id: '0', pageNumber: -1 });
      };

      $scope.abrirPaginaDetalles = function (siniestroID) {
          // vamos al state específico, dependiendo de si estamos consultando/editando
          //debugger;
          $state.go("siniestro", { origen: $scope.origen, id: siniestroID, pageNumber: $scope.currentPage });
      };

      // pagination (nótese que el número de página viene como parámetro al state)
      $scope.currentPage = pageNumber && pageNumber != -1 ? parseInt(pageNumber) : 1;
      $scope.pageSize = 6;

      $scope.siniestros = $scope.$meteorCollection(Siniestros, false);

      $scope.alerts.length = 0;
      $scope.alerts.push({
          type: 'info',
          msg: Siniestros.find().count().toString() + " registros seleccionados ..."
      });

      $scope.regresar = function () {
          $state.go('siniestrosFiltro', { origen: $scope.origen });
      };
  }
]);
