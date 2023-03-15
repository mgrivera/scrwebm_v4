
import angular from 'angular';
import lodash from 'lodash'; 
import saveAs from 'save-as'; 

import InfoModal from '/client/imports/genericReactComponents/infoModal/angular.module';
import downloadContratoInfoText from './downloadContrato.infoText';
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

export default angular.module("scrwebm.contratos.contrato.downloadToDisk", [ InfoModal.name ])
    .controller('DownloadContratoToDisk_ModalController', ['$scope', '$uibModalInstance', '$timeout', '$uibModal', 'contrato', 
function ($scope, $uibModalInstance, $timeout, $uibModal, contrato) {
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
    $scope.infoText = downloadContratoInfoText();
    $scope.infoHeader = "Contratos - Download (al disco)";

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

    $scope.contratosDownloadForm_submit = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if ($scope.contratosDownloadForm.$valid) {

            $scope.submitted = false;
            $scope.contratosDownloadForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            $scope.showProgress = true;

            // para grabar una copia del contrato, como un simple json, al disco. Luego, este json podrá ser importado como 
            // un contrato nuevo ... 
            let message = "";
            try {
                const contrato_json = lodash.cloneDeep(contrato);       // to clone an object 

                const blob = new Blob([JSON.stringify(contrato_json)], { type: "text/plain;charset=utf-8" });
                saveAs(blob, "contrato");
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