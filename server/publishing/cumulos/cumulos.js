
import { Meteor } from 'meteor/meteor';

import { Cumulos } from '/imports/collections/catalogos/cumulos';

import { Companias } from '/imports/collections/catalogos/companias';
import { Monedas } from '/imports/collections/catalogos/monedas';
import { Ramos } from '/imports/collections/catalogos/ramos';
import { Asegurados } from '/imports/collections/catalogos/asegurados';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';

Meteor.publish("cumulos", function () {
    return [ 
        Cumulos.find(), 
        Monedas.find({}, { sort: { descripcion: 1 }}), 
        Companias.find({}, { sort: { nombre: 1 }}), 
        Ramos.find({}, { sort: { descripcion: 1 }}), 
        Asegurados.find({}, { sort: { nombre: 1 } }),
        EmpresasUsuarias.find({}, { fields: { nombre: 1, nombreCorto: 1 }, sort: { nombre: 1 }})
    ]
})