
import angular from 'angular';
import { Meteor } from 'meteor/meteor';

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import Filtro from './filtroController'; 
import Lista from './listaController'; 
import GenerarEmails from './generarEmails_react_modal/angular.module'; 

// debemos importar los templates (html) 
import './main.html'; 

export default angular.module("scrwebm.consultas.pendientesCobro_vencimientos", [ Filtro.name, 
                                                                                  Lista.name, 
                                                                                  GenerarEmails.name ])
       .controller("ConsultasMontosPendientesCobroVencimientos_Controller", ['$scope', '$state',
function ($scope, $state) {

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (companiaSeleccionada)
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc)
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    else
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    // ------------------------------------------------------------------------------------------------

    // abrimos de inmediato el 'filter' state ...
    $state.go('pendientesCobro_vencimientos_consulta_filter');
}])