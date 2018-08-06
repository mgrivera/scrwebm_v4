

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema'; 

var reasegurador_SimpleSchema = new SimpleSchema({
    _id: { type: String, label: "Reasegurador: ID", optional: false },
    compania: { type: String, label: "Reasegurador", optional: false },
    ordenPorc: { type: Number, label: "Reasegurador: orden (%)", optional: false, },
})

var source_SimpleSchema = new SimpleSchema({
    entityID: { type: String, optional: false },                  // ej: _id del riesgo; _id del contrato
    subEntityID: { type: String, optional: true },               // ej: _id del movimiento; _id de la capa o cuenta
    origen: { type: String, optional: false },                    // 'capa', 'cuenta', 'fac', 'sntro', 'nc', 'nd', etc.
    numero: { type: String, optional: false }                     // 37-3     (contrato 37, capa 3)
})

let simpleSchema: any = new SimpleSchema({
    _id: { type: String, label: "ID del registro (cúmulo)", optional: false, },

    source: { type: source_SimpleSchema, optional: false, minCount: 1 },

    desde: { type: Date, label: "Desde", optional: false, },
    hasta: { type: Date, label: 'Hasta', optional: false, },

    tipoCumulo: { type: String, label: 'Tipo de cúmulo', optional: false, },
    zona: { type: String, label: 'Zona', optional: false, },
    moneda: { type: String, label: 'Moneda', optional: false, },
    cedente: { type: String, label: 'Cedente', optional: false, },
    indole: { type: String, label: 'Indole', optional: true, },
    ramo: { type: String, label: 'Ramo', optional: false, },
    tipoObjetoAsegurado: { type: String, label: 'Tipo de objeto asegurado', optional: true, },
    
    valoresARiesgo: { type: Number, label: 'Valor a riesgo', optional: false, },
    sumaAsegurada: { type: Number, label: 'Suma asegurada', optional: false, },
    prima: { type: Number, label: 'Prima', optional: false, },
    nuestraOrdenPorc: { type: Number, label: 'Nuestra orden (%)', optional: false, },
    sumaReasegurada: { type: Number, label: 'Suma reasegurada', optional: false, },
    primaBruta: { type: Number, label: 'Prima bruta de reaseguro', optional: false, },

    reaseguradores: { type: Array, label: 'Reaseguradores', optional: true, minCount: 0, },
    'reaseguradores.$': { type: reasegurador_SimpleSchema },

    ingreso: { type: Date, optional: false, },
    ultAct: { type: Date, optional: true, },
    usuario: { type: String, optional: false, },
    ultUsuario: { type: String, optional: true, },

    cia: { type: String, label: 'Cia', optional: false, },
    docState: { type: Number, optional: true, }
})

export const Cumulos_Registro: any = new Mongo.Collection("cumulos_registro");
Cumulos_Registro.attachSchema(simpleSchema);