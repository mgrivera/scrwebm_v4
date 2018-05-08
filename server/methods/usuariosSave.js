
Meteor.methods(
{
    'usuarios.save': function (users) {
        // actualizamos los datos personales de los usuarios ...
        if (!_.isArray(users) || users.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        users.forEach(function (user) {
            let personales = {};

            personales.titulo = user.personales && user.personales.titulo ? user.personales.titulo : null;
            personales.nombre = user.personales && user.personales.nombre ? user.personales.nombre : null;
            personales.cargo = user.personales && user.personales.cargo ? user.personales.cargo : null;

            Meteor.users.update({ _id: user._id }, { $set: { personales: personales }}, { multi: false });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
