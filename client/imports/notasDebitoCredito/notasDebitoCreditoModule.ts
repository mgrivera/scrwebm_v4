

import * as angular from 'angular';

import './notasDebitoCredito.html';
import NotasDebitoCreditoAngularComponent from './angularComponent/angularComponent'; 

export default angular.module("scrwebm.notasDebitoCredito", [ NotasDebitoCreditoAngularComponent.name ])
.controller("NotasDebitoCredito_Controller", ['$scope', '$state', '$stateParams', function ($scope, $state, $stateParams) {

    const origen = $stateParams.origen;

}
])