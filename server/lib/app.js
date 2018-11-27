

Meteor.startup(function () {
    // environment variable que meteor usa para configurar la dirección usada para enviar e-mails
    // MAIL_URL = "smtp://USERNAME:PASSWORD@HOST:PORT/";
    process.env.MAIL_URL = Meteor.settings.mail_url;
  });

Accounts.onCreateUser(function(options, user) {
  // para agregar el rol 'admin' cuando el usuario crea el administrador
  if (user.emails && _.some(user.emails, (email) => { return email.address === 'admin@admin.com'; } )) {
      if (!user.roles || !_.some(user.roles, (rol) => { return rol === 'admin'; } )) {
          user.roles = [];
          user.roles.push('admin');
      };
  };

  return user;
});
