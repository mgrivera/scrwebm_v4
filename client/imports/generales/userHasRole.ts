
import * as lodash from 'lodash'; 

// esta funcion es llamada desde la página principal (home - index.html) para saber si el usuario tiene roles en particular
// y mostrar las opciones del menú en relación a estos roles; nótese que para 'admin', se muestran todas las opciones del menú
let userHasRole = function(rol) {

    // mostramos todas las opciones al usuario (cuyo mail es) 'admin@admin.com'
    // debugger;
    if (Meteor.user() &&
        Meteor.user().emails &&
        Meteor.user().emails.length > 0 &&
        lodash.some(Meteor.user().emails, function (email) { return email.address == "admin@admin.com"; })) {
            return true;
    }


    // mostramos todas las opciones a usuarios en el rol 'admin'
    let roles = Meteor.user() && Meteor.user().roles ? Meteor.user().roles : [];

    if (lodash.find(roles, function (r) { return r === "admin"; })) { 
        return true;
    }

    if (!rol) { 
        return false;
    }
        
    var found = lodash.find(roles, function (r) { return r === rol; });
    if (found) { 
        return true;
    }
    else { 
        return false;
    }
}

export { userHasRole }; 