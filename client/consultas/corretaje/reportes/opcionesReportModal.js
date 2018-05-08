


angular.module("scrwebM").controller('Consultas_corretaje_opcionesReportController',
['$scope', '$modalInstance', 'companiaSeleccionada', function ($scope, $modalInstance, companiaSeleccionada) {
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        // $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    // notas: aquí viene la compañía seleccionada 
    $scope.companiaSeleccionada = companiaSeleccionada; 

    // construimos el url que se debe usar para obtener el reporte (sql server reporting services - asp.net)
    let scrwebm_net_app_address = Meteor.settings.public.scrwebm_net_app_address;
    
    $scope.reportLink = "#";
    if (scrwebm_net_app_address) {
        $scope.reportLink = `${scrwebm_net_app_address}/reports/consultas/corretaje/report.aspx?user=${Meteor.userId()}&report=corretaje`;
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

        // con este método grabamos las opciones para la ejecución del reporte y mostramos el link que permite obtenerlo 
        Meteor.call('consultas.corretaje.report.grabarAMongoOpcionesReporte', $scope.opcionesReport, companiaSeleccionada,
            (err, result) => {

                if (err) {
                    let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

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
                if (Filtros.findOne({ nombre: 'consultas.corretaje.opcionesReport', userId: Meteor.userId() })) { 
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    Filtros.update(Filtros.findOne({ nombre: 'consultas.corretaje.opcionesReport', userId: Meteor.userId() })._id,
                    { $set: { filtro: $scope.opcionesReport } },
                    { validate: false });
                }
                else { 
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'consultas.corretaje.opcionesReport',
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
    var filtroAnterior = Filtros.findOne({ nombre: 'consultas.corretaje.opcionesReport', userId: Meteor.userId() });

    if (filtroAnterior) { 
        $scope.opcionesReport = filtroAnterior.filtro;
    }
    // ------------------------------------------------------------------------------------------------------

}
])