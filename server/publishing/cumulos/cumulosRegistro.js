
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check'

import { Cumulos_Registro } from '/imports/collections/principales/cumulos_registro';  

Meteor.publish("cumulosRegistro", function (filter) {
    check(filter, Object);
    return Cumulos_Registro.find(filter);
})