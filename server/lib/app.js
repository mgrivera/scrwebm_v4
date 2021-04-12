
import { Meteor } from 'meteor/meteor'; 
import { Accounts } from 'meteor/accounts-base'

import lodash from 'lodash'; 

Meteor.startup(function () {
    // environment variable que meteor usa para configurar la dirección usada para enviar e-mails
    // MAIL_URL = "smtp://USERNAME:PASSWORD@HOST:PORT/";
    process.env.MAIL_URL = Meteor.settings.mail_url;

    // just to know the version of mongodb driver 
    console.log("mongodb driver version: ", MongoInternals.NpmModules.mongodb.version)
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