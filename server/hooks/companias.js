
import { Meteor } from 'meteor/meteor'; 

import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Remesas } from '/imports/collections/principales/remesas';  
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 

Companias.before.remove(function (userId, doc) {
    // -----------------------------------------------------------------------
    // riesgos
    const riesgo = Riesgos.findOne({
        $or: [
            { compania: doc._id },
            { corredor: doc._id },
            { 'movimientos.companias.compania': doc._id },
            { 'movimientos.coberturasCompanias.compania': doc._id },
            { 'movimientos.primas.compania': doc._id },
            { 'movimientos.productores.compania': doc._id },
            { 'personas.compania': doc._id },
        ]
    },
        { fields: { numero: true } });

    if (riesgo) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen riesgos asociados a la compañía <em>${ doc.nombre }</em>; ejemplo: <em>riesgo número:
                               ${ riesgo.numero }</em>. La compañía no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -----------------------------------------------------------------------
    // contratos
    const contrato = Contratos.findOne({
        $or: [
            { compania: doc._id },
            { 'capas.reaseguradores.compania': doc._id },
            { 'capasPrimasCompaniasCompanias.compania': doc._id },
            { 'cuentas.reaseguradores.compania': doc._id },
            { 'cuentas.cuentas.cuentasTecnicas.compania': doc._id },
            { 'personas.compania': doc._id },
        ]
    },
        { fields: { numero: true } });

    if (contrato) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen contratos asociados a la compañía <em>${ doc.nombre }</em>; ejemplo: <em>contrato número:
                               ${ contrato.numero }</em>. La compañía no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -----------------------------------------------------------------------
    // siniestros
    const siniestro = Siniestros.findOne({
        $or: [
            { compania: doc._id },
            { 'companias.compania': doc._id },
            { 'personas.compania': doc._id },
        ]
    },
        { fields: { numero: true } });


    if (siniestro) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen siniestros asociados a la compañía <em>${ doc.nombre }</em>; ejemplo: <em>siniestro número:
                               ${ siniestro.numero }</em>. La compañía no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -----------------------------------------------------------------------
    // remesas
    const remesa = Remesas.findOne({
        $or: [
             { compania: doc._id },
             { 'remesas.cuadre.partidas.compania': doc._id },
     ]},
        { fields: { numero: true } });

    if (remesa) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen remesas asociadas a la compañía <em>${ doc.nombre }</em>; ejemplo: <em>remesa número:
                               ${ remesa.numero }</em>. La compañía no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }

    // -----------------------------------------------------------------------
    // cuotas
    const cuota = Cuotas.findOne({ compania: doc._id });

    if (cuota) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen cuotas asociadas a la compañía <em>${ doc.nombre }</em>; ejemplo: <em>cuota para la entidad:
                               ${ cuota.source.origen } - ${ cuota.source.numero }</em>. La compañía no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})
