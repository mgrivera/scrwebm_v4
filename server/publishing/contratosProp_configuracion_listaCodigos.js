

import { Meteor } from 'meteor/meteor';

import { ContratosProp_Configuracion_ListaCodigos } from '/imports/collections/catalogos/ContratosProp_Configuracion'; 

Meteor.publish("contratosProp.configuracion.listaCodigos", function (ciaSeleccionadaID) { 
    return [ 
        ContratosProp_Configuracion_ListaCodigos.find({ cia: ciaSeleccionadaID })
    ]
});
