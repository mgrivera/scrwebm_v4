
import { Meteor } from 'meteor/meteor';
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Cierre } from '/imports/collections/cierre/cierre'; 

Meteor.publish("cierre", function (companiaSeleccionadaID) {

    // leemos y regresamos el *último* cierre efectuado para la compañía seleccionada
    return Cierre.find({ cia: companiaSeleccionadaID, cerradoFlag: true, }, { sort: { hasta: -1, }, limit: 1, });
})
