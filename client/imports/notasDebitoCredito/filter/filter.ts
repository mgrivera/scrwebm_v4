

import * as angular from 'angular';
import * as lodash from 'lodash'; 

import { Filtros } from 'imports/collections/otros/filtros'; 

import { mensajeErrorDesdeMethod_preparar } from 'client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

export default angular.module("scrwebm.notasDebitoCredito.filter", [ 
    'angular-meteor', 
])
.controller("NotasDebitoCredito_Filter_Controller", ['$scope', '$state', '$stateParams', 
    function ($scope, $state, $stateParams) {

        $scope.$parent.showProgress = false;

        // para reportar el progreso de la tarea en la página
        $scope.processProgress = {
            current: 0,
            max: 0,
            progress: 0
        };
    
        // ui-bootstrap alerts ...
        $scope.alerts = [];
    
        $scope.closeAlert = function (index: number) {
            $scope.alerts.splice(index, 1);
        }
    
        $scope.origen = $stateParams.origen;
    
        $scope.limpiarFiltro = function () {
            $scope.filtro = {};
        }
    
        $scope.aplicarFiltroYAbrirLista = function () {
            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            $state.go('notasDebitoCredito.list', { origen: $scope.origen, limit: 50 });
        }
    
        $scope.nuevo = function () {
            $state.go("notasDebitoCredito.item", { origen: 'edicion', id: '0', pageNumber: -1, vieneDeAfuera: false });
        }
    
        // ------------------------------------------------------------------------------------------------------
        // si hay un filtro anterior, lo usamos
        // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
        $scope.filtro = {};
        var filtroAnterior = Filtros.findOne({ nombre: 'notasDebitoCredito', userId: Meteor.userId() });
    
        // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
        if (filtroAnterior) { 
            $scope.filtro = lodash.clone(filtroAnterior.filtro);
        }

        // ------------------------------------------------------------------------------------------------------
        // para recibir los eventos desde la tarea en el servidor ...
        EventDDP.setClient({ myuserId: Meteor.userId(), app: 'notasDebitoCredito', process: 'notasDebitoCredito_leerNotasDebitoCredito_reportProgress' });
        EventDDP.addListener('leerNotasDebitoCredito', function(process) {
    
            $scope.processProgress.current = process.current;
            $scope.processProgress.max = process.max;
            $scope.processProgress.progress = process.progress;
            // if we don't call this method, angular wont refresh the view each time the progress changes ...
            // until, of course, the above process ends ...
            $scope.$apply();
        })
}
])