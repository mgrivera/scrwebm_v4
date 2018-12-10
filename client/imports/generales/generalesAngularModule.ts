

// angular module para 'cargar' (load, DI) las opciones en el menú generales 
// este módulo es pasado en DI en el 'main' (scrwebm) module, que se define en client/lib/app.js 

import * as angular from 'angular';

// importamos cada module que está in imports 
import PruebaReact from 'client/imports/generales/pruebaReact/angularComponent'; 

export default angular.module("scrwebm.generales", [ PruebaReact.name ]);
