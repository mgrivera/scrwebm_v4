
import angular from 'angular';
import { react2angular } from 'react2angular';

import Usuarios from './Usuarios';

export default angular.module("scrwebm.administracion.usuariosLogin", [])
                      .component("usuariosLogin", react2angular(Usuarios));