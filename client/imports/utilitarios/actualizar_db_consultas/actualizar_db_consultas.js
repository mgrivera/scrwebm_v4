
import { Meteor } from 'meteor/meteor';
import angular from 'angular';

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import './actualizar_db_consultas.html';

// Este controller (angular) se carga con la página primera del programa
export default angular.module("scrwebm.utilitarios.actualizar_db_consultas", [])
                      .controller("Actualizar_db_consultas_Controller", ['$scope',
function ($scope) {

    $scope.alerts.length = 0;
    $scope.showProgress = true;
    $scope.$parent.tituloState = "Scrwebm - Actualizar base de datos de consultas"; 

    $scope.copiarCatalogos_a_db_consultas = () => {

        $scope.showProgress = true;

        Meteor.call('copiarCatalogos_a_db_consultas', (err, result) => {

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

        Meteor.call('reiniciar_proceso_copiarCatalogos_a_db_consultas', (err, result) => {

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