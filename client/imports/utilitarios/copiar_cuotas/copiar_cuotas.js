
import { Meteor } from 'meteor/meteor';
import angular from 'angular';

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar';

import './copiar_cuotas.html';

// Este controller (angular) se carga con la página primera del programa
export default angular.module("scrwebm.utilitarios.copiar_cuotas", [])
                      .controller("Copiar_cuotas_Controller", ['$scope',
function ($scope) {

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'copiar_cuotas_a_sql_server' });
    EventDDP.addListener('copiar_cuotas_a_sql_server_reportProgress', function (process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // -------------------------------------------------------------------------------------------------------

    $scope.alerts.length = 0;
    $scope.showProgress = true;
    $scope.$parent.tituloState = "Scrwebm - Actualizar base de datos de consultas - Copiar cuotas de cobro/pago";

    $scope.actualizar_db_consultas = () => {

        $scope.showProgress = true;

        Meteor.call('copiar_cuotas_a_dbConsultas', (err, result) => {

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

        Meteor.call('copiar_cuotas_a_dbConsultas_reiniciar', (err, result) => {

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

    $scope.showProgress = false; 
}])