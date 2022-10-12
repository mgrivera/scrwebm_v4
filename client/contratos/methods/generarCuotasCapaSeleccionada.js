
import { Mongo } from 'meteor/mongo';

import angular from 'angular';
import moment from 'moment';
import lodash from 'lodash';

import { determinarSiExistenCuotasConCobrosAplicados } from '/client/imports/generales/determinarSiExistenCuotasCobradas';
import { DialogModal } from '/client/imports/generales/angularGenericModal';
import { Contratos_Methods } from '/client/contratos/methods/_methods/_methods';

const generarCuotasCapaSeleccionada = ($scope, capaSeleccionada, $uibModal) => {

    if (!capaSeleccionada || Object.keys(capaSeleccionada).length === 0) {
        // no hay una capa seleccionada 
        DialogModal($uibModal,
            "<em>Contratos - Capas - Generación de cuotas</em>",
            "Ud. debe <em>seleccionar</em> una capa.<br /><br />" +
            "Ud. decidió ejecutar la función que permite construir cuotas para <em>la capa que se ha seleccionado</em>. <br /> " +
            "Debe seleccionar, en la lista de capas (arriba), la capa para la cual desea construir las cuotas.",
            false).then();
        return;
    }

    // seleccionamos *solo* los registros que corresponden a la capa seleccionada
    const primasPorCompania = $scope.contrato.capasPrimasCompanias && Array.isArray($scope.contrato.capasPrimasCompanias) ? 
                              $scope.contrato.capasPrimasCompanias.filter(x => x.numeroCapa === capaSeleccionada.numero) : 
                              []; 

    if (!primasPorCompania || !Array.isArray(primasPorCompania) || !primasPorCompania.length) {
        // el array de primas por compañía esta vacío o no existe 
        DialogModal($uibModal,
            "<em>Contratos - Capas - Generación de cuotas</em>",
            "Aparentemente, no se han registrados <em>registros de prima</em> para la capa que se ha seleccionado.<br /><br />" +
            "Ud. debe generar estos registros (primas para compañías) antes de intentar generar las cuotas " +
            "para la capa que se ha seleccionado.",
            false).then();
        return;
    }

    // si existen cuotas para la capa seleccionada, no deben haber recibido pagos 
    // nótese como determinamos las cuotas para la capa 
    const cuota_numeroCapa = $scope.contrato.numero.toString() + "-capa-" + capaSeleccionada.numero.toString(); 
    const cuotasCapaSeleccionada = $scope.cuotas.filter(c => c.source.origen === "capa" && c.source.numero === cuota_numeroCapa); 

    const existenCuotasConCobrosAplicados = determinarSiExistenCuotasConCobrosAplicados(cuotasCapaSeleccionada);
    if (existenCuotasConCobrosAplicados.existenCobrosAplicados) {
        DialogModal($uibModal, 
                    "<em>Cuotas - Existen cobros/pagos asociados para al menos una cuota, en la capa que se ha seleccionado</em>", 
                    existenCuotasConCobrosAplicados.message, 
                    false
                   ).then();
        return;
    }

    // si ya existen coutas para la capa seleccionada, permitimos cancelar el proceso 
    if (Array.isArray(cuotasCapaSeleccionada) && cuotasCapaSeleccionada.length) {
        const mensajeAlUsuarioModel = {};
        mensajeAlUsuarioModel.titulo = "Existen <em>cuotas ya registradas</em> para la capa que se ha seleccionado";
        mensajeAlUsuarioModel.mensaje = "Ya existen <em>cuotas registradas</em> para la capa del contrato que Ud. ha seleccionado " + 
            "en la lista.<br /><br />" +
            "Si Ud. continúa, estas serán eliminadas y unas nuevas serán calculadas y registradas en su lugar.<br /><br />" +
            "Desea continuar y sustituir las cuotas registradas por unas nuevas?";

        DialogModal($uibModal, mensajeAlUsuarioModel.titulo, mensajeAlUsuarioModel.mensaje, true).then(
            () => {
                generarCuotas($scope, capaSeleccionada, cuotasCapaSeleccionada, $uibModal);
                return;
            },
            () => {
                DialogModal($uibModal, "<em>Contratos - Capas - Construcción de cuotas</em>", "Ok, el proceso ha sido cancelado.", false).then();
                return;
            });
        return;
    }
    else { 
        generarCuotas($scope, capaSeleccionada, cuotasCapaSeleccionada, $uibModal);
    }
}

