
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { Catalogos_deletedItems } from '/imports/collections/general/catalogos_deletedItems'; 

// -------------------------------------------------------------------------------------------
// cada vez que el usuairo elimina un catálogo, lo agregamos en esta tabla
// la idea es luego actualizar la tabla que corresponde en la db de consultas
// (sql server)
// -------------------------------------------------------------------------------------------
const registroEliminacionCatalogos = function(nombreCatalogo, itemId) { 
    Catalogos_deletedItems.insert({ _id: new Mongo.ObjectID()._str, collection: nombreCatalogo, itemId, fecha: new Date() }, (err) => { 
        if (err) { 
            throw new Meteor.Error("validationErrors", err.invalidKeys.toString());
        }
    })
}

export { registroEliminacionCatalogos }; 