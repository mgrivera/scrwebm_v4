


import lodash from 'lodash';
import moment from 'moment';

angular.module("scrwebm").controller('Siniestros_ConstruirCuotasController',
['$scope', '$modalInstance', 'siniestro', 'liquidacion', 'cuotas',
function ($scope, $modalInstance, siniestro, liquidacion, cuotas) {

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

    $scope.parametros.fecha1raCuota = liquidacion.fecha;
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

            calcularCuotasLiquidacionSeleccionada(siniestro, liquidacion, cuotas, $scope.parametros);

            if (!siniestro.docState)
                siniestro.docState = 2;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: "Ok, las cuotas para la liquidación de siniestro han sido construidas."
            });
        }
    };
}
]);


function calcularCuotasLiquidacionSeleccionada(siniestro, liquidacion, cuotas, parametros) {

    // siempre intentamos eliminar cuotas que ahora existan para el movimiento ...
    // nótese que no las eliminamos; solo las marcamos para que sean eliminadas al guardar todo
    if (cuotas.length)
        lodash(cuotas).filter(function (c) { return c.source.subEntityID === liquidacion._id; }).map(function (c) { c.docState = 3; return c; }).value();


    // debemos generar cuotas para cada reasegurador, pero también par la compañía cedente;

    siniestro.companias.forEach( function(compania) {

        var fechaProximaCuota = parametros.fecha1raCuota;

        for (var i = 1; i <= parametros.cantidadCuotas; i++) {

            var cuota = construirCuota(siniestro,
                                       liquidacion,
                                       compania,
                                       i,
                                       parametros.cantidadCuotas,
                                       fechaProximaCuota,
                                       parametros.diasVencimiento);

            cuotas.push(cuota);

            // finalmente, calculamos la fecha de la próxima cuota ...
            if (parametros.cantidadCuotas > 1)
                if (lodash.isNumber(parametros.cantidadDias))
                    fechaProximaCuota = moment(fechaProximaCuota).add(parametros.cantidadDias, 'days').toDate();
                else if (lodash.isNumber(parametros.cantidadMeses))
                    fechaProximaCuota = moment(fechaProximaCuota).add(parametros.cantidadMeses, 'months').toDate();
            };
        });
    };

    function construirCuota(siniestro, liquidacion, compania, numero, cantidad, fecha, diasVenc) {

        var cuota = {};

        var factor = 1 / cantidad;

        cuota.compania = compania.compania;

        if (compania.nosotros)
            cuota.compania = siniestro.compania;

        var monto = 0;
        if (liquidacion.indemnizado) monto += liquidacion.indemnizado;
        if (liquidacion.adicional) monto += liquidacion.adicional;
        if (liquidacion.ajuste) monto += liquidacion.ajuste;
        if (liquidacion.otrosGastos) monto += liquidacion.otrosGastos;

        cuota._id = new Mongo.ObjectID()._str;

        cuota.source = {};

        cuota.source.entityID = siniestro._id;
        cuota.source.subEntityID = liquidacion._id;
        cuota.source.origen = "sinFac";
        cuota.source.numero = siniestro.numero.toString() + "-" + liquidacion.numero.toString();

        cuota.moneda = liquidacion.moneda;
        cuota.numero = numero;
        cuota.cantidad = cantidad;

        cuota.fechaEmision = liquidacion.fechaEmision ? liquidacion.fechaEmision : null;
        cuota.fecha = fecha;
        cuota.diasVencimiento = diasVenc;
        cuota.fechaVencimiento = moment(fecha).add(diasVenc, 'days').toDate();

        // para reaseguradores, el monto de la cuota es positivo (a cobrar); opuesto para 'nosotros' (que debemos pagar)
        cuota.montoOriginal = monto * compania.ordenPorc / 100;

        if (compania.nosotros)
            cuota.montoOriginal *= -1;

        cuota.factor = factor;
        cuota.monto = cuota.montoOriginal * factor;

        cuota.cia = siniestro.cia;
        cuota.docState = 1;

        return cuota;
    };
