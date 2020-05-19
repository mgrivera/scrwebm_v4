
import { Meteor } from 'meteor/meteor'; 

import { Riesgos } from '/imports/collections/principales/riesgos';   
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Remesas } from '/imports/collections/principales/remesas';  
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 

Monedas.before.remove(function (userId, doc) {
    // -------------------------------------------------------------------
    // riesgos
    const riesgo = Riesgos.findOne({
        $or: [
            { moneda: doc._id },
            { 'movimientos.coberturas.moneda': doc._id },
            { 'movimientos.coberturasCompanias.moneda': doc._id },
            { 'movimientos.primas.moneda': doc._id },
            { 'movimientos.productores.moneda': doc._id },
        ]
    },
        { fields: { numero: true } });

    if (riesgo) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen riesgos asociados a la moneda <em>${ doc.descripcion }</em>; ejemplo: <em>riesgo número:
                               ${ riesgo.numero }</em>. La moneda no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -------------------------------------------------------------------
    // contratos
    const contrato = Contratos.findOne({
        $or: [
            { 'capas.moneda': doc._id },
            { 'capasPrimasCompanias.moneda': doc._id },
            { 'cuentas.moneda': doc._id },
            { 'cuentas.cuentas.moneda': doc._id },
        ]
    },
        { fields: { numero: true } });

    if (contrato) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen contratos asociados a la moneda <em>${ doc.descripcion }</em>; ejemplo: <em>contrato número:
                               ${ contrato.numero }</em>. La moneda no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -------------------------------------------------------------------
    // siniestros
    const siniestro = Siniestros.findOne({
        $or: [
            { moneda: doc._id },
            { 'reservas.moneda': doc._id },
            { 'liquidaciones.moneda': doc._id },
        ]
    },
        { fields: { numero: true } });


    if (siniestro) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen siniestros asociados a la moneda <em>${ doc.descripcion }</em>; ejemplo: <em>siniestro número:
                               ${ siniestro.numero }</em>. La moneda no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -------------------------------------------------------------------
    // remesas
    const remesa = Remesas.findOne({ moneda: doc._id }, { fields: { numero: true } });

    if (remesa) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen remesas asociadas a la moneda <em>${ doc.descripcion }</em>; ejemplo: <em>remesa número:
                               ${ remesa.numero }</em>. La moneda no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -------------------------------------------------------------------
    // cuotas
    const cuota = Cuotas.findOne({ moneda: doc._id });

    if (cuota) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen cuotas asociadas a la moneda <em>${ doc.descripcion }</em>; ejemplo: <em>cuota para la entidad:
                               ${ cuota.source.origen } - ${ cuota.source.numero }</em>. La moneda no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})
