

import moment from 'moment'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '/client/contratos/methods/_methods/_methods'; 

let construirDefinicionCuentas = function ($scope, contrato, monedas, cuentasTecnicas_definiciones_ui_grid, modal, parentScope) {

    if (contrato && contrato.cuentasTecnicas_definicion && contrato.cuentasTecnicas_definicion.length > 0) {

        var mensajeAlUsuarioModel = {}

        mensajeAlUsuarioModel.titulo = "Existen definiciones de cuentas para el contrato";
        mensajeAlUsuarioModel.mensaje = `Ya existen <em>definiciones de cuentas</em> registradas para el contrato.<br />
                                         Ud. puede continuar y agregar nuevas definiciones a las que ahora existen.<br /><br />
                                         Desea continuar y agregar nuevas definiciones de cuenas al contrato?`;

        DialogModal(modal, mensajeAlUsuarioModel.titulo, mensajeAlUsuarioModel.mensaje, true).then(
            function () {
                generarDefinicionCuentasTecnicas($scope, contrato, monedas, cuentasTecnicas_definiciones_ui_grid, modal, parentScope);
            },
            function () {
                DialogModal($modal,
                            "<em>Contratos</em> - Generación de cuentas",
                            `Ok, el proceso ha sido cancelado.`,
                            false);
                return;
            });
        return;
    }
    else {
        generarDefinicionCuentasTecnicas($scope, contrato, monedas, cuentasTecnicas_definiciones_ui_grid, modal, parentScope);
    }
}

// --------------------------------------------------------------------
// para generar la definición de cuentas técnicas

function generarDefinicionCuentasTecnicas($scope, contrato, monedas, cuentasTecnicas_definiciones_ui_grid, modal, parentScope) {

    var modalInstance = modal.open({
        templateUrl: 'client/contratos/methods/construirDefinicionesDeCuentasTecnicas/cuentasConstruirDefinicionCuentas.html',
        controller: 'CuentasConstruirDefinicionCuentasController',
        size: 'md',
        resolve: {
            contrato: function () {
                return contrato;
            },
            monedas: function () {
                return monedas;
            }, 
            parentScope: function () { 
                return parentScope; 
            }
        }
    }).result.then(
        function (resolve) {
            return true;
        },
        function (cancel) {
            // al regresar, asociamos las cuentas recién agregadas al ui-grid
            if (contrato.cuentasTecnicas_definicion) {
                // nótese que el ui-grid es pasado a esta función como un parámetro desde el código principal que
                // maneja las funciones generales del registro del contrato ...
                cuentasTecnicas_definiciones_ui_grid.data = contrato.cuentasTecnicas_definicion;
            }

            return true;
      })
}

angular.module("scrwebM").controller('CuentasConstruirDefinicionCuentasController',
['$scope', '$modalInstance', 'contrato', 'monedas', 'parentScope', 
function ($scope, $modalInstance, contrato, monedas, parentScope) {

    $scope.contrato = contrato;
    $scope.monedas = monedas;
    $scope.parametros = {
        fecha: contrato.desde,
        cantidad: 4, 
        diasVencimiento: 45, 
        cantidadMeses: 3, 
    };

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };


    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

    $scope.submitConstruirDefinicionCuentasForm = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if ($scope.construirDefinicionCuentasForm.$valid) {

            if ($scope.parametros.cantidad > 1) {
                if (!$scope.parametros.cantidadDias && !$scope.parametros.cantidadMeses) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: `Ud. debe indicar la cantidad de días o meses entre cuentas,
                              pues indicó una cantidad de cuentas mayor a una.`
                    });

                    return;
                }
            }

            $scope.submitted = false;
            $scope.construirDefinicionCuentasForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            construirDefinicionCuentas2(contrato, $scope.parametros);

            if (!parentScope.contrato.docState) { 
                // recibimos desde el state de definiciones el 'parent' scope. La idea es poder acceder desde aquí para 
                // inicializar la variable 'dataHasBeenEdited' ... 
                parentScope.contrato.docState = 2;
                parentScope.dataHasBeenEdited = true; 
            }
                
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, la definición de cuentas para el contrato ha sido construida.`
            });
        }
    }
}
])


function construirDefinicionCuentas2(contrato, parametros) {

    if (!_.isArray(contrato.cuentasTecnicas_definicion)) { 
        contrato.cuentasTecnicas_definicion = [];
    }
        
    var fechaProximaCuenta = parametros.fecha;
    var cantidad = contrato.cuentasTecnicas_definicion.length;

    for (var i, i = 1; i <= parametros.cantidad; i++) {

        var cuenta = {};

        cuenta._id = new Mongo.ObjectID()._str;
        cuenta.numero = i + cantidad;
        cuenta.moneda = parametros.moneda;

        cuenta.desde = fechaProximaCuenta;
        cuenta.fechaVencimiento = moment(fechaProximaCuenta).add(parametros.diasVencimiento, 'days').toDate();

        contrato.cuentasTecnicas_definicion.push(cuenta);

        // finalmente, calculamos la fecha de la próxima cuenta ...
        if (parametros.cantidad > 1) { 
            if (_.isNumber(parametros.cantidadDias)) { 
                fechaProximaCuenta = moment(fechaProximaCuenta).add(parametros.cantidadDias, 'days').toDate();
                cuenta.hasta = moment(fechaProximaCuenta).add(-1, 'days').toDate();
            }
            else if (_.isNumber(parametros.cantidadMeses)) { 
                fechaProximaCuenta = moment(fechaProximaCuenta).add(parametros.cantidadMeses, 'months').toDate();
                cuenta.hasta = moment(fechaProximaCuenta).add(-1, 'days').toDate();
            }  
        }
    }
}

Contratos_Methods.construirDefinicionCuentas = construirDefinicionCuentas;
