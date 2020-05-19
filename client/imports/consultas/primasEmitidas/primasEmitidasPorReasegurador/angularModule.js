
import angular from 'angular';
import { react2angular } from 'react2angular'

import ConsultasPrimasEmitidasReaseguradores from './ConsultasPrimasEmitidasReaseguradores.jsx'; 
import ConsultasPrimasEmitidasReaseguradoresLista from './ConsultasPrimasEmitidasReaseguradoresLista.jsx'; 

export default angular.module("scrwebm.consultas.primasEmitidasReaseguradores", [])
                      .component('consultasPrimasEmitidasReaseguradores', react2angular(ConsultasPrimasEmitidasReaseguradores))   
                      .component('consultasPrimasEmitidasReaseguradoresLista', react2angular(ConsultasPrimasEmitidasReaseguradoresLista))