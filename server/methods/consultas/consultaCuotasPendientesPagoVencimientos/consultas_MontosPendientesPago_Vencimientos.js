
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 
import { check } from 'meteor/check';
import { Match } from 'meteor/check'

import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';

import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

import { Consulta_MontosPendientesPago_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesPago_Vencimientos'; 

Meteor.methods(
{
    consultas_MontosPendientesPago_Vencimientos: function (filtro) {

        check(filtro, Match.ObjectIncluding({ fechaPendientesAl: Date, fechaLeerHasta: Date, cia: String }));

        if (!filtro) {
            throw new Meteor.Error("Ud. debe indicar un criterio de selección a esta consulta.");
        }

        // antes que nada, eliminamos del collection de la consulta, los registros de la consulta anterior
        Consulta_MontosPendientesPago_Vencimientos.remove({ user: this.userId });

        const matchCriteria = {
            fecha: { $lte: filtro.fechaLeerHasta },
            'pagos.completo' : { $nin: [ true ] },
            cia: filtro.cia,
            monto: { $lt: 0 },
        };

        if (filtro.fechaEmisionDesde) {
            matchCriteria.fechaEmision = {
                $gte: moment(filtro.fechaEmisionDesde).toDate(),
                $lte: moment(filtro.fechaEmisionHasta).toDate(),
            };
        }

        if (filtro.fechaCuotaDesde) {
            matchCriteria.fecha = {
                $gte: moment(filtro.fechaCuotaDesde).toDate(),
                $lte: moment(filtro.fechaCuotaHasta).toDate(),
            };
        }

        if (filtro.fechaVencimientoDesde) {
            matchCriteria.fechaVencimiento = {
                $gte: moment(filtro.fechaVencimientoDesde).toDate(),
                $lte: moment(filtro.fechaVencimientoHasta).toDate(),
            };
        }


        if (filtro.compania && lodash.isArray(filtro.compania) && filtro.compania.length > 0) {
            const array = lodash.clone(filtro.compania);
            matchCriteria.compania = { $in: array };
        }

        if (filtro.moneda && lodash.isArray(filtro.moneda) && filtro.moneda.length > 0) {
            const array = lodash.clone(filtro.moneda);
            matchCriteria.moneda = { $in: array };
        }

        // cuotas (por pagar; negativa) para la cia seleccionada y que no tengan pagos o que tengan
        // pagos pero ninguno 'completo'; nótese que la fecha en el filtro viene, desde el cliente, como Date ...
        
        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = 0;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 4;
        let currentProcess = 1;
        let message = `leyendo las cuotas pendientes de pago ... `;

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "montosPendientesPago_vencimientos_consulta_reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'montosPendientesPago_vencimientos_consulta' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: message,
                        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        let result = Cuotas.find(matchCriteria).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = result.length;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        message = `asignando nombres desde catálogos ... `;

        eventData = {
                        current: currentProcess, max: numberOfProcess, progress: '0 %',
                        message: message,
                    };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------
        // leemos y recorremos los items seleccionados arriba, para asignar nombres de catálogos (asegurado, suscritor, ...)
        result.forEach(cuota => {

            cuota.suscriptor = null;
            cuota.asegurado = null;

            switch (cuota.source.origen) {

                case 'fac': {
                    const riesgo = Riesgos.findOne(cuota.source.entityID, { suscriptor: 1, asegurado: 1, });

                    if (riesgo) {
                        cuota.suscriptor = riesgo.suscriptor ? riesgo.suscriptor : null;
                        cuota.asegurado = riesgo.asegurado ? riesgo.asegurado : null;
                    }

                    break;
                }

                case 'sinFac': {
                    const siniestro = Siniestros.findOne(cuota.source.entityID, { suscriptor: 1, asegurado: 1, });

                    if (siniestro) {
                        cuota.suscriptor = siniestro.suscriptor ? siniestro.suscriptor : null;
                        cuota.asegurado = siniestro.asegurado ? siniestro.asegurado : null;
                    }

                    break;
                }

                case 'capa':
                case 'cuenta': {
                    const contrato = Contratos.findOne(cuota.source.entityID, { suscriptor: 1, referencia: 1, });

                    if (contrato) {
                        cuota.suscriptor = contrato.suscriptor ? contrato.suscriptor : null;
                        cuota.asegurado = contrato.referencia ? contrato.referencia : null;
                    }

                    break;
                }
            }

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

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = result.length;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 3;
        message = `filtrando por suscriptor ... `;

        eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: message,
                        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------
        // si el usuario indica filtros para: suscriptor, los aplicamos ahora (con lodash)
        // (pues el suscriptor no está en la cuota; lo leemos en el riesgo, siniestro, etc.)

        if (filtro.suscriptor && lodash.isArray(filtro.suscriptor) && filtro.suscriptor.length > 0) {
            result = lodash.filter(result, r => {
                return r.suscriptor &&
                lodash.some(filtro.suscriptor, a => { return a === r.suscriptor; })
            });
        }

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = result.length;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 4;
        message = `calculando vencimientos  ... `;

        eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: message,
                        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------
        let cantidadRegistrosAgregados = 0;

        let moneda = {};
        let compania = {};
        let suscriptor = {};
        let asegurado = {};

        // el usuario puede indicar nombres de compañía, moneda y suscriptor como parte de su filtro
        // la idea es que puede indicar *solo* parte del nombre para filtrar por allí 
        const { compania_text, moneda_text, suscriptor_text } = filtro; 

        for (const cuota of result) {

            moneda = Monedas.findOne(cuota.moneda, { fields: { simbolo: 1, descripcion: 1, }});
            compania = Companias.findOne(cuota.compania, { fields: { abreviatura : 1, nombre: 1, }});
            suscriptor = Suscriptores.findOne(cuota.suscriptor, { fields: { abreviatura : 1, nombre: 1 }});
            asegurado = Asegurados.findOne(cuota.asegurado, { fields: { abreviatura : 1 }});

            // si el usuario indicó filtros por catálogos, en texto, los aplicamos ahora 

            // buscamos por compañía 
            if (compania && compania_text && !(compania.nombre.toLowerCase().includes(compania_text.toLowerCase()) ||
                                               compania.abreviatura.toLowerCase().includes(compania_text.toLowerCase()))) {
                continue;
            }

            // buscamos por moneda 
            if (moneda && moneda_text && !(moneda.descripcion.toLowerCase().includes(moneda_text.toLowerCase()) ||
                                           moneda.simbolo.toLowerCase().includes(moneda_text.toLowerCase()))) {
                continue;
            }

            // buscamos por suscriptor 
            if (suscriptor && suscriptor_text && !(suscriptor.nombre.toLowerCase().includes(suscriptor_text.toLowerCase()) ||
                                                   suscriptor.abreviatura.toLowerCase().includes(suscriptor_text.toLowerCase()))) {
                continue;
            }

            const cuotaPendiente = {
                _id: new Mongo.ObjectID()._str,
                moneda: cuota.moneda,
                monedaDescripcion: moneda ? moneda.descripcion : "Indef",
                monedaSimbolo: moneda ? moneda.simbolo : "Indef",
                compania: cuota.compania,
                companiaNombre: compania ? compania.abreviatura : "Indef",
                companiaAbreviatura: compania ? compania.abreviatura : "Indef",
                suscriptor: cuota.suscriptor ? cuota.suscriptor : null,
                suscriptorAbreviatura: suscriptor ? suscriptor.abreviatura : "Indef",

                // en contratos, viene la referencia del contrato, para que el usuario identifique la cuota
                // en riesgos y siniestros ésto es fácil con el asegurado
                aseguradoAbreviatura: asegurado ? asegurado.abreviatura : (cuota.asegurado ? cuota.asegurado : "Indef"),

                origen: cuota.source.origen + '-' + cuota.source.numero,
                numero: cuota.numero,
                cantidad: cuota.cantidad,

                fechaEmision: cuota.fechaEmision, 
                fecha: cuota.fecha,
                fechaVencimiento: cuota.fechaVencimiento,

                // nótese como usamos *moment* para calcular la cantidad de días que existe entre la fecha de
                // la cuota y la fecha 'pendientes al' indicada por el usuario ...
                diasPendientes: moment(cuota.fecha).diff(moment(filtro.fechaPendientesAl), 'days'),
                diasVencidos: moment(cuota.fechaVencimiento).diff(moment(filtro.fechaPendientesAl), 'days'),

                montoCuota: cuota.monto,
                resta: cuota.monto,
                cantidadPagos: 0, 
                montoYaPagado: 0,
                montoYaCobrado: 0,

                user: this.userId,
                cia: cuota.cia
            };

            // determinamos el monto ya pagado para el monto de la cuota
            // (nótese que ya sabemos que ningún pago es 'total')
            if (lodash.isArray(cuota.pagos) && cuota.pagos.length) {
                cuotaPendiente.montoYaPagado = lodash.sumBy(cuota.pagos, 'monto');
                // sumamos en forma algebraica pues, normalmente, el monto por pagar es negativo y el monto pagado es positivo; ambos
                // se restan ...
                cuotaPendiente.resta += cuotaPendiente.montoYaPagado;

                // solo si hay un monto pagado (siempre parcial, pues el monto original está pendiente) determinamos la cantidad de
                // pagos; la idea es mostra un número en el report en vez del monto, que ocupa mucho más espacio ...
                if (cuotaPendiente.montoYaPagado && cuota.pagos && cuota.pagos.length) {
                    cuotaPendiente.cantidadPagos = cuota.pagos.length;
                }
            }


            // leemos las cuotas que corresponden a cobros, para mostrar un posible monto ya cobrado
            Cuotas.find({
                'source.entityID': cuota.source.entityID,
                'source.subEntityID': cuota.source.subEntityID,
                'numero': cuota.numero,
                'pagos.monto': { $lt: 0},
            },
            { fields: { pagos: 1 }} ).
            forEach((cuotaPago) => {
                const montoYaCobrado = lodash.sumBy(cuotaPago.pagos, 'monto');
                cuotaPendiente.montoYaCobrado = montoYaCobrado ? montoYaCobrado : 0;
            });

            // TODO: podríamos considerar en un futuro el tratamiento de cobros y pagos parciales y/o totales y
            // si se aplicó para la misma moneda

            Consulta_MontosPendientesPago_Vencimientos.insert(cuotaPendiente);
            cantidadRegistrosAgregados++;

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `leyendo las cuotas pendientes de pago ... `
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
        }

        // el usuario puede indicar que quiere *solo* montos pendientes de pago que tengan montos cobrados
        if (filtro.soloConMontoCobrado) {
            Consulta_MontosPendientesPago_Vencimientos.remove({
                montoYaCobrado: { $eq: 0 },
                user: this.userId,
            });
        }

        return "Ok, el proceso se ha ejecutado en forma satisfactoria.<br /><br />" +
               "En total, " + cantidadRegistrosAgregados.toString() + " registros han sido seleccionados y conforman esta consulta.";
    }
})