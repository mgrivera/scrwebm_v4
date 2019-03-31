

import angular from 'angular'; 

export default angular.module("scrwebm.remesas.remesa.cuadre.asientoContable.opciones", [])
                      .controller('RemesaCuadreAsientoContable_Opciones_Modal_Controller', 
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

