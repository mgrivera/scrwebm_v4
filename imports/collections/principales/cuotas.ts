


import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema'; 
import * as moment from 'moment'; 
import { Cierre } from '../cierre/cierre'; 

// ------------------------------------------------------------------------
// cuotas - pagos
// ------------------------------------------------------------------------
let emailsEnviados_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    tipoEmail: { type: String, optional: false },
    fecha: { type: Date, optional: false },
    user: { type: String, optional: false },
})

var cuotaPago_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    remesaID: { type: String, optional: false },
    remesaNumero: { type: Number, optional: false },
    //remesaPagoID: { type: String, optional: false },
    moneda: { type: String, optional: false },
    fecha: { type: Date, optional: false },
    monto: { type: Number, optional: false, },
    completo: { type: Boolean, optional: false }
})

var cuotaSource_SimpleSchema = new SimpleSchema({
    entityID: { type: String, optional: false },                  // ej: _id del riesgo; _id del contrato
    subEntityID: { type: String, optional: false },               // ej: _id del movimiento; _id de la capa o cuenta
    origen: { type: String, optional: false },                    // 'capa', 'cuenta', 'fac', 'sntro', 'nc', 'nd', etc.
    numero: { type: String, optional: false }                     // 37-3     (contrato 37, capa 3)
})

var schema_protegida = new SimpleSchema({
    protegida: { type: Boolean, label: "Protegida", optional: false, },
    razon: { type: String, optional: false, },
})


// -----------------------------------------------------------------------
//  cuotas
// -----------------------------------------------------------------------
let simpleSchema: any = new SimpleSchema({
    _id: { type: String, optional: false },

    source: { type: cuotaSource_SimpleSchema, optional: true, minCount: 0 },

    compania: { type: String, label: 'Compañía', optional: false },
    moneda: { type: String, label: 'Moneda', optional: false },
    numero: { type: Number, label: 'Número', optional: false },
    cantidad: { type: Number, label: 'Cantidad', optional: false },
    fechaEmision: { type: Date, label: "Fecha de emisión", optional: false },
    fecha: { type: Date, label: 'Fecha de la cuota', optional: false },
    diasVencimiento: { type: Number, label: 'Días de vencimiento', optional: false },
    fechaVencimiento: { type: Date, label: 'Fecha de vencimiento', optional: false },
    montoOriginal: { type: Number, label: 'Monto original', optional: false, },
    factor: { type: Number, label: 'Factor', optional: false, },
    monto: { type: Number, label: 'Monto', optional: false, },

    pagos: { type: Array, label: 'Arreglo de pagos', optional: true, minCount: 0 },
    'pagos.$': { type: cuotaPago_SimpleSchema },

    emailsEnviados: { type: Array, label: 'Arreglo de e-mails enviados', optional: true, minCount: 0 },
    'emailsEnviados.$': { type: emailsEnviados_SimpleSchema },

    cia: { type: String, label: 'Cia', optional: false },
    protegida: { type: schema_protegida, optional: true, minCount: 0 },     // para saber si la entidad está 'protegida' (ej: por un proceso de cierre)
    docState: { type: Number, optional: true }
})

export const Cuotas: any = new Mongo.Collection("cuotas");
Cuotas.attachSchema(simpleSchema);

// validamos que registros anteriores al cierre no sean alterados 
simpleSchema.addDocValidator(obj => {
    // Must return an array, potentially empty, of objects with `name` and `type` string properties and optional `value` property.

    // validamos solo cuando las ediciones son efectuadas por el usuario 
    // (ie: no las efectuadas por procesos como, por ejemplo, el proceso de cobranza, que agrega pagos a las cuotas)
    if (!obj.docState) { 
        return []; 
    }

    // leemos el último cierre efectuado para la compañía 
    let ultimoCierre = Cierre.findOne({ cia: obj.cia, cerradoFlag: true, }, { fields: { hasta: 1, }, sort: { hasta: -1, }}); 

    if (!ultimoCierre) { 
        return []; 
    }

    // eliminamos la parte 'time' a ambas fechas para poder comparar 
    let entidadDate = new Date(obj.fecha.toDateString());
    let cierreDate = new Date(ultimoCierre.hasta.toDateString());

    // la fecha debe ser *posterior* al período de cierre 
    if (entidadDate > cierreDate) { 
        return []; 
    }

    return [
      { name: 'fecha', type: 'REGISTROS-CERRADOS', value: moment(obj.fecha).format("DD-MMM-YYYY") }
    ];
  })
