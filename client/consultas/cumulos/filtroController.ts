

import * as lodash from 'lodash'; 
import * as angular from 'angular'; 

import { Consulta_Cumulos } from 'imports/collections/consultas/consulta_cumulos'; 
import { Filtros } from 'imports/collections/otros/filtros'; 

import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebM").controller("ConsultasCumulos_Filtro_Controller", ['$scope', '$state', function ($scope, $state) {

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'cumulos_consulta' });
    EventDDP.addListener('cumulos_consulta_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // -------------------------------------------------------------------------------------------------------

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

    // ponemos la forma en un objeto en el $scope. A veces, un problema en angular (??), hace que la forma
    // (ie: $scope.myForm) sea siempre undefined (???) ...
    $scope.myForms = {};

    // aplicamos el filtro indicado por el usuario y abrimos la lista
    $scope.submitConstruirFiltroForm = function () {

        $scope.submitted = true;
        $scope.alerts.length = 0;

        // ver comment más arriba acerca de porqué usamos 'myForms'
        if ($scope.myForms.construirFiltroForm.$valid) {
            $scope.submitted = false;
            $scope.myForms.construirFiltroForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
        }
        else { 
            return;
        }
        
        $scope.showProgress = true;

        // preparamos el filtro (selector)
        let filtro = {} as any;

        // agregamos la compañía seleccionada al filtro
        filtro = $scope.filtro;
        filtro.cia = $scope.companiaSeleccionada._id;

        // para medir y mostrar el progreso de la tarea ...
        $scope.processProgress.current = 0;
        $scope.processProgress.max = 0;
        $scope.processProgress.progress = 0;
        $scope.processProgress.message = "";

        let consultas_Cumulos_SubscriptionHandle = {} as any; 

        Meteor.call('consultas.cumulos', filtro, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // si se efectuó un subscription al collection antes, la detenemos ...
            if (consultas_Cumulos_SubscriptionHandle && consultas_Cumulos_SubscriptionHandle.stop) { 
                consultas_Cumulos_SubscriptionHandle.stop();
            }
                
            consultas_Cumulos_SubscriptionHandle = 
            Meteor.subscribe('consultas.cumulos', () => {
                // ------------------------------------------------------------------------------------------------------
                // guardamos el filtro indicado por el usuario
                var filtroActual = lodash.clone($scope.filtro);

                if (Filtros.findOne({ nombre: 'consultas_Cumulos', userId: Meteor.userId() })) {
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    Filtros.update(Filtros.findOne({ nombre: 'consultas_Cumulos', userId: Meteor.userId() })._id,
                                    { $set: { filtro: filtroActual } },
                                    { validate: false });
                }
                else {
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'consultas_Cumulos',
                        filtro: filtroActual
                    })
                }
                // ------------------------------------------------------------------------------------------------------

                if (Consulta_Cumulos.find({ user: Meteor.userId() }).count() == 0) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'warning',
                        msg: "0 registros seleccionados. Por favor revise el criterio de selección indicado e indique uno diferente.<br />" +
                            "(Nota: el filtro <b>solo</b> regresará registros si existe una <em>compañía seleccionada</em>.)"
                    });

                    $scope.showProgress = false;
                    $scope.$apply(); 

                    return;
                }

                $scope.showProgress = false;

                $state.go('cumulos_consulta_list')
            })
        })
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    let filtroAnterior = Filtros.findOne(
        {
            nombre: 'consultas_Cumulos',
            userId: Meteor.userId(),
        });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) {
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }
    // ------------------------------------------------------------------------------------------------------
  }
])
