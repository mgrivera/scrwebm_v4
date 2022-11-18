﻿
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 

import lodash from 'lodash'; 
import angular from 'angular';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Companias } from '/imports/collections/catalogos/companias'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Filtros } from '/imports/collections/otros/filtros'; 

export default angular.module("scrwebm.contratos.filter", [])
       .controller("ContratosFiltroController", ['$scope', '$state', '$stateParams', 
function ($scope, $state, $stateParams) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;

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

    // -------------------------------------------------------------------------------------------
    // leemos los catálogos en el $scope
    $scope.tiposContrato = $scope.$meteorCollection(TiposContrato, false);
    $scope.companias = $scope.$meteorCollection(Companias, false);
    $scope.suscriptores = $scope.$meteorCollection(Suscriptores, false);
    $scope.ramos = $scope.$meteorCollection(Ramos, false);

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };

    $scope.aplicarFiltroYAbrirLista = function () {

        $scope.showProgress = true;

        Meteor.call('contratos.leerDesdeMongo', JSON.stringify($scope.filtro), $scope.companiaSeleccionada._id, (err) => {

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

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario

            if (Filtros.findOne({ nombre: 'contratos', userId: Meteor.userId() })) { 
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'contratos', userId: Meteor.userId() })._id,
                    { $set: { filtro: $scope.filtro } },
                    { validate: false });
            }  
            else { 
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'contratos',
                    filtro: $scope.filtro
                });
            }
                
            $scope.showProgress = false;

            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            $state.go('contratosLista', { origen: $scope.origen, limit: 50 });
        })
    }

    $scope.nuevo = function () {
        $state.go('contrato.generales', {
            origen: $scope.origen,
            id: "0",
            limit: 50,
            vieneDeAfuera: false
        });
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    const filtroAnterior = Filtros.findOne({ nombre: 'contratos', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) { 
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }
    // ------------------------------------------------------------------------------------------------------

    // esta tabla es necesaria para inicializar algunas partes del contrato cuando el usuario lo agrega 
    $scope.showProgress = true;
    Meteor.subscribe('contratosParametros', () => {
        $scope.showProgress = false;
        $scope.$apply();
    })
}])