
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    descripcion: { type: String, label: "Descripción", min: 1, max: 60, optional: false, },
    simbolo: { type: String, label: "Simbolo", min: 1, max: 8, optional: false, },
    defecto: { type: Boolean, label: "Moneda por defecto", optional: true, },
    ultAct: { type: Date, optional: true },
    docState: { type: Number, optional: true, },
});

export const Monedas = new Mongo.Collection("monedas");
Monedas.attachSchema(schema);