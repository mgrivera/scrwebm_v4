
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';

import SimpleSchema from 'simpl-schema'; 
import moment from 'moment'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Cierre } from '/imports/collections/cierre/cierre'; 

// ------------------------------------------------------------------------
// cuotas - pagos
// ------------------------------------------------------------------------
const emailsEnviados_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    tipoEmail: { type: String, optional: false },
    fecha: { type: Date, optional: false },
    user: { type: String, optional: false },
})

const cuotaPago_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    remesaID: { type: String, optional: false },
    remesaNumero: { type: Number, optional: false },
    //remesaPagoID: { type: String, optional: false },
    moneda: { type: String, optional: false },
    fecha: { type: Date, optional: false },
    monto: { type: Number, optional: false, },
    completo: { type: Boolean, optional: false }
})

const cuotaSource_SimpleSchema = new SimpleSchema({
    entityID: { type: String, optional: false },                  // ej: _id del riesgo; _id del contrato
    subEntityID: { type: String, optional: false },               // ej: _id del movimiento; _id de la capa o cuenta
    origen: { type: String, optional: false },                    // 'capa', 'cuenta', 'fac', 'sntro', 'nc', 'nd', etc.
    numero: { type: String, optional: false }                     // 37-3     (contrato 37, capa 3)
})

const schema_protegida = new SimpleSchema({
    protegida: { type: Boolean, label: "Protegida", optional: false, },
    razon: { type: String, optional: false, },
})


// -----------------------------------------------------------------------
//  cuotas
// -----------------------------------------------------------------------
const simpleSchema = new SimpleSchema({
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
    docState: { type: Number, optional: true }, 

    fechaCopiadaSql: { type: Date, label: 'Fecha en que la cuota fue copiada a sql server', optional: true }
})

export const Cuotas = new Mongo.Collection("cuotas");
Cuotas.attachSchema(simpleSchema);

if (Meteor.isServer) {
    Cuotas.rawCollection().createIndex({ 'pagos.remesaID': 1 });
}

// validamos que registros anteriores al cierre no sean alterados 
simpleSchema.addDocValidator(obj => {
    // Must return an array, potentially empty, of objects with `name` and `type` string properties and optional `value` property.

    // validamos solo cuando las ediciones son efectuadas por el usuario 
    // (ie: no las efectuadas por procesos como, por ejemplo, el proceso de cobranza, que agrega pagos a las cuotas)
    if (!obj.docState) { 
        return []; 
    }

    // leemos la compañía seleccionada por el usuario 
    const empresaUsuariaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionada = null; 

    if (empresaUsuariaSeleccionada) { 
        companiaSeleccionada = EmpresasUsuarias.findOne(empresaUsuariaSeleccionada.companiaID, { fields: { _id: 1 } });
    }

    // el último período cerrado está siempre en minimongo; hacemos un pub/sub con null 
    const ultimoCierre = Cierre.findOne({ cia: companiaSeleccionada._id, cerradoFlag: true, }, { sort: { hasta: -1, } });

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