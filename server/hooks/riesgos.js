

import { Riesgos } from '/imports/collections/principales/riesgos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 

Riesgos.before.remove(function (userId, doc) {

    // ---------------------------------------------------------------------------------------------------------------------
    // siniestros

    let siniestro = Siniestros.findOne({
        $or: [
            { 'source.entityID': doc._id },
        ]
    },
        { fields: { numero: true } });


    if (siniestro) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen siniestros asociados al riesgo.<br />
                               ejemplo: <em>siniestro número: ${ siniestro.numero }</em>.<br />
                               El riesgo no puede ser eliminado.`);
    }

    // cuotas
    // impedimos eliminar un riesgo que tenga cuotas asociadas. El usuario debe eliminarlas primero ... 
    let cuota = Cuotas.findOne({ 'source.entityID': doc._id, });

    if (cuota) {
        throw new Meteor.Error("dataBaseError",
                    "Existen registros asociados.",
                    `Existen cuotas asociadas al riesgo. El riesgo no puede ser eliminado.<br />
                    Un riesgo con cuotas registradas, no puede ser eliminado.<br />
                    <b>Nota:</b> Ud. debe <b>antes</b> editar el riesgo y eliminar sus cuotas. <br />
                    Solo luego podrá regresar y eliminar el riesgo. 
                    `);
    }
})
