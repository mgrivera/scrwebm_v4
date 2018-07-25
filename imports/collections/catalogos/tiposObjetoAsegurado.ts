

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

var schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    descripcion: { type: String, label: "Descripción", min: 1, max: 60, optional: false, },
    abreviatura: { type: String, label: "Abreviatura", min: 1, max: 15, optional: false, },
    docState: { type: Number, optional: true, },
});

export const TiposObjetoAsegurado: any = new Mongo.Collection("tiposObjetoAsegurado");
TiposObjetoAsegurado.attachSchema(schema);
