
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema'; 

// el origen permite asociar la cuota al riesgo/contrato, etc. Además, al movimiento, capa, etc. 
// Es para poder ubicar un nota de débito para un riesgo y movimiento, por ejemplo, en forma muy 
// fácil y rápida 
const source_SimpleSchema = new SimpleSchema({
    entityID: { type: String, optional: false },                  // ej: _id del riesgo; _id del contrato
    subEntityID: { type: String, optional: false },               // ej: _id del movimiento; _id de la capa o cuenta
    origen: { type: String, optional: false },                    // 'capa', 'cuenta', 'fac', 'sntro', 'nc', 'nd', etc.
    numero: { type: SimpleSchema.Integer, optional: false }                     // 37-3     (contrato 37, capa 3)
})

// -----------------------------------------------------------------------
//  notas de débito y crédito 
// -----------------------------------------------------------------------
const simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },

    source: { type: source_SimpleSchema, optional: false, minCount: 1 },

    tipo: { type: String, label: 'Tipo (NC/ND)', optional: false },
    tipoNegocio: { type: String, label: 'Tipo negocio (ej: facultativo exc pérdidas)', optional: false },

    ano: { type: SimpleSchema.Integer, label: 'Año', optional: false, },
    numero: { type: SimpleSchema.Integer, label: 'Número', optional: false, },

    compania: { type: String, label: 'Compañía', optional: false },
    moneda: { type: String, label: 'Moneda', optional: false },
    
    fecha: { type: Date, label: 'Fecha', optional: false },
    cuota: { type: String, label: 'ID de la cuota asociada', optional: false },
    cuentaBancaria: { type: String, label: 'Compañía', optional: false },

    fechaCuota: { type: Date, label: 'Fecha', optional: false },
    fechaVencimientoCuota: { type: Date, label: 'Fecha', optional: false },

    monto: { type: Number, label: 'Monto', optional: false, },
    observaciones: { type: String, label: 'Observaciones', optional: true },
    
    cia: { type: String, label: 'Cia', optional: false },
    docState: { type: SimpleSchema.Integer, optional: true }
})

export const NotasDebitoCredito = new Mongo.Collection("notasDebitoCredito");
NotasDebitoCredito.attachSchema(simpleSchema);