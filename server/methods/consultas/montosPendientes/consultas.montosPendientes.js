
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 
import { check } from 'meteor/check';
import { Match } from 'meteor/check'

import lodash from 'lodash';
import numeral from 'numeral';
import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Contratos } from '/imports/collections/principales/contratos';  
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Consulta_MontosPendientes } from '/imports/collections/consultas/consulta_MontosPendientes'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

import { Monedas } from "/imports/collections/catalogos/monedas"; 
import { Companias } from "/imports/collections/catalogos/companias"; 
import { Ramos } from "/imports/collections/catalogos/ramos"; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 

Meteor.methods(
{
    'consultas.montosPendientes': function (filtro) {

        check(filtro, Match.ObjectIncluding({ fechaPendientesAl: Date, cia: String }));

        if (!filtro) {
            throw new Meteor.Error("Ud. debe indicar un criterio de selección a esta consulta.");
        }

        // antes que nada, eliminamos del collection de la consulta, los registros de la consulta anterior
        Consulta_MontosPendientes.remove({ user: this.userId });

        const matchCriteria = {
            cia: filtro.cia,
            $or: [{ pagos: { $exists: false }}, {'pagos.completo': { $ne: true }}],
            fecha: { $lte: filtro.fechaPendientesAl }
        }

        if (filtro.compania && Array.isArray(filtro.compania) && filtro.compania.length) {
            const array = lodash.clone(filtro.compania);
            matchCriteria.compania = { $in: array };
        }

        if (filtro.moneda && Array.isArray(filtro.moneda) && filtro.moneda.length) {
            const array = lodash.clone(filtro.moneda);
            matchCriteria.moneda = { $in: array };
        }

        if (filtro.pendientesDe && filtro.pendientesDe != 'todo') {
            matchCriteria.monto = filtro.pendientesDe == 'cobro' ? { $gt: 0 } : { $lt: 0 };
        }

        // el usuario puede agregar un filtro para el origen de las cuotas ...
        if (filtro.origen && !filtro.origen.todo) {

            const arrayOrigen = [];

            if (filtro.origen.primasProporcional) {
                arrayOrigen.push('cuenta');
            }

            if (filtro.origen.primasNoProporcional) {
                arrayOrigen.push('capa');
            }

            if (filtro.origen.primasFacultativo) {
                arrayOrigen.push('fac');
            }

            if (filtro.origen.siniestrosFacultativo) {
                arrayOrigen.push('sinFac');
            }

            matchCriteria['source.origen'] = { $in: arrayOrigen };
        }

        // cuotas para la cia seleccionada y que no tengan pagos o que tengan pagos pero ninguno 'completo'
        // nótese que la fecha en el filtro viene, desde el cliente, como Date ...
        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = 1;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 3;
        let currentProcess = 1;
        let message = `leyendo las cuotas pendientes ... `;

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "montosPendientesCobroYPago_consulta_reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'montosPendientesCobroYPago' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: message
                        };

        // sync call
        // Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        EventDDP.matchEmit(eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        let result = Cuotas.find(matchCriteria).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = result.length;
        reportarCada = Math.floor(result.length / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        message = `leyendo nombres y descripciones desde catálogos ... `;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: message
                    };

        // sync call
        // Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        EventDDP.matchEmit(eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        // leemos valores para asegurado, suscriptor y ramo
        // para contratos, en asegurado mostramos codigo / referencia
        result.forEach(cuota => {

            switch (cuota.source.origen) {

                case 'cuenta':
                case 'capa': {
                    const contrato = Contratos.findOne(cuota.source.entityID);

                    if (contrato) {
                        if (contrato.codigo) {
                            cuota.asegurado = contrato.codigo
                        }
                        if (contrato.referencia) {
                            if (cuota.asegurado) {
                                cuota.asegurado += ` - ${contrato.referencia}`;
                            } else {
                                cuota.asegurado = contrato.referencia;
                            }
                        }

                        if (contrato.ramo) {
                            cuota.ramo = contrato.ramo
                        }

                        if (contrato.suscriptor) {
                            cuota.suscriptor = contrato.suscriptor
                        }
                    }

                    break;
                }

                case 'fac': {
                    const riesgo = Riesgos.findOne(cuota.source.entityID);

                    if (riesgo) {
                        if (riesgo.asegurado) { cuota.asegurado = riesgo.asegurado }
                        if (riesgo.ramo) { cuota.ramo = riesgo.ramo }
                        if (riesgo.suscriptor) { cuota.suscriptor = riesgo.suscriptor }
                    }

                    break;
                }

                case 'sinFac': {
                    const siniestro = Siniestros.findOne(cuota.source.entityID);

                    if (siniestro) {
                        if (siniestro.asegurado) { cuota.asegurado = siniestro.asegurado }
                        if (siniestro.ramo) { cuota.ramo = siniestro.ramo }
                        if (siniestro.suscriptor) { cuota.suscriptor = siniestro.suscriptor }
                    }

                    break;
                }
            }


            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 25 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: message
                            };
                // Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                EventDDP.matchEmit(eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: message
                                };
                    // Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    EventDDP.matchEmit(eventName, eventSelector, eventData);
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        // ---------------------------------------------------------------------------------------------------------
        // si el usuario indica filtros para: ramo, asegurado, suscriptor, los aplicamos ahora (con lodash)

        if (filtro.asegurado) {
            result = lodash.filter(result, r => {
                return r.asegurado &&
                lodash.some(filtro.asegurado, a => { return a === r.asegurado; })
            });
        }

        if (filtro.ramo) {
            result = lodash.filter(result, r => {
                return r.ramo &&
                lodash.some(filtro.ramo, a => { return a === r.ramo; })
            });
        }

        if (filtro.suscriptor) {
            result = lodash.filter(result, r => {
                return r.suscriptor &&
                lodash.some(filtro.suscriptor, a => { return a === r.suscriptor; })
            });
        }

        // ---------------------------------------------------------------------------------------------------------

        const monedas = Monedas.find({}, { fields: { descripcion: 1, simbolo: 1, }}).fetch(); 
        const companias = Companias.find({}, { fields: { nombre: 1, abreviatura: 1, }}).fetch(); 
        const ramos = Ramos.find({}, { fields: { descripcion: 1, abreviatura: 1, }}).fetch(); 
        const asegurados = Asegurados.find({}, { fields: { abreviatura: 1, }}).fetch(); 
        const suscriptores = Suscriptores.find({}, { fields: { abreviatura: 1, }}).fetch(); 

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = result.length;
        reportarCada = Math.floor(result.length / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 3;
        message = `calculando montos efectivamente pendientes ... `;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: message
                    };

        // sync call
        // Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        EventDDP.matchEmit(eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        let cantidadRegistrosAgregados = 0;

        result.forEach(cuota => {

            const moneda = lodash.find(monedas, (x) => { return x._id === cuota.moneda; }); 
            const compania = lodash.find(companias, (x) => { return x._id === cuota.compania; }); 
            const ramo = lodash.find(ramos, (x) => { return x._id === (cuota.ramo ? cuota.ramo : "..."); }); 
            const asegurado = lodash.find(asegurados, (x) => { return x._id === (cuota.asegurado ? cuota.asegurado : "..."); }); 
            const suscriptor = lodash.find(suscriptores, (x) => { return x._id === (cuota.suscriptor ? cuota.suscriptor : "..."); }); 

            const cuotaPendiente = {
                _id: new Mongo.ObjectID()._str,
                moneda: cuota.moneda,

                monedaDescripcion: moneda.descripcion, 
                monedaSimbolo: moneda.simbolo, 

                compania: cuota.compania,

                companiaNombre: compania.nombre, 
                companiaAbreviatura: compania.abreviatura, 

                ramo: cuota.ramo ? cuota.ramo : null,

                ramoDescripcion: ramo && ramo.descripcion ? ramo.descripcion : " ", 
                ramoAbreviatura: ramo && ramo.abreviatura ? ramo.abreviatura : " ",  

                asegurado: cuota.asegurado ? cuota.asegurado : null,
                aseguradoAbreviatura: asegurado && asegurado.abreviatura ? asegurado.abreviatura : " ",  

                suscriptor: cuota.suscriptor ? cuota.suscriptor : null,
                suscriptorAbreviatura: suscriptor && suscriptor.abreviatura ? suscriptor.abreviatura : " ",  

                source: {
                    numero: cuota.source.numero,
                    origen: cuota.source.origen,
                    entityID: cuota.source.entityID,
                    subEntityID: cuota.source.subEntityID,
                },
                cuota: {
                    cuotaID: cuota._id,
                    numero: cuota.numero,
                    cantidad: cuota.cantidad,
                    fecha: cuota.fecha,
                    diasVencimiento: cuota.diasVencimiento,
                    fechaVencimiento: cuota.fechaVencimiento,
                    montoOriginal: cuota.montoOriginal,
                    factor: cuota.factor,
                    monto: cuota.monto,
                },
                user: this.userId,
                cia: cuota.cia
            }

            // el asegurado no viene en el contrato; por esta razón, lo tratamos en forma diferente. Arriba pusimos el código y la referencia 
            // del contrato en el asegurado, cuando el origen es contratos. Pasamos estos valores ahora a la descripción del asegurado, para 
            // que sean mostradas como valores para el asegurado en el reporte y para los contratos 
            if (cuota.source.origen === 'cuenta' || cuota.source.origen === 'capa') { 
                cuotaPendiente.aseguradoAbreviatura = cuota.asegurado ? cuota.asegurado : "";   
            } 

            // ------------------------------------------------------------------------------------------------------------------
            // la idea es restar el monto ya pagado al monto de la cuota (pendiente) solo si corresponden a la misma moneda ...
            let cantidadPagosParciales = 0;
            let montoPendiente = cuota.monto;
            let montoPagos = 0;
            let pagosMismaMoneda = true;
            let monedaPagos = null;

            if (cuota.pagos) {
                cuotaPendiente.pagos = [];

                // nota: ya sabemos que ningún pago es 'completo' ...
                cuota.pagos.forEach(pago => {

                    if (!monedaPagos)
                        monedaPagos = pago.moneda;

                    cuotaPendiente.pagos.push({
                        _id: new Mongo.ObjectID()._str,
                        pagoID: pago._id,
                        remesaID: pago.remesaID,
                        remesaNumero: pago.remesaNumero,
                        moneda: pago.moneda,
                        fecha: pago.fecha,
                        monto: pago.monto,
                        completo: pago.completo,
                    });

                    if (pagosMismaMoneda && pago.moneda != monedaPagos)
                        pagosMismaMoneda = false;

                    cantidadPagosParciales++;
                    montoPagos += pago.monto;
                });
            }

            if (pagosMismaMoneda)
                montoPendiente += montoPagos;       // ya el monto pagado viene (siempre) con el signo contrario

            cuotaPendiente.cantidadPagosParciales = cantidadPagosParciales;
            cuotaPendiente.montoPendiente = montoPendiente;

            Consulta_MontosPendientes.insert(cuotaPendiente);
            cantidadRegistrosAgregados++;

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 25 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: message
                            };
                // Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                EventDDP.matchEmit(eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: message
                                };
                    // Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    EventDDP.matchEmit(eventName, eventSelector, eventData);
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        return "Ok, el proceso se ha ejecutado en forma satisfactoria.<br /><br />" +
               "En total, " + cantidadRegistrosAgregados.toString() + " registros han sido seleccionados y conforman esta consulta.";
    }
})