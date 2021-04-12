
import angular from 'angular';
import { react2angular } from 'react2angular'

import ConsultaMontosCobradosFiltro from './ConsultaMontosCobradosFiltro.jsx'; 
import ConsultaMontosCobradosLista from './ConsultaMontosCobradosLista.jsx'; 

export default angular.module("scrwebm.consultas.montosCobrados", [])
                      .component('consultaMontosCobradosFiltro', react2angular(ConsultaMontosCobradosFiltro))   
                      .component('consultaMontosCobradosLista', react2angular(ConsultaMontosCobradosLista))