
import { Meteor } from 'meteor/meteor';
import { Consulta_MontosPendientesPago_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesPago_Vencimientos';

Meteor.publish("consulta_MontosPendientesPago_Vencimientos", function () {
    return Consulta_MontosPendientesPago_Vencimientos.find({ user: this.userId });
});
