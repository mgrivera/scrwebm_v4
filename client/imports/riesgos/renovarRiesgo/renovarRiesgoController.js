
import { Meteor } from 'meteor/meteor'; 
import angular from 'angular';

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import InfoModal from '/client/imports/genericReactComponents/infoModal/angular.module';
import renovarRiesgoInfoText from './renovarRiesgo.infoText'; 

export default angular.module("scrwebm.riesgos.riesgo.renovarRiesgo", [ InfoModal.name ])
                      .controller('RenovarRiesgo_ModalController', ['$scope', '$modalInstance', '$timeout', 'riesgoOriginal',
    function ($scope, $modalInstance, $timeout, riesgoOriginal) {
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

        // ----------------------------------------------------------------------------------------------------------------------
        // para mostrar/ocultar el modal que muestra las notas para esta función; nota: el modal es un react component ... 
        $scope.showInfoModal = false;
        $scope.infoText = renovarRiesgoInfoText();
        $scope.infoHeader = "Riesgos - Renovar riesgo";

        $scope.setShowInfoModal = () => {
            $scope.showInfoModal = !$scope.showInfoModal;

            // el timeOut es necesario pues la función se ejecuta desde react; angular 'no se da cuenta' y este código, 
            // probablemente, pasa desapercibido para angularjs; el $timeout hace que anular ejecute sus ciclos y revise el 
            // resultado de este código; al hacerlo, angular actualiza su state ... 

            // nótese que timeout ejecuta un callback luego que pasa un delay; cómo no necesitamos ejecutar un 
            // callback, no lo pasamos; el delay tampoco ... 
            $timeout();
        }
    // ----------------------------------------------------------------------------------------------------------------------

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
                        const errorMessage = mensajeErrorDesdeMethod_preparar(err);

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
}])