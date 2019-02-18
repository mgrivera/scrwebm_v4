

import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 
import { Companias } from 'imports/collections/catalogos/companias'; 

// para leer y regresar la compañía que representa 'nosotros' ... 
// el _id de esta compañía debe siempre existir en el registro que contiene la empresa usuaria  
// para el usuario 
export const LeerCompaniaNosotros = function(userID: string) { 

    let empresaUsuariaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

    if (!empresaUsuariaSeleccionada) { 
        let message = `Error (inesperado): no hemos podido leer una empresa usuaria seleccionada para el usuario. 
        `
        return { 
            error: true, 
            message: message
        }
    }

    if (!empresaUsuariaSeleccionada.companiaNosotros) { 
        let message = `Error: la <em>empresa usuaria</em> seleccionada para el usuario, no tiene un compañía del tipo 'nosotros' asociada.<br /> 
                       Este error puede corregirse, probablemente, si Ud. abre la opción que permite seleccionar una empresa usuaria 
                       y selecciona una. Nota: haga ésto aunque Ud. ahora tenga una empresa usuaria seleccionada, a ver si de esa forma se 
                       corrije este error. <br /> 
                       De otra forma, Ud. debe revisar el registro de la empresa usuaria que está usando y asegurarse que exista una 
                       compañía del tipo 'nosotros' asociada a la misma. 
        `; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        return { 
            error: true, 
            message: message
        }
    }

    // finalmente, leemos la compañía desde el catálogo de compañías ... 
    let companiaNosotros = Companias.findOne(empresaUsuariaSeleccionada.companiaNosotros); 

    if (!companiaNosotros) { 
        let message = `Error (inesperado): no hemos podido leer, en el catálogo de Compañías, la compañía que corresponde a la compañía 
        'nosotros'.<br /> 
        Por favor revise, en el catálogo de Empresas Usuarias, la empresa usuaria que ahora está seleccionada y asegúrese que tiene 
        una compañía asociada como compañía 'nosotros'. 
        `
        return { 
            error: true, 
            message: message
        }
    }

    return { 
        error: false, 
        companiaNosotros: companiaNosotros
    }
}