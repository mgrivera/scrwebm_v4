

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { Cierre } from 'imports/collections/cierre/cierre'; 
import * as moment from 'moment'; 

var schema_protegida = new SimpleSchema({
    protegida: { type: Boolean, label: "Protegida", optional: false, },
    razon: { type: String, optional: false, },
})


// origen_keys: la idea de esta estructura es guardar, para cada registro del cierre, los IDs de su 'origen'; por ejemplo, 
// en el caso de registros que provienen de proporcionales, el ID del contrato y de la definición de cuenta técnica. 
// Con estos dos IDs, podríamos buscar fácilemente el registro de origen (ej: saldo de cuenta técnica) y obtener 
// su monto de corretaje ...

let cierreRegistro_schema = new SimpleSchema({
    _id: { type: String, optional: false },

    fecha: { type: Date, label: "Fecha", optional: false, },
    moneda: { type: String, label: "Moneda", optional: false, },
    compania: { type: String, label: "Compania", optional: false, },
    cedente: { type: String, label: "Cedente", optional: true, },
    tipo: { type: String, label: "Tipo (Manual/Automático)", optional: false, },
    origen: { type: String, label: "Origen", optional: true, },
    referencia: { type: String, label: "Referencia", optional: true, },
    cobroPagoFlag: { type: Boolean, label: "Cobro o pago", optional: false, },
    serie: { type: Number, label: "Serie", optional: true, },
    tipoNegocio: { type: String, label: "Tipo de negocio", optional: true, },
    categoria: { type: String, label: "Categoría", optional: true, },
    descripcion: { type: String, label: "Descripcion", optional: false, },
    monto: { type: Number, label: "Monto", optional: false, },

    origen_keys: { type: Array, required: false, },
    'origen_keys.$': { type: String, },

    usuario: { type: String, label: "Usuario que efectuó el cierre", optional: false, },
    ingreso: { type: Date, label: "Ingreso", optional: false, },
    ultAct: { type: Date, label: "Ult act", optional: false, },
    cia: { type: String, label: "Cia", optional: false, },
    protegida: { type: schema_protegida, optional: true, minCount: 0 },     // para saber si la entidad está 'protegida' (ej: por un proceso de cierre)
    docState: { type: Number, optional: true, },
}) as any; 

export const CierreRegistro: any = new Mongo.Collection("cierreRegistro");
CierreRegistro.attachSchema(cierreRegistro_schema);


cierreRegistro_schema.addDocValidator(obj => {
    // Must return an array, potentially empty, of objects with `name` and `type` string properties and optional `value` property. 

    // el usuario no debe editar registros cuyo type no sea manual, pero el cierre agrega registros de tipo A a esta tabla. Lo que 
    // hacemos, para que esta validación aplique al usuario y no al cierre, es agregar docState. Este field nunca es usado por el 
    // cierre, pero siempre por el usuario ... 

    let errores = []; 

    if (obj.tipo === "A" && obj.docState) { 
        // para errores del tipo custom (validation), pasamos estos valores para solo mostrar el nombre (descripción del error) en el 
        // client. La razón es que no son, necesariamente, errores para un campo en particular, sino para todo el record 
        errores.push({ name: 'Registros del tipo <b>A (automático)</b> no pueden ser editados.', type: 'custom', value: 'A' } as never); 
    }

    return errores; 
  })


// validamos que registros anteriores al cierre no sean alterados 
cierreRegistro_schema.addDocValidator(obj => {
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
