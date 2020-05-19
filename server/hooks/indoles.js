
import { Meteor } from 'meteor/meteor'; 

import { Indoles } from '/imports/collections/catalogos/indoles'; 
import { Riesgos } from '/imports/collections/principales/riesgos';   

Indoles.before.remove(function (userId, doc) {
    // -------------------------------------------------------------------
    // riesgos
    const riesgo = Riesgos.findOne({
        $or: [
            { 'indole': doc._id },
        ]
    },
        { fields: { numero: true } });

    if (riesgo) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen riesgos asociados al índole <em>${ doc.descripcion }</em>; ejemplo: <em>riesgo número:
                               ${ riesgo.numero }</em>. El índole no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})
