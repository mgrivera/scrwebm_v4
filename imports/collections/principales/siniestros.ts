
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// -----------------------------------------------------------------------
// Siniestros - Liquidaciones
// -----------------------------------------------------------------------
var liquidacion_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    numero: { type: Number, optional: false },
    moneda: { type: String, optional: false },
    fechaEmision: { type: Date, optional: false },
    fecha: { type: Date, optional: false },
    indemnizado: { type: Number, optional: true, },
    ajuste: { type: Number, optional: true, },
    adicional: { type: Number, optional: true, },
    otrosGastos: { type: Number, optional: true, },
    definitivo: { type: Boolean, optional: true },
    comentarios: { type: String, optional: true }
})

// -----------------------------------------------------------------------
// Siniestros - Reservas
// -----------------------------------------------------------------------
var reserva_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    numero: { type: Number, optional: false },
    tipo: { type: String, optional: false, min: 1, max: 6 },
    moneda: { type: String, optional: false },
    fechaEmision: { type: Date, optional: false },
    fecha: { type: Date, optional: false },
    monto: { type: Number, optional: false, },
    comentarios: { type: String, optional: true }
})

// -----------------------------------------------------------------------
// Siniestros - Compañías
// -----------------------------------------------------------------------
var companias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    compania: { type: String, optional: false },
    nosotros: { type: Boolean, optional: false },
    ordenPorc: { type: Number, optional: false, }
})

// -----------------------------------------------------------------------
// Siniestros - Notas
// -----------------------------------------------------------------------
var notas_SimpleSchema = new SimpleSchema({
    lugar: { type: String, optional: true },
    descripcion: { type: String, optional: true },
    detalles: { type: String, optional: true },
    causa: { type: String, optional: true },
    consecuencias: { type: String, optional: true },
    observaciones: { type: String, optional: true },
})

// -----------------------------------------------------------------------
// Siniestros - Source (origen)
// -----------------------------------------------------------------------
var siniestroSource_SimpleSchema = new SimpleSchema({
    entityID: { type: String, optional: false },                  // ej: _id del riesgo; _id del contrato
    subEntityID: { type: String, optional: false },               // ej: _id del movimiento; _id de la capa o cuenta
    origen: { type: String, optional: false },                    // 'capa', 'cuenta', 'fac', 'sntro', 'nc', 'nd', etc.
    numero: { type: String, optional: false }                     // 37-3     (contrato 37, capa 3)
})

// -----------------------------------------------------------------------
// Compañías (movimiento sub-document)
// -----------------------------------------------------------------------
var persona_SimpleSchema = new SimpleSchema({
    compania: { type: String, optional: false },
    titulo: { type: String, optional: false, min: 1, max: 8 },
    nombre: { type: String, optional: false, min: 1, max: 100 }
})


// -----------------------------------------------------------------------
// Documenos (riesgo y movimientos sub-document)
// -----------------------------------------------------------------------
var documentos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    tipo: { type: String, optional: false },
    numero: { type: String, optional: false }
})


// -----------------------------------------------------------------------
// Siniestros
// -----------------------------------------------------------------------
export const Siniestro_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },

    source: { type: siniestroSource_SimpleSchema, optional: true, minCount: 0 },

    numero: { type: Number, optional: false },
    codigo: { type: String, optional: true },
    tipo: { type: String, min: 1, optional: false },
    referencia: { type: String, min: 1, optional: false },
    suscriptor: { type: String, optional: false },
    moneda: { type: String, optional: false },
    compania: { type: String, optional: false },

    personas: { type: Array, optional: true, minCount: 0 },
    'personas.$': { type: persona_SimpleSchema },


    ramo: { type: String, optional: true },
    asegurado: { type: String, optional: false },
    ajustador: { type: String, optional: true },
    causa: { type: String, optional: false },

    fechaEmision: { type: Date, optional: false },
    fechaOcurrencia: { type: Date, optional: false },
    fechaNotificacion: { type: Date, optional: false },

    notas: { type: notas_SimpleSchema, optional: true, minCount: 0 },

    documentos: { type: Array, optional: true, minCount: 0 },
    'documentos.$': { type: documentos_SimpleSchema },



    companias: { type: Array, optional: true, minCount: 0 },
    'companias.$': { type: companias_SimpleSchema },


    reservas: { type: Array, optional: true, minCount: 0 },
    'reservas.$': { type: reserva_SimpleSchema },


    liquidaciones: { type: Array, optional: true, minCount: 0 },
    'liquidaciones.$': { type: liquidacion_SimpleSchema },



    ingreso: { type: Date, optional: false },
    ultAct: { type: Date, optional: true },
    usuario: { type: String, optional: false },
    ultUsuario: { type: String, optional: true },
    cia: { type: String, optional: false },
    docState: { type: Number, optional: true }
})

export const Siniestros: any = new Mongo.Collection("siniestros");
Siniestros.attachSchema(Siniestro_SimpleSchema);
