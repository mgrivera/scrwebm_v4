

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const schema = new SimpleSchema({
    _id: { type: String, optional: false },
    cuenta: { type: String, label: "Cuenta contable", min: 1, max: 25, optional: false },
    totDet: { type: String, label: "Tipo (total/detalle)", optional: false, min: 1, max: 1, },
    cuentaEditada: { type: String, label: "Cuenta editada", optional: false, min: 1, max: 30,  },
    descripcion: { type: String, label: "Descripción", min: 1, max: 40, optional: false },
    cia: { type: String, label: "Cia", optional: false },
    docState: { type: Number, optional: true },
});

export const CuentasContables = new Mongo.Collection("cuentasContables");
CuentasContables.attachSchema(schema);