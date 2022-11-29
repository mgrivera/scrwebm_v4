
import { Meteor } from 'meteor/meteor';
// import { Mongo } from 'meteor/mongo'; 

import { knex_sql_database } from '/server/imports/knex/knex_connection'; 

import { Monedas } from '/imports/collections/catalogos/monedas';
import { Companias } from '/imports/collections/catalogos/companias';
import { Ramos } from '/imports/collections/catalogos/ramos';
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato';
import { Suscriptores } from '/imports/collections/catalogos/suscriptores';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';

import { Catalogos_deletedItems } from '/imports/collections/general/catalogos_deletedItems'; 

Meteor.methods(
    {
        // este método efectúa una copia de las tablas Catálogos, desde mongo --> sql. 
        // La idea es usar esta db sql para accederla desde Microsoft Access y poner allí 
        // todo tipo de consultas. Ya sabemos que resulta mucho más fácil hacer este tipo de 
        // cosas desde Access que desde Javascript (y en el browser, etc) 
        actualizar_db_consultas: async function () {

            // primero que todo, leemos un registro desde la tabla Copia_db_consultas (sql)
            // const copia_db_consultas = Copia_db_consultas.findOne({ tipoTablas: 'catalogos' }); 
            const copia_db_consultas = await knex_sql_database('copia_db_consultas').where({ tipoTablas: 'catalogos' }).first('*'); 

            if (!copia_db_consultas || !copia_db_consultas.fecha) { 
                // no hay un registro en la tabla; ello quiere decir que este proceso debe leer *todos* los items en las tablas 
                // para registrar todo a sql server. Normalmente, esto ocurre la 1ra vez. También si el usuario quiere copiar 
                // todos los registros nuevamente (una razón puede ser que los registros no fueron copiados adecuadamente antes) 
                agregarFechaUltAct_a_registrosQueNoTienenUna(); 
                const filter = {};   // para copiar *todos* los registros, desde mongo a sql 
                const result = await copiar_desde_mongo_a_sql(filter); 
                return result; 
            } else { 
                // Ok, este es el caso normal. Este proceso se ha ejecutado antes. 
                // leemos y copiamos *solo* los items que se han agregado/editado en forma *posterior* a la última vez que este 
                // proceso fue ejecutado 

                // para copiar *solo* los registros que se han editado *luego* de la última vez
                const filter = { $and: [ { ultAct: { $exists: true }}, { ultAct: { $ne: null }}, { ultAct: { $gt: copia_db_consultas.fecha } } ]}; 
                const result = await copiar_desde_mongo_a_sql(filter);
                return result; 
            }
        }
    })

// ==============================================================================
// para actualizar la fecha (ultAct) en los registros que aún no tienen una
// nota: este proceso solo se ejecuta cuando la copia se efectúa para *todos*
// los registros
// ==============================================================================
const agregarFechaUltAct_a_registrosQueNoTienenUna = () => {
    // -------------------------------------------------------------------------------------------------------------
    // nos aseguramos de agregar una fecha a los registros que no la tengan; esta es la fecha en el que el registro 
    // fue editado por última vez. Esta es una copia completa, todos los registros serán copiados  
    // los registros que aún no tienen una fecha es porqué no se han editado luego de implementar este proceso. Ahora
    // estos registros (catálogos), al ser editados, reciben una fecha de ultima edición. 
    const ultAct = new Date();
    Monedas.update({ $or: [{ ultAct: null }, { ultAct: { $exists: false } }] }, { $set: { ultAct } }, { multi: true });
    Ramos.update({ $or: [{ ultAct: null }, { ultAct: { $exists: false } }] }, { $set: { ultAct } }, { multi: true });
    TiposContrato.update({ $or: [{ ultAct: null }, { ultAct: { $exists: false } }] }, { $set: { ultAct } }, { multi: true });
    Suscriptores.update({ $or: [{ ultAct: null }, { ultAct: { $exists: false } }] }, { $set: { ultAct } }, { multi: true });
    EmpresasUsuarias.update({ $or: [{ ultAct: null }, { ultAct: { $exists: false } }] }, { $set: { ultAct } }, { multi: true });
}

