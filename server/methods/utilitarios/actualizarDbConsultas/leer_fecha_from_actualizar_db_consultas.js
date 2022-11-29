
import { Meteor } from 'meteor/meteor';

import { knex_sql_database } from '/server/imports/knex/knex_connection'; 

Meteor.methods(
    {
        // solo para leer la fecha en que el proceso de copia desde mongo a sql fue ejecutado la última vez 
        leer_fecha_from_actualizar_db_consultas: async function () {

            // primero que todo, leemos un registro desde la tabla Copia_db_consultas 
            // const copia_db_consultas = Copia_db_consultas.findOne({ tipoTablas: 'catalogos' });
            const copia_db_consultas = await knex_sql_database('copia_db_consultas').where({ tipoTablas: 'catalogos' }).select('*').first(); 

            if (!copia_db_consultas || !copia_db_consultas.fecha) {
                return {
                    error: false,
                    fecha: null 
                }
            } else {
                return {
                    error: false,
                    fecha: copia_db_consultas.fecha
                }
            }
        }
    })