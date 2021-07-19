
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema'; 

const Cumulos_Registro_schema = new SimpleSchema({
    _id: { type: String, label: "ID del registro (cúmulo)", optional: false, },

    entityId: { type: String, optional: false },                                // ej: _id del riesgo; _id del contrato
    subEntityId: { type: String, optional: true },                              // ej: _id del movimiento; _id de la capa o cuenta

    // información general 
    numero: { type: SimpleSchema.Integer, label: 'Número', optional: false, },
    subNumero: { type: SimpleSchema.Integer, label: 'Sub número', optional: false, },

    moneda: { type: String, label: 'Moneda', optional: false },
    compania: { type: String, label: 'Moneda', optional: false },
    cedenteOriginal: { type: String, label: 'Moneda', optional: false },
    ramo: { type: String, label: 'Moneda', optional: false },
    origen: { type: String, label: 'Moneda', optional: false },

    // nuestra referencia 
    codigo: { type: String, label: 'Código', optional: false, },
    referencia: { type: String, label: 'Referencia', optional: false, },
    asegurado: { type: String, label: 'Asegurado', optional: true },

    // fechas 
    desde: { type: Date, label: 'Desde', optional: false, },
    hasta: { type: Date, label: 'Hasta', optional: false, },
    cumulosAl: { type: Date, label: 'Cumulos al', optional: false },
    
    // tipo de cúmulo y zona  
    tipoCumulo: { type: String, label: 'Tipo de cúmulo', optional: false, },        // terremoto, motín, ... 
    zona: { type: String, label: 'Zona', optional: false, },

    // cifras a 100%
    valorARiesgo: { type: Number, label: 'Valor a riesgo', optional: false, },
    sumaAsegurada: { type: Number, label: 'Suma asegurada', optional: false, },
    primaSeguro: { type: Number, label: 'Prima del seguro', optional: false, },
    limiteCesion: { type: Number, label: 'Límite de cesión', optional: false, },

    // cesión al CP 
    monto_cp: { type: Number, label: 'Monto al CP', optional: false, },
    prima_cp: { type: Number, label: 'Prima al CP', optional: false, },
    nuestraOrdenPorc_cp: { type: Number, label: 'Nuestra orden (%) CP', optional: false, },
    nuestraOrdenMonto_cp: { type: Number, label: 'Nuestra parte CP', optional: false, },
    nuestraOrdenPrima_cp: { type: Number, label: 'Nuestra prima CP', optional: false, },

    // cesión al excedente  
    monto_ex: { type: Number, label: 'Monto al Exc', optional: false, },
    prima_ex: { type: Number, label: 'Prima al Exc', optional: false, },
    nuestraOrdenPorc_ex: { type: Number, label: 'Nuestra orden (%) Exc', optional: false, },
    nuestraOrdenMonto_ex: { type: Number, label: 'Nuestra parte Exc', optional: false, },
    nuestraOrdenPrima_ex: { type: Number, label: 'Nuestra prima Exc', optional: false, },

    // cesión al no prop  
    monto_noProp: { type: Number, label: 'Monto al NoProp', optional: false, },
    prima_noProp: { type: Number, label: 'Prima al NoProp', optional: false, },
    nuestraOrdenPorc_noProp: { type: Number, label: 'Nuestra orden (%) NoProp', optional: false, },
    nuestraOrdenMonto_noProp: { type: Number, label: 'Nuestra parte NoProp', optional: false, },
    nuestraOrdenPrima_noProp: { type: Number, label: 'Nuestra prima NoProp', optional: false, },

    // cesión al fac  
    monto_fac: { type: Number, label: 'Monto al fac', optional: false, },
    prima_fac: { type: Number, label: 'Prima al fac', optional: false, },
    nuestraOrdenPorc_fac: { type: Number, label: 'Nuestra orden (%) fac', optional: false, },
    nuestraOrdenMonto_fac: { type: Number, label: 'Nuestra parte fac', optional: false, },
    nuestraOrdenPrima_fac: { type: Number, label: 'Nuestra prima fac', optional: false, },

    // cesión al retrocesionario 
    monto_ret: { type: Number, label: 'Monto retro', optional: false, },
    prima_ret: { type: Number, label: 'Prima retro', optional: false, },
    
    // nuestro cúmulo 
    cumulo: { type: Number, label: 'cúmulo', optional: false, },
    primaCumulo: { type: Number, label: 'Prima del cúmulo', optional: false, },

    ingreso: { type: Date, optional: false, },
    ultAct: { type: Date, optional: true, },
    usuario: { type: String, optional: false, },
    ultUsuario: { type: String, optional: true, },

    cia: { type: String, label: 'Cia', optional: false, },
})

const Cumulos_Registro = new Mongo.Collection("cumulos_registro");
Cumulos_Registro.attachSchema(Cumulos_Registro_schema);

export { Cumulos_Registro }; 