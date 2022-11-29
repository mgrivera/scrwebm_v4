
// angular module para 'cargar' (load, DI) las opciones en el menú import/contratos 
// este módulo es pasado en DI en el 'main' (scrwebm) module, que se define en client/lib/app.js 
import angular from 'angular';

import CopiarContratoADBConsultas from './copiarContratoADBConsultas/copiarContrato';

export default angular.module("scrwebm.contratos", [ CopiarContratoADBConsultas.name ]);