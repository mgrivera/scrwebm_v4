
import angular from 'angular';

import PrimasEmitidasReaseguradores from './primasEmitidas/primasEmitidasPorReasegurador/angularModule'; 
import Cumulos from './cumulos/angularModule'; 
import MontosCobrados from './montosCobrados/angularModule'; 
import MontosPagados from './montosPagados/angularModule'; 
import MontosPorCobrar_Vencimientos from '/client/imports/consultas/pendientesCobro_vencimientos/angular.module'; 

export default angular.module("scrwebm.consultas", [ PrimasEmitidasReaseguradores.name, 
                                                     Cumulos.name, 
                                                     MontosCobrados.name, 
                                                     MontosPagados.name, 
                                                     MontosPorCobrar_Vencimientos.name ]);