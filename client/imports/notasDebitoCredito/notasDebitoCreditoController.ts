

import * as angular from 'angular';

import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 

import './notasDebitoCredito.html';

import NotasDebitoCreditoFilter from './filter/filter'; 
import './filter/filter.html'; 

import NotasDebitoCreditoList from './list/list'; 
import './list/list.html'; 

import NotasDebitoCreditoItem from './item/item'; 
import './item/item.html'; 

export default angular.module("scrwebm.notasDebitoCredito", [ 
    'angular-meteor', 
    NotasDebitoCreditoFilter.name, 
    NotasDebitoCreditoList.name, 
    NotasDebitoCreditoItem.name, 
])
.controller("NotasDebitoCredito_Controller", ['$scope', '$state', '$stateParams', '$modal', 
    function ($scope, $state, $stateParams, $modal) {

    $scope.showProgress = true;

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let empresaUsuariaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (empresaUsuariaSeleccionada) { 
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(empresaUsuariaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
        
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) { 
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
}
])