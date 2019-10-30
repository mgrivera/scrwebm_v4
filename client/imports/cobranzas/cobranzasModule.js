

import { Meteor } from 'meteor/meteor'
import angular from 'angular';

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 

import { Companias } from '/imports/collections/catalogos/companias'; 
import { Remesas } from '/imports/collections/principales/remesas';  

import './cobranzas.html'; 

// angular modules 
import './cobranzas.seleccionRemesa.html'; 
import CobranzasSeleccionRemesaModule from './cobranzasSeleccionRemesaModule'; 

import './cobranzas.aplicarPagos.html';
import CobranzasAplicarPagosModule from  './cobranzasAplicarPagosModule'; 

import './cobranzas.resultados.html'; 
import CobranzasResultadosModule from  './cobranzasResultadosModule'; 

export default angular.module("scrwebm.cobranzas", [ CobranzasSeleccionRemesaModule.name, 
                                                     CobranzasAplicarPagosModule.name, 
                                                     CobranzasResultadosModule.name] )
                      .controller("CobranzasController", ['$scope', '$state', '$meteor', function ($scope, $state, $meteor) {

    $scope.showProgress = false;

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: "", 
    }

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (companiaSeleccionada) { 
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID);
    }
        
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) { 
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    } else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }  
    // ------------------------------------------------------------------------------------------------

    // leemos los catálogos en el $scope
    $scope.monedas = $scope.$meteorCollection(Monedas, false);
    $scope.companias = $scope.$meteorCollection(Companias, false);
    $scope.bancos = $scope.$meteorCollection(Bancos, false);

    let remesas_subscriptionHandle = null; 

    // aplicamos el filtro indicado por el usuario y abrimos la lista
    function leerRemesasAbiertas() {

        $scope.showProgress = true;
        $scope.processProgress.message = "leyendo remesas abiertas ..."; 

        // si se efectuó un subscription al collection antes, la detenemos ...
        if (remesas_subscriptionHandle) { 
            remesas_subscriptionHandle.stop();
        }
            
        remesas_subscriptionHandle = null;

        // preparamos el filtro (selector)
        var filtro = {};

        // agregamos la compañía seleccionada al filtro
        filtro.cia = $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : -999;
        filtro.fechaCerrada = null;

        $meteor.subscribe('remesas', JSON.stringify(filtro)).then(
            function (subscriptionHandle) {
                remesas_subscriptionHandle = subscriptionHandle;

                if (Remesas.find().count() == 0) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'warning',
                        msg: "0 registros seleccionados. Aparentemente, no existen remesas 'abiertas' para la compañía seleccionada.<br />" +
                            "Por favor revise. Ud. puede abrir la página de registro de remesas y verificar esta situación."
                    });

                    $scope.showProgress = false;
                    return;
                }

                $scope.processProgress.message = ""; 
                $scope.showProgress = false;

                // mostramos el 'state' inicial, el cual le permite al usuario seleccionar una remesa
                $state.go('cobranzas.seleccionRemesa');
            },
            function (err) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Error: hemos obtenido un error al intentar ejecutar una función de base de datos (en el servidor): <br /><br />" +
                        err.toString()
                });

                $scope.processProgress.message = ""; 
                $scope.showProgress = false;
            })
    }

    leerRemesasAbiertas();
  }
]);
