
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash'; 

import { Indoles } from '/imports/collections/catalogos/indoles'; 

Meteor.methods(
{
    indolesSave: function (indoles) {

        if (!lodash.isArray(indoles) || indoles.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(indoles).
                      filter(item => { return item.docState && item.docState == 1; }).
                      map(item => { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            Indoles.insert(item, (error) => {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });


        var updates = lodash.chain(indoles).
                        filter(item =>  { return item.docState && item.docState == 2; }).
                        map(item =>  { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(item =>  { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(item =>  { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {
            Indoles.update({ _id: item._id }, { $set: item.object }, {}, function (error) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        var removes = lodash.filter(indoles, item => { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {
            Indoles.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})