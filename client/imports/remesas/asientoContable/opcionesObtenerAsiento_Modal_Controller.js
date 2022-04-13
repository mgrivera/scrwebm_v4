

import angular from 'angular'; 

export default angular.module("scrwebm.remesas.remesa.cuadre.asientoContable.opciones", [])
                      .controller('RemesaCuadreAsientoContable_Opciones_Modal_Controller', 
                      ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {

    $scope.ok = function () {
        $uibModalInstance.close($scope.opciones);
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    }

    $scope.opciones = { 
        resumirPartidasAsientoContable: false, 
    }
}
])

