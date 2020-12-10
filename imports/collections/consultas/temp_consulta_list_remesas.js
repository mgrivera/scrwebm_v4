
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

// nótese que no usamos schema en tablas de este tipo ... 
export const Temp_consulta_list_remesas = new Mongo.Collection("temp_consulta_list_remesas");
export const Temp_consulta_list_remesas_config = new Mongo.Collection("temp_consulta_list_remesas_config");

if (Meteor.isServer) {
    Temp_consulta_list_remesas.rawCollection().createIndex({ user: 1 });
}