
import { Meteor } from 'meteor/meteor'

import angular from 'angular'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { LeerCompaniaNosotros } from '/imports/generales/leerCompaniaNosotros'; 

export default angular.module("scrwebm.remesas.remesa.remesasCuadreObtener", [])
                      .controller('RemesaCuadreObtener_Modal_Controller',
['$scope', '$uibModalInstance', 'remesaID', 'ciaSeleccionada', function ($scope, $uibModalInstance, remesaID, ciaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $uibModalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    }








    // ----------------------------------------------------------------------------------------------------------------------
    // determinamos la compañía nosotros, para saber si tiene un monto de corretaje calculado. De ser así, preguntamos al 
    // usuario si construimos una cuota de corretaje para la compañía cedente 
    let companiaNosotros = {};
    const result = LeerCompaniaNosotros(Meteor.userId());

    if (result.error) {
        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'danger',
            msg: `<em>Riesgos - Error al intentar leer la compañía 'nosotros'</em><br />${result.message}`
        });
    }

    companiaNosotros = result.companiaNosotros; 
    // ----------------------------------------------------------------------------------------------------------------------









    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

    $scope.parametros = {
        generarMontosEnFormaProporcional: true,
        leerMontosMismaMoneda: true,
    }

    $scope.submit_remesasObtenerCuadreForm = () => {

        $scope.submitted = true;
        $scope.showProgress = true;

        if ($scope.remesasObtenerCuadreForm.$valid) {

            $scope.submitted = false;
            $scope.remesasObtenerCuadreForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            Meteor.call('remesasObtenerCuadre', remesaID, companiaNosotros.tipo, $scope.parametros, (err) => {
                
                if (err) {
                    const errorMessage = mensajeErrorDesdeMethod_preparar(err);
    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
    
                    $scope.showProgress = false;
                    $scope.$apply();
    
                    return;
                }

                $scope.ok();
            })
        }
    }
}])