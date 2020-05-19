

import angular from 'angular';
import angularMeteor from 'angular-meteor';

// import '/client/imports/riesgos/filtro.html'; 
// import '/client/imports/riesgos/lista.html';
// import '/client/imports/riesgos/riesgo.html';

import RiesgosFiltro from '/client/imports/riesgos/riesgoFiltroController';
import RiesgosLista from '/client/imports/riesgos/riesgoListaController';

import RiesgosRiesgo from '/client/imports/riesgos/riesgo_Controller';

export default angular.module("scrwebm.riesgos", [ 
    angularMeteor, RiesgosFiltro.name, RiesgosLista.name, RiesgosRiesgo.name, 
]);