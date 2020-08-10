
import { Meteor } from 'meteor/meteor'; 
import angular from 'angular'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

export default angular.module("scrwebm.remesas.remesa.cuadre.exportarExcel", [])
                      .controller('RemesaCuadreExportarExcel_Modal_Controller',
['$scope', '$modalInstance', 'remesa', 'ciaSeleccionada', function ($scope, $modalInstance, remesa, ciaSeleccionada) {

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

    $scope.downloadDocument = false;
    $scope.selectedFile = "remesa - cuadre - consulta.xlsx";
    $scope.downLoadLink = "";

    $scope.exportarAExcel = () => {
        $scope.showProgress = true;

        Meteor.call('remesas.cuadre.exportar.Excel', remesa._id, ciaSeleccionada, (err, result) => {

            if (err) {
                const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            if (result.error) {
                const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

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
}])