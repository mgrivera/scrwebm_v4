
import { Meteor } from 'meteor/meteor'; 
import angular from 'angular'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { ContratosParametros } from '/imports/collections/catalogos/contratosParametros'; 

angular.module("scrwebm").controller("ContratosProp_Configuracion_Controller", ['$scope', function ($scope) {

    $scope.showProgress = true;

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {};

    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1, abreviatura: 1 } });
    } 

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) { 
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }  
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    Meteor.subscribe('contratosParametros', () => {

        $scope.helpers({
            contratosParametros: () => {
                return ContratosParametros.findOne();
            },
        });

        $scope.showProgress = false;
    })
  }
]);
