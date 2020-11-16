
import { Meteor } from 'meteor/meteor';
import angular from 'angular';

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import './pruebaEnviarEmail.html';

// Este controller (angular) se carga con la página primera del programa
export default angular.module("scrwebm.utilitarios.pruebaEnviarEmail", [])
                      .controller("Prueba_EnviarEmail_Controller", ['$scope',
function ($scope) {

    $scope.alerts.length = 0;
    $scope.showProgress = true;

    $scope.sendTestEmail = () => {

        $scope.showProgress = true;

        const to = "smr.software@outlook.com";
        const from = "smr.software@gmail.com";
        const cc = "smr.software@gmail.com";
        const subject = "Prueba de envío de un Email desde el programa ...";
        const text = `Hola, <br /> 
                    La idea de este correo es ver si llega a su destino. <br />
                    De hacerlo, el módulo de Emails en el 
                    programa pareciera estar correctamente configurado. <br /><br />
                    Saludos desde el programa <b><em>scrwebm</em></b>`;

        Meteor.call('sendEmail', to, from, cc, subject, text, (err, result) => {

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
        });
    }

    $scope.showProgress = false;
}])