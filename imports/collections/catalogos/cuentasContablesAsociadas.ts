


import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export const CuentasContablesAsociadas: any = new Mongo.Collection("cuentasContablesAsociadas");

var schema = new SimpleSchema({
    _id: { type: String, optional: false },

    tipo: { type: Number, label: "Tipo de cuenta (primas por pagar, primas por cobrar, corretaje, ...)", optional: false, custom: validarTipo, },
    moneda: { type: String, label: "Moneda", min: 1, max: 40, optional: true, },
    compania: { type: String, label: "Compañía", min: 1, max: 40, optional: true, },
    origen: { type: String, label: "Origen (fac, cont, sin, ...)", min: 1, max: 40, optional: true, },

    cuentaContable: { type: String, label: "Cuenta contable", min: 1, max: 25, optional: false, },
    cia: { type: String, label: "Cia", optional: false, },
    docState: { type: Number, optional: true, },
});

CuentasContablesAsociadas.attachSchema(schema);

function validarTipo() { 
    // el origen es requerido; la exepción es para registros del tipo 10 o 100, Transitoria o Diferencia en remesa. 
    if (!this.value) { 
        return undefined; 
    }

    let origen = this.field("origen"); 

    if ((this.value === 10 || this.value === 100) && origen.isSet) { 
        return "Cuentas contables del tipo 'transitoria' o 'diferencia', deben tener el campo <em>Origen</em> en blanco (vacío)."; 
    }

    return undefined; 
}