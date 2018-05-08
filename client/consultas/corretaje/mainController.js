


import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

angular.module("scrwebM").controller("ConsultasCorretaje_Controller",
['$scope', '$state', '$stateParams', '$meteor',
  function ($scope, $state, $stateParams, $meteor) {

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

      // abrimos de inmediato el 'filter' state ...
    //   $state.go('pendientesCobro_vencimientos_consulta_filter');
  }
]);
