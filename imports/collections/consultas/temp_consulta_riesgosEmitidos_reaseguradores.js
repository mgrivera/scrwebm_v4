
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { Tracker } from 'meteor/tracker';

export const Temp_consulta_riesgosEmitidosReaseguradores_config = new Mongo.Collection("temp_consulta_riesgosEmitidosReaseguradores_config");

/** Define a Mongo collection to hold the data. */
const Temp_consulta_riesgosEmitidosReaseguradores = new Mongo.Collection("temp_consulta_riesgosEmitidosReaseguradores");

/** Define a schema to specify the structure of each document in the collection. */
const Temp_consulta_riesgosEmitidosReaseguradores_Schema = new SimpleSchema({
    _id: { type: String, optional: false },
    riesgoId: { type: String, optional: false },
    numero: { type: SimpleSchema.Integer, optional: false },
    moneda: { type: Object, blackbox: true, optional: false }, 
    cedente: { type: Object, blackbox: true, optional: false }, 
    compania: { type: Object, blackbox: true, optional: false }, 
    ramo: { type: Object, blackbox: true, optional: false }, 
    asegurado: { type: Object, blackbox: true, optional: false }, 
    estado: { type: String, optional: false }, 
    movimiento: { type: Number, optional: false },
    fechaEmision: { type: Date, optional: false }, 
    desde: { type: Date, optional: false },
    hasta: { type: Date, optional: false },

    valorARiesgo: { type: Number, optional: false },
    sumaAsegurada: { type: Number, optional: false }, 
    prima: { type: Number, optional: false },
    ordenPorc: { type: Number, optional: false }, 
    sumaReasegurada: { type: Number, optional: false },
    primaBruta: { type: Number, optional: false },
    comision: { type: Number, optional: false },
    impuesto: { type: Number, optional: false },
    corretaje: { type: Number, optional: false },
    impuestoSobrePN: { type: Number, optional: false },
    primaNeta: { type: Number, optional: false },

    cia: { type: String, optional: false }, 
    user: { type: String, optional: false }, 
}, { tracker: Tracker });

/** Attach this schema to the collection. */
Temp_consulta_riesgosEmitidosReaseguradores.attachSchema(Temp_consulta_riesgosEmitidosReaseguradores_Schema);

/** Make the collection and schema available to other code. */
export { Temp_consulta_riesgosEmitidosReaseguradores, Temp_consulta_riesgosEmitidosReaseguradores_Schema };