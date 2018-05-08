
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

CompaniaSeleccionada.allow({
    insert: function (userId, doc) {
        if (userId)
            return true;
        else
            return false;
    },
    update: function (userId, doc, fields, modifier) {
        if (userId)
            return true;
        else
            return false;
    },
    remove: function (userId, doc) {
        if (userId)
            return true;
        else
            return false;
    }
});