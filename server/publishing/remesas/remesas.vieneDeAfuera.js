
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';  
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';  
import { Remesas } from '/imports/collections/principales/remesas';  

Meteor.publish("remesas.vieneDeAfuera", function (remesaID) {

    new SimpleSchema({
        remesaID: { type: String, optional: false, },
    }).validate({ remesaID, });

    // esta publishing es usado cuando se abre la remesa en una página (tab) difernente. La idea es leer y cargar la remesa, pero 
    // también algunos catálogos que no estarán en minimongo cuando la nueva página se abra ... 

    return [
        EmpresasUsuarias.find({}),
        CompaniaSeleccionada.find({ userID: this.userId }),
        Remesas.find({ _id: remesaID }), 
    ]
})