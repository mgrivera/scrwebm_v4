
import { Meteor } from 'meteor/meteor'; 
import angular from 'angular'; 

import lodash from 'lodash'; 
import numeral from 'numeral'; 
import moment from 'moment'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Remesas } from '/imports/collections/principales/remesas';  
import { Temp_Cobranzas } from '/imports/collections/consultas/temp_cobranzas';

import CobranzaResumenCobranzaModal from './resumenCobranzaModal/angularComponent'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

// importamos el controller CobranzaGuardarEstado_Controller
import CobranzaGuardarEstado from './cobranzaGuardarEstado'; 

export default angular.module("scrwebm.cobranzas.aplicarPagos", [ CobranzaGuardarEstado.name, CobranzaResumenCobranzaModal.name ])
                      .controller("CobranzasAplicarPagosController",
['$scope', '$state', '$stateParams', '$uibModal', function ($scope, $state, $stateParams, $uibModal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    let remesaSeleccionada = null; 

    const remesaSeleccionadaPK = $stateParams.remesaPK;

    if (remesaSeleccionadaPK) {

        $scope.showProgress = true;

        remesaSeleccionada = Remesas.findOne({ _id: remesaSeleccionadaPK });

        $scope.remesa = remesaSeleccionada; 
        $scope.monedaRemesa = Monedas.findOne($scope.remesa.moneda); 

        Meteor.call('cobranzas.determinarCuotasPendientesCompaniaRemesaSeleccionada', remesaSeleccionada._id, (err, result)  => {

            if (err) {
                const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `${result}.<br />
                        Ahora, Ud. debe seleccionar las cuotas a pagar y hacer un
                        <em>click</em> en el botón <em>Aplicar pagos</em>`
            });

            // Ok, ahora que el 'method' en el servidor agregó los items a la tabla, hacemos un subscribe para tener estos items en el cliente ...
            // nótese solo se publicarán documentos que correspondan al usuario
            Meteor.subscribe('temp_cobranzas', () => { 

                $scope.temp_cobranzas = Temp_Cobranzas.find({ usuario: Meteor.userId() },
                                                            { sort: { 'cuota.fecha': 1, 'origen.numero': 1 }}).
                                                        fetch();
                $scope.showProgress = false;
                $scope.$apply(); 
            })
        })
    }

    $scope.opcionesSeleccionarCuotas = [
        { tipo: true, descripcion: 'Seleccionadas' },
        { tipo: false, descripcion: 'No seleccionadas' },
        { tipo: '', descripcion: 'Todas' }, 
    ];

    $scope.regresarStateAnterior = function () {
        $state.go('cobranzas.seleccionRemesa');
    }

    $scope.seleccionarCuotasPagadas = function() { 
        // permitimos al usuario ver solo cuotas seleccionadas (ie: marcadas), por seleccionar o todas ... 
        switch($scope.seleccionarMarcadas) { 
            case "SE": {
                break; 
            }
            case "NS": {
                break; 
            }
            default: {
                // $scope.filterCuotaMarcada = { }
                break; 
            }
        }
    }

    $scope.aplicarPagos = function () {

        if (!$scope.temp_cobranzas) {
            DialogModal($uibModal, "<em>Cobranzas</em>",
                                `Aparentemente, Ud. no ha seleccionado pagos a ser aplicados.<br />
                                    Ud. debe seleccionar al menos un pago a ser aplicado por este proceso,
                                    para la remesa seleccionada.`,
                                false).then();

            return;
        }

        const pagosAAplicar = lodash.filter($scope.temp_cobranzas, function (cuota) { return cuota.pagar; });

        if (pagosAAplicar.length == 0) {
            DialogModal($uibModal, "<em>Cobranzas</em>",
                                `Aparentemente, Ud. no ha seleccionado pagos a ser aplicados.<br />
                                    Ud. debe seleccionar al menos un pago a ser aplicado por este proceso, para
                                    la remesa seleccionada.`,
                                false).then();

            return;
        }

        $scope.showProgress = true;

        // construimos un array que contendrá solo los datos que el método necesita para aplicar los pagos ...
        const pagosAAplicar2 = [];

        pagosAAplicar.forEach(function (item) {
            const pagoAAplicar = {
                cuotaID: item.cuota.cuotaID,
                monto: item.monto,
                completo: item.completo
            };

            pagosAAplicar2.push(pagoAAplicar);
        })

        Meteor.call('cobranzas.grabarPagosIndicadosParaCuotasSeleccionadas', remesaSeleccionada._id, pagosAAplicar2, (err, result)  => {

            if (err) {
                const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // vamos al state de Resultados
            $state.go("cobranzas.resultados", {
                remesaID: remesaSeleccionadaPK,
                cantPagos: result.cantidadPagosAplicados
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
    }

    $scope.montoTotalSeleccionado = 0; 
    $scope.cantidadCuotasSeleccionadas = 0; 
    $scope.mensajeResumenRemesa = "";
    $scope.infoRemesa = ""; 

    if (remesaSeleccionada && remesaSeleccionada.instrumentoPago && remesaSeleccionada.instrumentoPago.monto) { 
        const montoRemesa = remesaSeleccionada.instrumentoPago.monto; 
        $scope.mensajeResumenRemesa = `
            Monto remesa: ${numeral(montoRemesa).format("0,0.00")} - 
            aplicado: 0,00 - 
            resta: ${numeral(montoRemesa).format("0,0.00")}. 
        `

        const compania = Companias.findOne(remesaSeleccionada.compania); 
        const moneda = Monedas.findOne(remesaSeleccionada.moneda); 

        $scope.infoRemesa = `
            Remesa #: ${remesaSeleccionada.numero.toString()} - 
                      ${moment(remesaSeleccionada.fecha).format("DD-MMM-YYYY")} - 
                      ${compania && compania.abreviatura ? compania.abreviatura : 'compañía indefinida'} - 
                      ${moneda && moneda.simbolo ? moneda.simbolo : 'moneda indefinida'} - 
                      ${remesaSeleccionada.miSu} - 
                      ${numeral(montoRemesa).format("0,0.00")}. 
        `
    }

    const resumenArray = []; 
    $scope.resumenCuotasAplicadasArray = []; 

    $scope.calcularTotalMontoAPagar = function() { 
        // para calcular y mostrar el total para el monto seleccionado en la tabla 
        const montoTotalSeleccionado = lodash($scope.temp_cobranzas).filter((x) => { return x.pagar; }).sumBy("monto"); 
        const cantidadCuotasSeleccionadas = lodash.filter($scope.temp_cobranzas, (x) => { return x.pagar; }).length; 

        $scope.montoTotalSeleccionado = montoTotalSeleccionado; 
        $scope.cantidadCuotasSeleccionadas = cantidadCuotasSeleccionadas; 

        // además del monto seleccionado, a pagar o cobrar, determinamos el resto con respecto al monto inicial de la remesa 
        if (remesaSeleccionada && remesaSeleccionada.instrumentoPago && remesaSeleccionada.instrumentoPago.monto) { 
            const montoRemesa = remesaSeleccionada.instrumentoPago.monto; 
            let montoPorAplicar = 0; 

            if (lodash.isFinite(montoTotalSeleccionado)) { 
                if (remesaSeleccionada.miSu === "MI") { 
                    // la remesa es un pago nuestro; normalmente, se seleccionarán montos positivos que cancelan a los negativos
                    // que debemos (créditos). 
                    // si el montoPorAplicar queda negativo, debe indicar que el monto de la remesa se ha excedido 
                    montoPorAplicar = montoRemesa - montoTotalSeleccionado; 
                } else { 
                    // la remesa es un cobro; normalmente seleccionamos montos negativos que cancelan montos positivos (que nos 
                    // deben). Convertimos el total aplicado a positivo. Si el monto que queda por aplicar es negaivo, debe ser 
                    // que el usuario ha excedido el monto de la reemsa 
                    montoPorAplicar = montoRemesa - Math.abs(montoTotalSeleccionado); 
                }
            }

            $scope.mensajeResumenRemesa = `
                Monto remesa: ${numeral(montoRemesa).format("0,0.00")} - 
                aplicado: ${numeral(montoTotalSeleccionado).format("0,0.00")} - 
                resta: ${numeral(montoPorAplicar).format("0,0.00")}. 
            `; 
        }

        // creamos un array para pasar al react component que muestra el resumen 
        resumenArray.length = 0; 
        let id = 0; 
        $scope.temp_cobranzas.filter(x => x.pagar).forEach((x) => { 
            const item = { 
                id: id, 
                origen: `${x.origen.origen}-${x.origen.numero}`, 
                monedaID: x.cuota.moneda, 
                monto: x.monto, 
            }

            resumenArray.push(item); 
            id++; 
        })

        resumenArray.forEach(x => { 
            const moneda = Monedas.findOne(x.monedaID, { fields: { simbolo: true, defecto: true, }}); 
            x.simboloMoneda = moneda.simbolo; 
            x.monedaDefecto = moneda.defecto ? moneda.defecto : false; 
        })

        $scope.resumenCuotasAplicadasArray = resumenArray; 
    }

    $scope.cobranza_guardarState = function() { 
        
        // para permitir al usuario guardar el estado de la cobranza y recuperarlo luego. Esto permite que el usuario 'marque' muchos cobros; 
        // los guarda en un file y luego regrese, los cargue y continúe el proceso ... 
        $uibModal.open({
            templateUrl: 'client/html/cobranzas/cobranzaGuardarEstado_Modal.html',
            controller: 'CobranzaGuardarEstado_Controller',
            size: 'md',
            resolve: {
                temp_cobranzas: () => {
                    return $scope.temp_cobranzas;
                },
                companiaSeleccionada: () => {
                    return $scope.companiaSeleccionada;
                },
            },
        }).result.then(
            function () {
                return true;
            },
            function () {
                return true;
            });
    }

    //-------------------------------------
    // angular pagination ...
    $scope.pageSize = 10;
    $scope.currentPage = 1;

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: "", 
    }

    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'cobranzas.procesosVarios' });
    EventDDP.addListener('cobranzas.procesosVarios.reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
}])