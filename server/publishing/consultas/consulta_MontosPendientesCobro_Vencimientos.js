
import { Consulta_MontosPendientesCobro_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesCobro_Vencimientos'; 

Meteor.publish("consulta_MontosPendientesCobro_Vencimientos", function () {
    return Consulta_MontosPendientesCobro_Vencimientos.find({ user: this.userId });
});
