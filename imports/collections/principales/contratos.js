
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// ----------------------------------------------------------------------
// complementarios - comisión adicional 
// ---------------------------------------------------------------------- 
const ContratoProp_comAdic_resumen_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false,},
    definicionID: { type: String, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, },
    docState: { type: Number, optional: true }, 
})

export const ContratosProp_comAdic_resumen = new Mongo.Collection("contratosProp_comAdic_resumen");
ContratosProp_comAdic_resumen.attachSchema(ContratoProp_comAdic_resumen_simpleSchema);

const ContratoProp_comAdic_distribucion_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, },
    ordenPorc: { type: Number, optional: false, },
    monto_suParte: { type: Number, optional: false, },
    docState: { type: Number, optional: true }, 
})

export const ContratosProp_comAdic_distribucion = new Mongo.Collection("contratosProp_comAdic_distribucion");
ContratosProp_comAdic_distribucion.attachSchema(ContratoProp_comAdic_distribucion_simpleSchema);

const ContratoProp_comAdic_montosFinales_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, },
    docState: { type: Number, optional: true }, 
})

export const ContratosProp_comAdic_montosFinales = new Mongo.Collection("contratosProp_comAdic_montosFinales");
ContratosProp_comAdic_montosFinales.attachSchema(ContratoProp_comAdic_montosFinales_simpleSchema);

// ----------------------------------------------------------------------
// complementarios - entrada cartera primas 
// ---------------------------------------------------------------------- 
const ContratoProp_entCartPr_resumen_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_entCartPr_distribucion_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    ordenPorc: { type: Number, optional: false, },
    monto_suParte: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_entCartPr_montosFinales_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

export const ContratosProp_entCartPr_resumen = new Mongo.Collection("contratosProp_entCartPr_resumen");
ContratosProp_entCartPr_resumen.attachSchema(ContratoProp_entCartPr_resumen_simpleSchema);

export const ContratosProp_entCartPr_distribucion = new Mongo.Collection("contratosProp_entCartPr_distribucion");
ContratosProp_entCartPr_distribucion.attachSchema(ContratoProp_entCartPr_distribucion_simpleSchema);

export const ContratosProp_entCartPr_montosFinales = new Mongo.Collection("contratosProp_entCartPr_montosFinales");
ContratosProp_entCartPr_montosFinales.attachSchema(ContratoProp_entCartPr_montosFinales_simpleSchema);

// ----------------------------------------------------------------------
// complementarios - entrada cartera siniestros
// ---------------------------------------------------------------------- 
const ContratoProp_entCartSn_resumen_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_entCartSn_distribucion_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    ordenPorc: { type: Number, optional: false, },
    monto_suParte: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_entCartSn_montosFinales_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

export const ContratosProp_entCartSn_resumen = new Mongo.Collection("contratosProp_entCartSn_resumen");
ContratosProp_entCartSn_resumen.attachSchema(ContratoProp_entCartSn_resumen_simpleSchema);

export const ContratosProp_entCartSn_distribucion = new Mongo.Collection("contratosProp_entCartSn_distribucion");
ContratosProp_entCartSn_distribucion.attachSchema(ContratoProp_entCartSn_distribucion_simpleSchema);

export const ContratosProp_entCartSn_montosFinales = new Mongo.Collection("contratosProp_entCartSn_montosFinales");
ContratosProp_entCartSn_montosFinales.attachSchema(ContratoProp_entCartSn_montosFinales_simpleSchema);

// ----------------------------------------------------------------------
// complementarios - retirada cartera primas 
// ---------------------------------------------------------------------- 
const ContratoProp_retCartPr_resumen_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_retCartPr_distribucion_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    ordenPorc: { type: Number, optional: false, },
    monto_suParte: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_retCartPr_montosFinales_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

export const ContratosProp_retCartPr_resumen = new Mongo.Collection("contratosProp_retCartPr_resumen");
ContratosProp_retCartPr_resumen.attachSchema(ContratoProp_retCartPr_resumen_simpleSchema);

