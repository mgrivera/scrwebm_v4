
import { Riesgos } from '/imports/collections/principales/riesgos';   
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 

Ramos.before.remove(function (userId, doc) {

    // debugger;

    let riesgo = Riesgos.findOne({ ramo: doc._id }, { fields: { numero: true } });

    if (riesgo) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen riesgos asociados al ramo <em>${ doc.descripcion }</em>; ejemplo: <em>riesgo número:
                               ${ riesgo.numero }</em>. El ramo no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    };

    let contrato = Contratos.findOne({ ramo: doc._id }, { fields: { numero: true } });

    if (contrato) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen contratos asociados al ramo <em>${ doc.descripcion }</em>; ejemplo: <em>contrato número:
                               ${ contrato.numero }</em>. El ramo no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    };

    let siniestro = Siniestros.findOne({ ramo: doc._id }, { fields: { numero: true } });

    if (siniestro) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen siniestros asociados al ramo <em>${ doc.descripcion }</em>; ejemplo: <em>siniestro número:
                               ${ siniestro.numero }</em>. El ramo no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    };                            
});
