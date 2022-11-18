
import angular from 'angular';

import Filter from "./filtro"; 
import List from "./lista"; 
import Contrato from "./contrato"; 

export default angular.module("scrwebm.contratos", [ Filter.name, List.name, Contrato.name ]); 