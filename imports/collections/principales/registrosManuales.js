
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// =======================================================================================================================
// este es el esquema para agregar un array que permite distribuir el monto original en compañías 
const distribucion_SimpleSchema = new SimpleSchema({
    _id: { type: String, min: 1, optional: false },
    compania: { type: String, label: 'Compañía', min: 1, optional: false },
    ordenPorc: { type: Number, label: 'Proporción del monto original', optional: false },
    monto: { type: Number, label: 'Parte del monto original', optional: false }
})

// =======================================================================================================================
// *solo* para validar cuando el usuario está agregando un item desde la forma al array de compañías en el registro manual 
const distribucion_formValidation_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: true },
    compania: { type: String, label: 'Compañía', min: 1, optional: false },
    ordenPorc: { type: Number, label: 'Proporción del monto original', optional: false },
    monto: { type: Number, label: 'Parte del monto original', optional: false }
})

// =======================================================================================================================
// NOTA IMPORTANTE: 
// este schema es solo para *validar* el item cuando sale de la forma (html - react-hook-form) y antes del *insert* en mongo  
// nota importante: algunos fields requeridos no tendrán un valor en este momento pues no es el usuario el que les asigna 
// un valor; por eso, aquí se muestran como opcionales, aunque no lo son; ejemplo: _id, usuario, ingreso, ...   
const RegistrosManuales_formValidation_schema = new SimpleSchema({
    _id: { type: String, label: "ID del registro", optional: true },

    compania: { type: String, label: 'Compañía', min: 1, optional: false },
    fecha: { type: Date, label: 'Fecha', optional: false },       
    origen: { type: String, label: 'Origen', min: 1, optional: false },
    codigo: { type: String, label: 'Código', optional: true },
    referencia: { type: String, label: 'Referencia', optional: true },
    numero: { type: SimpleSchema.Integer, label: 'Número', optional: false },              
    moneda: { type: String, label: 'Moneda', min: 1, optional: false },
    ramo: { type: String, label: 'Ramo', optional: true },
    asegurado: { type: String, label: 'Asegurado', optional: true },
    monto: { type: Number, label: 'Monto', optional: false },               
    descripcion: { type: String, label: 'Descripcion', min: 1, optional: false },

    ingreso: { type: Date, optional: true },                             // estos valores vienen como strings desde la forma (aunque luego serán dates)
    ultAct: { type: Date, optional: true },
    usuario: { type: String, optional: true },
    ultUsuario: { type: String, optional: true },
})

// =======================================================================================================================
// este sí es el schema definitivo de collection en mongo
const RegistrosManuales_schema = new SimpleSchema({
    _id: { type: String, label: "ID del registro", min: 1, optional: false },

    compania: { type: String, label: 'Compañía', min: 1, optional: false },
    fecha: { type: Date, label: 'Fecha', optional: false },
    origen: { type: String, label: 'Origen', min: 1, optional: false },
    codigo: { type: String, label: 'Código', optional: true },
    referencia: { type: String, label: 'Referencia', optional: true },
    numero: { type: SimpleSchema.Integer, label: 'Número', optional: true },
    moneda: { type: String, label: 'Moneda', min: 1, optional: false },
    ramo: { type: String, label: 'Ramo', optional: true },
    asegurado: { type: String, label: 'Asegurado', optional: true },
    monto: { type: Number, label: 'Monto', optional: false },
    descripcion: { type: String, label: 'Descripcion', min: 1, optional: false },

    distribucion: { type: Array, optional: true, minCount: 0 },
    'distribucion.$': { type: distribucion_SimpleSchema },

    ingreso: { type: Date, optional: false },
    ultAct: { type: Date, optional: true },
    usuario: { type: String, min: 1, optional: false },
    ultUsuario: { type: String, optional: true },

    cia: { type: String, label: 'Cia', min: 1, optional: false }
})

const RegistrosManuales = new Mongo.Collection("registrosManuales");
RegistrosManuales.attachSchema(RegistrosManuales_schema);

export { RegistrosManuales_formValidation_schema, 
         RegistrosManuales_schema, 
         RegistrosManuales, 
         distribucion_SimpleSchema, 
         distribucion_formValidation_SimpleSchema }; 