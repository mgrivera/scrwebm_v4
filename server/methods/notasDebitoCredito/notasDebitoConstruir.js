
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 

import { Riesgos } from '/imports/collections/principales/riesgos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { NotasDebitoCredito } from '/imports/collections/principales/notasDebitoCredito'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 

import NotasDebitoCredito_determinarProxNumero from '/server/imports/general/notasDebitoCredito_DeterminarProxNumero'; 

Meteor.methods(
{
    'notasDebito_construir': function (entityID, subEntityID) {

        // NOTA: inicialmente, esta función tratará solo notas para riesgos; luego, para otras entidades: contratos, siniestros, ...
        const riesgo = Riesgos.findOne(entityID); 

        if (!riesgo) {
            const message = `Error inesperado: no hemos podido leer el riesgo indicado en la base de datos.  
                          `; 

            return { 
                error: true, 
                message: message, 
            }
        }

        if (!riesgo.movimientos || !Array.isArray(riesgo.movimientos) || riesgo.movimientos.length === 0) {
            const message = `Error inesperado: el riesgo indicado no tiene movimientos registrados.<br /> 
                           Por favor revise.   
                          `; 

            return { 
                error: true, 
                message: message, 
            }
        }

        const movimiento = riesgo.movimientos.find((x) => x._id === subEntityID); 

        if (!movimiento) {
            const message = `Error inesperado: el riesgo indicado no tiene movimientos registrados.<br /> 
                           Por favor revise.   
                          `; 

            return { 
                error: true, 
                message: message, 
            }
        }

        const cuotas = Cuotas.find({ 'source.entityID': entityID, 'source.subEntityID': subEntityID }).fetch(); 

        if (!cuotas || !cuotas.length) { 
            const message = `Error: el movimiento indicado no tiene cuotas registradas. Debe tenerlas para poder construir sus notas de débito.<br /> 
                           Por favor revise.   
                          `; 

            return { 
                error: true, 
                message: message, 
            }
        }

        // las cuotas para las cuales determinamos las notas de débito solo son las que tiene monto positivo 
        const cuotasMontoPositivo = cuotas.filter((x) => x.monto > 0); 

        if (!cuotasMontoPositivo || !cuotasMontoPositivo.length) { 
            const message = `Error: el movimiento indicado no tiene cuotas cuyo monto sea positivo. <br /> 
                           Las notas de débito solo se construyen para cuotas cuyo monto sea positivo.<br /> 
                           Por favor revise.   
                          `; 

            return { 
                error: true, 
                message: message, 
            }
        }

        // eliminamos algunas notas de débito que puedan existir para el mismo riesgo y movimiento 
        const filtroEliminar = { 
            source: { 
                entityID: riesgo._id,                  // ej: _id del riesgo; _id del contrato
                subEntityID: movimiento._id,               // ej: _id del movimiento; _id de la capa o cuenta
                origen: 'fac',
                numero: movimiento.numero,   
            },
            cia: riesgo.cia,
        }

        const cantidadNotasDebitoEliminadas = NotasDebitoCredito.remove(filtroEliminar); 

        // leemos una cuenta bancaria para la moneda, para asignarla como default 
        let cuentaBancaria = CuentasBancarias.findOne({ moneda: riesgo.moneda }); 

        if (!cuentaBancaria) { 
            cuentaBancaria = CuentasBancarias.findOne(); 
        }

        let cantidadCuotasDebitoConstruidas = 0; 

        for(const cuota of cuotasMontoPositivo) { 
            // ok, construimos una nota de débito para cada cuota con monto positivo 

            const numeroProximaNota = NotasDebitoCredito_determinarProxNumero("ND", new Date().getFullYear(), riesgo.cia); 

            if (numeroProximaNota.error) { 
                return { 
                    error: true, 
                    message: numeroProximaNota.message,  
                }
            }

            const notaDebito = { 
                _id: new Mongo.ObjectID()._str,
                source: { 
                    entityID: riesgo._id,                  // ej: _id del riesgo; _id del contrato
                    subEntityID: movimiento._id,               // ej: _id del movimiento; _id de la capa o cuenta
                    origen: 'fac',
                    numero: movimiento.numero,   
                },
                tipo: "ND",
                tipoNegocio: riesgo.tipo, 
                ano: new Date().getFullYear(),
                numero: numeroProximaNota.result.numero,
                compania: cuota.compania,
                moneda: cuota.moneda,
                fecha: new Date(),
                cuota: cuota._id,
                cuentaBancaria: cuentaBancaria ? cuentaBancaria._id : "undefined",
                fechaCuota: cuota.fecha, 
                fechaVencimientoCuota: cuota.fechaVencimiento, 
                monto: cuota.monto,
                observaciones: "", 
                cia: cuota.cia,
            }

            NotasDebitoCredito.insert(notaDebito); 
            
            cantidadCuotasDebitoConstruidas++; 
        }

        const message = `Ok, las notas de débito para el riesgo y movimiento indicados se han construido en forma satisfactoria.<br /><br /> 
                        En total, se han construido <b>${cantidadCuotasDebitoConstruidas.toString()}</b> notas de débito para el 
                        movimiento indicado;<br />
                        además, se eliminaron <b>${cantidadNotasDebitoEliminadas.toString()}</b> notas de débito que ya existían y 
                        que fueron sustituidas. 
                      `; 

        return { 
            error: false, 
            message: message,  
        }
    }
})