
import { Meteor } from 'meteor/meteor'; 

Meteor.startup(function () {
    // environment variable que meteor usa para configurar la dirección usada para enviar e-mails
    // MAIL_URL = "smtp://USERNAME:PASSWORD@HOST:PORT/";
    process.env.MAIL_URL = Meteor.settings.mail_url;

    // just to know the version of mongodb driver 
    console.log("mongodb driver version: ", MongoInternals.NpmModules.mongodb.version)
  });

Accounts.onCreateUser(function(options, user) {
  // para agregar el rol 'admin' cuando el usuario crea el administrador
  if (user.emails && lodash.some(user.emails, (email) => { return email.address === 'admin@admin.com'; } )) {
      if (!user.roles || !lodash.some(user.roles, (rol) => { return rol === 'admin'; } )) {
          user.roles = [];
          user.roles.push('admin');
      }
  }

  return user;
})