


angular.module("scrwebm").controller('RemesaCuadreObtener_Opciones_Modal_Controller',
['$scope', '$modalInstance', function ($scope, $modalInstance) {

    $scope.ok = function () {
        $modalInstance.close($scope.opciones);
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.opciones = { 
        resumirPartidasAsientoContable: false, 
    }
}
])

