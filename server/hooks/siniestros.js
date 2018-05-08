

import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 

Siniestros.before.remove(function (userId, doc) {

    // cuotas
    let cuota = Cuotas.findOne({ 'source.entityID': doc._id });

    if (cuota) {
        throw new Meteor.Error("dataBaseError",
                    "Existen registros asociados.",
                    `Existen cuotas asociadas al siniestro. El siniestro no puede ser eliminado.<br />
                    Un siniestro con cuotas registradas, no puede ser eliminado.<br />
                    <b>Nota:</b> Ud. debe <b>antes</b> editar el siniestro y eliminar sus cuotas. <br />
                    Solo luego podrá regresar y eliminar el siniestro. 
                    `);
    }
})
