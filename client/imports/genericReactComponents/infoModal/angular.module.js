
import angular from 'angular';
import { react2angular } from 'react2angular'

import InfoModal from './InfoModal';

export default angular.module("scrwebm.genericReactComponents.infoModal", [])
                      .component('infoModal', react2angular(InfoModal)); 