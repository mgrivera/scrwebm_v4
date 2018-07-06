

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebM").controller('RenovarRiesgo_ModalController',
['$scope', '$modalInstance', 'riesgoOriginal', 'companiaSeleccionada',
function ($scope, $modalInstance, riesgoOriginal, companiaSeleccionada) {
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

    $scope.riesgosRenovarForm_submit = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if ($scope.riesgosRenovarForm.$valid) {

            $scope.submitted = false;
            $scope.riesgosRenovarForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            $scope.showProgress = true

            Meteor.call('riesgos.renovar', riesgoOriginal, $scope.parametros, function (err, result) {

                if (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage, });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                if (result.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: result.message, });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                })

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
    }
}
])
