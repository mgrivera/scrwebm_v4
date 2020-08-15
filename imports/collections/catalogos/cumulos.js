
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const schema_zonas = new SimpleSchema({
    _id: { type: String, optional: false, },
    descripcion: { type: String, label: "Descripción", min: 1, max: 60, optional: false, },
    abreviatura: { type: String, label: "Abreviatura", min: 1, max: 15, optional: false, },
});

const schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    descripcion: { type: String, label: "Descripción", min: 1, max: 60, optional: false, },
    abreviatura: { type: String, label: "Abreviatura", min: 1, max: 15, optional: false, },
    zonas: { type: Array, label: "Zonas", optional: true, },
    'zonas.$': { type: schema_zonas, },
    docState: { type: Number, optional: true, },
});

export const Cumulos = new Mongo.Collection("cumulos");
Cumulos.attachSchema(schema);