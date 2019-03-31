

import angular from 'angular';

import '/client/imports/remesas/filtro.html'; 
import '/client/imports/remesas/lista.html';
import '/client/imports/remesas/remesa.html';

import RemesasFiltro from '/client/imports/remesas/filtro';
import RemesasLista from '/client/imports/remesas/lista';
import RemesasRemesa from '/client/imports/remesas/remesa';

export default angular.module("scrwebm.remesas", [ RemesasFiltro.name, RemesasLista.name, RemesasRemesa.name, ]);