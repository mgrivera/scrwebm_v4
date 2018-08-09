

import { Consulta_Cumulos } from 'imports/collections/consultas/consulta_cumulos'; 

Meteor.publish("consultas.cumulos", function () {
    // regresamos solo los items que corresponden al usuario ... 
    return Consulta_Cumulos.find({ user: this.userId });
});