
import { Meteor } from 'meteor/meteor'; 

import angular from 'angular';
import moment from 'moment';

import Papa from 'papaparse';
import saveAs from 'save-as'

import { Consulta_MontosPendientesPago_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesPago_Vencimientos'; 

angular.module("scrwebm")
       .controller("ConsultasMontosPendientesPagoVencimientos_Lista_Controller", ['$scope', '$state', '$uibModal', 'uiGridConstants',
function ($scope, $state, $uibModal, uiGridConstants) {

    $scope.showProgress = false;

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
        // permitimos grabar el asiento contable, como un json, a un archivo en la máquina. Luego, este archivo podrá
        // ser importado como un asiento nuevo ...
        try {
            $scope.showProgress = true;

            const items = Consulta_MontosPendientesPago_Vencimientos.find({ user: Meteor.userId() }).fetch(); 

            // eliminamos algunas propiedades que no queremos en el txt (csv) 
            items.forEach(x => {
                delete x._id;
                delete x.moneda;
                delete x.compania; 
                delete x.companiaNombre; 
                delete x.suscriptor; 
                delete x.user; 
                delete x.cia; 

                x.fecha = moment(x.fecha).format("YYYY-MM-DD"); 
                x.fechaEmision = moment(x.fechaEmision).format("YYYY-MM-DD"); 
                x.fechaVencimiento = moment(x.fechaVencimiento).format("YYYY-MM-DD"); 
            });

            // papaparse: convertimos el array json a un string csv ...
            const config = {
                quotes: true,
                quoteChar: "'",
                delimiter: "\t",
                header: true
            };

            let csvString = Papa.unparse(items, config);

            // cambiamos los headers por textos más apropiados (pareciera que ésto no se puede hacer desde el config)
            csvString = csvString.replace("monedaDescripcion", "moneda");
            csvString = csvString.replace("monedaSimbolo", "simbolo");
            csvString = csvString.replace("companiaAbreviatura", "compañía");
            csvString = csvString.replace("suscriptorAbreviatura", "suscriptor");
            csvString = csvString.replace("aseguradoAbreviatura", "asegurado");
            csvString = csvString.replace("codigo", "código");
            csvString = csvString.replace("numero", "número");

            var blob = new Blob([csvString], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "montos por pagar");

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, el contenido de la lista ha sido exportado a un archivo de texto en forma exitosa. <br /> 
                      En total, se han exportado <b>${items.length.toString()}</b> lineas. 
                     `
            });

            // por alguna razón el ui-grid deja de mostrarse en forma correcta cuando este proceso termina ... 
            // $scope.configuracionContrato_ui_grid.data = $scope.contratosProp_configuracion_tablas;

            $scope.showProgress = false;
        }
        catch (err) {
            const message = err.message ? err.message : err.toString();

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });

            $scope.showProgress = false;
        }
    }

    $scope.reporteOpcionesModal = function () {

        $uibModal.open({
            templateUrl: 'client/consultas/pendientesPago_vencimientos/reportes/opcionesReportModal.html',
            controller: 'Consultas_montosPendientesPago_vencimientos_opcionesReportController',
            size: 'md',
            resolve: {
                companiaSeleccionada: function () {
                    return $scope.companiaSeleccionada
                },
            }
        }).result.then(
            function () {
                return true;
            },
            function () {
                return true;
        })
    }

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
        onRegisterApi: function () {
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
            name: 'aseguradoAbreviatura',
            field: 'aseguradoAbreviatura',
            displayName: 'Asegurado',
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
            enableFiltering: true,
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
            enableFiltering: true,
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
            enableFiltering: true,
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
            enableFiltering: true,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
    ]

      $scope.items_ui_grid.data = [];
      $scope.items_ui_grid.data = $scope.montosPendientes;
}])