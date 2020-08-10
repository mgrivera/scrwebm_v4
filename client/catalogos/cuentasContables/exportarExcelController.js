
import { Meteor } from 'meteor/meteor'; 
import angular from 'angular'; 

import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebm")
       .controller('CuentasContablesExportarExcel_Controller', ['$scope', '$modalInstance', 'ciaSeleccionada', 
    function ($scope, $modalInstance, ciaSeleccionada) {

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
        $scope.selectedFile = "cuentas contables.xlsx";
        $scope.downLoadLink = "";

        $scope.exportarAExcel = () => {
            $scope.showProgress = true;

            Meteor.call('cuentasContables.exportarExcel', ciaSeleccionada, (err, result) => {

                if (err) {
                    const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });

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

                $scope.downLoadLink = result;
                $scope.downloadDocument = true;

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
}])