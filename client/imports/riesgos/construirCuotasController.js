
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';
import angular from 'angular';

import moment from 'moment';
import lodash from 'lodash';

import { LeerCompaniaNosotros } from '/imports/generales/leerCompaniaNosotros'; 

import InfoModal from '/client/imports/genericReactComponents/infoModal/angular.module'; 
import construirCuotasInfoText from './construirCuotas.infoText'; 

export default angular.module("scrwebm.riesgos.movimientos.contruirCuotas", [ InfoModal.name ]).
                       controller('Riesgos_ConstruirCuotasController',
['$scope', '$modalInstance', '$timeout', 'riesgo', 'movimiento', 'cuotas', 
function ($scope, $modalInstance, $timeout, riesgo, movimiento, cuotas) {

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

    // determinamos la compañía nosotros, para saber si tiene un monto de corretaje calculado. De ser así, preguntamos al 
    // usuario si construimos una cuota de corretaje para la compañía cedente 
    let companiaNosotros = {};
    const result = LeerCompaniaNosotros(Meteor.userId());

    if (result.error) {
        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'danger',
            msg: `<em>Riesgos - Error al intentar leer la compañía 'nosotros'</em><br />${result.message}`
        });
    }

    // ----------------------------------------------------------------------------------------------------------------------
    // para mostrar/ocultar el modal que muestra las notas para esta función; nota: el modal es un react component ... 
    $scope.showInfoModal = false; 
    $scope.infoText = construirCuotasInfoText(); 
    $scope.infoHeader = "Construir cuotas de cobro y pago de primas"; 

    $scope.setShowInfoModal = () => { 
        $scope.showInfoModal = !$scope.showInfoModal; 

        // el timeOut es necesario pues la función se ejecuta desde react; angular 'no se da cuenta' y este código, 
        // probablemente, pasa desapercibido para angularjs; el $timeout hace que anular ejecute sus ciclos y revise el 
        // resultado de este código; al hacerlo, angular actualiza su state ... 

        // nótese que timeout ejecuta un callback luego que pasa un delay; cómo no necesitamos ejecutar un 
        // callback, no lo pasamos; el delay tampoco ... 
        $timeout(); 
    }

    companiaNosotros = result.companiaNosotros; 

    // ahora que tenemos la compañía nosotros, revisamos a ver si su registro de primas tiene un monto de corretaje calculado 
    // nota: en el registro de prima, hay una propiedad Nosotros; también pudimos, simplemente, haberla usado, para saber si 
    // el registro de primas corresponde a la compañía Nosotros 
    const companiaCedenteTieneMontoCorretaje = movimiento.primas.some(x => x.compania === companiaNosotros._id && x.corretaje); 

    // si existe un monto de corretaje para la compañía cedente en el registro que corresponde a nuestra prima, 
    // preguntamos al usuario si desea construir una cuota (cxp) para el mismo
    $scope.preguntarGenerarCuotaCorretajeCompaniaCedente = companiaCedenteTieneMontoCorretaje; 

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

            if (!riesgo.docState) { 
                riesgo.docState = 2;
            }
                
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
        lodash(cuotas).filter(function (c) { return c.source.subEntityID === movimiento._id; })
                      .map(function (c) { c.docState = 3; return c; })
                      .value();
    }

    // debemos generar cuotas para cada reasegurador, pero también par la compañía Nosotros;
    const factor = 1 / parametros.cantidadCuotas;

    movimiento.primas.forEach( function(prima) {

        let fechaProximaCuota = parametros.fecha1raCuota;

        for (let i = 1; i <= parametros.cantidadCuotas; i++) {

            const cuota = {};

            cuota._id = new Mongo.ObjectID()._str;

            cuota.source = {};

            cuota.source.entityID = riesgo._id;
            cuota.source.subEntityID = movimiento._id;
            cuota.source.origen = "fac";
            cuota.source.numero = riesgo.numero.toString() + "-" + movimiento.numero.toString();

            // las primas que corresponden a 'nosotros' en el array de primas, generan cuotas para la
            // compañía cedente (es decir: nuestras primas las cobramos a la compañía cedente ...)

            cuota.compania = prima.compania;

            if (prima.nosotros) { 
                cuota.compania = riesgo.compania;
            }
                
            cuota.moneda = prima.moneda;
            cuota.numero = i;
            cuota.cantidad = parametros.cantidadCuotas;

            cuota.fechaEmision = movimiento.fechaEmision;
            cuota.fecha = fechaProximaCuota;
            cuota.diasVencimiento = parametros.diasVencimiento;
            cuota.fechaVencimiento = moment(fechaProximaCuota).add(parametros.diasVencimiento, 'days').toDate();

            const montoOriginal = prima.primaNeta; 

            if (parametros.generarCuotaCorretajePorPagar && prima.nosotros && prima.corretaje) {
                // si hay un monto de corretaje para la compañía cedente, y el usuario puede decidir si generar una cuota 
                // agregamos el corretaje a la prima, para obtener un monto 'full' que incluya el corretaje 
                cuota.montoOriginal = montoOriginal + (prima.corretaje * -1);       // nótese que el corr viene con signo opuesto siempre
            } else { 
                cuota.montoOriginal = montoOriginal;
            }

            cuota.factor = factor;
            cuota.monto = cuota.montoOriginal * factor;

            cuota.cia = riesgo.cia;
            cuota.docState = 1;

            cuotas.push(cuota);

            if (parametros.generarCuotaCorretajePorPagar && prima.nosotros && prima.corretaje) { 
                // si hay un monto de corretaje para la compañía cedente, el usuario puede decidir si generar una cuota 
                // para este monto y por pagar a esta compañía. En este caso, básicamente, duplicamos esta cuota y cambiamos el monto 
                // por el corretaje; también debemos ajustar la prima por cobrar para agregar el corretaje 
                const cuotaMontoCorretaje = agregarCuotaCorretajeCompaniaCedente(cuota, prima.corretaje, factor);
                cuotas.push(cuotaMontoCorretaje);  
            }

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

function agregarCuotaCorretajeCompaniaCedente(cuota, montoCorretaje, factor) { 

    const cuotaCorretaje = Object.assign({}, cuota);        // to get a clone of object 
  
    cuotaCorretaje._id = new Mongo.ObjectID()._str;

    cuotaCorretaje.montoOriginal = montoCorretaje;
    cuotaCorretaje.factor = factor;
    cuotaCorretaje.monto = cuotaCorretaje.montoOriginal * factor;

    return cuotaCorretaje; 
}