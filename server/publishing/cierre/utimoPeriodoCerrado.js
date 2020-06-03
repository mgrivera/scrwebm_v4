
import { Meteor } from 'meteor/meteor';

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Cierre } from '/imports/collections/cierre/cierre'; 

Meteor.publish("utimoPeriodoCerrado", function (companiaSeleccionadaId) {

    // leemos y regresamos el *último* período de cierre efectuado para la compañía seleccionada; el período debe estar cerrado ... 
    return Cierre.find({ cia: companiaSeleccionadaId, cerradoFlag: true, }, { sort: { hasta: -1, }, limit: 1, });
})

Meteor.publish(null, function () {

    // el período corresponde simpre a la compañía seleccionada por el usuario 
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

    if (!companiaSeleccionada) {
        return [];
    }   

    // leemos y regresamos el *último* período de cierre efectuado para la compañía seleccionada; el período debe estar cerrado ... 
    return Cierre.find({ cia: companiaSeleccionada.companiaID, cerradoFlag: true, }, { sort: { hasta: -1, }, limit: 1, });
})