function generarCuotas($scope, capaSeleccionada, cuotasCapaSeleccionada, $uibModal) {

    $uibModal.open({
        templateUrl: 'client/contratos/capasGenerarCuotas_capaSeleccionada.html',
        controller: 'GenerarCuotasCapaSeleccionada_Controller',
        size: 'md',
        resolve: {
            contrato: () => $scope.contrato,
            capaSeleccionada: () => capaSeleccionada, 
            cuotasCapaSeleccionada: () =>  cuotasCapaSeleccionada
        }
    }).result.then(
        function () {
            return true;
        },
        function (cuotasCapaSeleccionada) {
            // cuando el usuario cierra el modal que permite construir las cuotas, las asociamos al grid
            $scope.capasCuotas_ui_grid.data = [];

            if ($scope.cuotas && Array.isArray($scope.cuotas)) {
                // agregamos las cuotas recién construidas al array de cuotas, pero antes eliminamos la que ahora puedan existir
                const cuota_numeroCapa = $scope.contrato.numero.toString() + "-capa-" + capaSeleccionada.numero.toString(); 
                const newArray = $scope.cuotas.filter(x => x.source.numero != cuota_numeroCapa); 
                $scope.cuotas = []; 
                cuotasCapaSeleccionada.forEach(x => newArray.push(x)); 

                // ahora agregamos las cuotas nuevas (las que se han marcado como eliminadas y las marcadas como nuevas)
                newArray.forEach(x => $scope.cuotas.push(x)); 

                // finalmente hacemos el data binding en el grid 
                $scope.capasCuotas_ui_grid.data = $scope.cuotas;
            }

            if ($scope.contrato.docState) {
                $scope.dataHasBeenEdited = true;
            }

            return true;
        })
}

angular.module("scrwebm").
        controller('GenerarCuotasCapaSeleccionada_Controller', 
        ['$scope', '$uibModalInstance', 'contrato', 'capaSeleccionada', 'cuotasCapaSeleccionada',
function ($scope, $uibModalInstance, contrato, capaSeleccionada, cuotasCapaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        $uibModalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss(cuotasCapaSeleccionada);
    }

    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

    $scope.parametros = {
        cantidadCuotas: 1,
        fecha1raCuota: new Date(contrato.desde.getFullYear(), contrato.desde.getMonth(), contrato.desde.getDate()),
        diasVencimiento: 30,
        resumirCuotas: true,
    };

    $scope.submitConstruirCuotasForm = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if (!$scope.parametros || Object.keys($scope.parametros).length === 0) {
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

            calcularCuotas(contrato, capaSeleccionada, cuotasCapaSeleccionada, $scope.parametros);

            if (!contrato.docState) {
                contrato.docState = 2;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, las cuotas para la capa seleccionada (capa # <b>${capaSeleccionada.numero.toString()}</b>) han sido construidas.`
            });
        }
    }
}])

function calcularCuotas(contrato, capaSeleccionada, cuotasCapaSeleccionada, parametros) {

    // determinamos el número que asociaremos a las cuotas 
    const cuota_numeroCapa = contrato.numero.toString() + "-capa-" + capaSeleccionada.numero.toString(); 

    // siempre intentamos eliminar cuotas que ahora existan para el movimiento ...
    // nótese que no las eliminamos; solo las marcamos para que sean eliminadas al guardar todo
    if (cuotasCapaSeleccionada && Array.isArray(cuotasCapaSeleccionada) && cuotasCapaSeleccionada.length) {
        cuotasCapaSeleccionada.forEach(c => c.docState = 3);
    }

    const factor = 1 / parametros.cantidadCuotas;
    const primasArray = contrato.capasPrimasCompanias.filter(x => x.numeroCapa === capaSeleccionada.numero);

    primasArray.forEach(function (prima) {

        let fechaProximaCuota = parametros.fecha1raCuota;

        for (let i = 1; i <= parametros.cantidadCuotas; i++) {

            const cuota = {};

            cuota._id = new Mongo.ObjectID()._str;

            cuota.source = {};

            cuota.source.entityID = contrato._id;
            cuota.source.subEntityID = prima.capaID;
            cuota.source.origen = "capa";
            cuota.source.numero = cuota_numeroCapa;

            if (prima.nosotros) {
                // esta cuota corresponde al cedente ...
                cuota.compania = contrato.compania;
            }
            else {
                cuota.compania = prima.compania;
            }

            cuota.moneda = prima.moneda;
            cuota.numero = i;
            cuota.cantidad = parametros.cantidadCuotas;

            cuota.fechaEmision = new Date();
            cuota.fecha = fechaProximaCuota;
            cuota.diasVencimiento = parametros.diasVencimiento;
            cuota.fechaVencimiento = moment(fechaProximaCuota).add(parametros.diasVencimiento, 'days').toDate();

            cuota.montoOriginal = prima.primaNeta;
            cuota.factor = factor;
            cuota.monto = cuota.montoOriginal * factor;

            cuota.cia = contrato.cia;
            cuota.docState = 1;

            cuotasCapaSeleccionada.push(cuota);

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

    return;
}

Contratos_Methods.generarCuotasCapaSeleccionada = generarCuotasCapaSeleccionada;