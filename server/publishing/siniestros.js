
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash';
import moment from 'moment';

import { Siniestros } from '/imports/collections/principales/siniestros'; 

Meteor.publish("siniestros", function (filtro) {

    filtro = JSON.parse(filtro);
    var selector = {};

    if (filtro.numero1)
        if (filtro.numero2)
            selector.numero = { $gte: filtro.numero1, $lte: filtro.numero2 };
        else
            selector.numero = filtro.numero1;

        if (filtro.codigo) {
            const search = new RegExp(filtro.codigo, 'i');
            selector.codigo = search;
        }

        if (filtro.referencia) {
            const search = new RegExp(filtro.referencia, 'i');
            selector.referencia = search;
        }

    // nótese como los 'dates' vienen como strings y deben ser convertidos ...
    if (filtro.fechaEmision1 && moment(filtro.fechaEmision1).isValid())
        if (filtro.fechaEmision2 && moment(filtro.fechaEmision2).isValid())
            selector.fechaEmision = { $gte: moment(filtro.fechaEmision1).toDate(), $lte: moment(filtro.fechaEmision2).toDate() };
        else
            selector.fechaEmision = moment(filtro.fechaEmision1).toDate();

    if (filtro.fechaOcurrencia1 && moment(filtro.fechaOcurrencia1).isValid())
        if (filtro.fechaOcurrencia2 && moment(filtro.fechaOcurrencia2).isValid())
            selector.fechaOcurrencia = { $gte: moment(filtro.fechaOcurrencia1).toDate(), $lte: moment(filtro.fechaOcurrencia2).toDate() };
        else
            selector.fechaOcurrencia = moment(filtro.fechaOcurrencia1).toDate();


    if (filtro.fechaNotificacion1 && moment(filtro.fechaNotificacion1).isValid())
        if (filtro.fechaNotificacion2 && moment(filtro.fechaNotificacion2).isValid())
            selector.fechaNotificacion = { $gte: moment(filtro.fechaNotificacion1).toDate(), $lte: moment(filtro.fechaNotificacion2).toDate() };
        else
            selector.fechaNotificacion = moment(filtro.fechaNotificacion1).toDate();


    if (filtro.compania && filtro.compania.length) {
        const array = lodash.clone(filtro.compania);
        selector.compania = { $in: array };
    }

    if (filtro.ajustador && filtro.ajustador.length) {
        const array = lodash.clone(filtro.ajustador);
        selector.ajustador = { $in: array };
    }

    if (filtro.moneda && filtro.moneda.length) {
        const array = lodash.clone(filtro.moneda);
        selector.moneda = { $in: array };
    }

    if (filtro.causa && filtro.causa.length) {
        const array = lodash.clone(filtro.causa);
        selector.causa = { $in: array };
    }

    if (filtro.ramo && filtro.ramo.length) {
        const array = lodash.clone(filtro.ramo);
        selector.ramo = { $in: array };
    }

    if (filtro.asegurado && filtro.asegurado.length) {
        const array = lodash.clone(filtro.asegurado);
        selector.asegurado = { $in: array };
    }

    if (filtro.suscriptor && filtro.suscriptor.length) {
        const array = lodash.clone(filtro.suscriptor);
        selector.suscriptor = { $in: array };
    }

    if (filtro.tipo && filtro.tipo.length) {
        const array = lodash.clone(filtro.tipo);
        selector.tipo = { $in: array };
    }

    if (filtro.cia)
        selector.cia = filtro.cia;

    return Siniestros.find(selector);
})