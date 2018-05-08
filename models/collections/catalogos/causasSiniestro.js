
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

CausasSiniestro = new Mongo.Collection("causasSiniestro");

var schema = new SimpleSchema({
    _id: {
        type: String,
        optional: false
    },
    descripcion: {
        type: String,
        label: "Descripción",
        min: 1,
        max: 80,
        optional: false
    },
    abreviatura: {
        type: String,
        label: "Abreviatura",
        min: 1,
        max: 15,
        optional: false
    },
    docState: {
        type: Number,
        optional: true
    }
});

CausasSiniestro.attachSchema(schema);
