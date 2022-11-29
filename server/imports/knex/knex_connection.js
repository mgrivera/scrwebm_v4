
import { Meteor } from 'meteor/meteor'
import knex from 'knex'; 

const config = {
    client: Meteor.settings.knex.client,

    connection: {
        server: Meteor.settings.knex.connection.host,
        user: Meteor.settings.knex.connection.user,
        password: Meteor.settings.knex.connection.password,
        database: Meteor.settings.knex.connection.database, 

        options: {
            port: Meteor.settings.knex.connection.port
        }
    }, 
    
    debug: true
}

const knex_sql_database = knex(config)
export { knex_sql_database }; 