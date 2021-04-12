
import angular from 'angular';

import Companias from './companias/companias'; 
import TiposObjetoAsegurado from './tiposObjetoAsegurado/tiposObjetoAsegurado'; 
import Cumulos from './cumulos/cumulos'; 

export default angular.module("scrwebm.catalogos", [ Companias.name, TiposObjetoAsegurado.name,
                                                     Cumulos.name
                                                   ]);