// ================================================================
// para copiar un mongo collection a un sql table
// ================================================================
const copiar_desde_mongo_a_sql = async (filter) => {
    
    let result1 = {};
    let result2 = {};
    let finalMessage = "";
    let items_copiados = false;

    // -------------------------------------------------------------------------------------------------------------
    // Monedas 
    // -------------------------------------------------------------------------------------------------------------
    const monedas = Monedas.find(filter).fetch();
    result1 = await mongoCollection_copiar_a_sql("monedas", monedas);

    if (result1.error) {
        return {
            error: true,
            message: `Ha ocurrido un error al intentar ejecutar este proceso: <br /><br />${result1.message}`
        }
    }

    // ahora debemos leer la tabla de eliminaciones; debemos eliminar estos items en sql db 
    result2 = await leerTablaEliminacionesYActualizarSql("monedas");

    if (result1.count_modificados || result1.count_agregados || result2.sql_deleted_items || result2.mongo_deleted_items) {
        items_copiados = true;

        const message = `Monedas agregadas: ${result1.count_agregados} - 
                                     Monedas actualizadas: ${result1.count_modificados} - 
                                     Monedas eliminadas - scrwebm: ${result2.mongo_deleted_items} - 
                                     Monedas eliminadas - db copia: ${result2.sql_deleted_items}
                                    `;
        finalMessage += finalMessage ? `<br />${message}` : message;
    }

    // -------------------------------------------------------------------------------------------------------------
    // Compañías 
    // -------------------------------------------------------------------------------------------------------------
    const companias = Companias.find(filter).fetch();
    result1 = await companias_copiar_a_sql("companias", companias);

    if (result1.error) {
        return {
            error: true,
            message: `Ha ocurrido un error al intentar ejecutar este proceso: <br /><br />${result1.message}`
        }
    }

    // ahora debemos leer la tabla de eliminaciones; debemos eliminar estos items en sql db 
    result2 = await leerTablaEliminacionesYActualizarSql("companias");

    if (result1.count_modificados || result1.count_agregados || result2.sql_deleted_items || result2.mongo_deleted_items) {
        items_copiados = true;

        const message = `Compañías agregadas: ${result1.count_agregados} - 
                                     Compañías actualizadas: ${result1.count_modificados} - 
                                     Compañías eliminadas - scrwebm: ${result2.mongo_deleted_items} - 
                                     Compañías eliminadas - db copia: ${result2.sql_deleted_items}
                                    `;
        finalMessage += finalMessage ? `<br />${message}` : message;
    }

    // -------------------------------------------------------------------------------------------------------------
    // Ramos 
    // -------------------------------------------------------------------------------------------------------------
    const ramos = Ramos.find(filter).fetch();
    result1 = await mongoCollection_copiar_a_sql("ramos", ramos);

    if (result1.error) {
        return {
            error: true,
            message: `Ha ocurrido un error al intentar ejecutar este proceso: <br /><br />${result1.message}`
        }
    }

    // ahora debemos leer la tabla de eliminaciones; debemos eliminar estos items en sql db 
    result2 = await leerTablaEliminacionesYActualizarSql("ramos");

    if (result1.count_modificados || result1.count_agregados || result2.sql_deleted_items || result2.mongo_deleted_items) {
        items_copiados = true;

        const message = `Ramos agregadas: ${result1.count_agregados} - 
                                     Ramos actualizadas: ${result1.count_modificados} - 
                                     Ramos eliminadas - scrwebm: ${result2.mongo_deleted_items} - 
                                     Ramos eliminadas - db copia: ${result2.sql_deleted_items}
                                    `;
        finalMessage += finalMessage ? `<br />${message}` : message;
    }

    // -------------------------------------------------------------------------------------------------------------
    // TiposContrato 
    // -------------------------------------------------------------------------------------------------------------
    const tiposContrato = TiposContrato.find(filter).fetch();
    result1 = await mongoCollection_copiar_a_sql("tiposContrato", tiposContrato);

    if (result1.error) {
        return {
            error: true,
            message: `Ha ocurrido un error al intentar ejecutar este proceso: <br /><br />${result1.message}`
        }
    }

    // ahora debemos leer la tabla de eliminaciones; debemos eliminar estos items en sql db 
    result2 = await leerTablaEliminacionesYActualizarSql("tiposContrato");

    if (result1.count_modificados || result1.count_agregados || result2.sql_deleted_items || result2.mongo_deleted_items) {
        items_copiados = true;

        const message = `TiposContrato agregadas: ${result1.count_agregados} - 
                                     TiposContrato actualizadas: ${result1.count_modificados} - 
                                     TiposContrato eliminadas - scrwebm: ${result2.mongo_deleted_items} - 
                                     TiposContrato eliminadas - db copia: ${result2.sql_deleted_items}
                                    `;
        finalMessage += finalMessage ? `<br />${message}` : message;
    }

    // -------------------------------------------------------------------------------------------------------------
    // Suscriptores 
    // -------------------------------------------------------------------------------------------------------------
    const suscriptores = Suscriptores.find(filter).fetch();
    result1 = await mongoCollection_copiar_a_sql("suscriptores", suscriptores);

    if (result1.error) {
        return {
            error: true,
            message: `Ha ocurrido un error al intentar ejecutar este proceso: <br /><br />${result1.message}`
        }
    }

    // ahora debemos leer la tabla de eliminaciones; debemos eliminar estos items en sql db 
    result2 = await leerTablaEliminacionesYActualizarSql("suscriptores");

    if (result1.count_modificados || result1.count_agregados || result2.sql_deleted_items || result2.mongo_deleted_items) {
        items_copiados = true;

        const message = `Suscriptores agregadas: ${result1.count_agregados} - 
                                     Suscriptores actualizadas: ${result1.count_modificados} - 
                                     Suscriptores eliminadas - scrwebm: ${result2.mongo_deleted_items} - 
                                     Suscriptores eliminadas - db copia: ${result2.sql_deleted_items}
                                    `;
        finalMessage += finalMessage ? `<br />${message}` : message;
    }

    // -------------------------------------------------------------------------------------------------------------
    // EmpresasUsuarias 
    // -------------------------------------------------------------------------------------------------------------
    const empresasUsuarias = EmpresasUsuarias.find(filter).fetch();
    result1 = await mongoCollection_copiar_a_sql("empresasUsuarias", empresasUsuarias);

    if (result1.error) {
        return {
            error: true,
            message: `Ha ocurrido un error al intentar ejecutar este proceso: <br /><br />${result1.message}`
        }
    }

    // ahora debemos leer la tabla de eliminaciones; debemos eliminar estos items en sql db 
    result2 = await leerTablaEliminacionesYActualizarSql("empresasUsuarias");

    if (result1.count_modificados || result1.count_agregados || result2.sql_deleted_items || result2.mongo_deleted_items) {
        items_copiados = true;

        const message = `EmpresasUsuarias agregadas: ${result1.count_agregados} - 
                                     EmpresasUsuarias actualizadas: ${result1.count_modificados} - 
                                     EmpresasUsuarias eliminadas - scrwebm: ${result2.mongo_deleted_items} - 
                                     EmpresasUsuarias eliminadas - db copia: ${result2.sql_deleted_items}
                                    `;
        finalMessage += finalMessage ? `<br />${message}` : message;
    }

    // -------------------------------------------------------------------------------------------------------
    // finalmente, actualizamos la tabla CopiaDBConsultas, para poner la fecha y hora actual 
    await knex_sql_database("copia_db_consultas").where({ tipoTablas: 'catalogos' }).del();
    await knex_sql_database("copia_db_consultas").insert({ tipoTablas: 'catalogos', fecha: new Date() });

    let message = "";
    if (items_copiados) {
        message = `Ok, el proceso se ha ejecutado en forma satisfactoria. En total:  <br /><br />${finalMessage}`
    } else {
        message = `Ok, el proceso se ha ejecutado en forma satisfactoria. <br />
                               <b>Nota:</b> no hemos encontrado <b>ningún</b> registro que copiar. <br /> 
                               Este proceso <b>no</b> ha copiado registros a la <em>base de datos de consultas</em>.  
                               `
    }

    return {
        error: false,
        message
    }
}