export const ContratosProp_retCartPr_distribucion = new Mongo.Collection("contratosProp_retCartPr_distribucion");
ContratosProp_retCartPr_distribucion.attachSchema(ContratoProp_retCartPr_distribucion_simpleSchema);

export const ContratosProp_retCartPr_montosFinales = new Mongo.Collection("contratosProp_retCartPr_montosFinales");
ContratosProp_retCartPr_montosFinales.attachSchema(ContratoProp_retCartPr_montosFinales_simpleSchema);

// ----------------------------------------------------------------------
// complementarios - retirada cartera siniestros
// ---------------------------------------------------------------------- 
const ContratoProp_retCartSn_resumen_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_retCartSn_distribucion_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    ordenPorc: { type: Number, optional: false, },
    monto_suParte: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_retCartSn_montosFinales_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

export const ContratosProp_retCartSn_resumen = new Mongo.Collection("contratosProp_retCartSn_resumen");
ContratosProp_retCartSn_resumen.attachSchema(ContratoProp_retCartSn_resumen_simpleSchema);

export const ContratosProp_retCartSn_distribucion = new Mongo.Collection("contratosProp_retCartSn_distribucion");
ContratosProp_retCartSn_distribucion.attachSchema(ContratoProp_retCartSn_distribucion_simpleSchema);

export const ContratosProp_retCartSn_montosFinales = new Mongo.Collection("contratosProp_retCartSn_montosFinales");
ContratosProp_retCartSn_montosFinales.attachSchema(ContratoProp_retCartSn_montosFinales_simpleSchema);

// ----------------------------------------------------------------------
// complementarios - participación beneficios 
// ---------------------------------------------------------------------- 
const ContratoProp_partBeneficios_resumen_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_partBeneficios_distribucion_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    ordenPorc: { type: Number, optional: false, },
    monto_suParte: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

const ContratoProp_partBeneficios_montosFinales_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true }, 
})

export const ContratosProp_partBeneficios_resumen = new Mongo.Collection("contratosProp_partBeneficios_resumen");
ContratosProp_partBeneficios_resumen.attachSchema(ContratoProp_partBeneficios_resumen_simpleSchema);

export const ContratosProp_partBeneficios_distribucion = new Mongo.Collection("contratosProp_partBeneficios_distribucion");
ContratosProp_partBeneficios_distribucion.attachSchema(ContratoProp_partBeneficios_distribucion_simpleSchema);

export const ContratosProp_partBeneficios_montosFinales = new Mongo.Collection("contratosProp_partBeneficios_montosFinales");
ContratosProp_partBeneficios_montosFinales.attachSchema(ContratoProp_partBeneficios_montosFinales_simpleSchema);

// -----------------------------------------------------------------------
// contratos - cuentas técnicas - resumen de primas y siniestros (montos)
// para una definición de cuenta técnica
// -----------------------------------------------------------------------
const ContratoProp_cuentas_resumen_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    primas: { type: Number, optional: true, },
    siniestros: { type: Number, optional: true, },
    docState: { type: Number, optional: true }, 
})


// para agregar una validación para todo el schema y no para un field en particular 
ContratoProp_cuentas_resumen_simpleSchema.addDocValidator(obj => {
    // Must return an array, potentially empty, of objects with `name` and `type` string properties and optional `value` property.

    // validacimos solo cuando las ediciones son efectuadas por el usuario 
    // (ie: no las efectuadas por procesos como, por ejemplo, el proceso de cobranza, que agrega pagos a las cuotas)
    if (!obj.docState) { 
        return []; 
    }

    const primas = obj.primas;
    const siniestros = obj.siniestros;

    // la fecha debe ser *posterior* al período de cierre 
    if (primas || siniestros) { 
        return []; 
    }

    return [
      { name: 'primas', type: 'REGISTRO-INCOMPLETO', value: primas }
    ];
  })

