
import { Meteor } from 'meteor/meteor';
import { Consulta_Corretaje } from '/imports/collections/consultas/consulta_corretaje'; 

Meteor.publish("consultas.corretaje", function () {
    return Consulta_Corretaje.find({ user: this.userId });
});
