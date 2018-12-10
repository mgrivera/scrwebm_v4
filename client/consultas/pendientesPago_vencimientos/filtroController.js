

import lodash from 'lodash'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Filtros } from '/imports/collections/otros/filtros'; 

import { Consulta_MontosPendientesPago_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesPago_Vencimientos';

angular.module("scrwebm").controller("ConsultasMontosPendientesPagoVencimientos_Filtro_Controller",
['$scope', '$state', '$stateParams', '$meteor',
  function ($scope, $state, $stateParams, $meteor) {

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    }

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'montosPendientesPago_vencimientos_consulta' });
    EventDDP.addListener('montosPendientesPago_vencimientos_consulta_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })
    // -------------------------------------------------------------------------------------------------------

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = null;

    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
    // ------------------------------------------------------------------------------------------------

    // leemos los catálogos en el $scope
    $scope.monedas = Monedas.find().fetch();
    $scope.companias = Companias.find().fetch();
    $scope.suscriptores = Suscriptores.find().fetch();

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...

    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

    // aplicamos el filtro indicado por el usuario y abrimos la lista
    $scope.submitConstruirFiltroForm = function () {
        $scope.submitted = true;
        $scope.alerts.length = 0;

        if ($scope.construirFiltroForm.$valid) {

            if (!$scope.filtro || !$scope.filtro.fechaPendientesAl || !$scope.filtro.fechaLeerHasta) { 
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Ud. debe indicar un valor para <b>ambas</b> fechas: <em>pendientes al</em> y <em>leer hasta</em>.<br />" +
                        "Por favor indique un valor para las fechas mencionadas e intente nuevamente. "
            });

            return; 
            }

            $scope.submitted = false;
            $scope.construirFiltroForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
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

        $meteor.call('consultas_MontosPendientesPago_Vencimientos', filtro).then(
            function (data) {
                // si se efectuó un subscription al collection antes, la detenemos ...
                if (Consultas_MontosPendientesPago_Vencimientos_SubscriptionHandle) { 
                    Consultas_MontosPendientesPago_Vencimientos_SubscriptionHandle.stop();
                }

                Consultas_MontosPendientesPago_Vencimientos_SubscriptionHandle = null;

                $meteor.subscribe('consulta_MontosPendientesPago_Vencimientos').then(

                    function (subscriptionHandle) {

                        Consultas_MontosPendientesPago_Vencimientos_SubscriptionHandle = subscriptionHandle;
                        // ------------------------------------------------------------------------------------------------------
                        // guardamos el filtro indicado por el usuario
                        var filtroActual = lodash.clone($scope.filtro);

                        if (Filtros.findOne({ nombre: 'consultas_MontosPendientesDePago_vencimientos' })) { 
                            // el filtro existía antes; lo actualizamos
                            // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                            Filtros.update(Filtros.findOne({ nombre: 'consultas_MontosPendientesDePago_vencimientos' })._id,
                                            { $set: { filtro: filtroActual } },
                                            { validate: false });
                        }
                        else { 
                            Filtros.insert({
                                _id: new Mongo.ObjectID()._str,
                                userId: Meteor.userId(),
                                nombre: 'consultas_MontosPendientesDePago_vencimientos',
                                filtro: filtroActual
                            });
                        }
                        // ------------------------------------------------------------------------------------------------------

                        if (Consulta_MontosPendientesPago_Vencimientos.find({ user: Meteor.userId() }).count() == 0) {
                            $scope.alerts.length = 0;
                            $scope.alerts.push({
                                type: 'warning',
                                msg: "0 registros seleccionados. Por favor revise el criterio de selección indicado e indique uno diferente.<br />" +
                                    "(Nota: el filtro <b>solo</b> regresará registros si existe una <em>compañía seleccionada</em>.)"
                            });
                            $scope.showProgress = false;
                            return;
                        };

                        $scope.showProgress = false;

                        // abrimos el state Lista ...
                        let parametrosReporte =
                            {
                                fechaPendientesAl: filtro.fechaPendientesAl,
                                fechaLeerHasta: filtro.fechaLeerHasta
                            };

                        $state.go('pendientesPago_vencimientos_consulta_list',
                                    {
                                        companiaSeleccionada: JSON.stringify(companiaSeleccionadaDoc),
                                        parametrosReporte: JSON.stringify(parametrosReporte)
                                    });
                    },
                    function (err) {

                        let errMessage = mensajeErrorDesdeMethod_preparar(err);

                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'danger',
                            msg: errMessage
                        });

                        $scope.showProgress = false;
                    })

        },
        function (err) {

            let errMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errMessage
            });

            $scope.showProgress = false;
        });
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'consultas_MontosPendientesDePago_vencimientos' });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) { 
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }
    // ------------------------------------------------------------------------------------------------------
  }
]);
