
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
        copiarCatalogos_a_db_consultas: async function () {

            // para copiar *solo* los registros que se han editado *luego* de la última vez
            const filter = { $or: [ { fechaCopiadaSql: { $exists: false }}, { fechaCopiadaSql: { $eq: null }} ]}; 
            const result = await copiar_desde_mongo_a_sql(filter);
            return result; 
        }
    })

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

    // *marcamos* los registros para indicar que fueron copiados; nota: para registros nuevos o modificados por el usuario, 
    // esta fecha no existirá y el registro será copiado con la próxima copia  
    Monedas.update(filter, { $set: { fechaCopiadaSql: new Date() }}, { multi: true });

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

    // *marcamos* los registros para indicar que fueron copiados; nota: para registros nuevos o modificados por el usuario, 
    // esta fecha no existirá y el registro será copiado con la próxima copia  
    Companias.update(filter, { $set: { fechaCopiadaSql: new Date() } }, { multi: true });

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

    // *marcamos* los registros para indicar que fueron copiados; nota: para registros nuevos o modificados por el usuario, 
    // esta fecha no existirá y el registro será copiado con la próxima copia  
    Ramos.update(filter, { $set: { fechaCopiadaSql: new Date() } }, { multi: true });

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

    // *marcamos* los registros para indicar que fueron copiados; nota: para registros nuevos o modificados por el usuario, 
    // esta fecha no existirá y el registro será copiado con la próxima copia  
    TiposContrato.update(filter, { $set: { fechaCopiadaSql: new Date() } }, { multi: true });

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

    // *marcamos* los registros para indicar que fueron copiados; nota: para registros nuevos o modificados por el usuario, 
    // esta fecha no existirá y el registro será copiado con la próxima copia  
    Suscriptores.update(filter, { $set: { fechaCopiadaSql: new Date() } }, { multi: true });

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

    // *marcamos* los registros para indicar que fueron copiados; nota: para registros nuevos o modificados por el usuario, 
    // esta fecha no existirá y el registro será copiado con la próxima copia  
    EmpresasUsuarias.update(filter, { $set: { fechaCopiadaSql: new Date() } }, { multi: true });

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
        // este field puede venir; pero no existe en sql 
        delete item.fechaCopiadaSql; 

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

        // este field puede venir; pero no existe en sql 
        delete item.fechaCopiadaSql; 

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
        // eliminamos cada item en sql 
        const result = await knex_sql_database(mongoCollection).where({ _id: item.itemId }).del();
        if (result) {
            // del() regresa la cantidad de items eliminados; en este caso siempre sería 1, pues eliminamos por pk 
            // tembién podría ser 0, por supuesto, si el item no existe en sql 
            sql_deleted_items++;
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