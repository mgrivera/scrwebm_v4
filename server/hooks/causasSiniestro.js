
import { Meteor } from 'meteor/meteor'; 

import { CausasSiniestro } from '/imports/collections/catalogos/causasSiniestro'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 

CausasSiniestro.before.remove(function (userId, doc) {
    // ---------------------------------------------------------------------------------------------------------------------
    // siniestros
    const siniestro = Siniestros.findOne({
        $or: [
            { causa: doc._id },
        ]
    },
        { fields: { numero: true } });

    if (siniestro) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen siniestros asociados a la causa <em>${ doc.descripcion }</em>; ejemplo: <em>siniestro número:
                               ${ siniestro.numero }</em>. La causa de siniestro no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})
