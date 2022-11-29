
import angular from 'angular';
import { react2angular } from 'react2angular';

import MeteorLogin from './MeteorLogin';

// nótese cómo pasamos (injectamos, en angular argot) el $scope al react component 
export default angular.module("scrwebm.meteorLogin", [])
                      .component("meteorLogin", react2angular(MeteorLogin));