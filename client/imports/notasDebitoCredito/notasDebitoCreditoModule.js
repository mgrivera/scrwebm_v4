
import angular from 'angular';

import NotasDebitoCreditoAngularComponent from './angularComponent/angularComponent'; 

export default angular.module("scrwebm.notasDebitoCredito", [ NotasDebitoCreditoAngularComponent.name ])
                      .controller("NotasDebitoCredito_Controller", ['$stateParams', 
function ($stateParams) {
    const origen = $stateParams.origen;
}])