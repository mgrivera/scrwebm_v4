
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    nombre: { type: String, label: "Nombre", min: 1, max: 80, optional: false, },
    abreviatura: { type: String, label: "Abreviatura", min: 1, max: 15, optional: false, },
    docState: { type: Number, optional: true, }, 
});

export const Bancos = new Mongo.Collection("bancos");
Bancos.attachSchema(schema);