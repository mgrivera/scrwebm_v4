
import angular from 'angular';

import moment from 'moment';
import lodash from 'lodash';

export default angular.module("scrwebm.riesgos.movimientos.contruirCuotas", []).
                       controller('Riesgos_ConstruirCuotasController',
['$scope', '$modalInstance', 'riesgo', 'movimiento', 'cuotas',
function ($scope, $modalInstance, riesgo, movimiento, cuotas) {

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

    $scope.submitted = false;
    $scope.parametros = {};

    $scope.parametros.fecha1raCuota = movimiento.desde;
    $scope.parametros.cantidadCuotas = 1;
    $scope.parametros.diasVencimiento = 30;

    $scope.submitConstruirCuotasForm = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if (!$scope.parametros) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Ud. debe indicar los valores requeridos para el cálculo de las cuotas."
            });

            return;
        }

        if ($scope.parametros.cantidadCuotas && $scope.parametros.cantidadCuotas > 1) {
            if (!$scope.parametros.cantidadDias && !$scope.parametros.cantidadMeses) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Ud. debe indicar o una cantidad de meses o una cantidad de días."
                });

                return;
            }

            if ($scope.parametros.cantidadDias && $scope.parametros.cantidadMeses) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Ud. debe indicar una cantidad de meses o una cantidad de días; pero no ambos."
                });

                return;
            }
        }


        if ($scope.construirCuotasForm.$valid) {
            $scope.submitted = false;
            $scope.construirCuotasForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            calcularCuotasMovimientoSeleccionado(riesgo, movimiento, cuotas, $scope.parametros);

            if (!riesgo.docState)
                riesgo.docState = 2;


            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: "Ok, las cuotas para el movimiento seleccionado han sido construidas."
            });
        }
    }
}
]);


function calcularCuotasMovimientoSeleccionado(riesgo, movimiento, cuotas, parametros) {

    // siempre intentamos eliminar cuotas que ahora existan para el movimiento ...
    // nótese que no las eliminamos; solo las marcamos para que sean eliminadas al guardar todo
    if (cuotas.length) {
        lodash(cuotas).filter(function (c) { return c.source.subEntityID === movimiento._id; }).map(function (c) { c.docState = 3; return c; }).value();
    }


    // debemos generar cuotas para cada reasegurador, pero también par la compañía cedente;
    const factor = 1 / parametros.cantidadCuotas;

    movimiento.primas.forEach( function(prima) {

        let fechaProximaCuota = parametros.fecha1raCuota;

        for (let i = 1; i <= parametros.cantidadCuotas; i++) {

            let cuota = {};

            // TODO: agregar otros valores nuevos en el collection de cuotas ...
            cuota._id = new Mongo.ObjectID()._str;

            cuota.source = {};

            cuota.source.entityID = riesgo._id;
            cuota.source.subEntityID = movimiento._id;
            cuota.source.origen = "fac";
            cuota.source.numero = riesgo.numero.toString() + "-" + movimiento.numero.toString();

            // las primas que corresponden a 'nosotros' en el array de primas, generan cuotas para la
            // compañía cedente (es decir: nuestras primas las cobramos a la compañía cedente ...)

            cuota.compania = prima.compania;

            if (prima.nosotros)
                cuota.compania = riesgo.compania;

            cuota.moneda = prima.moneda;
            cuota.numero = i;
            cuota.cantidad = parametros.cantidadCuotas;

            cuota.fechaEmision = movimiento.fechaEmision;
            cuota.fecha = fechaProximaCuota;
            cuota.diasVencimiento = parametros.diasVencimiento;
            cuota.fechaVencimiento = moment(fechaProximaCuota).add(parametros.diasVencimiento, 'days').toDate();

            cuota.montoOriginal = prima.primaNeta;
            cuota.factor = factor;
            cuota.monto = cuota.montoOriginal * factor;

            cuota.cia = riesgo.cia;
            cuota.docState = 1;

            cuotas.push(cuota);

            // finalmente, calculamos la fecha de la próxima cuota ...
            if (parametros.cantidadCuotas > 1) {
                if (lodash.isNumber(parametros.cantidadDias)) {
                    fechaProximaCuota = moment(fechaProximaCuota).add(parametros.cantidadDias, 'days').toDate();
                }
                else if (lodash.isNumber(parametros.cantidadMeses)) {
                    fechaProximaCuota = moment(fechaProximaCuota).add(parametros.cantidadMeses, 'months').toDate();
                }
            }
        }
    })
}
