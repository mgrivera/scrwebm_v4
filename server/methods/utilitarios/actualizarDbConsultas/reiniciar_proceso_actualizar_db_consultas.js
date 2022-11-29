
import { Meteor } from 'meteor/meteor';

import { knex_sql_database } from '/server/imports/knex/knex_connection';

Meteor.methods(
    {
        // este proceso elimina el registro que pueda existir en la tabla (sql): copia_db_consultas. La idea es que la próxima vez que el 
        // usuario ejecute el proceso de copia, este se comporte como si fuera a primera copia 
        reiniciar_proceso_actualizar_db_consultas: async function () {

            // primero que todo, leemos un registro desde la tabla Copia_db_consultas 
            // const copia_db_consultas = Copia_db_consultas.findOne({ tipoTablas: 'catalogos' });
            await knex_sql_database('copia_db_consultas').where({ tipoTablas: 'catalogos' }).del();

            const message = `Ok, la fecha de ejecución del <em>proceso de copia</em> ha sido eliminada. <br /> 
                            El resultado de esta acción es que la próxima ejecución del proceso de <em>copia a la base de datos de consultas</em>, 
                            se comportará como si fuera la <b>primera</b> vez que se ejecuta, y <b>todos</b> los registros serán refrescados en 
                            la <em>base de datos de consultas</em>. 
                           `; 

            return {
                error: false,
                message
            }
        }
    })