
import { Meteor } from 'meteor/meteor'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 

Meteor.publish("emailsCobranzas", function () {
    return [
        CuentasBancarias.find(),
        Meteor.users.find(),
        EmailsCobranzaCuotasPendientes.find(),
    ];
});
