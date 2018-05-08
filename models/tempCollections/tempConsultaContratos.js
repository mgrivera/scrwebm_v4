
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    id: { type: String, optional: false },
    numero: { type: Number, label: "Número", optional: false },
    codigo: { type: String, label: "Código", optional: true },
    referencia: { type: String, label: "Referencia", optional: true },
    desde: { type: Date, label: "Desde", optional: false },
    hasta: { type: Date, label: "Hasta", optional: false },
    compania: { type: String, label: "Compañía", optional: false },
    suscriptor: { type: String, label: "Suscriptor", optional: false },
    tipo: { type: String, label: "Tipo", optional: false },
    ramo: { type: String, label: "Ramo", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: true },

    cia: { type: String, label: 'Cia scrwebM', optional: false },
    user: { type: String, label: 'Mongo user', optional: false },
})

Temp_Consulta_Contratos = new Mongo.Collection("temp_consulta_contratos");
Temp_Consulta_Contratos.attachSchema(schema);
