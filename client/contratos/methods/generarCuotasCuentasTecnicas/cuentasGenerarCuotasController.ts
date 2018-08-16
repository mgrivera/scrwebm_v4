

import * as angular from 'angular'; 
import * as moment from 'moment'; 
import * as lodash from 'lodash'; 

import { determinarSiExistenCuotasConCobrosAplicados } from '../../../imports/generales/determinarSiExistenCuotasCobradas'; 
import { DialogModal } from '../../../imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller('CuentasGenerarCuotasController',
['$scope', '$modal', '$modalInstance', 'contrato', 'definicionCuentaTecnicaSeleccionada', 'cuotas', 'definicionCuentaTecnicaSeleccionada_Info',
 'cuentas_saldos', 'comAdic_montosFinales', 'entCartPr_montosFinales', 'entCartSn_montosFinales', 
 'retCartPr_montosFinales', 'retCartSn_montosFinales', 'partBeneficios_montosFinales', 
function ($scope, $modal, $modalInstance, contrato, definicionCuentaTecnicaSeleccionada, cuotas, definicionCuentaTecnicaSeleccionada_Info, 
          cuentas_saldos, comAdic_montosFinales, entCartPr_montosFinales, entCartSn_montosFinales, 
          retCartPr_montosFinales, retCartSn_montosFinales, partBeneficios_montosFinales) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.definicionCuentaTecnicaSeleccionada = definicionCuentaTecnicaSeleccionada;
    $scope.definicionCuentaTecnicaSeleccionada_Info = definicionCuentaTecnicaSeleccionada_Info;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.parametros = {
        cantidadCuotas: 1,
        fecha1raCuota: new Date(definicionCuentaTecnicaSeleccionada.desde.getFullYear(),
                                definicionCuentaTecnicaSeleccionada.desde.getMonth(),
                                definicionCuentaTecnicaSeleccionada.desde.getDate()),
        diasVencimiento: 30
    }

    // ------------------------------------------------------------------------------------------------------------------------
    // determinamos si las cuotas han recibido cobros; de ser así, impedimos editarlas ... 
    // leemos solo las cuotas que corresponden al 'sub' entity; por ejemplo, solo al movimiento, capa, cuenta, etc., que el 
    // usuario está tratando en ese momento ...  
    // ------------------------------------------------------------------------------------------------------------------------
    let cuotasCuentaTecnica = [] as any; 

    if (cuotas.length) { 
        cuotasCuentaTecnica = lodash.filter(cuotas, (c) => { return c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id; });
    }
        

    let existenCuotasConCobrosAplicados = determinarSiExistenCuotasConCobrosAplicados(cuotasCuentaTecnica); 
    if (existenCuotasConCobrosAplicados.existenCobrosAplicados) { 
        DialogModal($modal, "<em>Cuotas - Existen cobros/pagos asociados</em>", existenCuotasConCobrosAplicados.message, false).then( 
            (resolve) => { 
                $scope.cancel();        // para cerrar el modal de cuotas justo cuando el usuario cierra este modal con el error ... 
            }
        ); 
    }

    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

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


        if ($scope.construirCuotasCuentaTecnicaForm.$valid) {
            $scope.submitted = false;
            // para que la clase 'ng-submitted deje de aplicarse a la forma
            $scope.construirCuotasCuentaTecnicaForm.$setPristine();

            calcularCuotasCuentaTecnica(contrato, definicionCuentaTecnicaSeleccionada, cuotas, $scope.parametros, 
                cuentas_saldos, comAdic_montosFinales, entCartPr_montosFinales, entCartSn_montosFinales, 
                retCartPr_montosFinales, retCartSn_montosFinales, partBeneficios_montosFinales);

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: "Ok, las cuotas para la cuenta técnica seleccionada han sido construidas."
            });
        }
    };
}
])


