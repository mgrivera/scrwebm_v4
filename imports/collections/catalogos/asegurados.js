
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

var schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    nombre: {type: String, label: "Nombre", min: 1, max: 120, optional: false, },
    abreviatura: {type: String, label: "Abreviatura", min: 1, max: 15, optional: false, },
    docState: {type: Number, optional: true, }
})

export const Asegurados = new Mongo.Collection("asegurados");
Asegurados.attachSchema(schema);