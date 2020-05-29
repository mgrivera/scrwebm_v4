
import lodash from 'lodash'; 
import angular from 'angular'; 

angular.module("scrwebm")
       .controller('Cierre_RegistrosCierre_MostrarEjecuciones_Modal_Controller', ['$scope', '$modalInstance', 'periodoCierre', 'companiaSeleccionada',
function ($scope, $modalInstance, periodoCierre, companiaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.companiaSeleccionada = companiaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.list_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableFiltering: false,
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

    $scope.list_ui_grid.columnDefs = [
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha de ejecución',
            width: '150',
            enableFiltering: false,
            enableCellEdit: true,
            cellFilter: 'dateTimeFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'user',
            field: 'user',
            displayName: 'Usuario',
            width: '200',
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'comentarios',
            field: 'comentarios',
            displayName: 'Comentarios',
            width: '400',
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
    ]


    $scope.list_ui_grid.data = [];

    if (periodoCierre.usuarios && Array.isArray(periodoCierre.usuarios)) { 
        $scope.list_ui_grid.data = lodash.orderBy(periodoCierre.usuarios, [ 'fecha' ], [ 'desc' ]); 
    }
}
])