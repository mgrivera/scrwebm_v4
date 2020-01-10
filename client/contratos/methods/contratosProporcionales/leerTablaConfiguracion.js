

import { Meteor } from 'meteor/meteor';
import { Contratos_Methods } from '/client/contratos/methods/_methods/_methods'; 

const leerTablaConfiguracion = function ($q, codigoContrato, moneda, anoContrato, companiaSeleccionadaID) {

    var defer = $q.defer();

    Meteor.call('contratosProporcionales.leerTablaConfiguracion.producirResumenPrimasSiniestros',
                codigoContrato, moneda, anoContrato, companiaSeleccionadaID, function (error, result) {
        if (error) {
            defer.reject(error);
        }

        if (result.error) {
            // aunque hubo un error, no fue un error grave de ejecución del método. En vez, un error pues alguna condición no fue 
            // encontrada ... resolvemos y, al regresar, se tratará este error ... 
            defer.resolve(result);
        }

        const resumenPrimasSiniestros_array = JSON.parse(result.resumenPrimasSiniestros_array);

        const resolve = {
            error: false,
            message: result.message,
            resumenPrimasSiniestros_array: resumenPrimasSiniestros_array,
        };

        defer.resolve(resolve);
  })

  return defer.promise;
}

Contratos_Methods.contratosProporcionales_leerTablaConfiguracion = leerTablaConfiguracion;
