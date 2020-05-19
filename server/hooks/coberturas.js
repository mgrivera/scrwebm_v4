
import { Meteor } from 'meteor/meteor'; 

import { Coberturas } from '/imports/collections/catalogos/coberturas'; 
import { Riesgos } from '/imports/collections/principales/riesgos';   

Coberturas.before.remove(function (userId, doc) {
    // ---------------------------------------------------------------------------------------------------------------------
    // riesgos
    const riesgo = Riesgos.findOne({
        $or: [
            { 'movimientos.coberturas.cobertura': doc._id },
            { 'movimientos.coberturasCompanias.cobertura': doc._id },
        ]
    },
        { fields: { numero: true } });

    if (riesgo) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen riesgos asociados a la cobertura <em>${ doc.descripcion }</em>; ejemplo: <em>riesgo número:
                               ${ riesgo.numero }</em>. La cobertura no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})
