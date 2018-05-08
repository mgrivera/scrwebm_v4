


import lodash from 'lodash';
import { Remesas } from '/imports/collections/principales/remesas';  
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller("CobranzasSeleccionRemesaController",
['$scope', '$state', '$stateParams', '$meteor', '$modal',
  function ($scope, $state, $stateParams, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      }

      $scope.abrirAplicarPagos = function () {

          var remesasSeleccionadas = lodash.filter($scope.remesas, function (r) { return r.selected == true; });

          if (remesasSeleccionadas.length == 0) {
              DialogModal($modal, "<em>Cobranzas</em>",
                          "Aparentemente, Ud. no ha seleccionado una remesa en la lista.<br />" +
                          "Ud. debe seleccionar una remesa de la lista <em>antes</em> de continuar con el próximo paso de este proceso.",
                          false).then();
              return;
          }

          if (remesasSeleccionadas.length > 1) {
              DialogModal($modal,
                          "<em>Cobranzas</em>",
                          "Aparentemente, Ud. ha seleccionado <em>más de una</em> remesa de la lista.<br />" +
                          "Por favor seleccione <em>solo una</em> remesa en la lista.",
                          false).then();
              return;
          }

          $state.go('cobranzas.aplicarPagos', { remesaPK: remesasSeleccionadas[0]._id });
      }

      $scope.helpers({
          remesas: () => {
              // nótese como ésto también cubre casos donde la fechaCerrada no existe como field (en mongo)
              return Remesas.find({ fechaCerrada: null }, { sort: { numero: 1 } });
          }
      })

      // agregamos la compañía seleccionada al filtro
      let filtro = {}; 
      filtro.cia = $scope.$parent.companiaSeleccionada && $scope.$parent.companiaSeleccionada._id ? $scope.$parent.companiaSeleccionada._id : -999;
      filtro.fechaCerrada = null;
      let remesasAbiertasCount = Remesas.find(filtro).count(); 

      $scope.alerts.length = 0;
      $scope.alerts.push({
          type: 'info',
          msg: `<b>${remesasAbiertasCount.toString()}</b> remesas <em>abiertas</em> seleccionadas ...`
      });

      // pagination (nótese que el número de página viene como parámetro al state)
      $scope.currentPage = 1;
      $scope.pageSize = 6;
  }
])
