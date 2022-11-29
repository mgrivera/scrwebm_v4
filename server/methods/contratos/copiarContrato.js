
import { Meteor } from 'meteor/meteor';
// import { Mongo } from 'meteor/mongo'; 
import lodash from 'lodash'; 

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

Meteor.methods(
    {
        // para copiar un contrato desde mongo --> sql. Nota: el usuario puede ejecutar este proceso muchas veces. El proceso 
        // primero intenta eliminar el contrato; solo luego lo graba a la base de datos (sql)
        copiar_contrato_a_db_consultas: async function (contratoId) {

            // primero que todo, leemos un registro desde la tabla Copia_db_consultas (sql)
            // const copia_db_consultas = Copia_db_consultas.findOne({ tipoTablas: 'catalogos' }); 
            const contratoExiste = await knex_sql_database('contratos').where({ _id: contratoId }).del();
            
            const result = await copiarContratoDesdeMongoASql(contratoId, contratoExiste);

            if (result.error) { 
                return result;
            }

            return { 
                error: false, 
                message: result.message ? result.message : '' 
            }
        }
    })

// ================================================================
// para copiar un mongo collection a un sql table
// ================================================================
const copiarContratoDesdeMongoASql = async (contratoId, contratoExiste) => {
    
    // leemos el contrato en mongo 
    const contrato = Contratos.findOne({ _id: contratoId });
    
    if (!contrato) { 
        return {
            error: true, 
            message: `Error inesperado: no pudimos leer el contrato en la base de datos (mongo). 
                     `
        }
    }

    // el objeto viene con algunos arrays que no serán registrados (insert) a la tabla principal (si, luego, a otras tablas)
    const contrato2 = lodash.cloneDeep(contrato);      // para tener un clone del contrato 

    delete contrato2.personas
    delete contrato2.capas
    delete contrato2.capasPrimasCompanias
    delete contrato2.cuentasTecnicas_definicion

    // intentamos grabar al sql 
    try { 
        console.log("Intentaremos grabar el contrato: ", JSON.stringify(contrato2, null, '\t'))
        await knex_sql_database("contratos").insert(contrato2);
        console.log("El contrato fue agregado sin errores aparentes!") 

        // copiamos las personas (si existen)
        if (Array.isArray(contrato.personas)) {
            for (const persona of contrato.personas) {
                const values = { ...persona, contratoId }
                await knex_sql_database("contratos_personas").insert(values);
            }
        }

        // copiamos los períodos (si existen)
        if (Array.isArray(contrato.cuentasTecnicas_definicion)) {
            for (const periodo of contrato.cuentasTecnicas_definicion) {
                const values = { ...periodo, contratoId }
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
            }
        }
    } catch(error) { 
        console.log("Error al agregar el contrato: ", JSON.stringify(error, null, '\t'))
        return {
            error: true,
            message: JSON.stringify(error, null, '\t')
        }
    }

    const message0 = contratoExiste ? `El contrato ya había sido copiado antes. Fue eliminado y vuelto a copiar. ` : ''; 
    const message = `Ok, el contrato <b>${contrato.numero}</b> ha sido copiado en forma correcta. <br /> ${message0}
                    `
    return {
        error: false, 
        message
    }
}

const copiar_tabla_contratos_proporcionales = async (items, table) => { 
    for (const item of items) {
        const item2 = { ...item };
        delete item2.contratoID;
        delete item2.definicionID;
        item2.periodoId = item.definicionID;

        await knex_sql_database(table).insert(item2);
    }
}