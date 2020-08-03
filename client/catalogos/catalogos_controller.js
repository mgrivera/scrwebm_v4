
import angular from 'angular'; 

// importamos controllers y plantillas que pueden ser usados en 'children' angular modules  
// import '../imports/catalogos/tiposObjetoAsegurado/tiposObjetoAsegurado.html';
import '../imports/catalogos/tiposObjetoAsegurado/tiposObjetoAsegurado';

// import '../imports/catalogos/cumulos/cumulos.html';
import '../imports/catalogos/cumulos/cumulos';

angular.module("scrwebm").controller("Catalogos_Controller", ['$scope', function ($scope) {
}])