// -----------------------------------------------------------------------
// contratos - cuentas técnicas - distribución de priimas y siniestros en
// las compañías del contrato
// -----------------------------------------------------------------------
const ContratoProp_cuentas_distribucion_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    ramo: { type: String, optional: false, },
    tipoContrato: { type: String, optional: false, },
    serie: { type: Number, optional: false, },

    prima: { type: Number, optional: true, },
    ordenPorc: { type: Number, optional: false, },
    primaBruta: { type: Number, optional: true, },
    comisionPorc: { type: Number, optional: true, },
    comision: { type: Number, optional: true, },
    imp1Porc: { type: Number, optional: true, },
    imp1: { type: Number, optional: true, },
    imp2Porc: { type: Number, optional: true, },
    imp2: { type: Number, optional: true, },
    imp3Porc: { type: Number, optional: true, },
    imp3: { type: Number, optional: true, },
    primaNetaAntesCorretaje: { type: Number, optional: true, },
    corretajePorc: { type: Number, optional: true, },
    corretaje: { type: Number, optional: true, },
    primaNeta: { type: Number, optional: true, },

    siniestros: { type: Number, optional: true, },
    siniestros_suParte: { type: Number, optional: true, },

    saldo: { type: Number, optional: false, },
    resultadoTecnico: { type: Number, optional: true, },        // mismo saldo, pero sin agregar corretaje al cálculo 
    docState: { type: Number, optional: true }, 
})

// -----------------------------------------------------------------------
// contratos - cuentas técnicas - saldos finales para cada compañía; para
// cada compañía en una cuenta técnica (período) particular
// -----------------------------------------------------------------------
const ContratoProp_cuentas_saldos_simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    contratoID: { type: String, optional: false, },
    definicionID: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    serie: { type: Number, optional: false, },
    
    prima: { type: Number, optional: true, },
    primaBruta: { type: Number, optional: true, },
    comision: { type: Number, optional: true, },
    imp1: { type: Number, optional: true, },
    imp2: { type: Number, optional: true, },
    imp3: { type: Number, optional: true, },
    primaNetaAntesCorretaje: { type: Number, optional: true, },
    corretaje: { type: Number, optional: true, },
    primaNeta: { type: Number, optional: true, },
    siniestros: { type: Number, optional: true, },
    siniestros_suParte: { type: Number, optional: true, },
    saldo: { type: Number, optional: false, },
    resultadoTecnico: { type: Number, optional: true, },        // mismo saldo, pero sin agregar corretaje al cálculo 
    docState: { type: Number, optional: true }, 
})

export const ContratosProp_cuentas_resumen = new Mongo.Collection("contratosProp_cuentas_resumen");
ContratosProp_cuentas_resumen.attachSchema(ContratoProp_cuentas_resumen_simpleSchema);

export const ContratosProp_cuentas_distribucion = new Mongo.Collection("contratosProp_cuentas_distribucion");
ContratosProp_cuentas_distribucion.attachSchema(ContratoProp_cuentas_distribucion_simpleSchema);

export const ContratosProp_cuentas_saldos = new Mongo.Collection("contratosProp_cuentas_saldos");
ContratosProp_cuentas_saldos.attachSchema(ContratoProp_cuentas_saldos_simpleSchema);


// -----------------------------------------------------------------------
// contratos - cuentas técnicas (definición de cuentas técnicas)
// -----------------------------------------------------------------------
const ContratoCuentasDefiniciones_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    numero: { type: Number, optional: false, },
    moneda: { type: String, optional: false, },
    desde: { type: Date, optional: false, },
    hasta: { type: Date, optional: false, },
    fechaVencimiento: { type: Date, optional: false, },
    fechaRecepcion: { type: Date, optional: true }, 
})

// -----------------------------------------------------------------------
// contrato - capas - reaseguradores
// -----------------------------------------------------------------------
const ContratoCapasReaseguradores_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    compania: { type: String, optional: false, },
    // persona: { type: persona_SimpleSchema, optional: true },
    ordenPorc: { type: Number, optional: false, },
    imp1Porc: { type: Number, optional: true, },
    imp2Porc: { type: Number, optional: true, },
    impSPNPorc: { type: Number, optional: true, },
    corretajePorc: { type: Number, optional: false, }
})


