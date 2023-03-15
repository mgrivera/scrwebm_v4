
import { Meteor } from 'meteor/meteor';
import angular from 'angular';

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import './copiarContrato.html';

export default angular.module("scrwebm.contrato.copiarContratoADBConsultas", []). 
                       controller('Contratos_CopiarADBConsultas_Controller', ['$scope', '$uibModalInstance',
function ($scope, $uibModalInstance) {

    // ui-bootstrap alerts ...
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

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'copiar_contratos_a_sql_server' });
    EventDDP.addListener('copiar_contratos_a_sql_server_reportProgress', function (process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // -------------------------------------------------------------------------------------------------------

    $scope.copiarContrato = () => {

        $scope.showProgress = true;

        Meteor.call('copiar_contrato_a_db_consultas', (err, result) => {

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

            if (result.error) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message,
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message,
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
    }

    $scope.reiniciar_proceso = () => {

        $scope.showProgress = true;

        Meteor.call('copiar_contratos_a_dbConsultas_reiniciar', (err, result) => {

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

            if (result.error) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message,
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message,
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
    }
}])