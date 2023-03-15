
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 

import { check } from 'meteor/check'
import moment from 'moment';

import { RegistrosManuales } from '/imports/collections/principales/registrosManuales';

import { Monedas } from '/imports/collections/catalogos/monedas';
import { Companias } from '/imports/collections/catalogos/companias';
import { Asegurados } from '/imports/collections/catalogos/asegurados';
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 

Meteor.methods(
    {
        // ----------------------------------------------------------------------------------------------------------
        // para leer la 1ra página desde el db - el usuario apliaca un filtro - leemos la 1ra página y la regesamos 
        // luego, el usuario puede leer otras páginas, o leer el resto (todo) de los items que aplican el filtro 
        // ----------------------------------------------------------------------------------------------------------  
        'emision.registrosManuales.leerItemsFromDB.1estPage': async function (filtro, pageSize, companiaSeleccionadaID) {

            check(filtro, {
                fecha1: String,
                fecha2: String,
                cia: String
            });

            const filtro2 = prepararFiltro(filtro, companiaSeleccionadaID);

            // primero debemos leer el recCount, pues debe ser mostrado al usuario 
            const recordCount = RegistrosManuales.find(filtro2).count();

            const skip = 0;
            const limit = pageSize;

            const records = RegistrosManuales.find(filtro2, { skip, limit }).fetch();

            // normalmente, los items son cambiados en alguna forma antes de enviarlos al client 
            const items = processReadItems(records); 

            const message = `Ok, los items han sido leídos desde el db en forma satisfactoria.
                            `
            return {
                error: false,
                message,
                recordCount,
                items
            }
        }, 

        // ----------------------------------------------------------------------------------------------------------
        // para leer una nueva página, luego que se ha leído la 1ra 
        // ----------------------------------------------------------------------------------------------------------  
        'emision.registrosManuales.leerItemsFromDB.nextPage': async function (filtro, page, leerResto, pageSize, recordCount, companiaSeleccionadaID) {

            check(filtro, {
                fecha1: String,
                fecha2: String,
                cia: String
            });

            const filtro2 = prepararFiltro(filtro, companiaSeleccionadaID);

            const skip = (page - 1) * pageSize;

            let limit;
            if (!leerResto) {
                limit = pageSize;
            } else {
                // el usuario quiere leer el resto; es decir, desde el skip + 1 hasta el recordCount ... 
                limit = recordCount - skip;
            }

            const records = RegistrosManuales.find(filtro2, { skip, limit }).fetch();

            // normalmente, los items son cambiados en alguna forma antes de enviarlos al client 
            const items = processReadItems(records);

            const message = `Ok, los items han sido leídos desde el db en forma satisfactoria.
                            `
            return {
                error: false,
                message,
                items
            }
        }, 

        // ----------------------------------------------------------------------------------------------------------
        // leemos, *nuevamente*, la cantidad de registros que *ya* habíamos leído antes 
        // ----------------------------------------------------------------------------------------------------------  
        'emision.registrosManuales.leerItemsFromDB.refresh': async function (filtro, limit, companiaSeleccionadaID) {

            check(filtro, {
                fecha1: String,
                fecha2: String,
                cia: String
            });

            const filtro2 = prepararFiltro(filtro, companiaSeleccionadaID);

            // refresh: siempre leemos desde el principio 
            const skip = 0;
            const records = RegistrosManuales.find(filtro2, { skip, limit }).fetch();

            // normalmente, los items son cambiados en alguna forma antes de enviarlos al client 
            const items = processReadItems(records);

            const message = `Ok, los items han sido leídos desde el db en forma satisfactoria.
                            `
            return {
                error: false,
                message,
                items
            }
        }, 
        // ----------------------------------------------------------------------------------------------------------
        // leemos, *nuevamente*, la cantidad de registros que *ya* habíamos leído antes 
        // ----------------------------------------------------------------------------------------------------------  
        'emision.registrosManuales.leerItemFromDB': async function (_id) {

            check(_id, String);
            const item = RegistrosManuales.findOne(_id); 

            // el item debe existir! 
            if (!item) { 
                const message = `Error inesperado: no pudimos leer el registro desde la base de datos.
                            `
                return {
                    error: true,
                    message
                }
            } else { 
                // intentamos leer las cuotas que pueda tener el registro manual (puede o no tenerlas)
                const cuotas = Cuotas.find({ 'source.entityID': _id }).fetch(); 

                const message = `Ok, el registro ha sido leído en forma exitosa.
                            `
                return {
                    error: false,
                    message, 
                    item, 
                    cuotas
                }
            }
        }
    }) 

// ----------------------------------------------------------------------------------------------------------
// recibe los items leidos desde el db y los prepara para regresarlos al client 
// ---------------------------------------------------------------------------------------------------------- 
const processReadItems = (records) => {
    const monedas = Monedas.find({}, { fields: { simbolo: 1 } }).fetch();
    const companias = Companias.find({}, { fields: { abreviatura: 1 } }).fetch();
    const ramos = Ramos.find({}, { fields: { abreviatura: 1 } }).fetch();
    const asegurados = Asegurados.find({}, { fields: { abreviatura: 1 } }).fetch();

    const origenes = [
        { value: "fac", description: "Riesgo facultativo" },
        { value: "sinFac", description: "Siniestros (fac)" },
        { value: "prop", description: "Proporcionales" },
        { value: "noProp", description: "No proporcionales" },
        { value: "otro", description: "Otro" }
    ]

    const items = [];

    for (const r of records) {

        const moneda0 = monedas.find(x => x._id === r.moneda);
        const asegurado0 = asegurados.find(x => x._id === r.asegurado);
        const ramo0 = ramos.find(x => x._id === r.ramo);
        const compania0 = companias.find(x => x._id === r.compania);

        const moneda = moneda0?.simbolo ? moneda0.simbolo : null;
        const asegurado = asegurado0?.abreviatura ? asegurado0.abreviatura : null;
        const ramo = ramo0?.abreviatura ? ramo0.abreviatura : null;
        const compania = compania0?.abreviatura ? compania0.abreviatura : null;

        const origen = origenes.find(x => x.value === r.origen);

        const item = {
            _id: new Mongo.ObjectID()._str,
            itemId: r._id,

            fecha: r.fecha,
            compania,
            moneda,

            origen: origen?.description ? origen.description : "Indefinido",
            codigo: r.codigo,
            referencia: r.referencia,
            numero: r.numero,

            ramo,
            asegurado,

            monto: r.monto,

            usuario: r.usuario,
            ingreso: r.ingreso,
            ultUsuario: r.ultUsuario,
            ultAct: r.ultAct
        }

        items.push(item);
    }

    return items;
}
 
// ----------------------------------------------------------------------------------------------------------
// debemos construir un filtro para leer desde mongo; lo que se recibe en el server es solo el criterio que 
// el usuario escribe en la forma 
// ---------------------------------------------------------------------------------------------------------- 
function prepararFiltro(f, ciaSeleccionadaID) {

    const fecha1 = f.fecha1 && moment(f.fecha1).isValid() ? moment(f.fecha1).toDate() : null;
    const fecha2 = f.fecha2 && moment(f.fecha2).isValid() ? moment(f.fecha2).toDate() : null;

    const filtro = {};

    if (fecha1) {
        if (fecha2) {
            filtro.fecha = { $gte: fecha1, $lte: fecha2 }
        } else {
            filtro.fecha = { $gte: fecha1 }
        }
    } else {
        if (fecha2) {
            filtro.fecha = { $lte: fecha2 }
        }
    }

    filtro.cia = { $eq: ciaSeleccionadaID }

    return filtro;
}