
import { Meteor } from 'meteor/meteor'; 

import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Riesgos } from '/imports/collections/principales/riesgos';  

Asegurados.before.remove(function (userId, doc) {
    // ------------------------------------------------------------------------
    // riesgos
    const riesgo = Riesgos.findOne({ $or: [ { 'asegurado': doc._id }, ] }, { fields: { numero: true } });

    if (riesgo) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen riesgos asociados al asegurado <em>${ doc.nombre }</em>; ejemplo: <em>riesgo número:
                               ${ riesgo.numero }</em>. El asegurado no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})
