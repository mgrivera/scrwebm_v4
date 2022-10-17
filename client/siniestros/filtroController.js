
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import angular from 'angular';

import lodash from 'lodash'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { TiposSiniestro } from '/imports/collections/catalogos/tiposSiniestro'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { CausasSiniestro } from '/imports/collections/catalogos/causasSiniestro'; 
import { Filtros } from '/imports/collections/otros/filtros'; 

angular.module("scrwebm").
        controller("SiniestrosFiltroController", ['$scope', '$stateParams', '$state', '$meteor',
function ($scope, $stateParams, $state, $meteor) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;

    // -------------------------------------------------------------------------------------------
    // leemos los catálogos en el $scope
    //$scope.tiposRiesgo = $scope.$meteorCollection(TiposRiesgo, false);
    $scope.companias = $scope.$meteorCollection(Companias, false);
    $scope.monedas = $scope.$meteorCollection(Monedas, false);
    $scope.ramos = $scope.$meteorCollection(Ramos, false);
    $scope.asegurados = $scope.$meteorCollection(Asegurados, false);
    $scope.causasSiniestro = $scope.$meteorCollection(CausasSiniestro, false);
    $scope.suscriptores = $scope.$meteorCollection(Suscriptores, false);
    $scope.tiposSiniestro = $scope.$meteorCollection(TiposSiniestro, false);

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = null; 
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

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    // -------------------------------------------------------------------------
    // aplicamos el filtro indicado por el usuario y abrimos la lista
    // -------------------------------------------------------------------------
    let Siniestros_SubscriptionHandle = null; 

    $scope.aplicarFiltroYAbrirLista = function () {
        // si se efectuó un subscription al collection antes, la detenemos ...
        if (Siniestros_SubscriptionHandle)
            Siniestros_SubscriptionHandle.stop();

        Siniestros_SubscriptionHandle = null;

        // preparamos el filtro (selector)
        let filtro = {};

        // construimos el filtro, en base al criterio indicado por el usuario en la forma ...
        //filtro = contriurFiltro($scope.filtro);

        // agregamos la compañía seleccionada al filtro
        filtro = lodash.clone($scope.filtro, true);
        filtro.cia = $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : -999;

        $scope.showProgress = true;

        $meteor.subscribe('siniestros', JSON.stringify(filtro)).then(function (subscriptionHandle) {

            Siniestros_SubscriptionHandle = subscriptionHandle;

            if (Siniestros.find().count() == 0) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'warning',
                    msg: "0 registros seleccionados. Por favor revise el criterio de selección indicado e indique uno diferente.<br />" +
                        "(Nota: el filtro <b>solo</b> regresará registros si existe una <em>compañía seleccionada</em>.)"
                });

                $scope.showProgress = false;
                return;
            }

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            const filtroActual = lodash.clone($scope.filtro);

            if (Filtros.findOne({ nombre: 'siniestros' }))
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'siniestros' })._id,
                    { $set: { filtro: filtroActual } },
                    { validate: false });
            else
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'siniestros',
                    filtro: filtroActual
                });
            // ------------------------------------------------------------------------------------------------------

            $scope.showProgress = false;

            // activamos el state Lista ...
            $state.go('siniestrosLista', { origen: $scope.origen, pageNumber: -1 });
        },
            function (err) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Error: hemos obtenido un error al intentar ejecutar una función de base de datos (en el servidor): <br /><br />" +
                        err.toString()
                });

                $scope.showProgress = false;
            });
    }

    $scope.nuevo = function () {
        $state.go("siniestro", { origen: 'edicion', id: '0', pageNumber: -1 });
    }


    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    const filtroAnterior = Filtros.findOne({ nombre: 'siniestros' });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) { 
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }
    // ------------------------------------------------------------------------------------------------------
}])