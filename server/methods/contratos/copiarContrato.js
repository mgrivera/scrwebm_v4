
import { Meteor } from 'meteor/meteor';
// import { Mongo } from 'meteor/mongo'; 
import lodash from 'lodash'; 
import numeral from 'numeral'; 

import { knex_sql_database } from '/server/imports/knex/knex_connection';

import { Contratos } from '/imports/collections/principales/contratos'; 

import { ContratosProp_cuentas_resumen } from '/imports/collections/principales/contratos'; 
import { ContratosProp_cuentas_distribucion } from '/imports/collections/principales/contratos';
import { ContratosProp_cuentas_saldos } from '/imports/collections/principales/contratos'; 

// nótese que los contratos proporcionales tienen *todos* sus datos relacionados en collections 
// separados. En sql, las tablas para el contrato son, básicamente, iguales, pero su nombre 
// comienza en minúscula, en vez de mayúscula 
import { ContratosProp_comAdic_resumen } from "/imports/collections/principales/contratos";    
import { ContratosProp_comAdic_distribucion } from "/imports/collections/principales/contratos";    
import { ContratosProp_comAdic_montosFinales } from "/imports/collections/principales/contratos";    

import { ContratosProp_entCartPr_resumen } from "/imports/collections/principales/contratos";   
import { ContratosProp_entCartPr_distribucion } from "/imports/collections/principales/contratos";   
import { ContratosProp_entCartPr_montosFinales } from "/imports/collections/principales/contratos";   

import { ContratosProp_entCartSn_resumen } from "/imports/collections/principales/contratos";  
import { ContratosProp_entCartSn_distribucion } from "/imports/collections/principales/contratos";   
import { ContratosProp_entCartSn_montosFinales } from "/imports/collections/principales/contratos";   

import { ContratosProp_retCartPr_resumen } from "/imports/collections/principales/contratos";   
import { ContratosProp_retCartPr_distribucion } from "/imports/collections/principales/contratos";   
import { ContratosProp_retCartPr_montosFinales } from "/imports/collections/principales/contratos";   

import { ContratosProp_retCartSn_resumen } from "/imports/collections/principales/contratos";   
import { ContratosProp_retCartSn_distribucion } from "/imports/collections/principales/contratos";   
import { ContratosProp_retCartSn_montosFinales } from "/imports/collections/principales/contratos";   

import { ContratosProp_partBeneficios_resumen } from "/imports/collections/principales/contratos";   
import { ContratosProp_partBeneficios_distribucion } from "/imports/collections/principales/contratos";  
import { ContratosProp_partBeneficios_montosFinales } from "/imports/collections/principales/contratos";  

import { Catalogos_deletedItems } from '/imports/collections/general/catalogos_deletedItems';

