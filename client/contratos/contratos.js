
import angular from 'angular';

import Filter from "./filtro"; 
import List from "./lista"; 
import Contrato from "./contrato"; 

import CopiarContratoADBConsultas from '/client/imports/contratos/copiarContratoADBConsultas/copiarContrato';

export default angular.module("scrwebm.contratos", [ Filter.name, List.name, Contrato.name, CopiarContratoADBConsultas.name ]); 