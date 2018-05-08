
Meteor.roles.before.remove(function (userId, doc) {

    // debugger;

    let usuario = Meteor.users.findOne({
        $and: [
            { roles: { $exists: true }},
            { roles: { $eq: doc.name }},
        ]
    },
        { fields: { emails: true } });

    if (usuario) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen usuarios asociadas al rol <em>${ doc.name }</em>; ejemplo: <em>usuario:
                               ${ usuario.emails[0].address }</em>. El rol no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    };
});
