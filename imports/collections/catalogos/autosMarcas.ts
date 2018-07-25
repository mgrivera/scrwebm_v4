


import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const schemaModelos = new SimpleSchema({ 
    _id: { type: String, optional: false, },
    modelo: {type: String, label: "Marca", min: 1, max: 50, optional: false, },
})

var schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    marca: {type: String, label: "Marca", min: 1, max: 50, optional: false, },
    modelos: { type: Array, label: "Modelos", optional: true, },
    'modelos.$': { type: schemaModelos, },
    docState: {type: Number, optional: true, }
})

export const AutosMarcas: any = new Mongo.Collection("autosMarcas");
AutosMarcas.attachSchema(schema);
