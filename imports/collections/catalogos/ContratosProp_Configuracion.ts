
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 

export const ContratosProp_Configuracion_ListaCodigos: any = new Mongo.Collection("contratosProp_configuracion_listaCodigos");

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    codigo: { type: String, optional: false },
    cia: { type: String, optional: false, },
    docState: { type: Number, optional: true, },
})

ContratosProp_Configuracion_ListaCodigos.attachSchema(schema);

if (Meteor.isServer) {
    // indicamos a mongo que queremos un índice por 2 fields
    ContratosProp_Configuracion_ListaCodigos._ensureIndex({ codigo: 1, cia: 1 }, { unique: 1 });
}

// ahora definimos un modelo para el collection que mantendrá las tablas de configuración
export const ContratosProp_Configuracion_Tablas: any = new Mongo.Collection("contratosProp_configuracion_tablas");

let schema2 = new SimpleSchema({
    _id: { type: String, optional: false, },
    codigo: { type: String, label: "Código del contrato", optional: false, },

    ano: { type: Number, label: "Año", optional: false, },
    moneda: { type: String, label: "Moneda", optional: false, },
    ramo: { type: String, label: "Ramo", optional: false, },
    tipoContrato: { type: String, label: "Tipo de contrato", optional: false, },
    compania: { type: String, label: "Compañía", optional: false, },
    nosotros: { type: Boolean, label: "Nosotros?", optional: false, },
    ordenPorc: { type: Number, label: "Orden (%)", optional: false, },
    comisionPorc: { type: Number, label: "Comisión (%)", optional: true, },
    imp1Porc: { type: Number, label: "Imp 1 (%)", optional: true, },
    imp2Porc: { type: Number, label: "Imp 2 (%)", optional: true, },
    imp3Porc: { type: Number, label: "Imp 3 (%)", optional: true, },
    corretajePorc: { type: Number, label: "Corretaje (%)", optional: true, },

    cia: { type: String, label: "Compañía usuaria", optional: false, },
    docState: { type: Number, optional: true, },
})

ContratosProp_Configuracion_Tablas.attachSchema(schema2);
