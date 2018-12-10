


import { Temp_Consulta_Remesas } from '/imports/collections/consultas/tempConsultaRemesas'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

angular.module("scrwebm").controller("RemesasListaController",
['$scope', '$state', '$stateParams', '$meteor',
  function ($scope, $state, $stateParams, $meteor) {

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

      $scope.nuevo = function () {
          $state.go("remesa", { origen: 'edicion', id: '0', pageNumber: 0 });
      }

    $scope.abrirRemesaPage = function (remesaID) {
    
        // suscribimos a la remesa antes de intentar abrir la página que muestra, y permite editar, todos sus detalles ... 
        $scope.showProgress = true; 

        // si se efectuó un subscription al collection antes, la detenemos ...
        if (Remesas_SubscriptionHandle) { 
            Remesas_SubscriptionHandle.stop();
        }
            
        Remesas_SubscriptionHandle = null;

        Remesas_SubscriptionHandle = 
        Meteor.subscribe('remesas', JSON.stringify({ _id: remesaID, }), () => { 
            $scope.showProgress = false;

            // activamos el state Lista ...
            $state.go("remesa", { origen: $scope.origen, id: remesaID, pageNumber: $scope.currentPage });
        })
    }

    // pagination (nótese que el número de página viene como parámetro al state)
    $scope.currentPage = pageNumber && pageNumber != -1 ? parseInt(pageNumber) : 1;
    $scope.pageSize = 10;

    $scope.helpers({
        remesas: () => {
            return Temp_Consulta_Remesas.find({ user: Meteor.userId() }, { sort: { numero: 1 }});
        },
    })

    $scope.alerts.length = 0;
    $scope.alerts.push({
        type: 'info',
        msg: Temp_Consulta_Remesas.find({ user: Meteor.userId() }).count().toString() + " registros seleccionados ..."
    })


    $scope.regresar = function () {
        $state.go('contratosFiltro', { origen: $scope.origen });
    }


    $scope.nuevo = function () {
        $state.go("remesa", { origen: 'edicion', id: '0', pageNumber: 0 });
    }

    $scope.regresar = function () {
        $state.go('remesasFiltro', { origen: $stateParams.origen });
    }
  }
])
