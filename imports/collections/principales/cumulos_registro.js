
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema'; 

const Cumulos_Registro_schema = new SimpleSchema({
    _id: { type: String, label: "ID del registro (cúmulo)", optional: false, },

    entityId: { type: String, optional: false },                                // ej: _id del riesgo; _id del contrato
    subEntityId: { type: String, optional: true },                              // ej: _id del movimiento; _id de la capa o cuenta
    origen: { type: String, label: "Origen", optional: false },                 // 'capa', 'cuenta', 'fac', 'sntro', 'nc', 'nd', etc.

    tipoCumulo: { type: String, label: 'Tipo de cúmulo', optional: false, },        // terremoto, motín, ... 
    zona: { type: String, label: 'Zona', optional: false, },
    
    valorARiesgo: { type: Number, label: 'Valor a riesgo', optional: false, },
    sumaAsegurada: { type: Number, label: 'Suma asegurada', optional: false, },
    montoAceptado: { type: Number, label: 'Monto aceptado', optional: false, },
    cesionCuotaParte: { type: Number, label: 'Cesión cuota parte', optional: false, },
    cesionExcedente: { type: Number, label: 'Cesión excedente', optional: false, },
    cesionFacultativo: { type: Number, label: 'Cesión facultativo', optional: false, },
    cumulo: { type: Number, label: 'cumulo', optional: false, },
    
    ingreso: { type: Date, optional: false, },
    ultAct: { type: Date, optional: true, },
    usuario: { type: String, optional: false, },
    ultUsuario: { type: String, optional: true, },

    cia: { type: String, label: 'Cia', optional: false, },
})

const Cumulos_Registro = new Mongo.Collection("cumulos_registro");
Cumulos_Registro.attachSchema(Cumulos_Registro_schema);

export { Cumulos_Registro }; 