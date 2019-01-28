

import * as angular from 'angular';

export default angular.module("scrwebm.notasDebitoCredito.list", [ 
    'angular-meteor', 
])
.controller("NotasDebitoCredito_List_Controller", ['$scope', '$state', '$stateParams', 
    function ($scope, $state, $stateParams) {

        $scope.showProgress = false;

        // ui-bootstrap alerts ...
        $scope.alerts = [];
    
        $scope.closeAlert = function (index: number) {
            $scope.alerts.splice(index, 1);
        };
    
        $scope.origen = $stateParams.origen;
    
        let limit = 50; 
    
        if (Number.isInteger(parseInt($stateParams.limit))) { 
            limit = parseInt($stateParams.limit);
        }
     
        $scope.regresar = function () {
            $state.go('notasDebitoCredito.filter', { origen: $scope.origen });
        }
    
        $scope.nuevo = function () {
            $state.go('notasDebitoCredito.item', {
                origen: $scope.origen,
                id: "0",
                pageNumber: 0,
                vieneDeAfuera: false
            });
        }
}
])