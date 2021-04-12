
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import lodash from 'lodash'; 

const EmailsCobranzaCuotasPendientes = new Mongo.Collection("emailsCobranzaCuotasPendientes");

// -----------------------------------------------------------------------
// Documenos (riesgo y movimientos sub-document)
// -----------------------------------------------------------------------
var reglas_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    numero: { type: Number, label: 'Regla número?', optional: false, },
    fechaCuotaDesde: { type: Number, label: 'Fecha de la cuota - Inicial', optional: true, },
    fechaCuotaHasta: { type: Number, label: 'Fecha de la cuota - Final', optional: true, },
    fechaVencimientoDesde: { type: Number, label: 'Fecha de vencimiento - Inicial', optional: true, },
    fechaVencimientoHasta: { type: Number, label: 'Fecha de vencimiento - Final', optional: true, },
    tipoEmail: { type: String, optional: false, min: 1 },
    emailsEnviarHasta: { type: Number, optional: true, },
    suspendido: { type: Boolean, label: "Suspendido?", optional: true },
    docState: { type: Number, optional: true },
})

var atencion_SimpleSchema = new SimpleSchema({
    nombre1: { type: Boolean, label: "Atención #1", optional: true },
    nombre2: { type: Boolean, label: "Atención #2", optional: true },
    nombre3: { type: Boolean, label: "Atención #3", optional: true },
    nombre4: { type: Boolean, label: "Atención #4", optional: true },
    nombre5: { type: Boolean, label: "Atención #5", optional: true },
})

var usuarios_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    userID: { type: String, label: "ID del usuario", optional: false },
    tipo: { type: String, label: "From, cc, bcc", optional: false },
    docState: { type: Number, optional: true },
})

var firmantes_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    userID: { type: String, label: "ID del usuario", optional: false },
    numero: { type: Number, label: "Firmante 1 o 2", optional: false },
    docState: { type: Number, optional: true },

})

var cuentasBancarias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    cuentaBancariaID: { type: String, label: "ID de la cuenta bancaria", optional: false },
    docState: { type: Number, optional: true },
})

const atencionValidator = function() {
    if (this.value && this.value.nombre1) {
        return false;
    }
    if (this.value && this.value.nombre2) {
        return false;
    }
    if (this.value && this.value.nombre3) {
        return false;
    }
    if (this.value && this.value.nombre4) {
        return false;
    }
    if (this.value && this.value.nombre5) {
        return false;
    }
    return "Ud. debe seleccionar al menos una persona.";
}

const usuariosValidator = function() {
    if (!Array.isArray(this.value)) {
        return false;
    }

    const count = lodash.filter(this.value, (x) => { return x.tipo === 'From'; });

    if (count.length != 1)
        return "Uno, y solo uno, de los usuarios, debe ser del tipo 'From'.";

    return null;
}

var schema = new SimpleSchema({
    _id: { type: String, optional: false },

    fecha: { type: String, label: 'Fecha para los e-mails', optional: false, min: 1, },
    emailSubject: { type: String, label: 'Asunto del e-mail', optional: false, min: 1, },
    procesoPrueba_noEnviarEmailsACompanias: { type: Boolean, label: "No enviar e-mails a compañías", optional: true, },
    noRegistrarEnvioEnCuotas: { type: Boolean, label: "No registrar envío de e-mails en cuotas de prima", optional: true, },

    atencion: {
        type: atencion_SimpleSchema, optional: false,
        label: 'Atención',
        custom: atencionValidator,
    },
    usuarios: { type: Array, minCount: 1, maxCount: 99, custom: usuariosValidator, },
    'usuarios.$': { type: usuarios_SimpleSchema, },

    firmantes: { type: Array, minCount: 1, maxCount: 2, },
    'firmantes.$': { type: firmantes_SimpleSchema, },

    cuentasBancarias: { type: Array, minCount: 1, maxCount: 2, },
    'cuentasBancarias.$': { type: cuentasBancarias_SimpleSchema, },

    reglas: { type: Array, minCount: 1, maxCount: 999, },
    'reglas.$': { type: reglas_SimpleSchema, },

    cia: { type: String, optional: false, min: 1, },
    docState: { type: Number, optional: true, },
})

EmailsCobranzaCuotasPendientes.attachSchema(schema);

export { EmailsCobranzaCuotasPendientes }; 