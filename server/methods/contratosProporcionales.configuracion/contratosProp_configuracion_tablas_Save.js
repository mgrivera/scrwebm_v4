

import { ContratosProp_Configuracion_Tablas } from '/imports/collections/catalogos/ContratosProp_Configuracion'; 

Meteor.methods(
{
    contratosProp_configuracion_tablas_Save: function (configItems) {

        if (!_.isArray(configItems) || configItems.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = _.chain(configItems).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();

        inserts.forEach(function (item) {
            try {
                ContratosProp_Configuracion_Tablas.insert(item);
            } catch(err) {
                // el insert puede fallar pues hay un unique index por código y cía. Nota: debe haber una forma mejor
                // de hacer ésto pero, la verdad, no pudimos implementarlo con ni con future ni con
                // wrapAsync ni cada parecido (???)
                throw new Meteor.Error(err.message);
            }
        });


        var updates = _.chain(configItems).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {
            ContratosProp_Configuracion_Tablas.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        var removes = _.filter(configItems, function (item) { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {
            ContratosProp_Configuracion_Tablas.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
