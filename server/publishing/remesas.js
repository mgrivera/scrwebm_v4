
import { Meteor } from 'meteor/meteor'; 

import lodash from 'lodash'; 
import moment from 'moment'; 
import { Remesas } from '/imports/collections/principales/remesas';  

Meteor.publish("remesas", function (filtro) {

    // TODO: nótese lo que vamos a intentar aquí: pasar el object como un string; la idea es poder pasar las propiedades de 'sub
    // collections' como 'a.b: 100', en vez de object.a.b: 100, pues no es fácil en mongo hacer un find usando propiedades ...
    filtro = JSON.parse(filtro);
    var selector = {};

    // número
    if (filtro.numero1) { 
        if (filtro.numero2) { 
            selector.numero = { $gte: filtro.numero1, $lte: filtro.numero2 };
        }
        else { 
            selector.numero = filtro.numero1;
        }
    }

    // nótese como los 'dates' vienen como strings y deben ser convertidos ...
    if (filtro.fecha1 && moment(filtro.fecha1).isValid()) { 
        if (filtro.fecha2 && moment(filtro.fecha2).isValid()) { 
            selector.fecha = { $gte: moment(filtro.fecha1).toDate(), $lte: moment(filtro.fecha2).toDate() };
        }
    else { 
        selector.fecha = moment(filtro.fecha1).toDate();
        }  
    }

    // nótese como los 'dates' vienen como strings y deben ser convertidos ...
    if (filtro.fechaCerrada1 && moment(filtro.fechaCerrada1).isValid()) { 
        if (filtro.fechaCerrada2 && moment(filtro.fechaCerrada2).isValid()) { 
            selector.fechaCerrada = { $gte: moment(filtro.fechaCerrada1).toDate(), $lte: moment(filtro.fechaCerrada2).toDate() };
        }
    else { 
        selector.fechaCerrada = moment(filtro.fechaCerrada1).toDate();
        }  
    }

    if (filtro.compania && filtro.compania.length) {
        var array = lodash.clone(filtro.compania);
        selector.compania = { $in: array };
    }

    if (filtro.moneda && filtro.moneda.length) {
        var array = lodash.clone(filtro.moneda);
        selector.moneda = { $in: array };
    }

    if (filtro.observaciones) {
        var search = new RegExp(filtro.observaciones, 'i');
        selector.observaciones = search;
    }

    if (filtro.miSu) {
        selector.miSu = filtro.miSu;
    }

    if (!filtro.instrumentoPago) { 
        filtro.instrumentoPago = {}; 
    }

    if (filtro.instrumentoPago.numero) {
        if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
        var search = new RegExp(filtro.instrumentoPago.numero, 'i');
    }

    if (filtro.instrumentoPago.fecha1 && moment(filtro.instrumentoPago.fecha1).isValid()) { 
        if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
        if (filtro.instrumentoPago.fecha2 && moment(filtro.instrumentoPago.fecha2).isValid()) { 
            selector.instrumentoPago.fecha = { $gte: moment(filtro.instrumentoPago.fecha1).toDate(), $lte: moment(filtro.instrumentoPago.fecha2).toDate() };
        }
    else { 
            selector.instrumentoPago.fecha = moment(filtro.instrumentoPago.fecha1).toDate();
        }  
    }

    if (filtro.instrumentoPago.banco && filtro.instrumentoPago.banco.length) {
        if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
        var array = lodash.clone(filtro.instrumentoPago.banco);
        selector.instrumentoPago.banco = { $in: array };
    }

    if (filtro.instrumentoPago.tipo && filtro.instrumentoPago.tipo.length) {
        if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
        var array = lodash.clone(filtro.instrumentoPago.tipo);
        selector.instrumentoPago.tipo = { $in: array };
    }

    if (filtro.instrumentoPago.monto1) { 
        if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
        if (filtro.instrumentoPago.monto2) { 
            selector.instrumentoPago.monto = { $gte: filtro.instrumentoPago.monto1, $lte: filtro.instrumentoPago.monto2 };
        }
        else { 
            // selector.instrumentoPago.monto = filtro.instrumentoPago.monto1;
            selector.instrumentoPago = { monto: filtro.instrumentoPago.monto1 }; 
        }
    }

    // cia
    if (filtro.cia) { 
        selector.cia = filtro.cia;
    }

    // _id
    if (filtro._id) { 
        selector._id = filtro._id;
    }

    // opciones 
    if (!filtro.opciones) { 
        filtro.opciones = {}; 
    }

    if (filtro.opciones.soloCerradas) { 
        selector.fechaCerrada = { $exists: true, $ne: null }; 
    }

    if (filtro.opciones.soloAbiertas) { 
        selector.$or = [{ fechaCerrada : { $exists: false }}, { fechaCerrada: { $eq: null }}]; 
    }

    if (filtro.opciones.conCuadre) { 
        selector.$and = [{ cuadre : { $exists: true }}, { cuadre: { $ne: [] }}]; 
    }

    if (filtro.opciones.conAsientoContable) { 
        selector.$and = [{ asientoContable : { $exists: true }}, { asientoContable: { $ne: [] }}]; 
    }

    if (filtro.opciones.sinCuadre) { 
        selector.$or = [{ cuadre : { $exists: false }}, { cuadre: { $eq: [] }}]; 
    }

    if (filtro.opciones.sinAsientoContable) { 
        selector.$or = [{ asientoContable : { $exists: false }}, { asientoContable: { $eq: [] }}]; 
    }

    return Remesas.find(selector);
})
                   
                             
