

import * as angular from 'angular'; 
import { react2angular } from 'react2angular'

import MyReactComponent from './reactComponent'; 

// Ok, this works!!
// export default angular.module("scrwebm.generales.pruebaReact", []).component("pruebaReact", { template: 'Hello World!' });

// this is how we will call our react component from an angular component 
export default angular.module("scrwebm.generales.pruebaReact", []).component("pruebaReact", react2angular(MyReactComponent, ['fooBar', 'baz']))
 
