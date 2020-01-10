

import { Meteor } from 'meteor/meteor';
import { ContratosProp_Configuracion_Tablas } from '/imports/collections/catalogos/ContratosProp_Configuracion'; 

Meteor.publish("contratosProp.configuracion.tablas", function (filtro) {
    filtro = JSON.parse(filtro); 
    return ContratosProp_Configuracion_Tablas.find(filtro);
});
