
import angular from 'angular';
import { react2angular } from 'react2angular'

import ConsultaMontosPagadosFiltro from './ConsultaMontosPagadosFiltro.jsx'; 
import ConsultaMontosPagadosLista from './ConsultaMontosPagadosLista.jsx'; 

export default angular.module("scrwebm.consultas.montosPagados", [])
                      .component('consultaMontosPagadosFiltro', react2angular(ConsultaMontosPagadosFiltro))   
                      .component('consultaMontosPagadosLista', react2angular(ConsultaMontosPagadosLista))