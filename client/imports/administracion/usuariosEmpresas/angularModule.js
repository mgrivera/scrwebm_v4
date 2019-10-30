

import angular from 'angular';
import { react2angular } from 'react2angular'

import UsuariosEmpresas from './reactComponent'; 

export default angular.module("scrwebm.administracion.usuariosEmpresas", [] )
                      .component('usuariosEmpresas', react2angular(UsuariosEmpresas))