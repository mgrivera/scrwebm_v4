
import { Meteor } from 'meteor/meteor'; 
import { Accounts } from 'meteor/accounts-base'
import { knex_sql_database  } from '/server/imports/knex/knex_connection'; 

import lodash from 'lodash'; 

Meteor.startup(async function () {
    // environment variable que meteor usa para configurar la dirección usada para enviar e-mails
    // MAIL_URL = "smtp://USERNAME:PASSWORD@HOST:PORT/";
    process.env.MAIL_URL = Meteor.settings.mail_url;

    // just to know the version of mongodb driver 
    console.log("mongodb driver version: ", MongoInternals.NpmModules.mongodb.version); 

    // --------------------------------------------------------------------------------------------------
    // probamos que la conexión a la base de datos sql funcione correctamente 
    console.log("**************************************************************************************************"); 
    console.log(`Knex: Ok, ahora vamos a probar la conexión a la base de datos sql: "${Meteor.settings.knex.connection.database}" ...`);
    knex_sql_database.raw('select 1+1 as result')
        .then(() => { 
            console.log(`Knex: Ok, la conexión a la base de datos sql server: "${Meteor.settings.knex.connection.database}" ha sido exitosa.`)
            console.log("**************************************************************************************************"); 
        })
        .catch((err) => {
            console.log(`Knex: [Fatal] Failed to establish connection to sql database: "${Meteor.settings.knex.connection.database}".`);
            console.log(err);
            console.log("**************************************************************************************************"); 
        });
  });

Accounts.onCreateUser(function (options, user) {
    // un usuario que se llame admin es automáticamente administrador
    if (user.username && user.username === "admin") {
        if (!user.roles) {
            user.roles = [];
        }

        if (!lodash.some(user.roles, (rol) => { return rol === 'admin'; })) {
            user.roles.push('admin');
        }
    }

    return user;
})