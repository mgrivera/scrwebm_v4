
import { Meteor } from 'meteor/meteor'; 
import { check } from 'meteor/check';

import { Remesas } from '/imports/collections/principales/remesas';  
import { Cuotas } from '/imports/collections/principales/cuotas'; 

Meteor.methods({
    'remesas.revertir': function (remesaID) {
        check(remesaID, String);
        
        var remesa = Remesas.findOne(remesaID);
    
        if (!remesa) {
            throw new Meteor.Error("remesa-no-encontrada", "Error inesperado: la remesa indicada no pudo ser leída en la base de datos.");
        }
            
        // eliminamos los cobros/pagos, en cuotas, que correspondan a la remesa ...
        Cuotas.update({ 'pagos.remesaID': { $in: [remesa._id] } }, { $pull: { pagos: { remesaID: remesa._id } } }, { multi: true });
    
        // finalmente, 'abrimos' la remesa y eliminamos su array de 'cuadre'
        Remesas.update({ _id: remesaID }, { $set: { fechaCerrada: null }, $unset: { cuadre: true, asientoContable: true, }});
    
        return "Ok, el proceso fue ejecutado en forma satisfactoria.";
    }
})