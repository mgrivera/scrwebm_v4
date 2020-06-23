
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 

import { Companias } from '/imports/collections/catalogos/companias';  
import { Ramos } from '/imports/collections/catalogos/ramos';  

Meteor.publish("contrato.loadInitialData", function (companiaId, ramoId) {

    // para cargar los datos que se necesitan al abrir una remesa; normalmente son catálogos necesarios para mostrar en los 
    // ddl: monedas, compañías, bancos, ... 

    new SimpleSchema({
        companiaId: { type: String, optional: false, }, 
        ramoId: { type: String, optional: false, }
    }).validate({ companiaId, ramoId });

    return [
        Companias.find(companiaId),
        Ramos.find(ramoId)
    ]
})