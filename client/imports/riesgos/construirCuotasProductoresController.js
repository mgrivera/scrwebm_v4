
import angular from 'angular';
import moment from 'moment'; 

export default angular.module("scrwebm.riesgos.movimientos.construirCuotasProductor", []).
                       controller('Riesgos_ConstruirCuotasProductorController',
['$scope', '$modalInstance', 'riesgo', 'movimiento', 'productor', 'cuotas', 
function ($scope, $modalInstance, riesgo, movimiento, productor, cuotas) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }


    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }


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

            calcularCuotasProductorSeleccionado(riesgo, movimiento, productor, cuotas, $scope.parametros);

            if (!riesgo.docState)
                riesgo.docState = 2;


            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: "Ok, las cuotas para el movimiento seleccionado han sido construidas."
            });
        }
    };
}
]);


function calcularCuotasProductorSeleccionado(riesgo, movimiento, productor, cuotas, parametros) {

    // siempre intentamos eliminar cuotas que ahora existan para el productor ...
    // nótese que no las eliminamos; solo las marcamos para que sean eliminadas al guardar todo
    if (cuotas.length)
        _(cuotas).filter(function (c) { return c.compania === productor.compania && c.source.subEntityID === movimiento._id; }).
                  map(function (c) { c.docState = 3; return c; }).
                  value();



    var factor = 1 / parametros.cantidadCuotas;
    var fechaProximaCuota = parametros.fecha1raCuota;

    for (var i = 1; i <= parametros.cantidadCuotas; i++) {

        var cuota = {};

        cuota._id = new Mongo.ObjectID()._str;

        cuota.source = {};

        cuota.source.entityID = riesgo._id;
        cuota.source.subEntityID = movimiento._id;
        cuota.source.origen = "fac";
        cuota.source.numero = riesgo.numero.toString() + "-" + movimiento.numero.toString();

        cuota.compania = productor.compania;
        cuota.moneda = productor.moneda;
        cuota.numero = i;
        cuota.cantidad = parametros.cantidadCuotas;

        cuota.fecha = fechaProximaCuota;
        cuota.fechaEmision = new Date(); 
        
        cuota.diasVencimiento = parametros.diasVencimiento;
        cuota.fechaVencimiento = moment(fechaProximaCuota).add(parametros.diasVencimiento, 'days').toDate();

        // nótese como los montos son negativos (pues los debemos pagar en vez de cobrar)
        cuota.montoOriginal = productor.monto * -1;
        cuota.factor = factor;
        cuota.monto = cuota.montoOriginal * factor;

        cuota.cia = riesgo.cia;
        cuota.docState = 1;

        cuotas.push(cuota);

        // finalmente, calculamos la fecha de la próxima cuota ...
        if (parametros.cantidadCuotas > 1)
            if (_.isNumber(parametros.cantidadDias))
                fechaProximaCuota = moment(fechaProximaCuota).add(parametros.cantidadDias, 'days').toDate();
            else if (_.isNumber(parametros.cantidadMeses))
                fechaProximaCuota = moment(fechaProximaCuota).add(parametros.cantidadMeses, 'months').toDate();
        }
    }
