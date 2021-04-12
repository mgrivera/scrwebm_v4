
import angular from 'angular';
import { react2angular } from 'react2angular';

import PersonasRegistroModal from './PersonasRegistroModal';

export default angular.module("scrwebm.catalogos.companias.personasRegistro", [])
                      .component('personasRegistroModal', react2angular(PersonasRegistroModal));