

import { Remesas } from '/imports/collections/principales/remesas';  
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 

CuentasBancarias.before.remove(function (userId, doc) {
    // -------------------------------------------------------------------------
    // remesas
    let remesa = Remesas.findOne({
        $or: [
            { 'instrumentoPago.cuentaBancaria': doc._id },
        ]
    },
        { fields: { numero: true } });

    if (remesa) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen remesas asociadas a la cuenta bancaria <em>${ doc.numero }</em>; ejemplo: <em>remesa:
                               ${ remesa.numero }</em>. La cuenta bancaria no puede ser eliminada.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})
