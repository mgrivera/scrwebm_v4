
import { Meteor } from 'meteor/meteor'
import angular from 'angular'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

angular.module("scrwebm")
       .controller("Cierre_Controller", ['$scope', function ($scope) {

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = { }; 

    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
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