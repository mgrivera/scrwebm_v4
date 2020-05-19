
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash'; 

import { ContratosProp_Configuracion_ListaCodigos } from '/imports/collections/catalogos/ContratosProp_Configuracion'; 

Meteor.methods(
{
    contratosProp_configuracion_listaCodigos_Save: function (codigos) {

        if (!Array.isArray(codigos) || codigos.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(codigos).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();

        inserts.forEach(function (item) {
            try {
                ContratosProp_Configuracion_ListaCodigos.insert(item);
            } catch(err) {
                // el insert puede fallar pues hay un unique index por código y cía. Nota: debe haber una forma mejor
                // de hacer ésto pero, la verdad, no pudimos implementarlo con ni con future ni con
                // wrapAsync ni cada parecido (???)
                throw new Meteor.Error(err.message);
            }
        });


        var updates = lodash.chain(codigos).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {
            ContratosProp_Configuracion_ListaCodigos.update({ _id: item._id }, { $set: item.object }, {}, function (error) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        var removes = lodash.filter(codigos, function (item) { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {
            ContratosProp_Configuracion_ListaCodigos.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})