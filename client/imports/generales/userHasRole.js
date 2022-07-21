
import { Meteor } from 'meteor/meteor'

// esta funcion es llamada desde la página principal (home - index.html) para saber si el usuario tiene roles en particular
// y mostrar las opciones del menú en relación a estos roles; nótese que para 'admin', se muestran todas las opciones del menú
const userHasRole = function(rol) {

    const user = Meteor.user(); 

    // mostramos todas las opciones al usuario (cuyo mail es) 'admin@admin.com'
    // debugger;
    if (user && user?.emails && Array.isArray(user.emails) && user.emails.length &&
        user.emails.some(email => email.address === "admin@admin.com")) {
            return true;
    }

    // mostramos todas las opciones a usuarios en el rol 'admin'
    const roles = user && user.roles ? user.roles : [];

    if (roles.find((r) =>  r === "admin")) { 
        return true;
    }

    if (!rol) { 
        return false;
    }
        
    const found = roles.find((r) => r === rol);
    if (found) { 
        return true;
    }
    else { 
        return false;
    }
}

export { userHasRole }; 