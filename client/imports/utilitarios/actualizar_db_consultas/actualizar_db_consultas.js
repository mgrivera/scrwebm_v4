
import { Meteor } from 'meteor/meteor';
import moment from 'moment'; 
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

    $scope.actualizar_db_consultas = () => {

        $scope.showProgress = true;

        Meteor.call('actualizar_db_consultas', (err, result) => {

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

        Meteor.call('reiniciar_proceso_actualizar_db_consultas', (err, result) => {

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

    // ======================================================================================================================
    // leemos la fecha de última ejecución de este proceso 
    // si no hay una fecha, el proceso nunca se ha ejecutado o el usuario quiere copiar, nuevamente, *todos* los registros 
    leerFechaCopiaDBConsultas().then((result) => {
        if (result.fecha) {
            $scope.alerts.push({
                type: 'info',
                msg: `Este proceso fue ejecutado por última vez el día: <b>${moment(result.fecha).format('D-MMM-YYYY h:m a')}</b>.<br /> 
                      <b>Solo</b> los registros que se han agregado/editado <b>luego</b> de esa fecha serán agregados a la base de datos de consultas.
                     `
            });

            $scope.showProgress = false;
            $scope.$apply();
        } else {
            $scope.alerts.push({
                type: 'info',
                msg: `<b>Nota:</b> Este proceso será ejecutado como si fuera la primera vez: copiara <b>todos</b> los registros a la base de datos de consulta.`
            });

            $scope.showProgress = false;
            $scope.$apply();
        }
    })
}])

// =====================================================================================================================
// cuando el usuario inicia esta opción desde el menú del programa, leemos la fecha de última ejecución del proceso
// para saber cuando fue ejecutado la última vez e informar al usuario 
const leerFechaCopiaDBConsultas = () => { 
    return new Promise(resolve => { 
        Meteor.call('leer_fecha_from_actualizar_db_consultas', (err, result) => {
            resolve(result); 
        })
    })
}