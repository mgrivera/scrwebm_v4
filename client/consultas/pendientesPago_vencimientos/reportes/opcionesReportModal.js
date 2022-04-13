
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

import angular from 'angular';

import { Filtros } from '/imports/collections/otros/filtros'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebm")
       .controller('Consultas_montosPendientesPago_vencimientos_opcionesReportController', ['$scope', '$uibModalInstance', 'companiaSeleccionada', 
function ($scope, $uibModalInstance, companiaSeleccionada) {
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        // $uibModalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    }

    // notas: aquí viene la compañía seleccionada 
    $scope.companiaSeleccionada = companiaSeleccionada; 

    // construimos el url que se debe usar para obtener el reporte (sql server reporting services - asp.net)
    const scrwebm_net_app_address = Meteor.settings.public.scrwebm_net_app_address;
    
    $scope.reportLink = "#";
    if (scrwebm_net_app_address) {
        $scope.reportLink = `${scrwebm_net_app_address}/reports/consultas/montosPendientesPagoVencimientos/report.aspx?user=${Meteor.userId()}&report=montosPendientesPagoVencimientos`;
    }

    $scope.opcionesReport = {
        subTitulo: "", 
        mostrarColores: false, 
        formatoExcel: false
    }

    $scope.showReportLink = false; 
    $scope.showProgress = false; 

    $scope.grabarOpcionesReporte = function () {

        $scope.showProgress = true; 

        // leemos dos fechas que el usuario pasa al proceso para: 1) calcular vencimientos; 2) leer montos hasta. La idea es 
        // pasar ambas fechas como parte de las opciones del reporte. Ambas están en Filtros, por eso leemos el filtro recién 
        // indicado 
        const filtroAnterior = Filtros.findOne({ nombre: 'consultas_MontosPendientesDePago_vencimientos', userId: Meteor.userId() });

        $scope.opcionesReport.fechaPendientesAl = new Date(); 
        $scope.opcionesReport.fechaLeerHasta = new Date(); 

        // pasamos las fechas indicadas a este proceso como parte de las opciones del reporte (además de subtitulo, colores, ...) 
        if (filtroAnterior.filtro && filtroAnterior.filtro.fechaPendientesAl) { 
            $scope.opcionesReport.fechaPendientesAl = filtroAnterior.filtro.fechaPendientesAl; 
        }

        if (filtroAnterior.filtro && filtroAnterior.filtro.fechaLeerHasta) { 
            $scope.opcionesReport.fechaLeerHasta = filtroAnterior.filtro.fechaLeerHasta; 
        }

        // con este método grabamos las opciones para la ejecución del reporte y mostramos el link que permite obtenerlo 
        Meteor.call('consultas.montos.pend.pago.venc.report.grabarAMongoOpcionesReporte', $scope.opcionesReport, companiaSeleccionada,
            (err, result) => {

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

                if (result.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: result.message
                    });
                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                // guardamos las opciones indicadas por el usuario, para que estén disponibles la próxima vez 
                // ------------------------------------------------------------------------------------------------------
                // guardamos el filtro indicado por el usuario
                if (Filtros.findOne({ nombre: 'consultas.montosPendPagoVenc.opcionesReport', userId: Meteor.userId() })) { 
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    Filtros.update(Filtros.findOne({ nombre: 'consultas.montosPendPagoVenc.opcionesReport', userId: Meteor.userId() })._id,
                    { $set: { filtro: $scope.opcionesReport } },
                    { validate: false });
                }
                else { 
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'consultas.montosPendPagoVenc.opcionesReport',
                        filtro: $scope.opcionesReport
                    });
                }

                // ------------------------------------------------------------------------------------------------------
                // mostrar link que permite obtener el report ... 
                $scope.showReportLink = true; 

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                });
                $scope.showProgress = false;
                $scope.$apply();
            }
        )
    }

    // ------------------------------------------------------------------------------------------------------
    // intentamos leer las opciones usadas antes por el usuario, para mostrarlas en el diálogo ... 
    $scope.opcionesReport = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'consultas.montosPendPagoVenc.opcionesReport', userId: Meteor.userId() });

    if (filtroAnterior) { 
        $scope.opcionesReport = filtroAnterior.filtro;
    }
    // ------------------------------------------------------------------------------------------------------
}])