function calcularCuotasCuentaTecnica(contrato, definicionCuentaTecnicaSeleccionada, cuotas, parametros, 
                                     cuentas_saldos, comAdic_montosFinales, entCartPr_montosFinales, entCartSn_montosFinales, 
                                     retCartPr_montosFinales, retCartSn_montosFinales, partBeneficios_montosFinales) {

    // siempre intentamos eliminar cuotas que ahora existan para la definición de cuenta técnica que el
    // usuario ha seleccionado ...
    // nótese que no las eliminamos; solo las marcamos para que sean eliminadas al guardar todo
    if (cuotas.length) { 
        lodash(cuotas).filter(function (c) {
            return c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id;
        }).map(function (c) { c.docState = 3; return c; }).value();
    }
        
    // siempre generamos las cuotas para los saldos de la definición seleccionada
    var factor = 1 / parametros.cantidadCuotas;

    let montosCompanias_array = []; 

    // nótese que, en adelante, los arrays con saldos y montos de cuentas y complementarios, corresponden solo a la definición seleccionada 

    // 1) montos en saldos de cuentas técnicas 
    if (Array.isArray(cuentas_saldos)) { 
        cuentas_saldos.forEach((x) => { 
            let montoCompania = {
                compania: x.compania, 
                nosotros: x.nosotros, 
                moneda: x.moneda, 
                monto: x.saldo,             // en este array, el monto se llama saldo; en el resto, se llama, simplemente, monto ... 
            }; 
            montosCompanias_array.push(montoCompania as never); 
        })
    }

    // 2) montos en comisión adicional  
    if (Array.isArray(comAdic_montosFinales)) { 
        comAdic_montosFinales.forEach((x) => { 
            let montoCompania = {
                compania: x.compania, 
                nosotros: x.nosotros, 
                moneda: x.moneda, 
                monto: x.monto,            
            }; 
            montosCompanias_array.push(montoCompania as never); 
        })
    }

    // 3) montos en participación de beneficios
    if (Array.isArray(partBeneficios_montosFinales)) { 
        partBeneficios_montosFinales.forEach((x) => { 
            let montoCompania = {
                compania: x.compania, 
                nosotros: x.nosotros, 
                moneda: x.moneda, 
                monto: x.monto,            
            }; 
            montosCompanias_array.push(montoCompania as never); 
        })
    }

    // 4) montos en entrada cartera primas 
    if (Array.isArray(entCartPr_montosFinales)) { 
        entCartPr_montosFinales.forEach((x) => { 
            let montoCompania = {
                compania: x.compania, 
                nosotros: x.nosotros, 
                moneda: x.moneda, 
                monto: x.monto,            
            }; 
            montosCompanias_array.push(montoCompania as never); 
        })
    }

    // 5) montos en retirada cartera primas 
    if (Array.isArray(retCartPr_montosFinales)) { 
        retCartPr_montosFinales.forEach((x) => { 
            let montoCompania = {
                compania: x.compania, 
                nosotros: x.nosotros, 
                moneda: x.moneda, 
                monto: x.monto,            
            }; 
            montosCompanias_array.push(montoCompania as never); 
        })
    }

    // 6) montos en entrada cartera siniestros 
    if (Array.isArray(entCartSn_montosFinales)) { 
        entCartSn_montosFinales.forEach((x) => { 
            let montoCompania = {
                compania: x.compania, 
                nosotros: x.nosotros, 
                moneda: x.moneda,  
                monto: x.monto,        
            }; 
            montosCompanias_array.push(montoCompania as never); 
        })
    }

    // 7) montos en retirada cartera siniestros 
    if (Array.isArray(retCartSn_montosFinales)) { 
        retCartSn_montosFinales.forEach((x) => { 
            let montoCompania = {
                compania: x.compania, 
                nosotros: x.nosotros, 
                moneda: x.moneda, 
                monto: x.monto,        
            }; 
            montosCompanias_array.push(montoCompania as never); 
        })
    }

    let montosCompanias_final = []; 

    // finalmente, debemos producir un array donde haya un solo registro por compañía, con su monto final (saldo a pagar/cobrar) 
    // para hacerlo, debemos agrupar por compañía y sumarizar los montos ... 
    let montosCompanias_groupBy_compania = lodash.groupBy(montosCompanias_array, "compania"); 

    for (let compania in montosCompanias_groupBy_compania) { 

        let firstItemInArray: any = montosCompanias_groupBy_compania[compania][0]; 

        let itemCompania = { 
            compania: firstItemInArray.compania, 
            nosotros: firstItemInArray.nosotros, 
            moneda: firstItemInArray.moneda, 
            monto: lodash.sumBy(montosCompanias_groupBy_compania[compania], "monto"),        
        }; 

        montosCompanias_final.push(itemCompania as never); 
    }
    

    montosCompanias_final.forEach( function(saldo: any) {

        var fechaProximaCuota = parametros.fecha1raCuota;

        for (var i = 1; i <= parametros.cantidadCuotas; i++) {

            var cuota = {} as any;

            cuota._id = new Mongo.ObjectID()._str;

            cuota.source = {};

            // nótese como las cuotas se generan, en forma específica, para la definición seleccionada ...
            cuota.source.entityID = contrato._id;
            cuota.source.subEntityID = definicionCuentaTecnicaSeleccionada._id;
            cuota.source.origen = "cuenta";
            cuota.source.numero = contrato.numero.toString() + "-" + definicionCuentaTecnicaSeleccionada.numero.toString();

            // nótese como nuestras cuentas técnicas deben generar cuotas para la compañía cedente ...
            if (saldo.nosotros) { 
                cuota.compania = contrato.compania;
            }  
            else { 
                cuota.compania = saldo.compania;
            }
                
            cuota.moneda = saldo.moneda;
            cuota.numero = i;
            cuota.cantidad = parametros.cantidadCuotas;

            cuota.fechaEmision = definicionCuentaTecnicaSeleccionada.desde ? definicionCuentaTecnicaSeleccionada.desde : null;
            cuota.fecha = fechaProximaCuota;
            cuota.diasVencimiento = parametros.diasVencimiento;
            cuota.fechaVencimiento = moment(fechaProximaCuota).add(parametros.diasVencimiento, 'days').toDate();

            cuota.montoOriginal = saldo.monto;
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
}
