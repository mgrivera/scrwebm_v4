

import angular from 'angular'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

export default angular.module("scrwebm.remesas.remesa.remesasCuadreObtener", [])
                      .controller('RemesaCuadreObtener_Modal_Controller',
['$scope', '$modalInstance', 'remesaID', 'ciaSeleccionada', function ($scope, $modalInstance, remesaID, ciaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

    $scope.parametros = {
        generarMontosEnFormaProporcional: true,
        leerMontosMismaMoneda: true,
    }

    $scope.submit_remesasObtenerCuadreForm = () => {

        $scope.submitted = true;
        $scope.showProgress = true;

        if ($scope.remesasObtenerCuadreForm.$valid) {

            $scope.submitted = false;
            $scope.remesasObtenerCuadreForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            Meteor.call('remesasObtenerCuadre', remesaID, $scope.parametros, (err, result) => {
                
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

                $scope.ok();
            })
        }
    }
}])
