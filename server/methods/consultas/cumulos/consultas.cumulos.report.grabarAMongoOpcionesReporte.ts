

import { Consulta_Cumulos_config } from 'imports/collections/consultas/consulta_cumulos'; 

import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 

Meteor.methods(
{
    'consultas.cumulos.report.grabarAMongoOpcionesReporte': function (opcionesReporte, empresaSeleccionada) {

        new SimpleSchema({
            opcionesReporte: { type: Object, blackbox: true, optional: false, }, 
            empresaSeleccionada: { type: Object, blackbox: true, optional: false, }, 
        }).validate({ opcionesReporte, empresaSeleccionada, });

        Consulta_Cumulos_config.remove({ user: Meteor.userId() }); 

        // grabamos un registro 'config' para que el proceso asp.net pueda saber el valor de algunos parámetros, 
        // como período, compañía, etc. 
        Consulta_Cumulos_config.insert({ 
            opcionesReporte: opcionesReporte, 
            compania: empresaSeleccionada, 
            user: Meteor.userId() 
        }); 

        return { 
            error: false, 
            message: "Ok, las opciones del reporte han sido registradas.<br />" + 
                     "Ud. debe hacer un <em>click</em> en el <em>link</em> que se ha mostrado, para obtener el reporte. " 
        }
    }
})