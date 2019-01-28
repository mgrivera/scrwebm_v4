


import * as angular from 'angular';

import { DialogModal } from 'client/imports/generales/angularGenericModal'; 

export default angular.module("scrwebm.notasDebitoCredito.item", [ 
    'angular-meteor', 
])
.controller("NotasDebitoCredito_Item_Controller", ['$scope', '$state', '$stateParams', '$modal', 
function ($scope, $state, $stateParams, $modal) {

    $scope.showProgress = true;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.goToState = function (state) {
        // para abrir alguno de los 'children' states ...
        if (state === "infoRamo") { 
            // abrimos un state que permite al usuario registrar información propia para el ramo; ej: para automovil el usuario 
            // puede registrar: marca, modelo, placa, etc. 
            let ramo = $scope.ramos.find(x => x._id === $scope.riesgo.ramo); 

            if (ramo) { 
                const tipoRamo = ramo.tipoRamo ? ramo.tipoRamo : ""; 
                switch (tipoRamo) { 
                    case "automovil": { 
                        $state.go("riesgo.infoRamo_autos");
                        break; 
                    }
                    default: { 
                        DialogModal($modal,
                            "<em>Riesgos - Información propia para el ramo del riesgo</em>",
                            `Error: no hay un <em>registro específico de información</em> para el ramo indicado para el riesgo. <br /><br />  
                             Ud. debe usar esta opción <b>solo</b> para riesgos cuyo ramo posea un registro propio de información. <br />
                             Por ejemplo, para el ramo automóvil, el usuario puede usar esta opción para registrar: marca, modelo, año, placa, etc.
                             `,
                            false);
                    }
                }
            }
        }
        else if (state != 'cuotas') { 
            $state.go("riesgo." + state);
        }
        else {  
            $state.go("riesgo.cuotas", {
                'origen': $stateParams.origen,
                'source': 'facXXX'
            });
        }
    }

    $scope.nuevo0 = function () {

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa para agregar un nuevo registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                                    true);

            promise.then(
                function (resolve) {
                    $scope.nuevo();
                },
                function (err) {
                    return true;
                });

            return;
        }
        else { 
            $scope.nuevo();
        }
    }

    $scope.nuevo = function () {
        $scope.id = "0"; 
        inicializarItem(); 
    }

    $scope.origen = $stateParams.origen;
    $scope.id = $stateParams.id;
    $scope.pageNumber = parseInt($stateParams.pageNumber);
    // nótese que el boolean value viene, en realidad, como un string ...
    $scope.vieneDeAfuera = ($stateParams.vieneDeAfuera == "true");    // por ejemplo: cuando se abre desde siniestros ...

    $scope.regresarALista = function () {

        if ($scope.notaDebitoCredito && $scope.notaDebitoCredito.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Notas débito/crédito</em>",
                                    "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                    true).then(
                function (resolve: any) {
                    $state.go('notasDebitoCredito.list', { origen: $scope.origen, limit: $scope.limit });
                },
                function (err: any) {
                    return true;
                })
            return;
        }
        else { 
            $state.go('notasDebitoCredito.list', { origen: $scope.origen, limit: $scope.limit });
        }
    }

    $scope.refresh = function () {
        if ($scope.riesgo.docState) {
            var promise = DialogModal($modal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa y refresca el registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios?",
                                    true);

            promise.then(
                function (resolve) {
                    inicializarItem();
                },
                function () {
                    return true;
                });

            return;
        }
        else {
            inicializarItem();
        }
    }

    // -------------------------------------------------------------------------
    // para inicializar el item (en el $scope) cuando el usuario abre la página
    // -------------------------------------------------------------------------
    function inicializarItem() {
    }

    inicializarItem();
}
])