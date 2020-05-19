
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 
import { check } from 'meteor/check';

import { Remesas } from '/imports/collections/principales/remesas';  
import { Cuotas } from '/imports/collections/principales/cuotas'; 

Meteor.methods(
{
    // ---------------------------------------------------------------------------------------------------------------------------
    // método para, efectivamente, registrar en la remesa y cuotas cada uno de los pagos seleccionados por el usuario como pagos
    // que corresponden a la remesa
    // ---------------------------------------------------------------------------------------------------------------------------
    'cobranzas.grabarPagosIndicadosParaCuotasSeleccionadas': function (remesaID, pagosAAplicar) {
        check(remesaID, String);
        check(pagosAAplicar, [Object]);

        var self = this;

        // leemos la remesa
        var remesa = Remesas.findOne(remesaID);

        if (!remesa)
            throw new Meteor.Error("remesa-no-encontrada", "Error inesperado: la remesa indicada no pudo ser leída en la base de datos.");

        // ésto no debe ser para nada necesario; la remesa usada en este proceso no debe estar cerrada ni tener pagos asociados ...
        if (remesa.fechaCerrada)
            throw new Meteor.Error("remesa-cerrada", "Error inesperado: la remesa está cerrada; no debe estarlo, pues significa " +
                "que este proceso fue ejecutado antes para esta remesa.");

        if (remesa.pagos && remesa.pagos.length) {
            throw new Meteor.Error("remesa-con-pagos-asociados", "Error inesperado: la remesa seleccionada tiene pagos asociados.");
        }

        // grabamos cada pago indicado por el usuario como un pago a la remesa ...
        var cantidadPagosAplicados = 0;

        pagosAAplicar.forEach(function (pago) {

            var pagoCuota = {
                _id: new Mongo.ObjectID()._str,
                remesaID: remesa._id,
                remesaNumero: remesa.numero,
                moneda: remesa.moneda,
                fecha: remesa.fecha,
                monto: pago.monto,
                completo: pago.completo
            };

            // agregamos el pago a la cuota
            Cuotas.update({ _id: pago.cuotaID }, { $push: { pagos: pagoCuota } });
            cantidadPagosAplicados++;
        });

        // finalmente, cerramos la remesa
        Remesas.update({ _id: remesaID }, { $set: { fechaCerrada: new Date() } });

        // TODO: regresar cantidad de pagos aplicados para la remesa seleccionada ...
        var infoProceso = { mensaje: 'Ok, el proceso fue ejecutado en forma satisfactoria.',
                            cantidadPagosAplicados: cantidadPagosAplicados
                          };
        return infoProceso;
    }
})