
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash'; 

Meteor.methods(
{
    usuariosRolesSave: function (users) {
        // solo pretendemos actualizar los roles de cada usuario aquí; los usuarios, en sí, se actualizan desde el ui que
        // Meteor provee para ello ...
        if (!lodash.isArray(users) || users.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        users.forEach(function (user) {
            delete user.docState;
            Meteor.users.update({ _id: user._id }, { $set: { roles: user.roles }}, { multi: false });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})