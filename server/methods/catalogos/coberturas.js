
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash'; 

import { Coberturas } from '/imports/collections/catalogos/coberturas'; 

Meteor.methods(
{
    coberturasSave: function (coberturas) {

        if (!lodash.isArray(coberturas) || coberturas.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        const inserts = lodash.chain(coberturas).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            Coberturas.insert(item, function (error) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        const updates = lodash.chain(coberturas).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto 
                        map(function (item) { return { _id: item._id, object: item }; }).           // sepacoberturas el _id del objeto 
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo sepacoberturas) 
                        value();

        updates.forEach(function (item) {
            Coberturas.update({ _id: item._id }, { $set: item.object }, {}, function (error) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        const removes = lodash.filter(coberturas, function (item) { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {
            Coberturas.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})