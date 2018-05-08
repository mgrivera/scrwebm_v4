


import lodash from 'lodash'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 

Meteor.methods(
{
    cuotasSave: function (cuotas) {

        if (!lodash.isArray(cuotas) || cuotas.length == 0) {
            // permitimos grabar alguna entidad (riesgos, contratos, etc., sin cuotas ... 
            //throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(cuotas).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            Cuotas.insert(item, function (error, result) {
                if (error)
                    if (error.invalidKeys) 
                        throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                    else 
                        throw new Meteor.Error("meteorError", error);
                });
        });


        var updates = lodash.chain(cuotas).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto 
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto 
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos) 
                        value();

        updates.forEach(function (item) {
            Cuotas.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    if (error.invalidKeys)
                        throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                    else
                        throw new Meteor.Error("meteorError", error);
            });
        });

        var removes = lodash.filter(cuotas, function (item) { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {
            Cuotas.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});