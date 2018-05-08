

import moment from 'moment';
import Papa from 'papaparse';

import { Consulta_MontosPendientesPago_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesPago_Vencimientos'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller("ConsultasMontosPendientesPagoVencimientos_Lista_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

    $scope.showProgress = false;

    let parametrosReporte = JSON.parse($stateParams.parametrosReporte);
    let companiaSeleccionada = JSON.parse($stateParams.companiaSeleccionada);

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.montosPendientes = Consulta_MontosPendientesPago_Vencimientos.find({ user: Meteor.userId() }).fetch();

    $scope.alerts.length = 0;
    $scope.alerts.push({
        type: 'info',
        msg: $scope.montosPendientes.length.toString() + " registros seleccionados ..."
    })

    $scope.regresar = function () {
        $state.go('pendientesPago_vencimientos_consulta_filter');
    }


    $scope.exportarDatosConsulta = () => {

        $scope.showProgress = true;

        // construimos un array con los datos que deben ser exportados como 'csv'; luego, usamos una
        // funcionalidad que ya habíamos agregado al programa, para construir el 'csv' y exportar a un
        // archivo en disco ...

        let montosPendientes = [];

        Consulta_MontosPendientesPago_Vencimientos.find({ user: Meteor.userId() }).forEach(monto => {

            let montoPendiente = {};

            montoPendiente.moneda = monto.monedaSimbolo;
            montoPendiente.compania = monto.companiaAbreviatura;
            montoPendiente.suscriptor = monto.suscriptorAbreviatura;
            montoPendiente.asegurado = monto.aseguradoAbreviatura;

            montoPendiente.origen = monto.origen;
            montoPendiente.numero = monto.numero.toString() + "/" + monto.cantidad.toString();
            montoPendiente.fecha = moment(monto.fecha).format("YYYY-MM-DD");
            montoPendiente.fechaVencimiento = moment(monto.fechaVencimiento).format("YYYY-MM-DD");;
            montoPendiente.diasPendientes = monto.diasPendientes;
            montoPendiente.diasVencidos = monto.diasVencidos;

            montoPendiente.montoCuota = monto.montoCuota;
            montoPendiente.montoPorPagar = monto.montoPorPagar;
            montoPendiente.saldo1 = monto.saldo1;

            montoPendiente.montoCobrado = monto.montoCobrado;
            montoPendiente.montoPagado = monto.montoPagado;
            montoPendiente.saldo2 = monto.saldo2;

            montosPendientes.push(montoPendiente);
        });

        let montosPendientes_CSV = Papa.unparse(montosPendientes, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });

        let files = [];

        files.push({ fileContent: montosPendientes_CSV, fileName: 'montosPorCobrar_Pendientes_consulta.csv' });

        var mensajeAlUsuario = "<ol>" +
            "<li>Para grabar el archivo en el disco duro local, haga un <em>click</em> sobre el mismo</b></li>" +
            "<li>De inmediato, se abrirá un diálogo que le permitirá grabar el archivo en el directorio que Ud. indique.</li>" +
            "</ol>"

        // para mostrar al usuario un diálogo y permitir guardar el archivo (file) al disco duro ...
        Global_Methods.PermitirUsuarioDownloadFiles($modal, files, mensajeAlUsuario);

        $scope.showProgress = false;
    };

    let dataToCSVUnparseError = (error, file) => {

        let type = error.type ? error.type : "<indef>";
        let code = error.code ? error.code : "<indef>";
        let message = error.message ? error.message : "<indef>";
        let row = error.row ? error.row : "<indef>";

        let errorMessage = `Se ha obtenido un error al intentar exportar los datos a un archivo. El mensaje del error obtenido es:
        Error al intentar crear el archivo: <em>${message}</em>; del tipo: ${type}; cuyo código es: ${code}; en la linea: ${row}.
                            Por favor intente corregir esta situación, y luego intente ejecutar esta función nuevamente.`;

        DialogModal($modal, "<em>Consultas</em>", errorMessage, false).then();
        return;
    }

    $scope.reporteOpcionesModal = function () {

        var modalInstance = $modal.open({
            templateUrl: 'client/consultas/pendientesPago_vencimientos/reportes/opcionesReportModal.html',
            controller: 'Consultas_montosPendientesPago_vencimientos_opcionesReportController',
            size: 'md',
            resolve: {
                companiaSeleccionada: function () {
                    return $scope.companiaSeleccionada
                },
            }
        }).result.then(
            function (resolve) {
                return true;
            },
            function (cancel) {
                return true;
        })
    }

    let selectedItem = {};

    $scope.items_ui_grid = {
        enableSorting: true,
        enableFiltering: true,
        showColumnFooter: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                selectedItem = {};

                if (row.isSelected) {
                    selectedItem = row.entity;
                }
                else { 
                return;
                } 
            })
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },

        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.items_ui_grid.columnDefs = [
        {
            name: 'monedaSimbolo',
            field: 'monedaSimbolo',
            displayName: 'Mon',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'companiaAbreviatura',
            field: 'companiaAbreviatura',
            displayName: 'Compañía',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'suscriptorAbreviatura',
            field: 'suscriptorAbreviatura',
            displayName: 'Suscriptor',
            width: 80,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'origen',
            field: 'origen',
            displayName: 'Origen',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            width: 40,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'cantidad',
            field: 'cantidad',
            displayName: 'De',
            width: 40,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'fechaVencimiento',
            field: 'fechaVencimiento',
            displayName: 'F venc',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'diasPendientes',
            field: 'diasPendientes',
            displayName: 'días pend',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'diasVencidos',
            field: 'diasVencidos',
            displayName: 'días venc',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'montoCuota',
            field: 'montoCuota',
            displayName: 'Monto cuota',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
        {
            name: 'montoYaPagado',
            field: 'montoYaPagado',
            displayName: 'Ya pagado',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
        {
            name: 'resta',
            field: 'resta',
            displayName: 'Resta',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
        {
            name: 'montoYaCobrado',
            field: 'montoYaCobrado',
            displayName: 'Ya cobrado',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
    ]

      $scope.items_ui_grid.data = [];
      $scope.items_ui_grid.data = $scope.montosPendientes;
  }
]);
