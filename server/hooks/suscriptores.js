
import { Meteor } from 'meteor/meteor'; 

import { Riesgos } from '/imports/collections/principales/riesgos';   
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

Suscriptores.before.remove(function (userId, doc) {

    const riesgo = Riesgos.findOne({ suscriptor: doc._id }, { fields: { numero: true } });

    if (riesgo) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen riesgos asociados al suscriptor <em>${ doc.nombre }</em>; ejemplo: <em>riesgo número:
                               ${ riesgo.numero }</em>. El suscriptor no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    const siniestro = Siniestros.findOne({ suscriptor: doc._id }, { fields: { numero: true } });

    if (siniestro) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen siniestros asociados al suscriptor <em>${ doc.nombre }</em>; ejemplo: <em>siniestro número:
                               ${ siniestro.numero }</em>. El suscriptor no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})