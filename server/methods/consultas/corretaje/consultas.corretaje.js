
import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';

import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Consulta_Corretaje } from '/imports/collections/consultas/consulta_corretaje'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 

Meteor.methods(
{
    'consultas.corretaje': function (filtro) {

        check(filtro, Match.ObjectIncluding({ cia: String }));

        if (!filtro) {
            throw new Meteor.Error("Ud. debe indicar un criterio de selección a esta consulta.");
        }

        if (filtro.fechaEmisionDesde || filtro.fechaEmisionHasta) {
            if (!filtro.fechaEmisionDesde || !filtro.fechaEmisionHasta) {
                throw new Meteor.Error(`Ud. ha indicado un período incompleto en el filtro.<br /> 
                                        Por favor indique un período completo (desde y hasta).`);
            }
        }

        if (filtro.fechaCuotaDesde || filtro.fechaCuotaHasta) {
            if (!filtro.fechaCuotaDesde || !filtro.fechaCuotaHasta) {
                throw new Meteor.Error(`Ud. ha indicado un período incompleto en el filtro.<br /> 
                                        Por favor indique un período completo (desde y hasta).`);
            }
        }

        if (filtro.fechaVencimientoDesde || filtro.fechaVencimientoHasta) {
            if (!filtro.fechaVencimientoDesde || !filtro.fechaVencimientoHasta) {
                throw new Meteor.Error(`Ud. ha indicado un período incompleto en el filtro.<br /> 
                                        Por favor indique un período completo (desde y hasta).`);
            }
        }

        if (filtro.fechaCobroDesde || filtro.fechaCobroHasta) {
            if (!filtro.fechaCobroDesde || !filtro.fechaCobroHasta) {
                throw new Meteor.Error(`Ud. ha indicado un período incompleto en el filtro.<br /> 
                                        Por favor indique un período completo (desde y hasta).`);
            }
        }

        // antes que nada, eliminamos del collection de la consulta, los registros de la consulta anterior
        Consulta_Corretaje.remove({ user: this.userId });

        // leemos solo cuotas por cobrar; aquellas cuyo monto es positivo; también eliminamos las cuotas de siniestro de la
        // selección (los siniestro no generan corretaje)
        var matchCriteria = {
            monto: { $gt: 0 },
            'source.origen' : { $not : /^sin/ },
            cia: filtro.cia,
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

        // si el usuario indicó un período de cobro, aplicamos a la fecha en el array de pagos ... 
        if (filtro.fechaCobroDesde) {
            matchCriteria['pagos.fecha'] = { 
                    $gte: moment(filtro.fechaCobroDesde).toDate(),
                    $lte: moment(filtro.fechaCobroHasta).toDate(),
                }; 
        }

        if (filtro.companias && Array.isArray(filtro.companias) && filtro.companias.length > 0) {
            var array = lodash.clone(filtro.companias);
            matchCriteria.compania = { $in: array };
        }

        if (filtro.monedas && Array.isArray(filtro.monedas) && filtro.monedas.length > 0) {
            var array = lodash.clone(filtro.monedas);
            matchCriteria.moneda = { $in: array };
        }

        let pipeline = [
          {
              $match: matchCriteria
          }
        ];

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = 0;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 4;
        let currentProcess = 1;
        let message = `leyendo las cuotas ... `

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "corretaje_consulta_reportProgress";
        let eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'corretaje_consulta' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: message
                        };

        // sync call
        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        let result = Cuotas.aggregate(pipeline);

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = result.length;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        message = `leyendo las descripciones desde catálogos ... `

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: message
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // leemos y recorremos los items seleccionados arriba para agregar suscriptor, asegurado y ramo,
        // cuando sea posible ...
        result.forEach(cuota => {

            cuota.suscriptor = null;
            cuota.asegurado = null;
            cuota.ramo = null;

            switch (cuota.source.origen) {

                case 'fac': {
                    let riesgo = Riesgos.findOne(cuota.source.entityID);

                    if (riesgo) {
                        cuota.suscriptor = riesgo.suscriptor ? riesgo.suscriptor : null;
                        cuota.asegurado = riesgo.asegurado ? riesgo.asegurado : null;
                        cuota.ramo = riesgo.ramo ? riesgo.ramo : null;
                    }

                    break;
                }

                case 'capa':
                case 'cuenta': {
                    let contrato = Contratos.findOne(cuota.source.entityID);

                    if (contrato) {
                        if (contrato.suscriptor) {
                            cuota.suscriptor = contrato.suscriptor;
                            cuota.ramo = contrato.ramo ? contrato.ramo : null;
                        }

                        // los contratos no corresponden a un asegurado particular ; usamos su referencia para que el 
                        // usuairo identifique fácilmente 
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
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: message
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        })

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = 0;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 3;
        message = `aplicando filtro suscriptor y ramo ... `

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: message
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        let monedas = Monedas.find({}, { fields: { simbolo: 1, descripcion: 1, }}).fetch();
        let companias = Companias.find({}, { fields: { abreviatura : 1, nombre: 1, }}).fetch();
        let ramos = Ramos.find({}, { fields: { abreviatura : 1, descripcion: 1, }}).fetch();
        let suscriptores = Suscriptores.find({}, { fields: { abreviatura : 1 }}).fetch();
        let asegurados = Asegurados.find({}, { fields: { abreviatura : 1 }}).fetch();

        // ---------------------------------------------------------------------------------------------------------
        // si el usuario indica filtros para: suscriptor o ramo, los aplicamos ahora (con lodash)
        if (filtro.suscriptores && Array.isArray(filtro.suscriptores) && filtro.suscriptores.length > 0)
            result = lodash.filter(result, r => {
                return r.suscriptor && lodash.some(filtro.suscriptores, a => { return a === r.suscriptor; })
            });

        if (filtro.ramos && Array.isArray(filtro.ramos) && filtro.ramos.length > 0)
            result = lodash.filter(result, r => {
                return r.ramo && lodash.some(filtro.ramos, a => { return a === r.ramo; })
            });
        // ---------------------------------------------------------------------------------------------------------

        let cantidadRegistrosAgregados = 0;

        let moneda = {};
        let compania = {};
        let suscriptor = {};
        let ramo = {};
        let asegurado = {};

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = result.length;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 4;
        message = `determinando el corretaje ... `

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: message
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        result.forEach(cuota => {

            moneda = monedas.find((x) => { return cuota.moneda === x._id; });
            compania = companias.find((x) => { return cuota.compania === x._id; });
            ramo = ramos.find((x) => { return cuota.ramo === x._id; });
            suscriptor = suscriptores.find((x) => { return cuota.suscriptor === x._id; });
            asegurado = asegurados.find((x) => { return cuota.asegurado === x._id; });

            let cuotaCorretaje = {
                _id: new Mongo.ObjectID()._str,

                moneda: cuota.moneda,
                monedaSimbolo: moneda ? moneda.simbolo : "Indef",
                monedaDescripcion: moneda ? moneda.descripcion : "Indef",

                compania: cuota.compania,
                companiaAbreviatura: compania ? compania.abreviatura : "Indef",
                companiaNombre: compania ? compania.nombre : "Indef",

                ramo: ramo ? ramo._id : "",
                ramoAbreviatura: ramo ? ramo.abreviatura : "",
                ramoDescripcion: ramo ? ramo.descripcion : "",

                suscriptor: suscriptor ? suscriptor._id : null,
                suscriptorAbreviatura: suscriptor ? suscriptor.abreviatura : "Indef",

                // para cuotas de contratos, su referencia viene como asegurado; nos aseguramos de que
                // permanezca aquí ...
                asegurado: asegurado ? asegurado._id : cuota.asegurado,
                aseguradoAbreviatura: asegurado ? asegurado.abreviatura : cuota.asegurado,

                cuotaID: cuota._id,
                origen: cuota.source.origen + '-' + cuota.source.numero,
                numero: cuota.numero,
                cantidad: cuota.cantidad,

                fechaEmision: cuota.fechaEmision ? cuota.fechaEmision : null,
                fechaCuota: cuota.fecha,
                fechaVencimiento: cuota.fechaVencimiento,

                montoCuota: cuota.monto,
                montoPorPagar: 0,
                montoCorretaje: 0,

                // el monto cobrado está en el array de pagos en la cuota
                montoCobrado: lodash.sumBy(cuota.pagos, 'monto'),
                montoPagado: 0,

                cia: cuota.cia,
                user: this.userId,
            };

            // para leer el monto por pagar que corresponde a cada cuota, leemos las cuotas idénticas, misma entityID y subEntityID,
            // misma cuota, pero con monto negativo ...
            Cuotas.find({
                'source.entityID': cuota.source.entityID,
                'source.subEntityID': cuota.source.subEntityID,
                'source.origen': cuota.source.origen,
                'numero': cuota.numero,
                monto: { $lt: 0},
            },
            { fields: { monto: 1 }} ).
            forEach((cuotaPago) => {
                cuotaCorretaje.montoPorPagar += cuotaPago.monto;
                // la cuota puede tener pagos
                cuotaCorretaje.montoPagado += lodash.sumBy(cuotaPago.pagos, 'monto');
            });

            // nótese que el monto por pagar siempre viene negativo ...
            cuotaCorretaje.montoCorretaje = cuotaCorretaje.montoCuota + cuotaCorretaje.montoPorPagar;

            Consulta_Corretaje.insert(cuotaCorretaje);
            cantidadRegistrosAgregados++;



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
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: message
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        // eliminamos las cuotas que no han generado corretaje
        Consulta_Corretaje.remove({ montoCorretaje: { $eq: 0 }, user: this.userId });


        if (filtro.leerSoloCuotas) {
            switch (filtro.leerSoloCuotas) {
                case 'pendientes':
                    Consulta_Corretaje.remove({ montoCobrado: { $ne: 0 }, user: this.userId });
                    break;
                case 'cobradas':
                    Consulta_Corretaje.remove({ montoCobrado: { $eq: 0 }, user: this.userId });
                    break;
                case 'cobradasPorPagar':
                    Consulta_Corretaje.remove({ montoCobrado: { $eq: 0 }, user: this.userId });
                    Consulta_Corretaje.remove({ montoPagado: { $ne: 0 }, user: this.userId });
                    break;
                default:
            }
        }

        return `Ok, el proceso se ha ejecutado en forma satisfactoria.<br /><br /> +
                En total, ${cantidadRegistrosAgregados.toString()} registros han sido seleccionados y
                conforman esta consulta.`;
    }
});
