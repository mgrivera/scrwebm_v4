

import { Riesgos } from '/imports/collections/principales/riesgos';   

TiposFacultativo.before.remove(function (userId, doc) {

    let riesgo = Riesgos.findOne({ tipo: doc._id }, { fields: { numero: true } });

    if (riesgo) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen riesgos asociados al tipo de facultativo <em>${ doc.descripcion }</em>;
                                ejemplo: <em>riesgo:
                               ${ riesgo.numero }</em>. El tipo de riesgo no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    };
});
