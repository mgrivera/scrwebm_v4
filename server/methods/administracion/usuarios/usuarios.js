
import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'; 
import { check } from 'meteor/check';

Meteor.methods(
    {
        // ========================================================================================
        // administracion.usuarios.leerDesdeMongo.recordCount
        // ========================================================================================
        'administracion.usuarios.leerDesdeMongo.recordCount': function () {

            let recCount = null;

            try {
                recCount = Meteor.users.find({}, { fields: { '_id': 1 } }).count();
            } catch (err) {
                throw new Meteor.Error(err);
            }

            return {
                error: false,
                recCount
            }
        }, 

        // ========================================================================================
        // administracion.usuarios.save.update
        // ========================================================================================
        'administracion.usuarios.save.update': function (values) {

            check(values, Object);

            // leemos la definición de usuario para saber lo que se intenta modificar: username, Email, password 
            const currentUser = Meteor.users.findOne({ _id: values._id }, { fields: { username: 1, emails: 1 }}); 

            if (!currentUser) { 
                return {
                    error: true,
                    message: "Error inesperado: no hemos podido leer la configuración actual del usuario que se intenta modificar."
                }
            }

            let usernameChanged = false; 
            let emailChanged = false; 
            let passwordChanged = false; 

            const currentUserEmail = currentUser.emails[0].address; 

            // ----------------------------------------------------------------------------
            // intentamos cambiar el Email 
            // ----------------------------------------------------------------------------
            if (values.email != currentUserEmail) {
                // Ok, el usuario intenta cambiar el e-mail  
                emailChanged = true; 

                // la dirección de correo indicada no debe haber sido asignada a algún usuario
                const userWithEmail = Accounts.findUserByEmail(values.email);

                if (userWithEmail) {
                    return {
                        error: true,
                        message: `Error: la dirección de correo indicada (${values.email}) ya ha sido usada en alguna (otra) 
                              cuenta de usuario.<br /> 
                              Por favor indique una dirección de correo que no haya sido usada aún. 
                             `
                    }
                }

                // Ok, vamos a eliminar el e-mail al usuario *antes* de agregar el nuevo 
                try {
                    Accounts.removeEmail(values._id, currentUserEmail);
                } catch (error) {
                    return {
                        error: true,
                        message: error.message
                    }
                }

                // Ok, ya eliminamos el e-mail; ahora agregamos el nuevo 
                try {
                    Accounts.addEmail(values._id, values.email);
                } catch (error) {
                    return {
                        error: true,
                        message: error.message
                    }
                }
            }

            // ----------------------------------------------------------------------------
            // intentamos cambiar el username 
            // ----------------------------------------------------------------------------
            if (values.username != currentUser.username) {
                // Ok, el usuario intenta cambiar el username 
                usernameChanged = true; 

                try {
                    Accounts.setUsername(values._id, values.username); 
                } catch (error) {
                    return {
                        error: true,
                        message: `Error: este proceso ha encontrado errores al intentar efectuar los cambios que Ud. ha 
                                  solicitado:<br /> 
                                  A continuación mostramos los mensajes de error específicos: <br /><br /> 
                                  ${error.message}`
                    }
                }
            }

            // ----------------------------------------------------------------------------
            // intentamos cambiar el password  
            // ----------------------------------------------------------------------------
            if (values.password) {
                // Ok, el usuario intenta cambiar el password 
                passwordChanged = true;

                try {
                    // logount true para hacer logout en probables sesiones que pueda tener el usuario 
                    Accounts.setPassword(values._id, values.password, { logout: true }); 
                } catch (error) {
                    return {
                        error: true,
                        message: `Error: este proceso ha encontrado errores al intentar efectuar los cambios que Ud. ha 
                                  solicitado:<br /> 
                                  A continuación mostramos los mensajes de error específicos: <br /><br /> 
                                  ${error.message}`
                    }
                }
            }

            let finalMessage = ""; 

            if (!usernameChanged && !emailChanged && !passwordChanged) { 
                finalMessage = `Aunque la ejecución de este proceso ha sido exitosa, es decir, sin errores, 
                                pareciera que Ud. no ha requerido ningún cambio. <br /> 
                                Este proceso no ha efectuado ningún cambio en los datos que corresponden a este usuario. 
                               `; 
            } else { 
                finalMessage = `Ok, el usuario ha sido modificado en forma exitosa. En particular: <br /><br /><ul>`; 

                if (usernameChanged) {
                    finalMessage += `<li>El nombre del usuario ha sido cambiado de <em>${currentUser.username}</em>
                                     a <em>${values.username}</em>.</li>
                                    `;
                }

                if (emailChanged) {
                    finalMessage += `<li>La dirección de correo del usuario ha sido cambiada de 
                                    <em>${currentUserEmail}</em> a <em>${values.email}</em>.</li>
                               `;
                }

                if (passwordChanged) {
                    finalMessage += `<li>El password ha sido cambiado por el que se ha indicado.</li>
                               `;
                }

                finalMessage += `</ul>`; 
            }
            
            return {
                error: false,
                message: finalMessage
            }
        }, 

        // ========================================================================================
        // administracion.usuarios.save.delete
        // ========================================================================================
        'administracion.usuarios.save.delete': function (userId) {

            check(userId, String);

            // lo primero que hacemos es leer la definición del usuario que se intenta eliminar 
            const currentUser = Meteor.users.findOne({ _id: userId }, { fields: { username: 1, emails: 1 } });

            if (!currentUser) {
                return {
                    error: true,
                    message: "Error inesperado: no hemos podido leer la configuración actual del usuario que se intenta eliminar."
                }
            }

            const currentUserName = currentUser.username; 
            const currentUserEmail = currentUser.emails[0].address;

            // nótese que no hay un method en el api en passwords que permita eliminar un usuario 
            // simplemente, usamos el users meteor collection 
            try {
                Meteor.users.remove({ _id: userId });
            } catch (error) {
                return {
                    error: true,
                    message: error.message
                }
            }

            return {
                error: false,
                message: `Ok, el usuario <em>${currentUserName}</em>, con Email <em>${currentUserEmail}</em>,
                          ha sido eliminado de la tabla de usuarios.`
            }
        }
    })