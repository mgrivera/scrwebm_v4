
import angular from 'angular';
import { react2angular } from 'react2angular';

import RegistrosManuales from './RegistrosManuales';

export default angular.module("scrwebm.emision.registrosManuales", [])
                      .component("registrosManuales", react2angular(RegistrosManuales));