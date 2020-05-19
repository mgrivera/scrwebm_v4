
import { Meteor } from 'meteor/meteor'; 

Meteor.publish("temp_cobranzas", function () {
    return Temp_Cobranzas.find({ usuario: this.userId });
})