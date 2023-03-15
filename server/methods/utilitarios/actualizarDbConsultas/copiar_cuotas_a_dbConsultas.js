
import { Meteor } from 'meteor/meteor';
// import { Mongo } from 'meteor/mongo'; 
import lodash from 'lodash'; 
import numeral from 'numeral'; 

import { knex_sql_database } from '/server/imports/knex/knex_connection';

import { Cuotas } from '/imports/collections/principales/cuotas';
import { Catalogos_deletedItems } from '/imports/collections/general/catalogos_deletedItems';

// NOTA IMPORTANTE: los procesos en este method no leen records usando la compañía seleccionada por el usuario. 
// Los procesos leen y actualizan todas la cuotas en la base de datos, no solo las que corresponden a la compañía 
// seleccionada por el usuario. Cambiar esto en el futuro sería super fácil, por supuesto, si fuese más apropiado 
// hacerlo de esa manera. 

Meteor.methods({
    // ===================================================================================================================
    // para leer las cuotas que no tienen una fecha en el field fechaCopiadaSql y copiarlas desde mongo a sql 
    // ===================================================================================================================
    copiar_cuotas_a_dbConsultas: async function () {

        let cuotas_copiadas = 0;
        let cuotas_con_pagos = 0;
        let pagos_copiados = 0;

        // leemos cuotas sin fechaCopiadaSql o con fechaCopiadaSql en null 
        const cuotas = Cuotas.find({ $or: [{ fechaCopiadaSql: { $exists: false } }, { fechaCopiadaSql: { $eq: null } }] }).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = cuotas.length;
        let reportarCada = Math.floor(numberOfItems / 20);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 2;
        let currentProcess = 1;
        let messageProc = `leyendo y copiando las cuotas ... `

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "copiar_cuotas_a_sql_server_reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'copiar_cuotas_a_sql_server' };
        let eventData = {
            current: currentProcess, max: numberOfProcess, progress: '0 %',
            messageProc: messageProc
        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        for (const cuota of cuotas) {
            // antes de copiar la cuota, la eliminamos, pues puede existir 
            await knex_sql_database('cuotas').where({ _id: cuota._id }).del();

            // 2.2) modify in mongo (set fechaCopiadaSql to today) 
            const cuota2 = lodash.cloneDeep(cuota);

            cuota2.source_entity_id = cuota.source.entityID;
            cuota2.source_subEntity_id = cuota.source.subEntityID;
            cuota2.source_origen = cuota.source.origen;
            cuota2.source_numero = cuota.source.numero;

            cuota2.protegida = cuota.protegida?.protegida ? cuota.protegida?.protegida : null;
            cuota2.protegida_razon = cuota.protegida?.razon ? cuota.protegida?.razon : null;

            delete cuota2.source;
            delete cuota2.pagos;
            delete cuota2.emailsEnviados;
            delete cuota2.protegida;
            delete cuota2.docState;
            delete cuota2.fechaCopiadaSql;

            await knex_sql_database('cuotas').insert(cuota2);

            // -------------------------------------------------------------------------------------------------------------
            // si la cuota tiene pagos, debemos registrarlos en forma separada en sql 
            if (Array.isArray(cuota.pagos) && cuota.pagos.length) { 

                cuotas_con_pagos++; 

                for (const pago of cuota.pagos) { 

                    const pago2 = lodash.cloneDeep(pago);

                    pago2.cuota_id = cuota._id;
                    pago2.remesa_id = pago.remesaID;

                    delete pago2.remesaID;
                    delete pago2.remesaNumero;

                    try { 
                        await knex_sql_database('cuotas_pagos').insert(pago2);
                        pagos_copiados++; 
                    } catch(error) { 
                        const message = JSON.stringify(error, null, 2);
                        return { 
                            error: true, 
                            message 
                        }
                    }
                }
            }

            // finalmente, modificamos la cuota en mongo para agregar una fechaCopiadaSql 
            Cuotas.update({ _id: cuota._id }, { $set: { fechaCopiadaSql: new Date() } });

            cuotas_copiadas++;

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                    current: currentProcess, max: numberOfProcess,
                    progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                    message: messageProc
                };
                Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                        current: currentProcess, max: numberOfProcess,
                        progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                        message: messageProc
                    };
                    Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        }

        // -------------------------------------------------------------------------------------------------------------
        // Ahora revisamos a ver si se han eliminado cuotas desde mongo; de ser así, las eliminamos desde sql 
        let cuotas_eliminadas = 0;
        const cuotas_eliminadas_en_mongo = Catalogos_deletedItems.find({ collection: "cuotas" }).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = cuotas_eliminadas_en_mongo.length;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        messageProc = `eliminando cuotas que ya se habían eliminado antes `

        eventData = {
            current: currentProcess, max: numberOfProcess, progress: '0 %',
            message: messageProc
        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        if (Array.isArray(cuotas_eliminadas_en_mongo) && cuotas_eliminadas_en_mongo.length) { 
            for (const cuotaEliminada of cuotas_eliminadas_en_mongo) { 
                await knex_sql_database('cuotas').where({ _id: cuotaEliminada._id }).del();
                cuotas_eliminadas++; 

                // -------------------------------------------------------------------------------------------------------
                // vamos a reportar progreso al cliente; solo 20 veces ...
                cantidadRecs++;
                if (numberOfItems <= 20) {
                    // hay menos de 20 registros; reportamos siempre ...
                    eventData = {
                        current: currentProcess, max: numberOfProcess,
                        progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                        message: messageProc
                    };
                    Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                }
                else {
                    reportar++;
                    if (reportar === reportarCada) {
                        eventData = {
                            current: currentProcess, max: numberOfProcess,
                            progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                            message: messageProc
                        };
                        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                        reportar = 0;
                    }
                }
            // -------------------------------------------------------------------------------------------------------
            }
        }

        // solo finalmente, eliminamos los items en la tabla de cuotas eliminadas 
        Catalogos_deletedItems.remove({ collection: "cuotas" });

        const message = `Ok, <b>${cuotas_copiadas.toString()}</b> cuotas han sido leídas y copiadas a la <em>base de datos de consultas</em>.<br /> 
                         Para las cuotas que se han copiado, <b>${cuotas_con_pagos}</b> tenían pagos asociados. <br /> 
                         En total, se han copiado <b>${pagos_copiados}</b> registros de pago, para las cuotas mencionadas. <br /> 
                         También se han eliminado <b>${cuotas_eliminadas}</b> cuotas que habían sido eliminadas por diversos procesos que efectúo el usuario. 
                        `

        return {
            error: false,
            message
        }
    }, 

    // ===================================================================================================================
    // para quitar la fechaCopiadaSql en las cuotas que la tienen y así preparar la cuota para que sea copiada nuevamente 
    // desde mongo a sql 
    // ===================================================================================================================
    copiar_cuotas_a_dbConsultas_reiniciar: async function () {

        let cuotas_leidas = 0;

        // 1) leer cuotas sin fechaCopiadaSql o con fechaCopiadaSql en null 
        const cuotas = Cuotas.find({ fechaCopiadaSql: { $exists: true }}).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        const numberOfItems = cuotas.length;
        const reportarCada = Math.floor(numberOfItems / 20);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 1;
        const currentProcess = 1;
        const messageProc = `leyendo las cuotas y modificándolas para que sean copiadas nuevamente ... `

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "copiar_cuotas_a_sql_server_reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'copiar_cuotas_a_sql_server' };
        let eventData = {
            current: currentProcess, max: numberOfProcess, progress: '0 %',
            messageProc: messageProc
        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        for (const cuota of cuotas) {
            // lo *único* que hacemos en este proceso es poner el field fechaCopiadaSql en nulls; nada más ... 
            Cuotas.update({ _id: cuota._id }, { $set: { fechaCopiadaSql: null } });

            cuotas_leidas++;

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                    current: currentProcess, max: numberOfProcess,
                    progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                    message: messageProc
                };
                Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                        current: currentProcess, max: numberOfProcess,
                        progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                        message: messageProc
                    };
                    Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        }

        const message = `Ok, <b>${cuotas_leidas.toString()}</b> cuotas han sido leídas y modificadas, para que 
                         sean copiadas <b>nuevamente</b> a la <em>base de datos de consultas</em>, cuando el proceso  
                         que efectúa la copia sea ejecutado nuevamente.
                         `

        return {
            error: false,
            message
        }
    }
})