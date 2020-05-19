
import { Meteor } from 'meteor/meteor'; 

import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 

Bancos.before.remove(function (userId, doc) {
    // -------------------------------------------------------------------------
    // cuentas bancarias
    const cuentaBancaria = CuentasBancarias.findOne({
        $or: [
            { banco: doc._id },
        ]
    },
        { fields: { numero: true } });

    if (cuentaBancaria) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen cuentas bancarias asociadas al banco <em>${ doc.nombre }</em>; ejemplo: <em>cuenta bancaria:
                               ${ cuentaBancaria.numero }</em>. El banco no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})
