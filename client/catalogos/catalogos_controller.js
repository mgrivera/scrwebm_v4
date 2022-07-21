
import angular from 'angular'; 

import { userHasRole  } from '/client/imports/generales/userHasRole';

// importamos controllers y plantillas que pueden ser usados en 'children' angular modules  
// import '../imports/catalogos/tiposObjetoAsegurado/tiposObjetoAsegurado.html';
import '../imports/catalogos/tiposObjetoAsegurado/tiposObjetoAsegurado';

// import '../imports/catalogos/cumulos/cumulos.html';
import '../imports/catalogos/cumulos/cumulos';

angular.module("scrwebm").controller("Catalogos_Controller", ['$scope', function ($scope) {
    // para poder usar la función userHasRole desde el código html (angular) 
    $scope.userHasRole = userHasRole; 
}])