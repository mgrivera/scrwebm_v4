

import { Meteor } from 'meteor/meteor'
import lodash from 'lodash'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { EmpresasUsuariasUsuarios } from '/imports/collections/catalogos/empresasUsuariasUsuarios'; 

Meteor.methods(
{
    leerEmpresasUsuarias: function () {

        const empresasUsuarias = EmpresasUsuarias.find({}, { fields: { nombre: 1, nombreCorto: 1, }, 
                                                             sort: { nombre: 1, }})
                                                 .fetch(); 

        const usuarioID = Meteor.userId(); 

        // leemos las empresas asignadas al usuario; si no hay items en esta tabla, puede leer todas 
        const empresasUsuariasUsuario = EmpresasUsuariasUsuarios.find({ usuarioID: usuarioID }).fetch(); 

        // al usuario se le han restringido algunas empresas; solo tiene permiso a las que están en el array 
        const empresasUsuarias2 = lodash.cloneDeep(empresasUsuarias); 

        if (empresasUsuariasUsuario.length) { 
            // eliminamos cada empresa que no exista en el array 
            for (const empresa of empresasUsuarias2) { 

                const existe = empresasUsuariasUsuario.some(x => x.empresaUsuariaID === empresa._id);
    
                if (!existe) { 
                    lodash.remove(empresasUsuarias, x => x._id === empresa._id); 
                }
            }
        }
        
        return { 
            error: false, 
            message: "", 
            empresasUsuarias: empresasUsuarias, 
        }
    }, 
})