// -----------------------------------------------------------------------
// contratos - capas
// -----------------------------------------------------------------------
const ContratoCapa_SimpleSchema = new SimpleSchema({
    _id: { type:String, optional: false, },
    numero: { type:Number, optional: false, },
    moneda: { type:String, optional: false, },
    descripcion: { type:String, optional: true},
    pmd: { type: Number, optional: false, },
    nuestraOrdenPorc: { type: Number, optional: false, },
    imp1Porc: { type: Number, optional: true, },
    imp2Porc: { type: Number, optional: true, },
    impSPNPorc: { type: Number, optional: true, },
    corretajePorc: { type: Number, optional: false, },

    reaseguradores: { type:Array, optional: true,minCount: 0 },
    'reaseguradores.$': { type:ContratoCapasReaseguradores_SimpleSchema },
})

// -----------------------------------------------------------------------
// contratos - capas - primas de compañías
// -----------------------------------------------------------------------
const ContratoCapa_PrimasCompanias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    capaID: { type: String, optional: false, },
    numeroCapa: { type: Number, optional: false, },
    compania: { type: String, optional: false, },
    nosotros: { type: Boolean, optional: false, },
    moneda: { type: String, optional: false, },
    pmd: { type: Number, optional: false, },
    ordenPorc: { type: Number, optional: false, },
    primaBruta: { type: Number, optional: false, },

    imp1Porc: { type: Number, optional: true, },
    imp1: { type: Number, optional: true, },

    imp2Porc: { type: Number, optional: true, },
    imp2: { type: Number, optional: true, },

    corretajePorc: { type: Number, optional: true, },
    corretaje: { type: Number, optional: true, },

    primaNeta0: { type: Number, optional: false, },

    impSPNPorc: { type: Number, optional: true, },
    impSPN: { type: Number, optional: true, },

    primaNeta: { type: Number, optional: false, }
})

// -----------------------------------------------------------------------
// Compañías (movimiento sub-document)
// -----------------------------------------------------------------------
const  persona_SimpleSchema = new SimpleSchema({
    compania: { type: String, optional: false, },
    titulo: { type: String, optional: false, min: 1, max: 8 },
    nombre: { type: String, optional: false, min: 1, max: 100 }
})

// -----------------------------------------------------------------------
// Renovación (riesgo sub-document)
// -----------------------------------------------------------------------
const  renovacion_SimpleSchema = new SimpleSchema({
    renovadoPor: { type: Number, optional: true },
    renuevaAl: { type: Number, optional: true }
})

// -----------------------------------------------------------------------
// contratos
// -----------------------------------------------------------------------
const Contrato_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    numero: { type: Number, optional: false, },
    codigo: { type: String, optional: true },

    fechaEmision: { type: Date, label: "Fecha de emisión", optional: false, },
    desde: { type: Date, optional: false, },
    hasta: { type: Date, optional: false, },
    suscriptor: { type: String, optional: false, },
    compania: { type: String, optional: false, },

    personas: { type: Array, optional: true, minCount: 0 },
    'personas.$': { type: persona_SimpleSchema },

    tipo: { type:String, optional: false, },
    referencia: { type: String, min: 1, optional: false, },
    ramo: { type: String, optional: true },
    descripcion: { type: String, optional: true },
    renovacion: { type: renovacion_SimpleSchema, optional: true },

    capas: { type: Array, optional: true, minCount: 0 },
    'capas.$': { type: ContratoCapa_SimpleSchema },

    capasPrimasCompanias: { type: Array, optional: true, minCount: 0 },
    'capasPrimasCompanias.$': { type: ContratoCapa_PrimasCompanias_SimpleSchema },

    cuentasTecnicas_definicion: { type: Array, optional: true, minCount: 0 },
    'cuentasTecnicas_definicion.$': { type: ContratoCuentasDefiniciones_SimpleSchema },

    ingreso: { type: Date, optional: false, },
    ultAct: { type: Date, optional: true },
    usuario: { type: String, optional: false, },
    ultUsuario: { type: String, optional: true },

    cia: { type: String, optional: false, },
    docState: { type: Number, optional: true }
})

export const Contratos = new Mongo.Collection("contratos");
Contratos.attachSchema(Contrato_SimpleSchema);
