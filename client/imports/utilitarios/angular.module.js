
import { Meteor } from 'meteor/meteor'
import angular from 'angular';

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';

import './utilitarios.html'; 

import PruebaEnviarEmail from './pruebaEnviarEmail/pruebaEnviarEmail'; 
import ActualizarDBConsultas from './actualizar_db_consultas/actualizar_db_consultas'; 
import CopiarCuotas from './copiar_cuotas/copiar_cuotas'; 

// Este module (angular) se carga con el module principal del programa (scrwebm)
export default angular.module("scrwebm.utilitarios", [ PruebaEnviarEmail.name, ActualizarDBConsultas.name, CopiarCuotas.name ])
                      .controller("Utilitarios_Controller", ['$scope', 
function ($scope) {

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
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
}])