
import { Meteor } from 'meteor/meteor';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Indoles } from '/imports/collections/catalogos/indoles'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 

// estos publishings son usados para filtrar por catalogos en ciertas consultas; las más recientes, 
// en las cuales hemos logrado usar react 

Meteor.publish("search.monedas", function (search) {
    return Monedas.find({ $or: [ {descripcion: new RegExp(search, 'i')}, {simbolo: new RegExp(search, 'i')} ] }, 
                        { fields: { descripcion: 1, simbolo: 1 }});
})

Meteor.publish("search.companias", function (search) {
    return Companias.find({
        $or: [
                { nombre: new RegExp(search, 'i') },
                { abreviatura: new RegExp(search, 'i') },
            ]
    }, { fields: { nombre: 1, tipo: 1 }});
})

Meteor.publish("search.ramos", function (search) {
    return Ramos.find({ nombre: new RegExp(search, 'i') }, { fields: { descripcion: 1 }});
})

Meteor.publish("search.asegurados", function (search) {
    return Asegurados.find({ nombre: new RegExp(search, 'i') }, { fields: { nombre: 1 }});
})

Meteor.publish("search.bancos", function (search) {
    return Bancos.find({ nombre: new RegExp(search, 'i') });
})

Meteor.publish("leer.cuentasBancarias.banco", function (banco, cia) {
    return CuentasBancarias.find({ banco, cia });
})

Meteor.publish("search.indoles", function (search) {
    return Indoles.find({ descripcion: new RegExp(search, 'i') });
})