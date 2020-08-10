
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 
import { check } from 'meteor/check';

import lodash from 'lodash';
import numeral from 'numeral'; 

import { Remesas } from '/imports/collections/principales/remesas';  
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Riesgos } from '/imports/collections/principales/riesgos'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Temp_Cobranzas } from '/imports/collections/consultas/temp_cobranzas';

Meteor.methods(
{
    // ---------------------------------------------------------------------------------------------------------------------------
    // determinamos las cuotas pendientes que corresponden a la compañía de la remesa indicada y las regresamos al cliente para
    // que el usuario seleccione las que corresponden a la remesa seleccionada
    // ---------------------------------------------------------------------------------------------------------------------------
    'cobranzas.determinarCuotasPendientesCompaniaRemesaSeleccionada': function (remesaID) {
        check(remesaID, String);

        var self = this;
        var remesa = Remesas.findOne(remesaID);

        if (!remesa) { 
            throw new Meteor.Error("remesa-no-encontrada",
                                   "Error inesperado: la remesa indicada no pudo ser leída en la base de datos.");
        }
            

        // --------------------------------------------------------------------------------------------------------------
        // primero eliminamos de la tabla 'temporal', los registros que puedan existir para el usuario
        Temp_Cobranzas.remove({ usuario: self.userId });

        // leemos las cuotas que corresponden a la compañía de la remesa (y la cia) y que están pendientes (ie: sin pagos 'completos'
        const cuotasPendientes = Cuotas.find({ compania: remesa.compania, cia: remesa.cia, 'pagos.completo': { $nin: [true] } }).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        const numberOfItems = cuotasPendientes.length;
        const reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 1;
        const currentProcess = 1;
        const message = `leyendo cuotas pendientes ... `; 

        // nótese que 'eventName' y 'eventSelector' no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "cobranzas.procesosVarios.reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'cobranzas.procesosVarios' };
        let eventData = { current: currentProcess, max: numberOfProcess, progress: '0 %', message: message, };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        var cantidadRegistrosAgregadosTablaTemporal = 0;

        cuotasPendientes.forEach(function (cuota) {
            var cuotaPendiente = {};

            cuotaPendiente._id = new Mongo.ObjectID()._str;
            cuotaPendiente.compania = cuota.compania;

            let nombreAsegurado = ""; 

            switch (cuota.source.origen) {

                case 'fac': {
                    const riesgo = Riesgos.findOne(cuota.source.entityID, { fields: { asegurado: 1 }});

                    if (riesgo && riesgo.asegurado) { 
                        const asegurado = Asegurados.findOne(riesgo.asegurado, { fields: { abreviatura: 1 }}); 
                        if (asegurado) { 
                            nombreAsegurado = asegurado.abreviatura; 
                        }
                    }

                    break;
                }

                case 'sinFac': {
                    const siniestro = Siniestros.findOne(cuota.source.entityID, { fields: { asegurado: 1 }});

                    if (siniestro && siniestro.asegurado) { 
                        const asegurado = Asegurados.findOne(siniestro.asegurado, { fields: { abreviatura: 1 }}); 
                        if (asegurado) { 
                            nombreAsegurado = asegurado.abreviatura; 
                        }
                    }

                    break;
                }

                case 'capa':
                case 'cuenta': {
                    const contrato = Contratos.findOne(cuota.source.entityID);

                    if (contrato && contrato.codigo) {
                        nombreAsegurado = contrato.codigo; 
                    }

                    if (contrato && contrato.referencia) { 
                        if (nombreAsegurado) { 
                            nombreAsegurado += " - "; 
                        }

                        nombreAsegurado += contrato.referencia; 
                    }

                    break;
                }
            }

            cuotaPendiente.cuota = {};

            cuotaPendiente.cuota.cuotaID = cuota._id;
            cuotaPendiente.cuota.entityID = cuota.source.entityID;
            cuotaPendiente.cuota.numero = cuota.numero;
            cuotaPendiente.cuota.cantidad = cuota.cantidad;
            cuotaPendiente.cuota.moneda = cuota.moneda;
            cuotaPendiente.cuota.fecha = cuota.fecha;
            cuotaPendiente.cuota.fechaVencimiento = cuota.fechaVencimiento;
            cuotaPendiente.cuota.monto = cuota.monto;
            cuotaPendiente.cuota.asegurado = nombreAsegurado; 

            cuotaPendiente.origen = {};

            cuotaPendiente.origen.origen = cuota.source.origen;
            cuotaPendiente.origen.numero = cuota.source.numero;

            cuotaPendiente.pagosAnteriores = {};

            cuotaPendiente.pagosAnteriores.cantidad = 0;
            cuotaPendiente.pagosAnteriores.monto = 0;
            cuotaPendiente.pagosAnteriores.mismaMoneda = false;

            // para este momento, cualquier pago que pueda tener la cuota es siempre 'parcial',
            // pues arriba descartamos cuotas con pagos 'completos'

            if (cuota.pagos && cuota.pagos.length) {
                cuotaPendiente.pagosAnteriores.cantidad = cuota.pagos.length;
                // revisamos si todos los pagos son de la misma moneda de la cuota ...
                cuotaPendiente.pagosAnteriores.mismaMoneda = !(lodash.some(cuota.pagos, (p) => { return p.moneda != cuota.moneda; }));

                // solo sumarizamos el monto de los pagos si sus monedas son la misma de la cuota
                if (cuotaPendiente.pagosAnteriores.mismaMoneda) {
                    cuotaPendiente.pagosAnteriores.monto = lodash.sumBy(cuota.pagos, 'monto');
                }
            }

            // el monto pendiente para una cuota sin pagos es, simplemente, su monto ..
            cuotaPendiente.montoPendiente = cuota.monto;

            // si la cuota tiene pagos parciales y son de la misma moneda, los restamos al monto pendiente ...
            if (cuota.pagos && cuota.pagos.length && cuotaPendiente.pagosAnteriores.mismaMoneda) {
                // nótese que sumamos el monto anterior para obtener la diferencia (monto original - pagos parciales);
                // en realidad, el monto en pagos parciales viene con monto contrario; luego el resultado resta en vez de sumar
                cuotaPendiente.montoPendiente += cuotaPendiente.pagosAnteriores.monto;
            }

            cuotaPendiente.pagar = false;
            // el monto a pagar siempre debe ser del signo contrario al original
            cuotaPendiente.monto = cuotaPendiente.montoPendiente * -1;
            cuotaPendiente.completo = true;             // la mayoría de los pagos que agregue el usuario serán 'completos'
            cuotaPendiente.cia = remesa.cia;
            cuotaPendiente.usuario = self.userId;

            Temp_Cobranzas.insert(cuotaPendiente);

            cantidadRegistrosAgregadosTablaTemporal++;

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: message
                            };
                Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: message
                                };
                    Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        if (cantidadRegistrosAgregadosTablaTemporal == 0) {
            throw new Meteor.Error("compania-sin-cuotas-pendientes",
                `Aparentemente, no existen cuotas pendientes para la compañía de la remesa
                 (y para la cia seleccionada).<br /><br />
                 Para corroborar esta situación, Ud. puede ejecutar una <em>consulta de cuotas
                 pendientes</em> para la compañía de la remesa y la cia seleccionada.`
                );
        }

        return `Ok, <b>${cantidadRegistrosAgregadosTablaTemporal.toString()}
                cuotas pendientes</b>, para la compañía de la remesa, han sido leídas y mostradas en la lista.`;
    }
})