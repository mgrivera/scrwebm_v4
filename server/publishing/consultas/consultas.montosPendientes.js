
import { Meteor } from 'meteor/meteor'; 
import { Consulta_MontosPendientes } from '/imports/collections/consultas/consulta_MontosPendientes'; 

Meteor.publish("consulta.montosPendientes", function () {
    return Consulta_MontosPendientes.find({ user: this.userId });
});