// ================================================================
// para copiar un mongo collection a un sql table
// ================================================================
const mongoCollection_copiar_a_sql = async (table, items) => {

    let count_agregados = 0; 
    let count_modificados = 0; 

    for (const item of items) { 
        try {
            // leemos el item en sql server; si existe lo actualizamos; si no existe, lo agregamos 
            const result = await knex_sql_database(table).where({ _id: item._id }).first('*');

            // TODO: leer item en sql server 
            // existe: update ... 
            // no existe: insert ... 
            if (result) {
                // el registro existe en sql; lo actualizamos 
                await knex_sql_database(table).update(item).where({ _id: item._id });
                count_modificados++;
            } else {
                // el registro no existe en sql; lo agregamos 
                await knex_sql_database(table).insert(item);
                count_agregados++;
            }

        } catch (error) {
            return {
                error: true, 
                message: error
            }
        }
    }

    return { 
        error: false, 
        count_modificados, 
        count_agregados
    }
}

// ================================================================
// para copiar un mongo collection a un sql table
// ================================================================
const companias_copiar_a_sql = async (table, items) => {

    let count_agregados = 0;
    let count_modificados = 0;

    for (const item of items) {
        try {
            // leemos el item en sql server; si existe lo actualizamos; si no existe, lo agregamos 
            const result = await knex_sql_database(table).where({ _id: item._id }).first('*');

            // TODO: leer item en sql server 
            // existe: update ... 
            // no existe: insert ... 
            if (result) {
                // el registro existe en sql; lo actualizamos  - nota: debemos quitar el array de personas cuando exista 
                const item2 = { ...item };
                delete item2.personas; 
                await knex_sql_database(table).update(item2).where({ _id: item._id });
                count_modificados++;

                // -----------------------------------------------------------------------------------------------------
                // ya modificamos los datos de la compañía. Ahora vamos a registrar sus personas  
                await knex_sql_database("personas").where({ companiaId: item._id }).del();      // eliminamos antes las personas que puedan existir

                if (Array.isArray(item.personas)) {
                    for (const persona of item.personas) {
                        await knex_sql_database("personas").insert({ ...persona, companiaId: item._id });
                    }
                }
            } else {
                // el registro no existe en sql; lo agregamos - nota: debemos quitar el array de personas cuando exista 
                const item2 = { ...item }; 
                delete item2.personas; 
                await knex_sql_database(table).insert(item2);
                count_agregados++;

                // -----------------------------------------------------------------------------------------------------
                // agregamos una compañía; debemos agregar sus personas, si existen 
                if (Array.isArray(item.personas)) {
                    for (const persona of item.personas) { 
                        await knex_sql_database("personas").insert({ ...persona, companiaId: item._id });
                    }
                }
            }
        } catch(error) { 
            return {
                error: true,
                message: error
            }
        }
    }

    return {
        error: false,
        count_modificados,
        count_agregados
    }
}

// ======================================================================
// para eliminar en sql los items que el usuario ha eliminado en mongo
// ======================================================================

const leerTablaEliminacionesYActualizarSql = async (mongoCollection) => { 

    // primero leemos los registros eliminados para la tabla específica 
    const deletedItems = Catalogos_deletedItems.find({ collection: mongoCollection }).fetch(); 

    let sql_deleted_items = 0; 
    let mongo_deleted_items = 0; 

    for (const item of deletedItems) { 
        try { 
            // eliminamos cada item en sql 
            const result = await knex_sql_database(mongoCollection).where({ _id: item.itemId }).del();
            if (result) {
                // del() regresa la cantidad de items eliminados; en este caso siempre sería 1, pues eliminamos por pk 
                // tembién podría ser 0, por supuesto, si el item no existe en sql 
                sql_deleted_items++;
            } 
        } catch(error) { 
            return {
                error: true,
                message: error
            }
        }
    }

    // finalmente, elimiamos los registros en la tabla de eliminaciones (mongo) 
    mongo_deleted_items = Catalogos_deletedItems.remove({ collection: mongoCollection }); 

    return { 
        error: false, 
        sql_deleted_items, 
        mongo_deleted_items
    }
}