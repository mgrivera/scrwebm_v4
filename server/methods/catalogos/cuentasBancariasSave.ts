﻿
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash'; 

import { CuentasBancarias } from 'imports/collections/catalogos/cuentasBancarias'; 

Meteor.methods(
{
    cuentasBancariasSave: function (items) {

        if (!lodash.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            CuentasBancarias.insert(item, function (error) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        })

        var updates = lodash.chain(items).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {
            CuentasBancarias.update({ _id: item._id }, { $set: item.object }, {}, function (error) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        })

        var removes = lodash.filter(items, function (item) { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {
            CuentasBancarias.remove({ _id: item._id });
        })

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})