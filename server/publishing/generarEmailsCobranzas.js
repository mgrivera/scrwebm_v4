
import { Meteor } from 'meteor/meteor'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 

import { EmailsCobranzaCuotasPendientes } from '/imports/collections/otros/emailsCobranzaCuotasPendientes';

Meteor.publish("emailsCobranzas", function () {
    return [
        CuentasBancarias.find(),
        Meteor.users.find(),
        EmailsCobranzaCuotasPendientes.find(),
    ];
});
