

import { CierreRegistro } from '/imports/collections/cierre/registroCierre';
import lodash from 'lodash'; 

Meteor.methods(
{
    'cierreRegistro.save': function (registro) {

        if (!lodash.isArray(registro) || registro.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(registro).
                      filter((item) => { return item.docState && item.docState == 1; }).
                      map((item) => { delete item.docState; return item; }).
                      value();


        inserts.forEach((item) => {
            CierreRegistro.insert(item, (error, result) => {
                if (error) { 
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                }
            })
        })


        var updates = lodash.chain(registro).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach((item) => {
            CierreRegistro.update({ _id: item._id }, { $set: item.object }, {}, (error, result) => {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error) { 
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                }
            })
        })

        var removes = lodash.filter(registro, function (item) { return item.docState && item.docState == 3; });

        removes.forEach((item) => {
            CierreRegistro.remove({ _id: item._id });
        })

        return { 
            error: false, 
            message: "Ok, los datos han sido actualizados en la base de datos." 
        }
    }
})