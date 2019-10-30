

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    usuarioID: { type: String, optional: false, },
    empresaUsuariaID: { type: String, optional: false, },
})

export const EmpresasUsuariasUsuarios = new Mongo.Collection("empresasUsuariasUsuarios");
EmpresasUsuariasUsuarios.attachSchema(schema);