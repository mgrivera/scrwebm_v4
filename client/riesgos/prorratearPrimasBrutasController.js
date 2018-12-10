

import lodash from 'lodash';

angular.module("scrwebm").controller('Riesgos_ProrratearPrimasController',
['$scope', '$modalInstance', 'riesgo', 'movimiento',
function ($scope, $modalInstance, riesgo, movimiento) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    var coberturaCompaniaSeleccionada = {};

    movimiento.coberturasCompanias.forEach(function(c) {

        // las primas brutas para cada cobertura se guardan en el field primaBruta ...
        if (!c.primaBrutaAntesProrrata && c.primaBruta) {
            c.primaBrutaAntesProrrata = c.primaBruta;
        }

        c.factorProrrata = movimiento.factorProrrata;
    })

    $scope.coberturasCompaniasProrratearPrimas_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                coberturaCompaniaSeleccionada = {};

                if (row.isSelected)
                    coberturaCompaniaSeleccionada = row.entity;
                else
                    return;
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!riesgo.docState)
                        riesgo.docState = 2;
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

    $scope.coberturasCompaniasProrratearPrimas_ui_grid.columnDefs = [
          {
              name: 'compania',
              field: 'compania',
              displayName: 'Compañía',
              width: 80,
              cellFilter: 'companiaAbreviaturaFilter',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              pinnedLeft: true,
              type: 'string'
          },
          {
              name: 'cobertura',
              field: 'cobertura',
              displayName: 'Cobertura',
              width: 80,
              cellFilter: 'coberturaAbreviaturaFilter',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              pinnedLeft: true,
              type: 'string'
          },
          {
              name: 'moneda',
              field: 'moneda',
              displayName: 'Mon',
              width: 40,
              cellFilter: 'monedaSimboloFilter',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              pinnedLeft: true,
              type: 'string'
          },
          {
              name: 'primaBrutaMovimientoAnterior',
              field: 'primaBrutaMovimientoAnterior',
              displayName: 'PB mov anterior',
              cellFilter: 'currencyFilterAndNull',
              width: 120,
              headerCellClass: 'ui-grid-rightCell',
              cellClass: 'ui-grid-rightCell',
              enableSorting: false,
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'number'
          },
          {
              name: 'primaBrutaAntesProrrata',
              field: 'primaBrutaAntesProrrata',
              displayName: 'PB mov actual',
              cellFilter: 'currencyFilterAndNull',
              width: 120,
              headerCellClass: 'ui-grid-rightCell',
              cellClass: 'ui-grid-rightCell',
              enableSorting: false,
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'number'
          },
          {
              name: 'factorProrrata',
              field: 'factorProrrata',
              displayName: 'Factor prorrata',
              cellFilter: 'number8decimals',
              width: 120,
              headerCellClass: 'ui-grid-rightCell',
              cellClass: 'ui-grid-rightCell',
              enableSorting: false,
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'number'
          },
          {
              name: 'primaBruta',
              field: 'primaBruta',
              displayName: 'Prima bruta',
              cellFilter: 'currencyFilterAndNull',
              width: 120,
              headerCellClass: 'ui-grid-rightCell',
              cellClass: 'ui-grid-rightCell',
              enableSorting: false,
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'number'
          }
    ];

    $scope.coberturasCompaniasProrratearPrimas_ui_grid.data = movimiento.coberturasCompanias;

    $scope.determinarPrimasMovimientoAnterior = function() {

        // lo primero que hacemos es determinar cual es el movimiento anterior al actual; puede no haber uno ...
        var index = riesgo.movimientos.indexOf(movimiento);

        if (index == -1)
            return;

        var movimientoAnterior = riesgo.movimientos[index - 1];

        if (!movimientoAnterior || !movimientoAnterior.coberturasCompanias)
            return;

        // recorremos las coberturas para inicializar la pb y orden del movimiento anterior
        movimiento.coberturasCompanias.forEach(function(c) {
            // buscamos la cobertura en el movimiento anterior (por compañía/cobertura y moneda)
            var coberturaMovimientoAnterior = {};

            // antes no existía la moneda en el item de coberturas
            if (!c.moneda)
                coberturaMovimientoAnterior = lodash.find(movimientoAnterior.coberturasCompanias,
                    function(cob) { return c.compania === cob.compania && c.cobertura === cob.cobertura; });
            else
                coberturaMovimientoAnterior = lodash.find(movimientoAnterior.coberturasCompanias,
                    function(cob) { return c.compania === cob.compania && c.moneda === cob.moneda && c.cobertura === cob.cobertura; });

            if (coberturaMovimientoAnterior) {
                c.primaBrutaMovimientoAnterior = lodash.isFinite(coberturaMovimientoAnterior.primaBrutaAntesProrrata) ?      // puede ser 0
                                                 coberturaMovimientoAnterior.primaBrutaAntesProrrata :
                                                 coberturaMovimientoAnterior.primaBruta;
            };
        });

        if (!riesgo.docState)
            riesgo.docState = 2;
    };

    $scope.calcularProrrateoPrimasBrutas = function() {
        movimiento.coberturasCompanias.forEach(function(c) {
            c.primaBruta = c.primaBrutaAntesProrrata * c.factorProrrata;

            if (lodash.isFinite(c.primaBrutaAntesProrrata) && lodash.isFinite(c.primaBrutaMovimientoAnterior))
                c.primaBruta = (c.primaBrutaAntesProrrata - c.primaBrutaMovimientoAnterior) * c.factorProrrata;
        });

        if (!riesgo.docState)
            riesgo.docState = 2;
    };
}
]);
