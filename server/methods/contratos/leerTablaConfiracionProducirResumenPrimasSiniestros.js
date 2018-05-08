
import SimpleSchema from 'simpl-schema';
import lodash from 'lodash'; 

import { ContratosProp_Configuracion_Tablas } from '/imports/collections/catalogos/ContratosProp_Configuracion'; 

Meteor.methods(
{
    'contratosProporcionales.leerTablaConfiguracion.producirResumenPrimasSiniestros':
     function (codigoContrato, moneda, anoContrato, ciaSeleccionadaID) {
        // leemos la tabla de configuración de contratos proporcionales para el código de contrato indicado;
        // producimos una lista con el resumen de: serie, ramo, tipo, moneda, para el código indicado.
        // La idea es que el usuario indique las primas/siniestros para cada combinación y esta sea la base
        // para la formación de las cuentas técnicas de ese período ...
        new SimpleSchema({
            codigoContrato: { type: String, optional: false },
            anoContrato: { type: Number, optional: false },
            ciaSeleccionadaID: { type: String, optional: false },
        }).validate({ codigoContrato, anoContrato, ciaSeleccionadaID, });

        // TODO: leer tabla de configuración para el código/cia; si no hay registros, error ...
        let tablaConfiguracion = ContratosProp_Configuracion_Tablas.find({
                                                    codigo: codigoContrato,
                                                    moneda: moneda,
                                                    ano: { $lte: anoContrato },
                                                    cia: ciaSeleccionadaID,
                                                }).fetch();

        if (!tablaConfiguracion.length) {
            let message = `Error: no hemos podido leer registros en la <em>tabla de configuración</em> para el código
                           de contrato <b><em>${codigoContrato}</em></b>, años anteriores o iguales a
                           <b><em>${anoContrato.toString()}</em></b>, la moneda de la definición de cuentas técnicas
                           y la compañía seleccionada.<br /><br />
                           Ud. debe revisar la <em>tabla de configuración</em> para este contrato en particular.
                           Recuerde que la tabla de configuración se asocia al contrato mediante el campo
                           <em>código</em>.<br /><br />
                           La tabla de configuración es el mecanismo que permite distribuir los montos de prima
                           y siniestro para las series que se indiquen, en las compañías que fueron relacionadas
                           al contrato.
                          `;
             return {
                 error: true,
                 message: message,
             };
        }

        // TODO: resumir por: moneda/ramo/tipoContrato/serie (ano)
        // para producir el array con las conbinaciones diferentes de: mon/ramo/tipo/año, hacemos lo siguiente:
        // 1) producimos un array con los valores: 'mon-ramo-tipo-año'
        // 2) aplicamos lodash 'uniq' al array anterior para obtener solo las diferentes
        // 3) separamos cada valor con 'split('-')'
        let tablaConfiguracion2 = lodash(tablaConfiguracion).
                                    map((x) =>
                                        {
                                            return `${x.moneda}-${x.ramo}-${x.tipoContrato}-${x.ano.toString()}`;
                                        }).
                                    uniq().
                                    value();

        // finalmente, separamos: moneda, ramo, tipo y año, usando split('-') ...
        let tablaConfiguracion3 = [];

        tablaConfiguracion2.forEach((x) => {
            let values = x.split('-');

            tablaConfiguracion3.push({
                moneda: values[0],
                ramo: values[1],
                tipo: values[2],
                serie: values[3],
            });
        })

        return {
            error: false,
            message: "Ok, la tabla de configuración para el contrato ha sido leída en forma satisfactoria.",
            resumenPrimasSiniestros_array: JSON.stringify(tablaConfiguracion3),
        };
    }
});
