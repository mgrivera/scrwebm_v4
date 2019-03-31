

import * as angular from 'angular';

import { react2angular } from 'react2angular'
import ReportFromList from './reportFromList'; 

// este angular component sirve para montar un react component en una plantilla angular. 
// aunque angular piensa que este es un simple angular component más, y lo es!, en realidad 
// empaqueta (packages) un react component, que es el que finalmente se termina mostrando ... 

export default angular.module('scrwebm.remesas.lista.reportFromList', [])
                      .component('reportFromListAngularComponent', react2angular(ReportFromList as any));