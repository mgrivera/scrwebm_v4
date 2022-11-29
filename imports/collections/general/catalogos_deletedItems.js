
import SimpleSchema from 'simpl-schema'; 
import { Mongo } from 'meteor/mongo';

// -----------------------------------------------------------------------
//  catalogos_deletedItems
//  en esta tabla grabamos un registro cada vez que el usuario elimina 
//  un item desde un catálogo. La idea es que luego se elimine el registro 
//  en la base de datos de consultas (sql server) 
// -----------------------------------------------------------------------
const simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },

    collection: { type: String, label: 'Mongo collection', optional: false },
    itemId: { type: String, label: 'Id del item eliminado', optional: false },
    fecha: { type: Date, label: 'Fecha de la eliminación', optional: false },
})

export const Catalogos_deletedItems = new Mongo.Collection("catalogos_deletedItems");
Catalogos_deletedItems.attachSchema(simpleSchema);