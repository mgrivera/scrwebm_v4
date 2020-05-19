
import { Meteor } from 'meteor/meteor'; 

import SimpleSchema from 'simpl-schema';
import { Temp_Consulta_Riesgos } from '/imports/collections/consultas/tempConsultaRiesgos'; 

Meteor.publish("temp.consulta.riesgos.list", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente,
    // los items que coresponden al usuario
    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
      }).validate({ cantRecords });

    const options = {
        sort: { numero: 1, },
        limit: cantRecords,
    };

    return Temp_Consulta_Riesgos.find(
        { user: this.userId },
        options
    );
})