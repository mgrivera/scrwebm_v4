
import { Meteor } from 'meteor/meteor'; 
import SimpleSchema from 'simpl-schema';

import { Temp_Consulta_Contratos } from '/imports/collections/consultas/tempConsultaContratos'; 

Meteor.publish("temp.consulta.contratos.list", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente,
    // los items que coresponden al usuario
    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
      }).validate({ cantRecords });

    const options = {
        sort: { numero: 1, },
        limit: cantRecords,
    };

    return Temp_Consulta_Contratos.find(
        { user: this.userId },
        options
    );
})