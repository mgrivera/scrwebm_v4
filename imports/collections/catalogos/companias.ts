
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';


var personas_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    titulo: { type: String, optional: false, min: 1, max: 8 },
    nombre: { type: String, optional: false, min: 1, max: 100 },
    cargo: { type: String, optional: true, min: 0, max: 100 },
    departamento: { type: String, optional: true, min: 0, max: 100 },
    email: { type: String, optional: true, min: 0, max: 100 },
    emailCobranzas: { type: Number, optional: true, },
});

var schema = new SimpleSchema({
    _id: { type: String, optional: false },
    nombre: { type: String, label: "Nombre", min: 1, max: 80, optional: false },
    abreviatura: { type: String, label: "Abreviatura", min: 1, max: 15, optional: false },
    tipo: { type: String, label: "Tipo", min: 1, max: 8, optional: false },
    rif: { type: String, label: "Rif", max: 20, optional: true },
    direccion: { type: String, label: "Dirección", max: 350, optional: true },
    telefono: { type: String, label: "Teléfono", max: 100, optional: true },
    fax: { type: String, label: "Fax", max: 100, optional: true },
    nosotros: { type: Boolean, label: "Nosotros", optional: false },
    docState: { type: Number, optional: true },
    personas: { type: Array, optional: true, minCount: 0 },
    'personas.$': { type: personas_SimpleSchema },
});

export const Companias: any = new Mongo.Collection("companias");
Companias.attachSchema(schema);
