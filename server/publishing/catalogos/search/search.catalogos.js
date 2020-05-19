
import { Meteor } from 'meteor/meteor';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 

// estos publishings son usados para filtrar por catalogos en ciertas consultas; las más recientes, 
// en las cuales hemos logrado usar react 

Meteor.publish("search.monedas", function (search) {
    return Monedas.find({ descripcion: new RegExp(search, 'i') }, { fields: { descripcion: 1 }});
});

Meteor.publish("search.companias", function (search) {
    return Companias.find({ nombre: new RegExp(search, 'i') }, { fields: { nombre: 1 }});
});

Meteor.publish("search.ramos", function (search) {
    return Ramos.find({ nombre: new RegExp(search, 'i') }, { fields: { descripcion: 1 }});
});

Meteor.publish("search.asegurados", function (search) {
    return Asegurados.find({ nombre: new RegExp(search, 'i') }, { fields: { nombre: 1 }});
});