
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 

import * as lodash from 'lodash'; 

import { Cuotas } from 'imports/collections/principales/cuotas'; 
import { Remesas } from 'imports/collections/principales/remesas'; 
import { ReconversionMonetaria_log } from 'imports/collections/otros/reconversionMonetaria_log'; 

Meteor.methods(
{
    'reconversionMonetaria': function (monedaDefault, parametros, companiaSeleccionada) {

        // calcumos el divisor en base a la cantidad de dígitos indicada 
        let divisor = 1;

        for (let i = 1; i <= parametros.cantidadDigitos; i++) {
            divisor = divisor * 10;
        }

        const cuotas = Cuotas.find({ cia: companiaSeleccionada._id, moneda: monedaDefault._id }).fetch(); 

        let cantidadCuotasActualizadas = 0; 
        let cantidadPagosActualizados = 0; 
        let cantidadCuotasPendientes = 0; 
        let cantidadCuotasConPagosAsociados = 0; 

        for (const cuota of cuotas) { 

            // actualizamos los montos de la cuota (original y monto) 
            const montoOriginal2 = lodash.round(cuota.montoOriginal / divisor, 2); 
            const monto2 = lodash.round(cuota.monto / divisor, 2); 

            Cuotas.update({ _id: cuota._id, }, { $set: { montoOriginal: montoOriginal2, monto: monto2, }}); 

            if (cuota.pagos && Array.isArray(cuota.pagos) && cuota.pagos.length) { 

                for (const pago of cuota.pagos) { 

                    if (pago.moneda === monedaDefault._id) { 

                        // actualizamos el monto del pago ... 
                        const monto2 = lodash.round(pago.monto / divisor, 2); 

                        Cuotas.update({ _id: cuota._id, "pagos._id": pago._id }, { $set: { "pagos.$.monto": monto2, }}); 

                        // vamos contando los pagos que se han actualizado 
                        cantidadPagosActualizados = cantidadPagosActualizados + cuota.pagos.length; 
                    }
                }

                cantidadCuotasConPagosAsociados++; 

            } else { 
                cantidadCuotasPendientes++; 
            }

            cantidadCuotasActualizadas++; 
        }

        let message = `Proceso de reconversión ejecutado en forma satisfactoria.
                       La cantidad de dígitos indicada fue ${parametros.cantidadDigitos.toString()} y el divisor que resultó es ${divisor.toString()}.
                       En total, ${cantidadCuotasActualizadas.toString()} cuotas fueron actualizadas; 
                       de las cuales: ${cantidadCuotasPendientes.toString()} estaban aún pendientes;  
                       ${cantidadCuotasConPagosAsociados.toString()} tenían pagos asociados. 
                       ${cantidadPagosActualizados.toString()} pagos (para estas cuotas) fueron actualizados.
                    `; 

            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        // agregamos un registro al log  
        ReconversionMonetaria_log.insert({ 
            _id: new Mongo.ObjectID()._str, 
            fecha: new Date(), 
            descripcion: message, 
            cantidadDigitos: parametros.cantidadDigitos, 
            user: Meteor.user().emails[0].address, 
            cia: companiaSeleccionada._id, 
        })

        return { 
            error: false, 
            message: "Ok, el proceso de reconversión ha sido efectuado en forma satisfactoria.", 
        }
    }, 

    'reconversionMonetaria_Remesas': function (monedaDefault, parametros, companiaSeleccionada) {

        // calcumos el divisor en base a la cantidad de dígitos indicada 
        let divisor = 1;

        for (let i = 1; i <= parametros.cantidadDigitos; i++) {
            divisor = divisor * 10;
        }

        // nótese como, deliveradamente, solo seleccionamos remesas anteriores al 22Ago2019 
        const fechaHasta = new Date(2018, 8, 22); 
        const remesas = Remesas.find({ cia: companiaSeleccionada._id, moneda: monedaDefault._id, fecha: { $lt: fechaHasta }, 'instrumentoPago.monto': { $exists: true }}).fetch(); 

        let cantidadRemesasActualizadas = 0; 
        let cantidadRemesasLeidas = 0; 

        for (const remesa of remesas) { 

            // actualizamos los montos de la remesa
            const monto2 = lodash.round(remesa.instrumentoPago.monto / divisor, 2); 

            Remesas.update({ _id: remesa._id, }, { $set: { 'instrumentoPago.monto': monto2 }}); 

            cantidadRemesasActualizadas++; 
            cantidadRemesasLeidas++; 
        }

        let message = `Proceso de reconversión Remesas ejecutado en forma satisfactoria. <br /><br /> 
                       La cantidad de dígitos indicada fue ${parametros.cantidadDigitos.toString()} y el divisor que resultó es ${divisor.toString()}.
                       En total, ${cantidadRemesasLeidas.toString()} remesas fueron leídas y, de éstas, ${cantidadRemesasActualizadas.toString()} fueron actualizadas. 
                    `; 

            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        // agregamos un registro al log  
        ReconversionMonetaria_log.insert({ 
            _id: new Mongo.ObjectID()._str, 
            fecha: new Date(), 
            descripcion: message, 
            cantidadDigitos: parametros.cantidadDigitos, 
            user: Meteor.user().emails[0].address, 
            cia: companiaSeleccionada._id, 
        })

        return { 
            error: false, 
            message: "Ok, el proceso de reconversión Remesas ha sido efectuado en forma satisfactoria.", 
        }
    }
})