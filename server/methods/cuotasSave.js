
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

import lodash from 'lodash'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Catalogos_deletedItems } from '/imports/collections/general/catalogos_deletedItems'; 

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
            Cuotas.insert(item, function (error) {
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
            // -----------------------------------------------------------------------------------------------------
            // para que el registro se copie a sql en la prox copia que efectúe el usuario 
            if (item?.object?.fechaCopiadaSql) { 
                item.object.fechaCopiadaSql = null; 
            }
            // -----------------------------------------------------------------------------------------------------
            
            Cuotas.update({ _id: item._id }, { $set: item.object }, {}, function (error) {
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

            // -----------------------------------------------------------------------------------------------------
            // para que el registro se elimine en sql la prox copia que efectúe el usuario 
            Catalogos_deletedItems.insert({ _id: new Mongo.ObjectID()._str, collection: "cuotas", itemId: item._id, fecha: new Date() }); 
            // -----------------------------------------------------------------------------------------------------
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})