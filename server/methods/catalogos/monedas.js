
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 

import { registroEliminacionCatalogos } from '/server/generalFunctions/registroEliminacionCatalogos'; 

Meteor.methods(
{
    monedasSave: function (monedas) {

        if (!lodash.isArray(monedas) || monedas.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        const inserts = lodash.chain(monedas).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();

        inserts.forEach(function (item) {
            item.ultAct = new Date(); 
            Monedas.insert(item, function (error) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        const updates = lodash.chain(monedas).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto 
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto 
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos) 
                        value();

        updates.forEach(function (item) {
            item.object.ultAct = new Date(); 
            item.object.fechaCopiadaSql = null; 
            Monedas.update({ _id: item._id }, { $set: item.object }, {}, function (error) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        const removes = lodash.filter(monedas, function (item) { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {
            const _id = item._id; 
            Monedas.remove({ _id });

            // ahora agregamos el item que justo se ha eliminado a la tabla: catalogos_deletedItems
            // la idea es luego actualizar la tabla que corresponde en la db de consultas (sql server) 
            registroEliminacionCatalogos("monedas", _id)
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})