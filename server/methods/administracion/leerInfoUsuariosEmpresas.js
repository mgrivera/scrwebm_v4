

import { Meteor } from 'meteor/meteor'
import lodash from 'lodash'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { EmpresasUsuariasUsuarios } from '/imports/collections/catalogos/empresasUsuariasUsuarios'; 

Meteor.methods(
{
    leerInfoUsuariosEmpresas: function () {

        // leemos el contenido de ambas tablas, además de los usuarios registrados 
        const empresasUsuarias = EmpresasUsuarias.find({}, { fields: { nombre: 1, nombreCorto: 1, }, 
                                                             sort: { nombreCorto: 1, }})
                                                 .fetch(); 

        const empresasUsuariasUsuarios = EmpresasUsuariasUsuarios.find().fetch(); 

        const users = Meteor.users.find({}, { fields: { emails: 1, }, sort: { 'emails.0.address': 1, }}).fetch(); 
        const users2 = users.map(x => { return { _id: x._id, email: x.emails[0].address, }}) 

        return { 
            error: false, 
            message: "", 
            users: users2, 
            empresasUsuarias: empresasUsuarias, 
            empresasUsuariasUsuarios: empresasUsuariasUsuarios, 
        }
    }, 


    grabarInfoUsuariosEmpresas: function (items) {

        // los items nuevos vienen con docState en 1 
        items.filter(x => x.docState && x.docState === 1).forEach((item) => { 
            // el item no debe exisir 
            const usuarioEmpresa = EmpresasUsuariasUsuarios.findOne({ usuarioID: item.usuarioID, empresaUsuariaID: item.empresaUsuariaID }); 

            const item2 = lodash.cloneDeep(item); 
            delete item2.docState; 

            if (!usuarioEmpresa) { 
                EmpresasUsuariasUsuarios.insert(item2); 
            }
        })

        // los items nuevos vienen con docState en 1 
        items.filter(x => x.docState && x.docState === 3).forEach((item) => { 
            EmpresasUsuariasUsuarios.remove({ usuarioID: item.usuarioID, empresaUsuariaID: item.empresaUsuariaID }); 
        })

        return { 
            error: false, 
            message: "Ok, los datos han sido registrados en forma exitosa.", 
        }
    }
})
