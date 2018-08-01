
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
﻿
// -----------------------------------------------------------------------
// Objeto asegurado (riesgo sub-document)
// -----------------------------------------------------------------------
var objetoAsegurado_SimpleSchema = new SimpleSchema({
    descripcion: { type: String, optional: true },
    ubicacion: { type: String, optional: true }
})


// -----------------------------------------------------------------------
// Renovación (riesgo sub-document)
// -----------------------------------------------------------------------
var renovacion_SimpleSchema = new SimpleSchema({
    renovadoPor: { type: Number, optional: true },
    renuevaAl: { type: Number, optional: true }
})

// -----------------------------------------------------------------------
// Compañías (movimiento sub-document)
// -----------------------------------------------------------------------

var companias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    compania: { type: String, optional: false },
    nosotros: { type: Boolean, optional: false },
    ordenPorc: { type: Number, optional: false, },
    comisionPorc: { type: Number, optional: true, },
    impuestoPorc: { type: Number, optional: true, },
    corretajePorc: { type: Number, optional: true, },
    impuestoSobrePNPorc: { type: Number, optional: true, },
})


// -----------------------------------------------------------------------
// Coberturas (movimiento sub-document)
// -----------------------------------------------------------------------
var coberturas_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    cobertura: { type: String, optional: false },
    moneda: { type: String, optional: false },
    valorARiesgo: { type: Number, optional: true, },
    sumaAsegurada: { type: Number, optional: true, },
    tasa: { type: Number, optional: true, },
    prima: { type: Number, optional: true, }
})


// -----------------------------------------------------------------------
// CoberturasCompanias (movimiento sub-document)
// -----------------------------------------------------------------------
var coberturasCompanias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    compania: { type: String, optional: false },
    nosotros: { type: Boolean, optional: false },
    cobertura: { type: String, optional: false },
    moneda: { type: String, optional: false },
    valorARiesgo: { type: Number, optional: true, },
    sumaAsegurada: { type: Number, optional: true, },
    tasa: { type: Number, optional: true, },
    prima: { type: Number, optional: true, },
    ordenPorc: { type: Number, optional: false, },
    sumaReasegurada: { type: Number, optional: false, },
    primaBrutaMovimientoAnterior: { type: Number, optional: true, },
    primaBrutaAntesProrrata: { type: Number, optional: true, },
    factorProrrata: { type: Number, optional: true, },
    primaBruta: { type: Number, optional: false, }
})


// -----------------------------------------------------------------------
// Primas (movimiento sub-document)
// -----------------------------------------------------------------------
var primas_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    compania: { type: String, optional: false },
    moneda: { type: String, optional: false },
    nosotros: { type: Boolean, optional: false },
    primaBruta: { type: Number, optional: true, },
    comisionPorc: { type: Number, optional: true, },
    comision: { type: Number, optional: true, },
    impuestoPorc: { type: Number, optional: true, },
    impuesto: { type: Number, optional: true, },
    corretajePorc: { type: Number, optional: true, },
    corretaje: { type: Number, optional: true, },
    primaNeta0: { type: Number, optional: true, },
    impuestoSobrePNPorc: { type: Number, optional: true, },
    impuestoSobrePN: { type: Number, optional: true, },
    primaNeta: { type: Number, optional: true, }
})

// -----------------------------------------------------------------------
// Productores (movimiento sub-document)
// -----------------------------------------------------------------------
var productores_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    compania: { type: String, optional: false },
    moneda: { type: String, optional: false },
    corretaje: { type: Number, optional: true, },
    porcentaje: { type: Number, optional: true, },
    monto: { type: Number, optional: false, }
})


// -----------------------------------------------------------------------
// Documentos (riesgo y movimientos sub-document)
// -----------------------------------------------------------------------
var documentos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    tipo: { type: String, optional: false },
    numero: { type: String, optional: false }
})


// -----------------------------------------------------------------------
// Movimientos
// -----------------------------------------------------------------------
var movimientos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    numero: { type: Number, optional: false },
    tipo: { type: String, optional: false },
    fechaEmision: { type: Date, label: "Fecha de emisión", optional: false },
    desde: { type: Date, optional: false },
    hasta: { type: Date, optional: false },


    documentos: { type: Array, optional: true, minCount: 0 },
    'documentos.$': { type: documentos_SimpleSchema },


    cantidadDias: { type: Number, optional: false },
    factorProrrata: { type: Number, optional: false, },

    companias: { type: Array, optional: true, minCount: 0 },
    'companias.$': { type: companias_SimpleSchema },


    coberturas: { type: Array, optional: true, minCount: 0 },
    'coberturas.$': { type: coberturas_SimpleSchema },


    coberturasCompanias: { type: Array, optional: true, minCount: 0 },
    'coberturasCompanias.$': { type: coberturasCompanias_SimpleSchema },


    primas: { type: Array, optional: true, minCount: 0 },
    'primas.$': { type: primas_SimpleSchema },


    productores: { type: Array, optional: true, minCount: 0 },
    'productores.$': { type: productores_SimpleSchema },


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
// Riesgos
// -----------------------------------------------------------------------
let Riesgo_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    numero: { type: Number, optional: false },
    codigo: { type: String, optional: true },
    tipo: { type: String, min: 1, optional: false },
    referencia: { type: String, min: 1, optional: false },
    estado: { type: String, optional: false },
    desde: { type: Date, optional: false },
    hasta: { type: Date, optional: false },

    suscriptor: { type: String, optional: false },
    moneda: { type: String, optional: false },
    indole: { type: String, optional: false },
    compania: { type: String, optional: false },

    personas: { type: Array, optional: true, minCount: 0 },
    'personas.$': { type: persona_SimpleSchema },


    ramo: { type: String, optional: false },
    asegurado: { type: String, optional: false },
    corredor: { type: String, optional: true },

    objetoAsegurado: { type: objetoAsegurado_SimpleSchema, optional: true },
    renovacion: { type: renovacion_SimpleSchema, optional: true },
    comentarios: { type: String, optional: true },

    documentos: { type: Array, optional: true, minCount: 0 },
    'documentos.$': { type: documentos_SimpleSchema },


    movimientos: { type: Array, optional: true, minCount: 0 },
    'movimientos.$': { type: movimientos_SimpleSchema },



    ingreso: { type: Date, optional: false },
    ultAct: { type: Date, optional: true },
    usuario: { type: String, optional: false },
    ultUsuario: { type: String, optional: true },
    cia: { type: String, optional: false },
    docState: { type: Number, optional: true }
})

export const Riesgos: any = new Mongo.Collection("riesgos");
Riesgos.attachSchema(Riesgo_SimpleSchema);

// Nota importante: aunque definimos este esquema, solo lo usamos para validar los registros que el usuario agregue para el 
// ramo Autos; la idea es que en esta tabla existan registros de ramos diferentes; para cada ramo, la estructura del 
// registro cambiará ... 
export const Riesgo_InfoRamos_Autos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    riesgoID: { type: String, optional: false },
    movimientoID: { type: String, optional: false },

    marca: { type: String, optional: false },
    modelo: { type: String, optional: false },
    ano: { type: SimpleSchema.Integer, optional: false },
    placa: { type: String, optional: false },
    serialCarroceria: { type: String, optional: true },
    
    docState: { type: Number, optional: true }
})

export const Riesgos_InfoRamo: any = new Mongo.Collection("riesgos_infoRamo");
