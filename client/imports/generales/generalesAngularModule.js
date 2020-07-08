
// angular module para 'cargar' (load, DI) las opciones en el menú generales 
// este módulo es pasado en DI en el 'main' (scrwebm) module, que se define en client/lib/app.js 
import angular from 'angular';

import Cumulos from './cumulos/angularModule'; 

export default angular.module("scrwebm.generales", [ Cumulos.name ]);