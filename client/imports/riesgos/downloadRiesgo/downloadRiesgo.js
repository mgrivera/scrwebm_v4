
import angular from 'angular';
import saveAs from 'save-as'; 

import InfoModal from '/client/imports/genericReactComponents/infoModal/angular.module';
import downloadRiesgoInfoText from './downloadRiesgo.infoText';
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

export default angular.module("scrwebm.riesgos.riesgo.downloadToDisk", [ InfoModal.name ])
    .controller('DownloadRiesgoToDisk_ModalController', ['$scope', '$uibModalInstance', '$timeout', '$uibModal', 'riesgoOriginal', 'riesgos_infoRamo', 
    function ($scope, $uibModalInstance, $timeout, $uibModal, riesgoOriginal, riesgos_infoRamo) {
        $scope.alerts = [];

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        }

        $scope.ok = function () {
            $uibModalInstance.close("Ok");
        }

        $scope.cancel = function () {
            $uibModalInstance.dismiss("Cancel");
        }

        // ----------------------------------------------------------------------------------------------------------------------
        // para mostrar/ocultar el modal que muestra las notas para esta función; nota: el modal es un react component ... 
        $scope.showInfoModal = false;
        $scope.infoText = downloadRiesgoInfoText();
        $scope.infoHeader = "Riesgos - Download (al disco)";

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

        $scope.riesgosDownloadForm_submit = function () {

            $scope.submitted = true;

            $scope.alerts.length = 0;

            if ($scope.riesgosDownloadForm.$valid) {

                $scope.submitted = false;
                $scope.riesgosDownloadForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

                $scope.showProgress = true; 

                // para grabar una copia del riesgo, como un simple json, al disco. Luego, este json podrá ser importado como 
                // un riesgo nuevo ... 
                let message = "";
                try {
                    const riesgo_json = Object.assign({}, riesgoOriginal);       // to clone an object 

                    // la información adicional para el riesgo Autos (u otros ramos) puede o no existir 
                    if (riesgos_infoRamo) {
                        riesgo_json.riesgos_infoRamo = riesgos_infoRamo;
                    } else { 
                        riesgo_json.riesgos_infoRamo = [];
                    }

                    var blob = new Blob([JSON.stringify(riesgo_json)], { type: "text/plain;charset=utf-8" });
                    saveAs(blob, "riesgo");
                }
                catch (err) {
                    message = err.message ? err.message : err.toString();
                }
                finally {
                    if (message) {
                        DialogModal($uibModal, "<em>Riesgos - Download</em>",
                            "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                            message, false).then();
                    }

                    $scope.showProgress = false; 
                }
            }
        }
}])