
import { Meteor } from 'meteor/meteor'; 

import { Cumulos_Registro } from '/imports/collections/principales/cumulos_registro';  

Meteor.methods(
{
    'cumulos_registro.save.insert': function (item) {

        Cumulos_Registro.insert(item, function (error) {
            if (error) { 
                if (error.invalidKeys) { 
                    throw new Meteor.Error('error-base-datos',
                                           `Error inesperado al intentar ejecutar la operación de base de datos: 
                                           ${error.invalidKeys.toString()}.`);
                } else { 
                    throw new Meteor.Error('error-base-datos',
                                           `Error inesperado al intentar ejecutar la operación de base de datos: 
                                           ${error.message}.`);
                }     
            }
        })

        return { 
            error: false, 
            message: "Ok, los datos han sido actualizados en la base de datos.", 
        }
    }, 

    'cumulos_registro.save.update': function (item) {

        Cumulos_Registro.update({ _id: item._id }, { $set: item }, {}, function (error) {
            //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
            if (error) { 
                if (error.invalidKeys) { 
                    throw new Meteor.Error('error-base-datos',
                                           `Error inesperado al intentar ejecutar la operación de base de datos: 
                                           ${error.invalidKeys.toString()}.`);
                } else { 
                    throw new Meteor.Error('error-base-datos',
                                           `Error inesperado al intentar ejecutar la operación de base de datos: 
                                           ${error.message}.`);
                }     
            }
        })

        return { 
            error: false, 
            message: "Ok, los datos han sido actualizados en la base de datos.", 
        }
    }, 

    'cumulos_registro.save.remove': function (itemId) {

        Cumulos_Registro.remove({ _id: itemId });

        return { 
            error: false, 
            message: "Ok, los datos han sido actualizados en la base de datos.", 
        }
    }
})