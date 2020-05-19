
import { Meteor } from 'meteor/meteor';
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos';  
import { Cumulos } from 'imports/collections/catalogos/cumulos'; 
import { TiposObjetoAsegurado } from 'imports/collections/catalogos/tiposObjetoAsegurado'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 

Meteor.publish("registroCumulos_catalogos", function () {
    return [
        Monedas.find(), 
        Companias.find(), 
        Ramos.find(), 
        Cumulos.find(), 
        TiposObjetoAsegurado.find(), 
        Indoles.find(), 
    ]
})