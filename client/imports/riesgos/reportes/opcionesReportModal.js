
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 
import angular from 'angular';

import { Filtros } from '/imports/collections/otros/filtros'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

export default angular.module("scrwebm.riesgos.lista.reportModal", []); 

angular.module("scrwebm.riesgos.lista.reportModal").controller('Riesgos_opcionesReportController',
['$scope', '$uibModalInstance', '$meteor', 'companiaSeleccionada', function ($scope, $uibModalInstance, $meteor, companiaSeleccionada) {
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
        $scope.reportLink = `${scrwebm_net_app_address}/reports/riesgos/report.aspx?user=${Meteor.userId()}&report=riesgosEmitidos`;
    }

    $scope.opcionesReport = {
        subTitulo: "", 
        mostrarColores: false, 
        tipoReporte: "original", 
    }

    $scope.showReportLink = false; 
    $scope.showProgress = false; 

    $scope.grabarOpcionesReporte = function () {

        $scope.showProgress = true; 

        // con este método grabamos las opciones para la ejecución del reporte y mostramos el link que permite obtenerlo 
        Meteor.call('riesgos.reporte.grabarAMongoOpcionesReporte', $scope.opcionesReport, companiaSeleccionada,
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
                if (Filtros.findOne({ nombre: 'riesgos.consulta.opcionesReport', userId: Meteor.userId() })) { 
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    Filtros.update(Filtros.findOne({ nombre: 'riesgos.consulta.opcionesReport', userId: Meteor.userId() })._id,
                    { $set: { filtro: $scope.opcionesReport } },
                    { validate: false });
                }
                else { 
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'riesgos.consulta.opcionesReport',
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
    var filtroAnterior = Filtros.findOne({ nombre: 'riesgos.consulta.opcionesReport', userId: Meteor.userId() });

    if (filtroAnterior) { 
        $scope.opcionesReport = filtroAnterior.filtro;

        if (!$scope.opcionesReport.hasOwnProperty("tipoReporte")) { 
            $scope.opcionesReport.tipoReporte = "original"; 
        }
    }
    // ------------------------------------------------------------------------------------------------------
}])