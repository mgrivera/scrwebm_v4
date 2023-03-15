
import { Meteor } from 'meteor/meteor';
import * as yup from "yup"; 
import { Mongo } from 'meteor/mongo'; 

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';

// ========================================================================================================
// react-form-hooks regresa '' para cualquier input sin valor. Debemos convertir a Undefined para que Yup aplique
// el required
const convertFromEmptyStringToUndefined = (value, originalValue) => {
    // normalmente, Yup aplica el default *solo* cuando el valor es undefined (ie: no un empty string)
    // nótese como usamos originalValue independientemente de como Yup haya transformado el valor original 
    // por ejemplo, cuando el usuario deja un input Number vacío, Yup lo convierte a NaN; pero es más fácil 
    // revisar el valor original, que es siempre un empty string en html forms 
    if (originalValue === "") return undefined;
    return value;
}

// ========================================================================================================
// react-form-hooks regresa '' para cualquier input sin valor. Convertimos a null 
const convertFromEmptyStringToNull = (value, originalValue) => {
    // la idea de esta función es usar en valores que son realmente opcionales. Entonces es mejor un null 
    // para grabar un null al db en vez de undefined
    if (originalValue === "") return null;
    return value;
}

// ========================================================================================================
// para asignar el id de la companía seleccionada por el usuario 
const leerCompaniaSeleccionada = () => {
    const id = CompaniaSeleccionada.findOne({ userID: Meteor.userId() }, { fields: { companiaID: 1 } });
    let cia = {};

    if (id) {
        cia = EmpresasUsuarias.findOne(id.companiaID, { fields: { _id: 1 } });
    } else {
        cia = { _id: "999" };
    }

    return cia._id;
}

// ========================================================================================================
// para regresar el usuario 
const userName = () => {
    const user = Meteor.user();
    const userName = user.username ? user.username : user.emails[0].address;

    return userName;
}

const registrosManuales_yup_schema = yup.object().shape({
    _id: yup.string().trim().transform(convertFromEmptyStringToUndefined).default(() => new Mongo.ObjectID()._str).required(),

    compania: yup.string().required(),
    fecha: yup.date().transform(convertFromEmptyStringToUndefined).required(),
    origen: yup.string().required(),
    codigo: yup.string(),
    referencia: yup.string(),
    numero: yup.number().transform(convertFromEmptyStringToUndefined).integer().required(),
    moneda: yup.string().required(),
    ramo: yup.string(),
    asegurado: yup.string(),
    monto: yup.number().transform(convertFromEmptyStringToUndefined).required(),
    descripcion: yup.string().required(),

    distribucion: yup.array().of(
        yup.object().shape({
            _id: yup.string().required(),
            compania: yup.string().required(),
            ordenPorc: yup.number().required(),
            monto: yup.number().required()
        })
    ).default(() => []), 

    ingreso: yup.date().transform(convertFromEmptyStringToUndefined).default(() => new Date()).required(),
    ultAct: yup.date().transform(convertFromEmptyStringToNull).nullable(),
    usuario: yup.string().transform(convertFromEmptyStringToUndefined).default(userName).required(),
    ultUsuario: yup.string().transform(convertFromEmptyStringToNull).nullable(),

    cia: yup.string().transform(convertFromEmptyStringToUndefined).default(leerCompaniaSeleccionada).required()
}) 

// -------------------------------------------------------------------------------------------- 
// separamos el schema de 1 item en la distribución (array), para poder validar cada item en 
// forma separada (cuando se agrega/edita cada uno)
const distribucion_yup_schema = yup.object().shape({
        _id: yup.string().required(),
        compania: yup.string().required(),
        ordenPorc: yup.number().required(),
        monto: yup.number().required()
    })

export { registrosManuales_yup_schema, distribucion_yup_schema };