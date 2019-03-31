

import * as angular from 'angular';

import { react2angular } from 'react2angular'
import NotasDebitoCreditoMainReactComponent from '../reactComponents/main'; 

// este angular component sirve para montar un react component en una plantilla angular. 
// aunque angular piensa que este es un simple angular component más, y lo es!, en realidad 
// empaqueta (packages) un react component, que es el que finalmente se termina mostrando ... 

export default angular.module('scrwebm.riesgos.riesgo.construirNotasDebito.angularComponents', [])
                      .component('notasDebitoCreditoAngularComponent', react2angular(NotasDebitoCreditoMainReactComponent as any));