
import angular from 'angular';

angular.module("scrwebm").
        controller('ContratoCapas_soloCapaSeleccionada_modal_controller', ['$scope', '$uibModalInstance', 'capaSeleccionada', 
function ($scope, $uibModalInstance, capaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        $uibModalInstance.close($scope.registrosPrima_calcular_soloCapaSeleccionada);
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    }

    $scope.submitted = false;

    $scope.submitForm = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if ($scope.registrosPrima_calcular_soloCapaSeleccionada && Object.keys(capaSeleccionada).length === 0) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: `No hay una capa seleccionada en la lista de capas.<br />
                      Por favor cierre este diálogo, seleccione una capa en la lista de capas y luego regrese y ejecute esta función 
                      para la capa seleccionada. 
                     `
            });

            return;
        }

        $scope.ok(); 
    }
}])