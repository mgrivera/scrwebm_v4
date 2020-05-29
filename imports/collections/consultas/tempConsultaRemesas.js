
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';
export const Temp_Consulta_Remesas = new Mongo.Collection("temp_consulta_remesas");

if (Meteor.isServer) {
    Temp_Consulta_Remesas.rawCollection().createIndex({ user: 1 });
}