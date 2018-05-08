
import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Remesas } from '/imports/collections/principales/remesas';  
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { Cuotas } from '/imports/collections/principales/cuotas'; 

EmpresasUsuarias.before.remove(function (userId, doc) {

    // -------------------------------------------------------------------
    // riesgos
    let riesgo = Riesgos.findOne({
        $or: [
            { cia: doc._id },
        ]
    },
        { fields: { numero: true } });

    if (riesgo) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen riesgos asociados a la compañía (usuaria) <em>${ doc.nombreCorto }</em>; ejemplo: <em>riesgo número:
                               ${ riesgo.numero }</em>. La compañía (usuaria) no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -------------------------------------------------------------------
    // contratos
    let contrato = Contratos.findOne({
        $or: [
            { cia: doc._id },
        ]
    },
        { fields: { numero: true } });

    if (contrato) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen contratos asociados a la compañía (usuaria) <em>${ doc.nombreCorto }</em>; ejemplo: <em>contrato número:
                               ${ contrato.numero }</em>. La compañía (usuaria) no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -------------------------------------------------------------------
    // siniestros
    let siniestro = Siniestros.findOne({
        $or: [
            { cia: doc._id },
        ]
    },
        { fields: { numero: true } });


    if (siniestro) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen siniestros asociados a la compañía (usuaria) <em>${ doc.nombreCorto }</em>; ejemplo: <em>siniestro número:
                               ${ siniestro.numero }</em>. La compañía (usuaria) no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -------------------------------------------------------------------
    // remesas
    let remesa = Remesas.findOne({
        $or: [
             { cia: doc._id },
     ]},
        { fields: { numero: true } });

    if (remesa) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen remesas asociadas a la compañía (usuaria) <em>${ doc.nombreCorto }</em>; ejemplo: <em>remesa número:
                               ${ remesa.numero }</em>. La compañía (usuaria) no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -------------------------------------------------------------------
    // cuotas
    let cuota = Cuotas.findOne({ cia: doc._id });

    if (cuota) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen cuotas asociadas a la compañía (usuaria) <em>${ doc.nombreCorto }</em>; ejemplo: <em>cuota para la entidad:
                               ${ cuota.source.origen } - ${ cuota.source.numero }</em>. La compañía (usuaria) no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})
