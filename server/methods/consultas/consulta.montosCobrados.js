
import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';

import { check } from 'meteor/check';
import { Match } from 'meteor/check'

import moment from 'moment'; 

import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Temp_consulta_montosCobrados, Temp_consulta_montosCobrados2 } from '/imports/collections/consultas/temp_consulta_montosCobrados';
import { Temp_consulta_montosCobrados_config } from '/imports/collections/consultas/temp_consulta_montosCobrados';

import { Riesgos } from '/imports/collections/principales/riesgos';
import { Contratos } from '/imports/collections/principales/contratos';
import { Siniestros } from '/imports/collections/principales/siniestros';

Meteor.methods(
    {
        'consulta.montosCobrados': async function (filtro) {

            check(filtro, Match.ObjectIncluding({ cia: String }));

            // antes que nada, eliminamos del collection de la consulta, los registros de la consulta anterior
            Temp_consulta_montosCobrados.remove({ user: this.userId });
            Temp_consulta_montosCobrados2.remove({ user: this.userId });

            // los dates pueden venir como strings; además, las fechas hasta siempre deben ser: ... 23:59:59 ... 
            filtro = prepararFechasEnFiltro(filtro);

            // ------------------------------------------------------------------------------
            // preparamos el pipeline para el mongodb aggregate 
            let match = { $and: [] };

            match['$and'].push({ pagos: { $exists: true, $ne: [] } });      // solo cuotas con items en el array 'pagos' 

            match['$and'].push({ cia: filtro.cia });
            match['$and'].push({ 'pagos.monto': { $lt: 0 }});               // solo cobros (monto negativo)

            if (filtro.periodoCobros1) {
                match['$and'].push({ 'pagos.fecha': { $gte: filtro.periodoCobros1 } });     // solo cobros para el período indicado 
            }

            if (filtro.periodoCobros2) {
                match['$and'].push({ 'pagos.fecha': { $lte: filtro.periodoCobros2 } });     // solo cobros para el período indicado 
            }

            if (filtro.monedas && Array.isArray(filtro.monedas) && filtro.monedas.length) {     // el usuario puede filtrar por moneda 
                match['$and'].push({ 'pagos.moneda': { $in: filtro.monedas } });
            }

            if (filtro.companias && Array.isArray(filtro.companias) && filtro.companias.length) {   // el usuario puede filtrar por compañía 
                match['$and'].push({ compania: { $in: filtro.companias } });
            } 

            if (filtro.tipoNegocio && Array.isArray(filtro.tipoNegocio) && filtro.tipoNegocio.length) {   
                // el usuario puede filtrar por tipo de negocio (proporcionales, no prop, facultativo, siniestros)
                match['$and'].push({ 'source.origen': { $in: filtro.tipoNegocio } });
            }

            // preparamos un 2do filtro para *omitir* pagos (cobros!) que no correspondan al período. Ahora, el filtro puede traer 
            // cobros con varios pagos, aunque no es frecuente. Algunos de esos pagos (cobros) pueden *no* corresponder al 
            // período indicado 
            const match2 = { $and: [] };

            match2['$and'].push({ 'pagos.monto': { $lt: 0 } });               // solo cobros (monto negativo)

            if (filtro.periodoCobros1) {
                match2['$and'].push({ 'pagos.fecha': { $gte: filtro.periodoCobros1 } });     // solo cobros para el período indicado 
            }

            if (filtro.periodoCobros2) {
                match2['$and'].push({ 'pagos.fecha': { $lte: filtro.periodoCobros2 } });     // solo cobros para el período indicado 
            }

            if (filtro.monedas && Array.isArray(filtro.monedas) && filtro.monedas.length) {     // el usuario puede filtrar por moneda 
                match2['$and'].push({ 'pagos.moneda': { $in: filtro.monedas } });
            }

            let pipeline = [
                { $match: match }, 

                { $unwind: '$pagos' }, 

                { $match: match2 }, 

                {
                    $lookup:
                    {
                        from: "monedas",                        // este es el foreign collection 
                        let: { monedaId: "$moneda" },           // estos son los local fields; pueden ser definidos como variables  
                        pipeline: [
                            {
                                $match:
                                    // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                                    // $$ para referenciar variables en let; $ para referenciar fields en el foreign collection 
                                    { $expr: { $eq: ["$$monedaId", "$_id"] } }
                            },
                            { $project: { _id: 1, descripcion: 1, simbolo: 1, } }
                        ],
                        as: "monedasCuota"
                    }
                },

                {
                    $lookup:
                    {
                        from: "monedas",                                // este es el foreign collection 
                        let: { monedaId: "$pagos.moneda" },             // estos son los local fields; pueden ser definidos como variables  
                        pipeline: [
                            {
                                $match:
                                    // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                                    // $$ para referenciar variables en let; $ para referenciar fields en el foreign collection 
                                    { $expr: { $eq: ["$$monedaId", "$_id"] } }
                            },
                            { $project: { _id: 1, descripcion: 1, simbolo: 1, } }
                        ],
                        as: "monedasPago"
                    }
                },

                {
                    $lookup:
                    {
                        from: "companias",                        // este es el foreign collection 
                        let: { companiaId: "$compania" },           // estos son los local fields; pueden ser definidos como variables  
                        pipeline: [
                            {
                                $match:
                                    // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                                    { $expr: { $eq: ["$$companiaId", "$_id"] } }
                            },
                            { $project: { _id: 1, nombre: 1, abreviatura: 1, } }
                        ],
                        as: "companias"
                    }
                }, 

                { $unwind: '$monedasCuota' }, 
                { $unwind: '$monedasPago' }, 
                { $unwind: '$companias' }, 

                { $project: { "moneda": 0, "compania": 0 }}, 

                { $project: { 
                    _id: 1,
                    source: 1,
                    numero: 1,
                    cantidad: 1,
                    fecha: 1,
                    fechaVencimiento: 1,
                    monto: 1,
                    pago: "$pagos",
                    monedaCuota: "$monedasCuota",
                    monedaPago: "$monedasPago", 
                    compania: "$companias",
                    cuotaId: 1,
                    user: 1
                }}
            ]

            const cobros = await Cuotas.rawCollection().aggregate(pipeline).toArray(); 

            for (const cobro of cobros) { 
                // cuando una cuota tiene varios cobros, al hacer el unwind de este array, el _id se va a repetir; 
                // en realidad el _id es el _id de la cuota. Lo preservamos y usamos como _id el del pago, que es siempre único 
                cobro.cuotaId = cobro._id; 
                cobro._id = cobro.pago._id; 
                cobro.user = this.userId; 

                Temp_consulta_montosCobrados.insert(cobro); 
            }

            // -----------------------------------------------------------------------------------------------------
            // recorremos los registros agregados para agregar: ramo y asegurado; nota: el asegurado solo se agrega 
            // para items que corresponden a negocios del tipo facultativo (riesgos y siniestros) 
            const items = Temp_consulta_montosCobrados.find({ user: this.userId }, { fields: { _id: 1, source: 1 }}).fetch(); 

            for (const item of items) { 

                let parentEntity = {}; 

                switch(item.source.origen) { 
                    case "fac": {
                        parentEntity = Riesgos.findOne(item.source.entityID, { fields: { _id: 0, ramo: 1, asegurado: 1 } }); 
                        break;
                    }
                    case "cuenta": 
                    case "capa": {
                        parentEntity = Contratos.findOne(item.source.entityID, { fields: { _id: 0, ramo: 1 } });
                        break;
                    }
                    case "sinFac": {
                        parentEntity = Siniestros.findOne(item.source.entityID, { fields: { _id: 0, ramo: 1, asegurado: 1 } });
                        break;
                    }
                    default: { 
                        parentEntity = { ramo: null, asegurado: null }; 
                    }
                }

                // el parent entity debe siempre existir; pueden, sin embargo, haber errores como cuotas sin parent ... 
                if (!parentEntity) { 
                    continue; 
                }

                // agregamos el key 'asegurado' pues no viene para contratos 
                if (item.source.origen === 'cuenta' || item.source.origen === 'capa') {
                    parentEntity.asegurado = null; 
                }

                // ahora que tenemos el ramo, actualizamos el item en el collection 
                Temp_consulta_montosCobrados.update(item._id, { $set: { ramo: parentEntity.ramo, asegurado: parentEntity.asegurado }}, 
                                                              { multi: false }); 
            }

            // --------------------------------------------------------------------------------------------------------
            // ahora recorremos la tabla 'temp' para hacer lookouts a los collections de asegurados y ramos 
            // nota: para cuotas que provienen de contratos no existirá un asegurado 
            match = { $and: [] };
            match['$and'].push({ user: this.userId });      // solo los items agregados antes 

            pipeline = [
                { $match: match },

                {
                    $lookup:
                    {
                        from: "ramos",                        // este es el foreign collection 
                        let: { ramoId: "$ramo" },           // estos son los local fields; pueden ser definidos como variables  
                        pipeline: [
                            {
                                $match:
                                    // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                                    // $$ para referenciar variables en let; $ para referenciar fields en el foreign collection 
                                    { $expr: { $eq: ["$$ramoId", "$_id"] } }
                            },
                            { $project: { _id: 1, descripcion: 1, abreviatura: 1, } }
                        ],
                        as: "ramos"
                    }
                },

                {
                    $lookup:
                    {
                        from: "asegurados",                        // este es el foreign collection 
                        let: { aseguradoId: "$asegurado" },           // estos son los local fields; pueden ser definidos como variables  
                        pipeline: [
                            {
                                $match:
                                    // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                                    { $expr: { $eq: ["$$aseguradoId", "$_id"] } }
                            },
                            { $project: { _id: 1, nombre: 1, abreviatura: 1, } }
                        ],
                        as: "asegurados"
                    }
                },

                { $unwind: '$ramos' },
                // para contratos, el lookup al collection de asegurados no encontrará ningún item; sin embargo, queremos el item 
                { $unwind: { path: '$asegurados', preserveNullAndEmptyArrays: true }},

                { $project: { "ramo": 0, "asegurado": 0 } },

                {
                    $project: {
                        _id: 1,
                        source: 1,
                        numero: 1,
                        cantidad: 1,
                        fecha: 1,
                        fechaVencimiento: 1,
                        monto: 1,
                        pago: 1,
                        monedaCuota: 1, 
                        monedaPago: 1, 
                        compania: 1, 

                        ramo: "$ramos",
                        asegurado: "$asegurados",

                        user: 1
                    }
                }, 

                // nótese que en el merge que sigue nunca ocurrira 'whenMatched' pues siempre serán registros nuevos 
                { $merge: { into: "temp_consulta_montosCobrados2", on: "_id", whenMatched: "replace", whenNotMatched: "insert" } }
            ]

            await Temp_consulta_montosCobrados.rawCollection().aggregate(pipeline).toArray(); 

            // finalmente, agregamos un asegurado vacío cuando no hay uno (caso contratos) 
            Temp_consulta_montosCobrados2.update({ user: this.userId, asegurado: { $exists: 0 }}, 
                { $set: { asegurado: { _id: '', nombre: '', abreviatura: '' } }}, 
                { multi: true }); 

            return {
                error: false,
                message: `Ok, la consulta de primas cobradas se ha ejecutao en forma exitosa ...`
            };
        }, 

        'consultas.montosCobrados.getRecCount': function (userId) {

            check(userId, String);

            const recordCount = Temp_consulta_montosCobrados2.find({ user: userId }).count();

            return {
                error: false,
                recordCount
            }
        }, 

        'consulta.montosCobrados.report.grabarAMongoOpcionesReporte': function (opcionesReporte, empresaSeleccionada) {

            new SimpleSchema({
                opcionesReporte: { type: Object, blackbox: true, optional: false, },
                empresaSeleccionada: { type: Object, blackbox: true, optional: false, },
            }).validate({ opcionesReporte, empresaSeleccionada, });

            Temp_consulta_montosCobrados_config.remove({ user: Meteor.userId() });

            // grabamos un registro 'config' para que el proceso asp.net pueda saber el valor de algunos parámetros, 
            // como período, compañía, etc. 
            Temp_consulta_montosCobrados_config.insert({
                opcionesReporte: opcionesReporte,
                compania: empresaSeleccionada,
                user: Meteor.userId()
            });

            return {
                error: false,
                message: "Ok, las opciones del reporte han sido registradas.<br />" +
                    "Ud. debe hacer un <em>click</em> en el <em>link</em> que se ha mostrado, para obtener el reporte. "
            }
        }
    })

function prepararFechasEnFiltro(filtro) {

    const f = { ...filtro };

    f.periodoCobros1 = moment(f.periodoCobros1).isValid() ? moment(f.periodoCobros1).toDate() : null;
    f.periodoCobros2 = moment(f.periodoCobros2).isValid() ? moment(f.periodoCobros2).toDate() : null;
    
    // la fecha final del período debe ser el último momento del día, para que incluya cualquier fecha de ese día 
    f.periodoCobros2 = f.periodoCobros2 ? new Date(f.periodoCobros2.getFullYear(), f.periodoCobros2.getMonth(), f.periodoCobros2.getDate(), 23, 59, 59) : null;
    
    return f;
}