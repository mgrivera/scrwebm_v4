
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 

import { Companias } from '/imports/collections/catalogos/companias';  
import { Monedas } from '/imports/collections/catalogos/monedas';  
import { Bancos } from '/imports/collections/catalogos/bancos';  
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias';  

Meteor.publish("remesa.loadInitialData", function (companiaId, monedaId, bancoId) {

    // para cargar los datos que se necesitan al abrir una remesa; normalmente son catálogos necesarios para mostrar en los 
    // ddl: monedas, compañías, bancos, ... 

    new SimpleSchema({
        companiaId: { type: String, optional: false, },
        monedaId: { type: String, optional: false, },
        bancoId: { type: String, optional: false, },
    }).validate({ companiaId, monedaId, bancoId });

    return [
        Companias.find(companiaId),
        Monedas.find(monedaId),
        Bancos.find(bancoId),
        CuentasBancarias.find({ banco: bancoId })
    ]
})