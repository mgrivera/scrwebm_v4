
import * as angular from 'angular';

import PrimasEmitidasReaseguradores from './primasEmitidas/primasEmitidasPorReasegurador/angularModule'; 
import Cumulos from './cumulos/angularModule'; 

export default angular.module("scrwebm.consultas", [ PrimasEmitidasReaseguradores.name, Cumulos.name ]);