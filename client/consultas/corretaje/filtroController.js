
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import angular from 'angular';
import lodash from 'lodash'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Filtros } from '/imports/collections/otros/filtros'; 

import { Consulta_Corretaje } from '/imports/collections/consultas/consulta_corretaje'; 

angular.module("scrwebm").controller("ConsultasCorretaje_Filtro_Controller", ['$scope', '$state',
function ($scope, $state) {

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'corretaje_consulta' });
    EventDDP.addListener('corretaje_consulta_reportProgress', function(process) {
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

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = null;

    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
    // ------------------------------------------------------------------------------------------------

    // leemos los catálogos en el $scope
    $scope.monedas = Monedas.find().fetch();
    $scope.companias = Companias.find().fetch();
    $scope.suscriptores = Suscriptores.find().fetch();
    $scope.ramos = Ramos.find().fetch();

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    let Consultas_Corretaje_SubscriptionHandle = null;

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
        var filtro = {};

        // agregamos la compañía seleccionada al filtro
        filtro = $scope.filtro;
        filtro.cia = companiaSeleccionadaDoc && companiaSeleccionadaDoc._id ? companiaSeleccionadaDoc._id : -999;

        // para medir y mostrar el progreso de la tarea ...
        $scope.processProgress.current = 0;
        $scope.processProgress.max = 0;
        $scope.processProgress.progress = 0;
        $scope.processProgress.message = "";

        Meteor.call('consultas.corretaje', filtro, (err, result) => {

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
                const errorMessage = `<b>Error:</b> se ha producido un error al intentar ejecutar la operación. <br /><br />${result.message}`;

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
            if (Consultas_Corretaje_SubscriptionHandle) { 
                Consultas_Corretaje_SubscriptionHandle.stop();
            }
                
            Consultas_Corretaje_SubscriptionHandle = 
            Meteor.subscribe('consultas.corretaje', () => {
                // ------------------------------------------------------------------------------------------------------
                // guardamos el filtro indicado por el usuario
                var filtroActual = lodash.clone($scope.filtro);

                if (Filtros.findOne({ nombre: 'consultas_Corretaje', userId: Meteor.userId() })) {
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    Filtros.update(Filtros.findOne({ nombre: 'consultas_Corretaje', userId: Meteor.userId() })._id,
                                    { $set: { filtro: filtroActual } },
                                    { validate: false });
                }
                else {
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'consultas_Corretaje',
                        filtro: filtroActual
                    })
                }
                // ------------------------------------------------------------------------------------------------------

                if (Consulta_Corretaje.find({ user: Meteor.userId() }).count() == 0) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'warning',
                        msg: "0 registros seleccionados. Por favor revise el criterio de selección indicado e indique uno diferente.<br />" +
                            "(Nota: el filtro <b>solo</b> regresará registros si existe una <em>compañía seleccionada</em>.)"
                    });
                    $scope.showProgress = false;
                    return;
                }

                $scope.showProgress = false;

                $state.go('corretaje_consulta_list', {
                    companiaSeleccionada: JSON.stringify(companiaSeleccionadaDoc),
                })
            })
        })
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne(
        {
            nombre: 'consultas_Corretaje',
            userId: Meteor.userId(),
        });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) {
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }
    // ------------------------------------------------------------------------------------------------------
}])