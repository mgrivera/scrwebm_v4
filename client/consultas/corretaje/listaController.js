


import { Consulta_Corretaje } from '/imports/collections/consultas/consulta_corretaje'; 

angular.module("scrwebM").controller("CConsultasCorretaje_Lista_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

    $scope.showProgress = false;

    let companiaSeleccionada = JSON.parse($stateParams.companiaSeleccionada);

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.helpers({
        consultaCorretaje: () => {
            return Consulta_Corretaje.find({ user: Meteor.userId() });
        },
    })

    $scope.alerts.length = 0;
    $scope.alerts.push({
        type: 'info',
        msg: $scope.consultaCorretaje.length.toString() + " registros seleccionados ..."
    })

    $scope.regresar = function () {
        $state.go('corretaje_consulta_filter');
    }

    let selectedItem = {};
    let items_ui_grid_gridApi = null;

    $scope.items_ui_grid = {
        enableSorting: true,
        enableFiltering: true,
        showColumnFooter: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: true,
        enableSelectAll: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {
            items_ui_grid_gridApi = gridApi;
            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                selectedItem = {};

                if (row.isSelected) {
                    selectedItem = row.entity;
                }
                else
                    return;
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
            name: 'ramoAbreviatura',
            field: 'ramoAbreviatura',
            displayName: 'Ramo',
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
            name: 'aseguradoAbreviatura',
            field: 'aseguradoAbreviatura',
            displayName: 'Asegurado',
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
            name: 'fechaEmision',
            field: 'fechaEmision',
            displayName: 'F emisión',
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
            name: 'fechaCuota',
            field: 'fechaCuota',
            displayName: 'F cuota',
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
            name: 'montoPorPagar',
            field: 'montoPorPagar',
            displayName: 'Por pagar',
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
            name: 'montoCorretaje',
            field: 'montoCorretaje',
            displayName: 'Corretaje',
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
            name: 'montoCobrado',
            field: 'montoCobrado',
            displayName: 'Cobrado',
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
            name: 'montoPagado',
            field: 'montoPagado',
            displayName: 'Pagado',
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

    $scope.reporteOpcionesModal = function () {

        var modalInstance = $modal.open({
            templateUrl: 'client/consultas/corretaje/reportes/opcionesReportModal.html',
            controller: 'Consultas_corretaje_opcionesReportController',
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

      $scope.items_ui_grid.data = [];
      $scope.items_ui_grid.data = $scope.consultaCorretaje;
  }
])
