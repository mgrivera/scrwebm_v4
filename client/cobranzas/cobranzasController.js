


import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 

import { Companias } from '/imports/collections/catalogos/companias'; 
import { Remesas } from '/imports/collections/principales/remesas';  

angular.module("scrwebm").controller("CobranzasController",
['$scope', '$state', '$stateParams', '$meteor',
  function ($scope, $state, $stateParams, $meteor) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (companiaSeleccionada) { 
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
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

    // aplicamos el filtro indicado por el usuario y abrimos la lista
    function leerRemesasAbiertas() {

        //debugger;

        // si se efectuó un subscription al collection antes, la detenemos ...
        if (Remesas_SubscriptionHandle)
            Remesas_SubscriptionHandle.stop();

        Remesas_SubscriptionHandle = null;

        // preparamos el filtro (selector)
        var filtro = {};

        // agregamos la compañía seleccionada al filtro
        filtro.cia = $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : -999;
        filtro.fechaCerrada = null;

        $scope.showProgress = true;

        $meteor.subscribe('remesas', JSON.stringify(filtro)).then(
            function (subscriptionHandle) {
                Remesas_SubscriptionHandle = subscriptionHandle;

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

                $scope.showProgress = false;
            })
    }


      leerRemesasAbiertas();
  }
]);
