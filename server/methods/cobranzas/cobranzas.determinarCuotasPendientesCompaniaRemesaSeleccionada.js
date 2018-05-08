


import lodash from 'lodash';
import { Remesas } from '/imports/collections/principales/remesas';  
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Riesgos } from '/imports/collections/principales/riesgos'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 

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
        var cuotasPendientes = Cuotas.find({ compania: remesa.compania, cia: remesa.cia, 'pagos.completo': { $nin: [true] } });

        var cantidadRegistrosAgregadosTablaTemporal = 0;

        cuotasPendientes.forEach(function (cuota) {
            var cuotaPendiente = {};

            cuotaPendiente._id = new Mongo.ObjectID()._str;
            cuotaPendiente.compania = cuota.compania;

            let nombreAsegurado = ""; 

            switch (cuota.source.origen) {

                case 'fac': {
                    let riesgo = Riesgos.findOne(cuota.source.entityID, { fields: { asegurado: 1 }});

                    if (riesgo && riesgo.asegurado) { 
                        let asegurado = Asegurados.findOne(riesgo.asegurado, { fields: { abreviatura: 1 }}); 
                        if (asegurado) { 
                            nombreAsegurado = asegurado.abreviatura; 
                        }
                    }

                    break;
                }

                case 'sinFac': {
                    let siniestro = Siniestros.findOne(cuota.source.entityID, { fields: { asegurado: 1 }});

                    if (siniestro && siniestro.asegurado) { 
                        let asegurado = Asegurados.findOne(siniestro.asegurado, { fields: { abreviatura: 1 }}); 
                        if (asegurado) { 
                            nombreAsegurado = asegurado.abreviatura; 
                        }
                    }

                    break;
                }

                case 'capa':
                case 'cuenta': {
                    let contrato = Contratos.findOne(cuota.source.entityID);

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