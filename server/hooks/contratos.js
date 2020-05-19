
import { Meteor } from 'meteor/meteor'; 

import { Contratos } from '/imports/collections/principales/contratos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 

Contratos.before.remove(function (userId, doc) {
    // cuotas
    if (!(doc.docState && doc.docState === 2)) { 
        const cuota = Cuotas.findOne({ 'source.entityID': doc._id });

        if (cuota) {
            throw new Meteor.Error("dataBaseError",
                        "Existen registros asociados.",
                        `Existen cuotas asociadas al contrato. El contrato no puede ser eliminado.<br />
                        Un contrato con cuotas registradas, no puede ser eliminado.<br />
                        <b>Nota:</b> Ud. debe <b>antes</b> editar el contrato y eliminar sus cuotas. <br />
                        Solo luego podrá regresar y eliminar el contrato. 
                        `);
        }
    }
})
