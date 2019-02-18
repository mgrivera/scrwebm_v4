
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

var schema = new SimpleSchema({
    _id: {type: String,optional: false, },
    nombre: {type: String, label: "Nombre", min: 1, max: 120, optional: false, },
    nombreCorto: {type: String, label: "Nombre corto", min: 1, max: 25, optional: false, },
    abreviatura: {type: String, label: "Abreviatura", min: 1, max: 15, optional: false, },
    rif: { type: String, label: "Rif", max: 20, optional: true, },
    direccion: { type: String, label: "Dirección", max: 350, optional: true, },
    telefono: { type: String, label: "Teléfono", max: 100, optional: true, },
    fax: { type: String, label: "Fax", max: 100, optional: true, },
    companiaNosotros: { type: String, label: "Compañía que representa a 'nosotros'", optional: true, },
    docState: { type: Number, optional: true, }
})

export const EmpresasUsuarias: any = new Mongo.Collection("empresasUsuarias");
EmpresasUsuarias.attachSchema(schema);
