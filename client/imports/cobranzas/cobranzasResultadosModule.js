
import angular from 'angular'; 
import lodash from 'lodash'; 

import { Remesas } from '/imports/collections/principales/remesas';
import { Cuotas } from '/imports/collections/principales/cuotas'; 
  
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

export default angular.module("scrwebm.cobranzas.resultados", [])
                      .controller("CobranzasResultadosController", ['$scope', '$stateParams', '$uibModal', 
    function ($scope, $stateParams, $uibModal) {

        $scope.showProgress = false;

        // ui-bootstrap alerts ...
        $scope.alerts = [];

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        var remesaID = $stateParams.remesaID;
        var cantidadPagosAplicados = $stateParams.cantPagos;

        $scope.remesa = {};

        $scope.showProgress = true;

        $scope.$meteorSubscribe('remesas', JSON.stringify({ _id: remesaID })).then(function (subscriptionHandle) {

            $scope.remesa = $scope.$meteorObject(Remesas, remesaID, false);

            // ahora leemos las cuotas que se han asociado a la remesa (cobros/pagos)
            var filtro = { pagos: { $elemMatch: { remesaID: remesaID } } };

            $scope.$meteorSubscribe('cuotas', JSON.stringify(filtro)).then(function (subscriptionHandle) {

                var cuotas = Cuotas.find().fetch();

                // nótese como las cuotas pueden tener más de un pago y para diferentes remesas; por eso, debemos extraer
                // los pagos que correspondan a la remesa en cuestion

                $scope.pagos = [];

                cuotas.forEach(function (cuota) {
                    lodash.filter(cuota.pagos, function (x) { return x.remesaID === remesaID; }).forEach(function (p) {
                        var pago = {};

                        pago.cuota = cuota;
                        pago.pago = p;

                        $scope.pagos.push(pago);
                    });
                });

                DialogModal($uibModal, "<em>Cobranzas</em>",
                                    "Ok, el proceso fue ejecutado en forma satisfactoria.<br />" +
                                    "En total fueron aplicados <b>" + cantidadPagosAplicados.toString() + "</b> cobros/pagos a " + 
                                    "la remesa seleccionada.<br /><br />" +
                                    "En cualquier momento, Ud. puede revisar los pagos aplicados, si consulta la remesa y " +
                                    "hace un <em>click</em> en la opción <em>Detalles</em>.<br /><br />" +
                                    "También puede <em>revertir</em> esta operación, si consulta la remesa y hace " +
                                    "un <em>click</em> en la opción <em>Revertir</em>.",
                                    false).then();
                $scope.showProgress = false;
            });
        });
  }])