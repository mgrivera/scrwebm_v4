
import { Mongo } from 'meteor/mongo'; 

import angular from 'angular';
import moment from 'moment';
import lodash from 'lodash';

import { determinarSiExistenCuotasConCobrosAplicados } from '/client/imports/generales/determinarSiExistenCuotasCobradas'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '/client/contratos/methods/_methods/_methods'; 

const generarCuotasCapas = ($scope, $uibModal) => {

    if (!$scope.contrato.capasPrimasCompanias || !lodash.isArray($scope.contrato.capasPrimasCompanias) || !$scope.contrato.capasPrimasCompanias.length) {
        DialogModal($uibModal,
                    "<em>Contratos - Capas - Generación de cuotas</em>",
                    "Aparentemente, el contrato y sus capas no tienen un registro de <em>primas para las compañías</em>.<br /><br />" +
                    "Ud. debe generar estos registros (primas para compañías) antes de intentar generar las cuotas " +
                    "para las capas del contrato.",
                    false).then();
        return;
    }

    // ------------------------------------------------------------------------------------------------------------------------
    // determinamos si las cuotas han recibido cobros/pagos; de ser así, impedimos editarlas ... 
    // leemos solo las cuotas que corresponden al 'sub' entity; por ejemplo, solo al movimiento, capa, cuenta, etc., que el 
    // usuario está tratando en ese momento ...  
    // ------------------------------------------------------------------------------------------------------------------------
    const cuotasCapas = $scope.cuotas.filter(c => c.source.origen === "capa"); 

    const existenCuotasConCobrosAplicados = determinarSiExistenCuotasConCobrosAplicados(cuotasCapas); 
    if (existenCuotasConCobrosAplicados.existenCobrosAplicados) { 
        DialogModal($uibModal, "<em>Cuotas - Existen cobros/pagos asociados</em>", existenCuotasConCobrosAplicados.message, false).then(); 
        return;
    }

    if ($scope.cuotas.some(c => c.source.origen === "capa")) {
        var mensajeAlUsuarioModel = {};
        mensajeAlUsuarioModel.titulo = "Existen <em>cuotas ya registradas</em> para las capas del contrato";
        mensajeAlUsuarioModel.mensaje = "Ya existen <em>cuotas registradas</em> para las capas del contrato.<br /><br />" +
                                        "Si Ud. continúa, éstas serán eliminadas y unas nuevas serán calculadas y " + 
                                        "registradas en su lugar.<br /><br />" +
                                        "Desea continuar y sustituir las cuotas registradas por unas nuevas?";

        DialogModal($uibModal, mensajeAlUsuarioModel.titulo, mensajeAlUsuarioModel.mensaje, true).then(
            function () {
                generarCuotas($scope, $uibModal);
                return;
            },
            function () {
                DialogModal($uibModal, "<em>Contratos - Capas</em>", "Ok, el proceso ha sido cancelado.", false).then();
                return;
            });
        return;
    }
    else
        generarCuotas($scope, $uibModal);
}

function generarCuotas($scope, $uibModal) {

    $uibModal.open({
        templateUrl: 'client/contratos/capasGenerarCuotas.html',
        controller: 'CapasGenerarCuotasController',
        size: 'md',
        resolve: {
            contrato: function () {
                return $scope.contrato;
            },
            cuotas: function () {
                return $scope.cuotas;
            }
        }
    }).result.then(
        function () {
            return true;
        },
        function () {
            // cuando el usuario cierra el modal que permite construir las cuotas, las asociamos al grid
            $scope.capasCuotas_ui_grid.data = [];

            if ($scope.cuotas && $scope.cuotas.find((c) => { return c.source.origen == 'capa'; })) { 
                $scope.capasCuotas_ui_grid.data = $scope.cuotas.filter((c) => { return c.source.origen === 'capa'; });
            }

            if ($scope.contrato.docState) { 
                $scope.dataHasBeenEdited = true; 
            }
                
            return true;
        })
}

angular.module("scrwebm").
        controller('CapasGenerarCuotasController', ['$scope', '$uibModalInstance', 'contrato', 'cuotas', 
function ($scope, $uibModalInstance, contrato, cuotas) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        $uibModalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
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

        if (!$scope.parametros || lodash.isEmpty($scope.parametros)) {
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

            calcularCuotas(contrato, cuotas, $scope.parametros);

            if (!contrato.docState) { 
                contrato.docState = 2;
            }
                
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: "Ok, las cuotas para las capas del contrato han sido construidas."
            });
        }
    }
}])

function calcularCuotas(contrato, cuotas, parametros) {

    // siempre intentamos eliminar cuotas que ahora existan para el movimiento ...
    // nótese que no las eliminamos; solo las marcamos para que sean eliminadas al guardar todo
    if (cuotas.length) { 
        cuotas.filter((c) => { return c.source.origen === "capa" }).map((c) => { c.docState = 3; return c; });
    }
        
    var factor = 1 / parametros.cantidadCuotas;

    // 'resumir': agrupar array de primas por compañía y moneda ...
    // vamos a crear un array aquí; si es 'resumir', vamos a agrupar por compañía y moneda; si no, lo dejamos tal cual ...
    // para agrupar por compañía-moneda, podemos concatenar (compañía y moneda); luego, para obtener cada valor, podemos hacer un split(" ")

    // también podemos crear un nuevo arry para opción 'resumir', que tenga ya todos sus valores para que el proceso que
    // sigue no tenga que distinguir si resumir o no.
    // en este nuevo array:
    // capaID: '0'
    // numeroCapa: 'todas'
    // primaNeta: sum(pn para las capas de la misma compañía-moneda)

    let primasArray = [];

    if (parametros.resumirCuotas) {

        // si el usuario quiere resumir las primas de todas las capas, debemos agrupar por compañía y moneda
        // grabamos el resultado en un nuevo array (primasArray
        const groupedArray = lodash.chain(contrato.capasPrimasCompanias)
                                .groupBy((x) => { return x.compania.toString() + " " + x.moneda.toString(); })
                                .value();

        for(const key in groupedArray) {

            // en el objeto que resulta del groupBy, cada key es una combinación: compania-moneda
            const compania = key.split(" ")[0];
            const moneda = key.split(" ")[1];

            primasArray.push({
                capaID: '0',
                numeroCapa: 'todas',
                nosotros: groupedArray[key][0].nosotros,
                compania: compania,
                moneda: moneda,
                primaNeta: lodash.sumBy(groupedArray[key], 'primaNeta'),
            })
        }
    }
    else { 
        // si el usuario no quiere resumir, usamos el array original (y generamos cuotas para *cada* capa ...)
        primasArray = lodash.cloneDeep(contrato.capasPrimasCompanias);
    }
    
    primasArray.forEach(function (prima) {

        var fechaProximaCuota = parametros.fecha1raCuota;

        for (var i = 1; i <= parametros.cantidadCuotas; i++) {

            var cuota = {};

            cuota._id = new Mongo.ObjectID()._str;

            cuota.source = {};

            cuota.source.entityID = contrato._id;
            cuota.source.subEntityID = prima.capaID;
            cuota.source.origen = "capa";
            cuota.source.numero = contrato.numero.toString() + "-" + prima.numeroCapa.toString();

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

    return;
}

Contratos_Methods.generarCuotasCapas = generarCuotasCapas;