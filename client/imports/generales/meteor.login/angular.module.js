
import angular from 'angular';
import { react2angular } from 'react2angular';

import MeteorLogin from './MeteorLogin';

export default angular.module("scrwebm.meteorLogin", [])
                      .component("meteorLogin", react2angular(MeteorLogin));