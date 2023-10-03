
import { Mongo } from 'meteor/mongo';
import moment from 'moment';

import SimpleSchema from 'simpl-schema'; 
import { Cierre } from '/imports/collections/cierre/cierre'; 

// -----------------------------------------------------------------------
// remesa - cuadre - transacción - partida
// -----------------------------------------------------------------------
const RemesaCuadreTransaccionPartida_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    numero: { type: Number, optional: false },
    tipo: { type: Number, optional: false },
    codigo: { type: String, optional: true },
    compania: { type: String, optional: false },
    descripcion: { type: String, optional: false },
    referencia: { type: String, optional: false },
    moneda: { type: String, optional: false },
    monto: { type: Number, optional: false, }
})

const RemesaCuadreTransaccion0_SimpleSchema = new SimpleSchema({
    numero: { type: Number, optional: false },
    descripcion: { type: String, optional: false }
})

// -----------------------------------------------------------------------
// remesa - cuadre - transacción
// -----------------------------------------------------------------------
const RemesaCuadreTransaccion_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    transaccion: { type: RemesaCuadreTransaccion0_SimpleSchema, optional: false },

    partidas: { type: Array, optional: false, minCount: 1 },
    'partidas.$': { type: RemesaCuadreTransaccionPartida_SimpleSchema },
})

// -----------------------------------------------------------------------
// instrumento de pago
// -----------------------------------------------------------------------
const RemesaInstrumentoPago_SimpleSchema = new SimpleSchema({
    numero: { type: String, optional: false },
    tipo: { type: String, optional: false },
    banco: { type: String, optional: false },
    cuentaBancaria: { type: String, optional: false },
    fecha: { type: Date, optional: false },
    monto: { type: Number, optional: false, }
})

// -----------------------------------------------------------------------
// remesa - asiento contagble - partida
// -----------------------------------------------------------------------
const RemesaAsientoContable_Partida_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    numero: { type: Number, optional: false, }, 
    moneda: { type: String, optional: true, },
    tipo: { type: Number, optional: true, },
    codigo: { type: String, optional: true, },
    compania: { type: String, optional: true, },
    descripcion: { type: String, optional: true, },
    referencia: { type: String, optional: true, },
    monto: { type: Number, optional: false, }, 
    docState: { type: Number, optional: true, }, 
})

const schema_protegida = new SimpleSchema({
    protegida: { type: Boolean, label: "Protegida", optional: false, },
    razon: { type: String, optional: false, },
})


// -----------------------------------------------------------------------
// remesas
// -----------------------------------------------------------------------
const Remesa_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    numero: { type: Number, optional: false },
    fecha: { type: Date, optional: false },
    compania: { type: String, optional: false },
    moneda: { type: String, optional: false },
    miSu: { type: String, optional: false },
    factorCambio: { type: Number, optional: false, },
    fechaCerrada: { type: Date, optional: true },
    observaciones: { type: String, optional: true },

    instrumentoPago: { type: RemesaInstrumentoPago_SimpleSchema, optional: false },

    cuadre: { type: Array, optional: true, minCount: 0  },
    'cuadre.$': { type: RemesaCuadreTransaccion_SimpleSchema },

    asientoContable: { type: Array, optional: true, minCount: 0, }, 
    'asientoContable.$': { type: RemesaAsientoContable_Partida_SimpleSchema }, 

    ingreso: { type: Date, optional: false },
    ultAct: { type: Date, optional: true },
    usuario: { type: String, optional: false },
    ultUsuario: { type: String, optional: true },

    cia: { type: String, optional: false },
    protegida: { type: schema_protegida, optional: true, minCount: 0 },     // para saber si la entidad está 'protegida' (ej: por un proceso de cierre)
    docState: { type: Number, optional: true }, 

    fechaCopiadaSql: { type: Date, label: 'Fecha en que el registro fue copiado a sql server', optional: true }
})

export const Remesas = new Mongo.Collection("remesas");
Remesas.attachSchema(Remesa_SimpleSchema);



// validamos que registros anteriores al cierre no sean alterados 
Remesa_SimpleSchema.addDocValidator(obj => {
    // Must return an array, potentially empty, of objects with `name` and `type` string properties and optional `value` property.

    // validamos solo cuando las ediciones son efectuadas por el usuario 
    // (ie: no las efectuadas por procesos como, por ejemplo, el proceso de cobranza, que agrega pagos a las cuotas)
    if (!obj.docState) { 
        return []; 
    }

    // leemos el último cierre efectuado para la compañía; leemos solo períodos cerrados y obtenemos el más reciente 
    const ultimoCierre = Cierre.findOne({ cia: obj.cia, cerradoFlag: true }, { sort: { hasta: -1 }}); 

    if (!ultimoCierre) { 
        return []; 
    }

    // eliminamos la parte 'time' a ambas fechas para poder comparar 
    const entidadDate = new Date(obj.fecha.toDateString());
    const cierreDate = new Date(ultimoCierre.hasta.toDateString());

    // la fecha debe ser *posterior* al período de cierre 
    if (entidadDate > cierreDate) { 
        return []; 
    }

    return [
      { name: 'fecha', type: 'REGISTROS-CERRADOS', value: moment(obj.fecha).format("DD-MMM-YYYY") }
    ];
  })

// la entidades protegidas no pueden ser editadas; por ejemplo: entidades que corresponden a período cerrado. 
Remesa_SimpleSchema.addDocValidator(obj => {
    // Must return an array, potentially empty, of objects with `name` and `type` string properties and optional `value` property.

    if (!obj.protegida || !obj.protegida.protegida) { 
        return []; 
    }

    const value = obj.protegida.razon ? obj.protegida.razon : "La entidad está protegida; ej: corresponde a un período cerrado."

    return [
      { name: 'protegida.protegida', type: 'ENTIDAD-PROTEGIDA', value: value }
    ];
  })