
import angular from 'angular';
import { react2angular } from 'react2angular'

import RegistroCumulos from './RegistroCumulos'

export default angular.module("scrwebm.generales.cumulosRegistro.registro", [])
                      .component('registroCumulos', react2angular(RegistroCumulos)); 