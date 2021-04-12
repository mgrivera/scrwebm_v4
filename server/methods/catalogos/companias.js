
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash'; 

import { Companias } from '/imports/collections/catalogos/companias'; 

Meteor.methods(
{
    companiasSave: function (companias) {

        if (!lodash.isArray(companias) || companias.length == 0) {
            const message = "Aparentemente, no se han editado los registros en la página. No hay nada que actualizar."; 

            return { 
                error: true, 
                message
            }
        }

        // eliminamos del array alguna persona que el usuario haya eliminado 
        companias.forEach(c => c.personas = c.personas.filter(p => !(p.docState && p.docState === 3)));

        // eliminamos un posible docState en algún item en el array de personas 
        companias.forEach(c => c.personas.forEach(p => delete p.docState ));

        const inserts = lodash.chain(companias).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            Companias.insert(item, function (error) {
                if (error) { 
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                }
            })
        })

        const updates = lodash.chain(companias).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {
            Companias.update({ _id: item._id }, { $set: item.object }, {}, function (error) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error) {
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                }
            });
        });

        const removes = lodash.filter(companias, function (item) { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {
            Companias.remove({ _id: item._id });
        });

        const message = "Ok, los registros han sido actualizados en la base de datos de manera satisfactoria.";

        return {
            error: false,
            message
        }
    }
})