
import { Meteor } from 'meteor/meteor'; 
import { Temp_Cobranzas } from '/imports/collections/consultas/temp_cobranzas';

Meteor.publish("temp_cobranzas", function () {
    return Temp_Cobranzas.find({ usuario: this.userId });
})