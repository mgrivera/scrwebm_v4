
import angular from 'angular';
import { react2angular } from 'react2angular'

import ConsultaPendientesCobroEmails from './ConsultaPendientesCobroEmails.jsx';

export default angular.module("scrwebm.consultas.pendientesCobro_vencimientos.generarEmails", [])
                      .component('consultaPendientesCobroEmails', react2angular(ConsultaPendientesCobroEmails))