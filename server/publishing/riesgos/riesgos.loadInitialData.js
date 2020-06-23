
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 

import { Companias } from '/imports/collections/catalogos/companias';  
import { Asegurados } from '/imports/collections/catalogos/asegurados';  
import { Indoles } from '/imports/collections/catalogos/indoles';  
import { Ramos } from '/imports/collections/catalogos/ramos';  

Meteor.publish("riesgo.loadInitialData", function (companiaId, ramoId, corredorId, indolesId) {

    // para cargar los datos que se necesitan al abrir una remesa; normalmente son catálogos necesarios para mostrar en los 
    // ddl: monedas, compañías, bancos, ... 

    new SimpleSchema({
        companiaId: { type: String, optional: false, }, 
        ramoId: { type: String, optional: false, }, 
        corredorId: { type: String, optional: true, }, 
        indolesId: { type: String, optional: false, }
    }).validate({ companiaId, ramoId, corredorId, indolesId });

    return [
        Companias.find({ $or: [ { _id: companiaId }, { _id: corredorId } ]}),
        Indoles.find(indolesId), 
        Ramos.find(ramoId)
    ]
})