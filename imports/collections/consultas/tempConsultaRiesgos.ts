

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    id: { type: String, optional: false },
    numero: { type: Number, label: "Número", optional: false },
    codigo: { type: String, label: "Código", optional: true },
    referencia: { type: String, label: "Referencia", optional: true },
    estado: { type: String, label: "Estado", optional: false },
    desde: { type: Date, label: "Desde", optional: false },
    hasta: { type: Date, label: "Hasta", optional: false },
    suscriptor: { type: String, label: "Suscriptor", optional: false },
    moneda: { type: String, label: "Moneda", optional: false },
    compania: { type: String, label: "Compañía", optional: false },
    ramo: { type: String, label: "Ramo", optional: false },
    asegurado: { type: String, label: "Asegurado", optional: false },
    tipo: { type: String, label: "Tipo", optional: false },

    cia: { type: String, label: 'Cia scrwebM', optional: false },
    user: { type: String, label: 'Mongo user', optional: false },
})

export const Temp_Consulta_Riesgos: any = new Mongo.Collection("temp_consulta_riesgos");
Temp_Consulta_Riesgos.attachSchema(schema);
