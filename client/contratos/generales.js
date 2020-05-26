
import angular from 'angular';

angular.module("scrwebm")
       .controller("ContratoGeneralesController", ['$scope', function ($scope) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.setIsEdited = function () {

          // nótese que, aparentemente, hay un problema con ng-grid y ng-model-options="{ updateOn: \'blur\' }" y, cuando esta última opción existe,
          // el cambio no se efectúa en $scope y esta función no se ejecuta ...
          // mientras tanto, esta función se ejecuta por cada 'key-stroke' ...

          if ($scope.contrato.docState)
              return;

          $scope.contrato.docState = 2;
      }
  }
])