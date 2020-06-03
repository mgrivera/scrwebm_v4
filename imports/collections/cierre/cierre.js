
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

var registroUsuariosCierre_schema = new SimpleSchema({
    _id: { type: String, optional: false },

    user: { type: String, label: "Usuario", optional: false, },
    fecha: { type: Date, label: "Fecha de ejecución del cierre", optional: false, },
    comentarios: { type: String, label: "Comentarios del cierre ejecutado", optional: false, },
})

export const Cierre_schema = new SimpleSchema({
    _id: { type: String, optional: false },

    desde: { type: Date, label: "Fecha inicial del período de cierre", optional: false, },
    hasta: { type: Date, label: "Fecha final del período de cierre", optional: false, },
    fechaEjecucion: { type: Date, label: "Fecha de ejecución del cierre", optional: false, },
    cerradoFlag: { type: Boolean, label: "Cerrado? / Abierto?", optional: false, },

    usuarios: { type: Array, required: true, }, 
    'usuarios.$': { type: registroUsuariosCierre_schema, }, 
    
    cia: { type: String, label: "Cia", optional: false, },
    docState: { type: Number, optional: true, }, 
})

export const Cierre = new Mongo.Collection("cierre");
Cierre.attachSchema(Cierre_schema);