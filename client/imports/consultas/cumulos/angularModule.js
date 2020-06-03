
import angular from 'angular';
import { react2angular } from 'react2angular'

import ConsultaCumulosFiltro from './ConsultaCumulosFiltro.jsx'; 
import ConsultaCumulosLista from './ConsultaCumulosLista.jsx'; 

export default angular.module("scrwebm.consultas.cumulos", [])
                      .component('consultaCumulosFiltro', react2angular(ConsultaCumulosFiltro))   
                      .component('consultaCumulosLista', react2angular(ConsultaCumulosLista))