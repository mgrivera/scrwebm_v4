
import { Meteor } from 'meteor/meteor'; 
import angular from 'angular';
import lodash from 'lodash';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Consulta_MontosPendientes } from '/imports/collections/consultas/consulta_MontosPendientes'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Filtros } from '/imports/collections/otros/filtros'; 

angular.module("scrwebm")
       .controller("ConsultasMontosPendientesFiltroController", ['$scope', '$state', function ($scope, $state) {

    $scope.showProgress = false;

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    }

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'montosPendientesCobroYPago' });
    EventDDP.addListener('montosPendientesCobroYPago_consulta_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })
    // -------------------------------------------------------------------------------------------------------

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {};

    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
        
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) {
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }
    else {
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    // leemos los catálogos en el $scope
    $scope.monedas = Monedas.find().fetch();
    $scope.companias = Companias.find().fetch();
    $scope.asegurados = Asegurados.find().fetch();
    $scope.ramos = Ramos.find().fetch();
    $scope.suscriptores = Suscriptores.find().fetch();

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...

    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;


    let Consultas_MontosPendientes_SubscriptionHandle = null;

    // aplicamos el filtro indicado por el usuario y abrimos la lista
    $scope.submitConstruirFiltroForm = function () {

        $scope.submitted = true;
        $scope.alerts.length = 0;

        if ($scope.construirFiltroForm.$valid) {
            $scope.submitted = false;
            $scope.construirFiltroForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
        }
        else {
            return;
        }

        if (!$scope.filtro.pendientesDe) {
            $scope.filtro.pendientesDe = 'todo';
        }

        if (!$scope.filtro.origen || lodash.isEmpty($scope.filtro.origen)) {
            $scope.filtro.origen = { todo: true };
        }

        $scope.showProgress = true;

        // preparamos el filtro (selector)
        var filtro = {};

        // agregamos la compañía seleccionada al filtro
        filtro = $scope.filtro;
        filtro.cia = $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : -999;

        Meteor.call('consultas.montosPendientes', filtro, (err) => {

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

            // si se efectuó un subscription al collection antes, la detenemos ...
            if (Consultas_MontosPendientes_SubscriptionHandle) {
                Consultas_MontosPendientes_SubscriptionHandle.stop();
            }

            Consultas_MontosPendientes_SubscriptionHandle = null;

            Consultas_MontosPendientes_SubscriptionHandle =
            Meteor.subscribe('consulta.montosPendientes', () => {

                // guardamos el filtro indicado por el usuario
                var filtroActual = _.clone($scope.filtro);

                if (Filtros.findOne({ nombre: 'consultas_MontosPendientes' })) {
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    Filtros.update(Filtros.findOne({ nombre: 'consultas_MontosPendientes' })._id,
                                    { $set: { filtro: filtroActual } },
                                    { validate: false });
                }
                else {
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'consultas_MontosPendientes',
                        filtro: filtroActual
                    });
                }

                if (Consulta_MontosPendientes.find({ user: Meteor.userId() }).count() == 0) {
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

                // abrimos el state Lista ...
                const parametrosReporte = { fechaPendientesAl: filtro.fechaPendientesAl };
                $state.go('montosPendientesLista', {
                    companiaSeleccionada: JSON.stringify(companiaSeleccionada),
                    parametrosReporte: JSON.stringify(parametrosReporte)
                })
            })
        })
    }

    
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'consultas_MontosPendientes' });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) { 
        $scope.filtro = _.clone(filtroAnterior.filtro);
    }
  }])