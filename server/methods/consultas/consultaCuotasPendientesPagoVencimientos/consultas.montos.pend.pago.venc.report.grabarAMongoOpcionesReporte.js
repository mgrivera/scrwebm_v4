
import { Meteor } from 'meteor/meteor'; 
import SimpleSchema from 'simpl-schema';

import { Consulta_MontosPendientesPago_Vencimientos_config } from '/imports/collections/consultas/consultas_MontosPendientesPago_Vencimientos'; 

Meteor.methods(
{
    'consultas.montos.pend.pago.venc.report.grabarAMongoOpcionesReporte': function (opcionesReporte, empresaSeleccionada) {

        new SimpleSchema({
            opcionesReporte: { type: Object, blackbox: true, optional: false, }, 
            empresaSeleccionada: { type: Object, blackbox: true, optional: false, }, 
        }).validate({ opcionesReporte, empresaSeleccionada, });

        Consulta_MontosPendientesPago_Vencimientos_config.remove({ user: Meteor.userId() }); 

        // grabamos un registro 'config' para que el proceso asp.net pueda saber el valor de algunos parámetros, 
        // como período, compañía, etc. 
        Consulta_MontosPendientesPago_Vencimientos_config.insert({ 
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