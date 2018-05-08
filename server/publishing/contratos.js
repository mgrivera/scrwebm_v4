

import { Contratos } from '/imports/collections/principales/contratos'; 

Meteor.publish("contratos", function (filtro) {

    var filtro = JSON.parse(filtro);
    var selector = {};

    // nótese como los 'dates' vienen como strings y deben ser convertidos ...
    if (filtro.desde)
        if (selector.desde.$gte && moment(filtro.desde.$gte).isValid() && moment(filtro.desde.$gte).isValid()) {
            selector.desde.$gte = moment(filtro.desde.$gte).toDate();
            selector.desde.$lte = moment(filtro.desde.$lte).toDate();
        }
        else
            if (moment(filtro.desde).isValid())
                selector.desde = moment(filtro.desde).toDate();


    if (filtro.hasta)
        if (selector.hasta.$gte && moment(filtro.hasta.$gte).isValid() && moment(selector.hasta.$gte).isValid()) {
            selector.hasta.$gte = moment(filtro.hasta.$gte).toDate();
            selector.hasta.$lte = moment(filtro.hasta.$lte).toDate();
        }
        else
            if (moment(filtro.hasta).isValid())
                selector.hasta = moment(filtro.hasta).toDate();

    if (filtro.compania) {
        var array = _.clone(filtro.compania);
        selector.compania = { $in: array };
    };

    if (filtro.tipo) {
        var array = _.clone(filtro.tipo);
        selector.tipo = { $in: array };
    };

    if (filtro.codigo) {
        var search = new RegExp(filtro.codigo, 'i');
        selector.codigo = search;
    }

    if (filtro.descripcion) {
        var search = new RegExp(filtro.descripcion, 'i');
        selector.descripcion = search;
    }

    if (filtro._id) {
        selector._id = filtro._id;
    }

    return Contratos.find(selector);
});