Meteor.methods(
    {
        // para copiar un contrato desde mongo --> sql. Nota: el usuario puede ejecutar este proceso muchas veces. El proceso 
        // primero intenta eliminar el contrato; solo luego lo graba a la base de datos (sql)
        copiar_contrato_a_db_consultas: async function () {

            let contratos_copiados = 0; 
            let message0 = ""; 

            // leemos contratos sin fechaCopiadaSql o con fechaCopiadaSql en null 
            const contratos = Contratos.find({ $or: [{ fechaCopiadaSql: { $exists: false } }, { fechaCopiadaSql: { $eq: null } }] }, { fields: { _id: true }}).fetch();

            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            let numberOfItems = contratos.length;
            let reportarCada = Math.floor(numberOfItems / 20);
            let reportar = 0;
            let cantidadRecs = 0;
            const numberOfProcess = 2;
            let currentProcess = 1;
            let messageProc = `leyendo y copiando los contratos ... `

            // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
            const eventName = "copiar_contratos_a_sql_server_reportProgress";
            const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'copiar_contratos_a_sql_server' };
            let eventData = {
                current: currentProcess, max: numberOfProcess, progress: '0 %',
                messageProc: messageProc
            };

            // sync call
            Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            // -------------------------------------------------------------------------------------------------------------

            for (const contrato of contratos) {

                const result = await copiarContratos(contrato._id); 

                if (result.error) { 
                    return result; 
                }

                message0 += `<br />${result.message}`; 
                
                // finalmente, modificamos la cuota en mongo para agregar una fechaCopiadaSql 
                Contratos.update({ _id: contrato._id }, { $set: { fechaCopiadaSql: new Date() } });

                contratos_copiados++;

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
            // Ahora revisamos a ver si se han eliminado contratos desde mongo; de ser así, los eliminamos desde sql 
            let contratos_eliminados = 0;
            let deletedCuotas = 0; 
            const items_eliminados_en_mongo = Catalogos_deletedItems.find({ collection: "contratos" }).fetch();

            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            numberOfItems = items_eliminados_en_mongo.length;
            reportarCada = Math.floor(numberOfItems / 20);
            reportar = 0;
            cantidadRecs = 0;
            currentProcess = 2;
            messageProc = `eliminando contratos que ya se habían eliminado antes `

            eventData = {
                current: currentProcess, max: numberOfProcess, progress: '0 %',
                message: messageProc
            };

            // sync call
            Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            // -------------------------------------------------------------------------------------------------------------

            if (Array.isArray(items_eliminados_en_mongo) && items_eliminados_en_mongo.length) {
                for (const itemEliminado of items_eliminados_en_mongo) {

                    const contratoId = itemEliminado.itemId; 

                    await knex_sql_database('contratos').where({ _id: contratoId }).del();
                    contratos_eliminados++;

                    // si el contrato tiene cuotas, debemos eliminarlas también 
                    const deletedItems = await knex_sql_database('cuotas').where({ source_entity_id: contratoId }).del();
                    if (deletedItems) { 
                        deletedCuotas += deletedItems; 
                    }
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

            // solo finalmente, eliminamos los items en la tabla de items eliminados desde mongo
            Catalogos_deletedItems.remove({ collection: "contratos" });

            const message = `Ok, <b>${contratos_copiados.toString()}</b> contratos han sido leídos y copiados a la <em>base de datos de consultas</em>.<br /> 
                         También se han eliminado <b>${contratos_eliminados.toString()}</b> contratos que habían sido eliminados por por el usuario antes. <br /> 
                         Las cuotas de contratos eliminados han sido, también, eliminadas:  <b>${deletedCuotas.toString()}</b>. <br /> 
                         ${message0}
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
        copiar_contratos_a_dbConsultas_reiniciar: async function () {

            let contratos_leidos = 0;

            // 1) leer cuotas sin fechaCopiadaSql o con fechaCopiadaSql en null 
            const contratos = Contratos.find({ fechaCopiadaSql: { $exists: true } }).fetch();

            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            const numberOfItems = contratos.length;
            const reportarCada = Math.floor(numberOfItems / 20);
            let reportar = 0;
            let cantidadRecs = 0;
            const numberOfProcess = 1;
            const currentProcess = 1;
            const messageProc = `leyendo los contratos y modificándolos para que sean copiados nuevamente ... `

            // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
            const eventName = "copiar_contratos_a_sql_server_reportProgress";
            const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'copiar_contratos_a_sql_server' };
            let eventData = {
                current: currentProcess, max: numberOfProcess, progress: '0 %',
                messageProc: messageProc
            };

            // sync call
            Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            // -------------------------------------------------------------------------------------------------------------

            for (const contrato of contratos) {
                // lo *único* que hacemos en este proceso es poner el field fechaCopiadaSql en nulls; nada más ... 
                Contratos.update({ _id: contrato._id }, { $set: { fechaCopiadaSql: null } });

                contratos_leidos++;

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

            const message = `Ok, <b>${contratos_leidos.toString()}</b> contratos han sido leídos y modificados, para que 
                         sean copiados <b>nuevamente</b> a la <em>base de datos de consultas</em>, cuando el proceso  
                         que efectúa esta copia sea ejecutado nuevamente.
                         `

            return {
                error: false,
                message
            }
        }
    })

// ----------------------------------------------------------------------------------------------------------
// para copiar cada contrato 
// ---------------------------------------------------------------------------------------------------------- 
const copiarContratos = async function(contratoId) { 

    // ----------------------------------------------------------------------------------------------------------
    // intentamos eliminar el contrato; puede o no existir; además determinamos si ya había sido copiado 
    // antes  
    const contratoExisteEnSql = await knex_sql_database('contratos').where({ _id: contratoId }).del();

    // ----------------------------------------------------------------------------------------------------------
    // leemos el contrato en mongo 
    const contratoMongo = Contratos.findOne({ _id: contratoId });

    if (!contratoMongo) {
        return {
            error: true,
            message: `Error inesperado: no pudimos leer el contrato en la base de datos (mongo). 
                     `
        }
    }

    let result = {};
    let message = ``;

    // ----------------------------------------------------------------------------------------------------------
    // ahora intentamos copiar *solo* la parte general del contrato (y sus personas, si existen)
    result = await copiarContratoDesdeMongoASql_parteGeneral(contratoMongo, contratoExisteEnSql);

    if (result.error) {
        return result;
    }

    message = result.message;

    // ----------------------------------------------------------------------------------------------------------
    // si el contrato es de tipo proporcional, copiamos sus tablas 
    result = await copiarContratoDesdeMongoASql_parteProp(contratoMongo);

    if (result.error) {
        return result;
    }

    message += `<br />${result.message}`;

    // ----------------------------------------------------------------------------------------------------------
    // si el contrato es de tipo NO proporcional, copiamos sus tablas 
    result = await copiarContratoDesdeMongoASql_parteNoProp(contratoMongo);

    if (result.error) {
        return result;
    }

    return { 
        error: false, 
        message
    }
}

// ========================================================================================
// para copiar la info general del contrato (y sus personas, si existen)
// ========================================================================================
const copiarContratoDesdeMongoASql_parteGeneral = async (contratoMongo, contratoExisteEnSql) => {

    // el objeto viene con algunos arrays que no serán registrados (insert) a la tabla principal (si, luego, a otras tablas)
    const contrato2 = lodash.cloneDeep(contratoMongo);      // para tener un clone del contrato 

    if (!contrato2.cedenteOriginal) { 
        contrato2.cedenteOriginal = contrato2.compania; 
    }

    delete contrato2.personas
    delete contrato2.capas
    delete contrato2.capasPrimasCompanias
    delete contrato2.cuentasTecnicas_definicion
    delete contrato2.fechaCopiadaSql
    delete contrato2.renovacion; 

    if (contratoMongo?.renovacion?.renovadoPor) {
        contrato2.renovadoPor = contratoMongo.renovacion.renovadoPor;
    }

    if (contratoMongo?.renovacion?.renuevaAl) {
        contrato2.renuevaAl = contratoMongo.renovacion.renuevaAl;
    }

    // intentamos grabar al sql 
    await knex_sql_database("contratos").insert(contrato2);

    // copiamos las personas (si existen)
    if (Array.isArray(contratoMongo.personas)) {
        for (const persona of contratoMongo.personas) {
            const values = { ...persona, contrato_id: contratoMongo._id };
            await knex_sql_database("contratos_personas").insert(values);
        }
    }

    const message0 = contratoExisteEnSql ? `El contrato <em>ya había sido copiado antes</em>. Fue eliminado y vuelto a copiar. ` : '';
    const message = `Ok, el contrato <b>${contratoMongo.numero}</b> ha sido copiado en forma correcta. <br /> ${message0}
                    `
    return {
        error: false,
        message
    }
}

// ========================================================================================
// para copiar un mongo collection a un sql table
// ========================================================================================
const copiarContratoDesdeMongoASql_parteProp = async (contratoMongo) => {
    
    // el objeto viene con algunos arrays que no serán registrados (insert) a la tabla principal (si, luego, a otras tablas)
    const contrato2 = lodash.cloneDeep(contratoMongo);      // para tener un clone del contrato 

    delete contrato2.personas
    delete contrato2.capas
    delete contrato2.capasPrimasCompanias
    delete contrato2.cuentasTecnicas_definicion

    let message = `Sin parte <em>proporcional</em> en el contrato que pueda ser grabada. `; 

    // intentamos grabar al sql 
    // copiamos los períodos (si existen)
    if (Array.isArray(contratoMongo.cuentasTecnicas_definicion)) {
        for (const periodo of contratoMongo.cuentasTecnicas_definicion) {

            const values = { ...periodo, contrato_id: contratoMongo._id }
            await knex_sql_database("contratos_cuentas_periodos").insert(values);

            // para cada período del contrato proporcional, grabamos sus diferentes collections a tablas en sql 
            // nótese que cada período tiene sus cuentas en tres collections separadas 

            // ========================================================================================================
            // cuentas técnicas 
            // ========================================================================================================
            const resumen = ContratosProp_cuentas_resumen.find({ definicionID: periodo._id }).fetch();
            await copiar_tabla_contratos_proporcionales(resumen, "contratos_cuentas_periodos_resumen"); 

            const distribucion = ContratosProp_cuentas_distribucion.find({ definicionID: periodo._id }).fetch();
            await copiar_tabla_contratos_proporcionales(distribucion, "contratos_cuentas_periodos_distribucion"); 

            const saldos = ContratosProp_cuentas_saldos.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(saldos, "contratos_cuentas_periodos_saldos"); 

            // ========================================================================================================
            // comisión adicional 
            // ========================================================================================================
            const resumen_comAdic = ContratosProp_comAdic_resumen.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(resumen_comAdic, "contratos_cuentas_periodos_comAdic_resumen"); 
            const distribucion_comAdic = ContratosProp_comAdic_distribucion.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(distribucion_comAdic, "contratos_cuentas_periodos_comAdic_distribucion"); 
            const montos_comAdic = ContratosProp_comAdic_montosFinales.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(montos_comAdic, "contratos_cuentas_periodos_comAdic_montosFinales"); 

            // ========================================================================================================
            // entrada cartera primas
            // ========================================================================================================
            const resumen_entCartPr = ContratosProp_entCartPr_resumen.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(resumen_entCartPr, "contratos_cuentas_periodos_entCartPr_resumen"); 
            const distribucion_entCartPr = ContratosProp_entCartPr_distribucion.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(distribucion_entCartPr, "contratos_cuentas_periodos_entCartPr_distribucion"); 
            const montos_entCartPr = ContratosProp_entCartPr_montosFinales.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(montos_entCartPr, "contratos_cuentas_periodos_entCartPr_montosFinales"); 

            // ========================================================================================================
            // entrada cartera siniestros
            // ========================================================================================================
            const resumen_entCartSn = ContratosProp_entCartSn_resumen.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(resumen_entCartSn, "contratos_cuentas_periodos_entCartSn_resumen"); 
            const distribucion_entCartSn = ContratosProp_entCartSn_distribucion.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(distribucion_entCartSn, "contratos_cuentas_periodos_entCartSn_distribucion"); 
            const montos_entCartSn = ContratosProp_entCartSn_montosFinales.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(montos_entCartSn, "contratos_cuentas_periodos_entCartSn_montosFinales"); 

            // ========================================================================================================
            // ret cart primas
            // ========================================================================================================
            const resumen_retCartPr = ContratosProp_retCartPr_resumen.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(resumen_retCartPr, "contratos_cuentas_periodos_retCartPr_resumen"); 
            const distribucion_retCartPr = ContratosProp_retCartPr_distribucion.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(distribucion_retCartPr, "contratos_cuentas_periodos_retCartPr_distribucion"); 
            const montos_retCartPr = ContratosProp_retCartPr_montosFinales.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(montos_retCartPr, "contratos_cuentas_periodos_retCartPr_montosFinales"); 

            // ========================================================================================================
            // retirada cartera siniestros
            // ========================================================================================================
            const resumen_retCartSn = ContratosProp_retCartSn_resumen.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(resumen_retCartSn, "contratos_cuentas_periodos_retCartSn_resumen"); 
            const distribucion_retCartSn = ContratosProp_retCartSn_distribucion.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(distribucion_retCartSn, "contratos_cuentas_periodos_retCartSn_distribucion"); 
            const montos_retCartSn = ContratosProp_retCartSn_montosFinales.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(montos_retCartSn, "contratos_cuentas_periodos_retCartSn_montosFinales"); 

            // ========================================================================================================
            // participación de beneficios 
            // ========================================================================================================
            const resumen_partBeneficios = ContratosProp_partBeneficios_resumen.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(resumen_partBeneficios, "contratos_cuentas_periodos_partBeneficios_resumen"); 
            const distribucion_partBeneficios = ContratosProp_partBeneficios_distribucion.find({ definicionID: periodo._id }).fetch();  
            await copiar_tabla_contratos_proporcionales(distribucion_partBeneficios, "contratos_cuentas_periodos_partBeneficios_distribucion"); 
            const montos_partBeneficios = ContratosProp_partBeneficios_montosFinales.find({ definicionID: periodo._id }).fetch();    
            await copiar_tabla_contratos_proporcionales(montos_partBeneficios, "contratos_cuentas_periodos_partBeneficios_montosFinales"); 

            message = `<b>Contrato proporcional:</b> La información proporcional del contrato ha sido grabada.`; 
        }
    }

    return {
        error: false, 
        message
    }
}

// ========================================================================================
// para copiar, en forma genérica, cada tabla para el contrato proporcional 
// pueden ser muchas (ej: cuentas, ret/ent cart pr, ret/ent car sin, etc) 
// ========================================================================================
const copiar_tabla_contratos_proporcionales = async (items, table) => { 
    for (const item of items) {
        const item2 = { ...item };
        delete item2.contratoID;
        delete item2.definicionID;
        item2.periodo_id = item.definicionID;

        await knex_sql_database(table).insert(item2);
    }
}

// ========================================================================================
// para copiar la parte no proporcional (ie: capas) del contrato (si existe!)
// ========================================================================================
const copiarContratoDesdeMongoASql_parteNoProp = async (contratoMongo) => {

    // el objeto viene con algunos arrays que no serán registrados (insert) a la tabla principal (si, luego, a otras tablas)
    const contrato2 = lodash.cloneDeep(contratoMongo);      // para tener un clone del contrato 

    delete contrato2.personas
    delete contrato2.capas
    delete contrato2.capasPrimasCompanias
    delete contrato2.cuentasTecnicas_definicion

    let message = `Sin parte <em>no proporcional</em> en el contrato que pueda ser grabada. `; 

    // intentamos grabar al sql 
    // copiamos los capas (si existen) y sus reaseguradores 
    if (Array.isArray(contratoMongo.capas)) {
        for (const capa of contratoMongo.capas) {

            const values = { ...capa, contrato_id: contratoMongo._id }
            delete values.reaseguradores; 

            await knex_sql_database("contratos_capas").insert(values);

            if (Array.isArray(capa.reaseguradores)) {
                for (const reasegurador of capa.reaseguradores) {

                    const values2 = { ...reasegurador, capa_id: capa._id }
                    await knex_sql_database("contratos_capas_reaseguradores").insert(values2);
                }
            }
        }
    }

    // copiamos primas para cada capa
    if (Array.isArray(contratoMongo.capasPrimasCompanias)) {
        for (const prima of contratoMongo.capasPrimasCompanias) {

            const values3 = { 
                ...prima,                               // agregamos todos los keys en el objeto original 
                capa_id: prima.capaID,                  // en sql, llamamos a este key 'capa_id', en vez de 'capaID' 
                contrato_id: contratoMongo._id          // en sql, agregamos el _id del contrato a la tabla 
            }

            delete values3.capaID;                      // elimiamos el key original, pues ahora se llama: capa_id 
            await knex_sql_database("contratos_capas_primasCompanias").insert(values3);  
        }
    }

    message = `<b>Contrato no proporcional:</b> La información no proporcional del contrato ha sido grabada.`; 

    return {
        error: false,
        message
    }
}