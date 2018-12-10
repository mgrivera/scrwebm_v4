

import * as angular from 'angular'; 

import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 
import { Cumulos } from 'imports/collections/catalogos/cumulos'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 

angular.module("scrwebm").controller("ConsultasCumulos_Controller", ['$scope', function ($scope) {

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {}; 

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

    // aunque la mayoría de los catálogos vienen de forma automática, no is igual para Cúmulos 
    Meteor.subscribe('cumulos', () => {
        $scope.helpers({ 
            monedas: () => Monedas.find(), 
            companias: () => Companias.find(), 
            companiasCedentes: () => Companias.find({ tipo: "SEG" }), 
            cumulos: () => Cumulos.find(), 
            ramos: () => Ramos.find(), 
            indoles:  () => Indoles.find(), 
        }); 
    })

}])
