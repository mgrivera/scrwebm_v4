

import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 

import { Remesas } from '../../imports/collections/principales/remesas'; 

Meteor.methods({
    'remesas.leerFactorCambioRemesaReciente': function (fecha) {

        new SimpleSchema({
            fecha: { type: Date, optional: false, }, 
        }).validate({ fecha, });
        
        let remesa = Remesas.findOne(
            { $and: [ { fecha: { $lt: fecha } }, { factorCambio: { $ne: null }}, { factorCambio: { $ne: 0 }} ]}, 
            { sort: { fecha: -1, }, fields: { factorCambio: true, }});
    
        if (!(remesa && remesa.factorCambio)) {
            // no pudimos leer una remesa grabada en forma reciente y antes a la indicada 
            return { 
                error: true, 
                message: `No hemos podido leer una remesa, registrada con fecha <b>anterior</b> a la fecha indicada, a partir de la cual obtener un valor para el factor de cambio. <br />
                          No pudimos leer un <em>factor de cambio</em> para asignarlo a la remesa que Ud. está registrando ahora. <br />
                          Por favor indique Ud. un factor de cambio para esta remesa.`
            }
        }
            
        return { 
            error: false, 
            message: ``, 
            factorCambio: remesa.factorCambio
        }
    }
})