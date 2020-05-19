
import { Meteor } from 'meteor/meteor'; 

import { Temp_consulta_cierreRegistro_config } from '/imports/collections/consultas/temp_consulta_cierreRegistro'; 
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    'cierre.consulta.grabarAMongoOpcionesReporte': function (fechaInicialPeriodo, fechaFinalPeriodo, opcionesReporte, empresaSeleccionada) {

        new SimpleSchema({
            fechaInicialPeriodo: { type: Date, optional: false, }, 
            fechaFinalPeriodo: { type: Date, optional: false, },  
            opcionesReporte: { type: Object, blackbox: true, optional: false, }, 
            empresaSeleccionada: { type: Object, blackbox: true, optional: false, }, 
        }).validate({ fechaInicialPeriodo, fechaFinalPeriodo, opcionesReporte, empresaSeleccionada, });

        Temp_consulta_cierreRegistro_config.remove({ user: Meteor.userId() }); 

        // grabamos un registro 'config' para que el proceso asp.net pueda saber el valor de algunos parámetros, 
        // como período, compañía, etc. 
        Temp_consulta_cierreRegistro_config.insert({ 
            fechaInicialPeriodo: fechaInicialPeriodo, 
            fechaFinalPeriodo: fechaFinalPeriodo, 
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
