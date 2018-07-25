

import * as moment from 'moment';
import * as lodash from 'lodash'; 

import { Riesgos, Riesgos_InfoRamo } from 'imports/collections/principales/riesgos';  
import { Cuotas } from 'imports/collections/principales/cuotas'; 

import { calcularNumeroReferencia } from '../../imports/general/calcularNumeroReferencia'; 

Meteor.methods(
{
    // con el riesgo, grabamos también la información del ramo, si existe ... 
    'riesgos.save': function (item, editedInfoRamo) {

        if (item.docState && item.docState == 1) {

            delete item.docState;

            // si el número viene en '0', asignamos un número consecutivo al riesgo
            if (!item.numero) {
                var numeroAnterior = Riesgos.findOne({ cia: item.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior || !numeroAnterior.numero)
                    item.numero = 1;
                else
                    item.numero = numeroAnterior.numero + 1;
            }

            // si la referencia viene en '0', asignamos una ...
            if (!item.referencia || item.referencia === '0') {
                let ano = parseInt(moment(item.desde).format('YYYY'));
                let result = calcularNumeroReferencia('fac', item.tipo, ano, item.cia);

                if (result.error) {
                    throw new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                }
                item.referencia = result.referencia;
            }

            Riesgos.insert(item);
        }


        if (item.docState && item.docState == 2) {

            var item2 = lodash.clone(item);

            delete item2.docState;
            delete item2._id;

            item2.ultAct = new Date();
            item2.ultUsuario = this.userId;

            // si el número viene en '0', asignamos un número consecutivo al riesgo
            if (!item2.numero) {
                var numeroAnterior = Riesgos.findOne({ cia: item.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior.numero)
                    item2.numero = 1;
                else
                    item2.numero = numeroAnterior.numero + 1;
            }

            // si la referencia viene en '0', asignamos una ...
            if (!item2.referencia || item2.referencia === '0') {
                let ano = parseInt(moment(item2.desde).format('YYYY'));
                let result = calcularNumeroReferencia('fac', item2.tipo, ano, item2.cia);

                if (result.error) {
                    throw new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                }
                item2.referencia = result.referencia;
            }

            Riesgos.update({ _id: item._id }, { $set: item2 });
        };


        if (item.docState && item.docState == 3) {
            // hooks: si el riesgo tiene cuotas cobradas/pagadas, no podrá ser eliminado ... 
            Riesgos.remove({ _id: item._id });
            // ahora eliminamos las cuotas asociadas al riesgo 
            Cuotas.remove({ 'source.entityID': item._id });
        }

        saveInfoRamo(editedInfoRamo); 

        return { 
            error: false, 
            message: 'Ok, los datos han sido actualizados en la base de datos.', 
        }
    }
})

function saveInfoRamo(editedInfoRamo) { 

    let inserts = lodash.chain(editedInfoRamo).
                  filter(function (item) { return item.docState && item.docState == 1; }).
                  map(function (item) { delete item.docState; return item; }).
                  value();

    inserts.forEach(function (item) {
        Riesgos_InfoRamo.insert(item, function (error, result) {
            if (error)
                if (error.invalidKeys) 
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                else 
                    throw new Meteor.Error("meteorError", error);
            });
    });

    let updates = lodash.chain(editedInfoRamo).
                    filter(function (item) { return item.docState && item.docState == 2; }).
                    map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto 
                    map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto 
                    map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos) 
                    value();

    updates.forEach(function (item) {
        Riesgos_InfoRamo.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
            //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
            if (error)
                if (error.invalidKeys)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                else
                    throw new Meteor.Error("meteorError", error);
        });
    });

    let removes = lodash.filter(editedInfoRamo, function (item) { return item.docState && item.docState == 3; });

    removes.forEach(function (item) {
        Riesgos_InfoRamo.remove({ _id: item._id });
    });
}