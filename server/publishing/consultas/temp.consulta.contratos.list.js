
import SimpleSchema from 'simpl-schema';

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
});
