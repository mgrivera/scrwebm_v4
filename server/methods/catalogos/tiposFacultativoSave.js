
import { TiposFacultativo } from '/imports/collections/catalogos/tiposFacultativo'; 

Meteor.methods(
{
    tiposFacultativoSave: function (tiposFacultativo) {

        if (!_.isArray(tiposFacultativo) || tiposFacultativo.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = _.chain(tiposFacultativo).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            TiposFacultativo.insert(item, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });


        var updates = _.chain(tiposFacultativo).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {
            TiposFacultativo.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        var removes = _.filter(tiposFacultativo, function (item) { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {
            TiposFacultativo.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});