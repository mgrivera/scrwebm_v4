
import { Meteor } from 'meteor/meteor';
import moment from 'moment'; 

import { Riesgos } from '/imports/collections/principales/riesgos'; 

Meteor.publish("riesgos", function (filtro) {

    filtro = JSON.parse(filtro);
    var selector = {};

    if (filtro._id)
        selector._id = filtro._id;

    if (filtro.numero1)
        if (filtro.numero2)
            selector.numero = { $gte: filtro.numero1, $lte: filtro.numero2 };
        else
            selector.numero = filtro.numero1;

    if (filtro.codigo) {
        var search = new RegExp(filtro.codigo, 'i');
        selector.codigo = search;
    }

    // nótese como los 'dates' vienen como strings y deben ser convertidos ...
    if (filtro.desde1 && moment(filtro.desde1).isValid())
        if (filtro.desde2 && moment(filtro.desde2).isValid())
            selector.desde = { $gte: moment(filtro.desde1).toDate(), $lte: moment(filtro.desde2).toDate() };
        else
            selector.desde = moment(filtro.desde1).toDate();

    if (filtro.hasta1 && moment(filtro.hasta1).isValid())
        if (filtro.hasta2 && moment(filtro.hasta2).isValid())
            selector.hasta = { $gte: moment(filtro.hasta1).toDate(), $lte: moment(filtro.hasta2).toDate() };
        else
            selector.hasta = moment(filtro.hasta1).toDate();



    if (filtro.compania && filtro.compania.length) {
        var array = lodash.clone(filtro.compania);
        selector.compania = { $in: array };
    }

    if (filtro.estado && filtro.estado.length) {
        const array = lodash.clone(filtro.estado);
        selector.estado = { $in: array };
    }

    if (filtro.moneda && filtro.moneda.length) {
        const array = lodash.clone(filtro.moneda);
        selector.moneda = { $in: array };
    }

    if (filtro.indole && filtro.indole.length) {
        const array = lodash.clone(filtro.indole);
        selector.indole = { $in: array };
    }

    if (filtro.ramo && filtro.ramo.length) {
        const array = lodash.clone(filtro.ramo);
        selector.ramo = { $in: array };
    }

    if (filtro.asegurado && filtro.asegurado.length) {
        const array = lodash.clone(filtro.asegurado);
        selector.asegurado = { $in: array };
    }

    if (filtro.corredor && filtro.corredor.length) {
        const array = lodash.clone(filtro.corredor);
        selector.corredor = { $in: array };
    }

    if (filtro.suscriptor && filtro.suscriptor.length) {
        const array = lodash.clone(filtro.suscriptor);
        selector.suscriptor = { $in: array };
    }

    if (filtro.comentarios) {
        const search = new RegExp(filtro.comentarios, 'i');
        selector.comentarios = search;
    }

    if (filtro.cia)
        selector.cia = filtro.cia;

    // ----------------------------------------------------------------------------------
    // agregamos la posibilidad de buscar desde la forma que permite agregar un nuevo
    // siniestro.
    // -----------------------------------------------------------------------------------

    if (filtro.siniestrosNuevo) {
        // debugger;
        // cuando se intenta registrar un siniestro, debemos buscar los riesgos por:
        // compañía, moneda, fecha de ocurrencia y cia
        if (filtro.siniestrosNuevo.compania)
            selector.compania = filtro.siniestrosNuevo.compania;

        if (filtro.siniestrosNuevo.asegurado)
            selector.asegurado = filtro.siniestrosNuevo.asegurado;

        if (filtro.siniestrosNuevo.suscriptor)
            selector.suscriptor = filtro.siniestrosNuevo.suscriptor;

        if (filtro.siniestrosNuevo.cia)
            selector.cia = filtro.siniestrosNuevo.cia;
    }

    return Riesgos.find(selector);
});
