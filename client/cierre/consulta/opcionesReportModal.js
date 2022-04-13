
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';

import * as angular from 'angular'; 

import { Filtros } from '/imports/collections/otros/filtros'; 
import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebm")
       .controller('Cierre_opcionesReportController',
['$scope', '$uibModalInstance', 'companiaSeleccionada', 'fechaInicialPeriodo', 'fechaFinalPeriodo', 'cuentasCorrientes', 
function ($scope, $uibModalInstance, companiaSeleccionada, fechaInicialPeriodo, fechaFinalPeriodo, cuentasCorrientes) {
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        // $uibModalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    };

    // notas: aquí viene la compañía seleccionada 
    $scope.companiaSeleccionada = companiaSeleccionada; 
   
    // construimos el url que se debe usar para obtener el reporte (sql server reporting services - asp.net)
    const scrwebm_net_app_address = Meteor.settings.public.scrwebm_net_app_address;
    
    $scope.reportLink = "#";
    if (scrwebm_net_app_address) {
        $scope.reportLink = `${scrwebm_net_app_address}/reports/cierre/report.aspx?user=${Meteor.userId()}&report=cuentaCorriente`;
    }

    $scope.opcionesReport = {
        subTitulo: "", 
        mostrarColores: false, 
        cuentasCorrientes: false, 
    }; 

    $scope.showReportLink = false; 
    $scope.showProgress = false; 

    $scope.grabarOpcionesReporte = function () {

        $scope.showProgress = true; 

        // con este método grabamos las opciones para la ejecución del reporte y mostramos el link que permite obtenerlo 
        Meteor.call('cierre.consulta.grabarAMongoOpcionesReporte', fechaInicialPeriodo, fechaFinalPeriodo, $scope.opcionesReport, companiaSeleccionada,
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
                if (Filtros.findOne({ nombre: 'cierres.consulta.opcionesReport', userId: Meteor.userId() })) { 
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    Filtros.update(Filtros.findOne({ nombre: 'cierres.consulta.opcionesReport', userId: Meteor.userId() })._id,
                    { $set: { filtro: $scope.opcionesReport } },
                    { validate: false });
                }
                else { 
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'cierres.consulta.opcionesReport',
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
    var filtroAnterior = Filtros.findOne({ nombre: 'cierres.consulta.opcionesReport', userId: Meteor.userId() });

    if (filtroAnterior) { 
        $scope.opcionesReport = filtroAnterior.filtro;
        $scope.opcionesReport.cuentasCorrientes = cuentasCorrientes; 
    }
    // ------------------------------------------------------------------------------------------------------

}])