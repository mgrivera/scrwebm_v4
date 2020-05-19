
import * as angular from 'angular';

import PrimasEmitidasReaseguradores from './primasEmitidas/primasEmitidasPorReasegurador/angularModule'; 

export default angular.module("scrwebm.consultas", [ PrimasEmitidasReaseguradores.name ]);