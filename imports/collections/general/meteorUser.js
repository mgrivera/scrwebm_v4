
import SimpleSchema from 'simpl-schema';

// -----------------------------------------------------------------------
// meteor user - la idea es poder validar un usuario
//
// ahora el usuario puede cambiar el Email, nombre y password 
// desde la nueva opción: Administración / Usuarios / Usuarios 
// -----------------------------------------------------------------------

function validarPasswords() {

    const password = this.field("password");
    const password2 = this.field("password2");

    if (password.value != password2.value) {
        return "Password: si Ud. quiere cambiar el password, indique uno y, además, confírmelo."
    }

    return undefined;
}

const meteorUser_simpleSchema = new SimpleSchema({
    _id: { type: String, label: 'Id del usuario', optional: false },
    username: { type: String, label: 'Nombre del usuario', optional: false, min: 1 },
    email: { type: String, label: 'Email del usuario', optional: false, min: 1 },
    verified: { type: Boolean, label: 'Email verificado?', optional: false },
    password: { type: String, label: 'Password', optional: true, custom: validarPasswords },
    password2: { type: String, label: 'Password (confirmar)', optional: true },
    createdAt: { type: Date, label: 'Creado el', optional: false },
});

export { meteorUser_simpleSchema }; 