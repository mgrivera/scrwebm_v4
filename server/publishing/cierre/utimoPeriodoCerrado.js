
import { Meteor } from 'meteor/meteor';
import { Cierre } from '/imports/collections/cierre/cierre'; 

Meteor.publish("utimoPeriodoCerrado", function (companiaSeleccionadaID) {

    // leemos y regresamos el *último* período de cierre efectuado para la compañía seleccionada; el período debe estar cerrado ... 
    return Cierre.find({ cia: companiaSeleccionadaID, cerradoFlag: true, }, { sort: { hasta: -1, }, limit: 1, });
})
