

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

var schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    ano: { type: SimpleSchema.Integer, label: 'Año de la numeración', optional: false, },
    tipo: { type: String, label: 'Tipo (NC/ND)', optional: false },
    numero: { type: SimpleSchema.Integer, label: 'Número de la próxima nota', optional: false, },
    cia: { type: String, label: 'Cia', optional: false },
})

export const NotasDebitoCredito_proxNumero: any = new Mongo.Collection("notasDebitoCredito_proxNumero");
NotasDebitoCredito_proxNumero.attachSchema(schema);

if (Meteor.isServer) {
    // indicamos a mongo que queremos un índice por 2 fields
    NotasDebitoCredito_proxNumero._ensureIndex({ ano: 1, tipo: 1, cia: 1 }, { unique: 1 });
}
