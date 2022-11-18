
import { Meteor } from 'meteor/meteor';
import angular from 'angular';

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebm.contratos.contrato").controller('ContratosCapasExportarExcel_Controller',
['$scope', '$uibModalInstance', '$uibModal', '$meteor', 'contratoID', 'ciaSeleccionada',
function ($scope, $uibModalInstance, $uibModal, $meteor, contratoID, ciaSeleccionada) {

    // debugger;
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $uibModalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    };

    $scope.downloadDocument = false;
    $scope.selectedFile = "contratos - capas - consulta.xlsx";
    $scope.downLoadLink = "";

    $scope.exportarAExcel = () => {
        $scope.showProgress = true;

        const fileName = "contratoCapas.xlsx";              // este es el nombre de la plantilla 
        const dropBoxPath = "/contratos/excel";             // este es el directorio donde la plantilla está en DropBox  

        Meteor.call('contratos.capas.exportar.Excel', contratoID, ciaSeleccionada, fileName, dropBoxPath, (err, result) => {

            if (err) {
                const msg = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            if (result.error) {
                const msg = mensajeErrorDesdeMethod_preparar(result.message);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, el documento ha sido construido en forma exitosa.<br />
                      Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
            });

            $scope.downLoadLink = result.sharedLink;
            $scope.downloadDocument = true;

            $scope.showProgress = false;
            $scope.$apply();
        })
    }
}]);