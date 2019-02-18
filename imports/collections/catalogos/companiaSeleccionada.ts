

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

var schema = new SimpleSchema({
    companiaID: { type: String, label: "Compañía", optional: false },
    userID: { type: String, label: "Usuario", optional: false }, 
    companiaNosotros: { type: String, label: "Compañía que representa a 'nosotros'", optional: true, },
})

export const CompaniaSeleccionada: any = new Mongo.Collection("companiaSeleccionada");
CompaniaSeleccionada.attachSchema(schema);
