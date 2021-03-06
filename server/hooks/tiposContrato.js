
import { Meteor } from 'meteor/meteor'; 

import { Contratos } from '/imports/collections/principales/contratos'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 

TiposContrato.before.remove(function (userId, doc) {

    const contrato = Contratos.findOne({
        $or: [
            { tipo: doc._id },
        ]
    },
        { fields: { numero: true } });

    if (contrato) {
        throw new Meteor.Error("dataBaseError",
                               "Existen registros asociados.",
                               `Existen contratos asociados al tipo de contrato <em>${ doc.descripcion }</em>; ejemplo: <em>contrato:
                               ${ contrato.numero }</em>. El tipo de contrato no puede ser eliminado.<br />
                               <b>Nota importante:</b> si otros registros fueron editados,
                               <em>pudieron haber sido grabados</em> en forma satisfactoria.`);
    }
})