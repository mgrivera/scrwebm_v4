

import SimpleSchema from 'simpl-schema';
import * as moment from 'moment'; 
import * as numeral from 'numeral'; 
import * as lodash from 'lodash'; 
import { Mongo } from 'meteor/mongo'; 

import { CierreRegistro } from 'imports/collections/cierre/registroCierre'; 
import { Temp_consulta_cierreRegistro } from 'imports/collections/consultas/temp_consulta_cierreRegistro'; 
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias';
import { Contratos, ContratosProp_cuentas_saldos } from 'imports/collections/principales/contratos'; 

Meteor.methods({

    'cierre.consulta.leerRegistro': function (filtro, 
                                              fechaInicialPeriodo, 
                                              fechaFinalPeriodo, 
                                              ciaSeleccionada, 
                                              cuentasCorrientes, 
                                              cuentasCorrientes_separarCorretaje) {

        new SimpleSchema({
            filtro: { type: Object, blackbox: true, optional: false, }, 
            fechaInicialPeriodo: { type: Date, optional: false, }, 
            fechaFinalPeriodo: { type: Date, optional: false, },  
            ciaSeleccionada: { type: String, optional: false, }, 
            cuentasCorrientes: { type: Boolean, optional: false, }, 
            cuentasCorrientes_separarCorretaje: { type: Boolean, optional: false, }, 
        }).validate({ filtro, fechaInicialPeriodo, fechaFinalPeriodo, ciaSeleccionada, cuentasCorrientes, cuentasCorrientes_separarCorretaje, });
            
        // eliminamos los registros de la consulta anterior  
        Temp_consulta_cierreRegistro.remove({ user: Meteor.userId() }); 
        
        let tempItemsAgregados = 0; 

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = CierreRegistro.find(filtro).count();
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 2;
        let currentProcess = 1;
        let message = `leyendo el registro ... `

        // nótese que 'eventName' y 'eventSelector' no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "cierre_consulta_reportProgress";
        let eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'cierre_consulta' };
        let eventData = {
                          current: currentProcess, 
                          max: numberOfProcess, 
                          progress: '0 %',
                          message: message
                        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        let monedas = Monedas.find({}, { fields: { descripcion: 1, simbolo: 1, }}).fetch(); 
        let companias = Companias.find({}, { fields: { nombre: 1, abreviatura: 1, }}).fetch(); 
        let empresaSeleccionada = EmpresasUsuarias.findOne(ciaSeleccionada, { nombre: 1, abreviatura: 1, }); 

        if (!empresaSeleccionada) { 
            throw new Meteor.Error('error-base-datos', `Error inesperado: no hemos podido leer 
                                    la compañía seleccionada (${filtro.cia}) en la base de datos.
            `);
        }

        // leemos todos los registros producidos por el cierre que cumplen el filtro; los agregamos a la tabla 'temp'; 
        // luego, en un paso posterior, agregaremos registros con los saldos iniciales para el período seleccionado ... 
        CierreRegistro.find(filtro).forEach((item) => { 

            const moneda = monedas.find((x) => { return x._id === item.moneda; }); 
            const compania = companias.find((x) => { return x._id === item.compania; }); 
            const cedente = companias.find((x) => { return x._id === item.cedente; });    // aunque viene casi siempre, puede no venir

            if (!moneda) { 
                throw new Meteor.Error('error-base-datos', `Error inesperado: no hemos podido leer un registro para la moneda 
                                        ${item.moneda} en la base de datos. Por favor revise. 
                `);
            }

            if (!compania) { 
                throw new Meteor.Error('error-base-datos', `Error inesperado: no hemos podido leer un registro para la compañía  
                                        ${item.compania} en la base de datos. Por favor revise. 
                `);
            }

            // el usuario puede indicar que desea separar el corretaje del saldo en contratos proporcionales ... 
            if (cuentasCorrientes_separarCorretaje && 
                (item.tipoNegocio && item.tipoNegocio === "Prop") && 
                (item.categoria && item.categoria === "Saldo")) { 

                    // leemos la cuenta técnica donde existe el corretaje, para separar del saldo 

                    // el _id del registro de saldo está en el array en el registro de cierres 
                    let saldoCuentaTecnica_id = ""; 
                    
                    if (item.origen_keys && Array.isArray(item.origen_keys) && item.origen_keys.length) { 
                        saldoCuentaTecnica_id = item.origen_keys[0]; 
                    }

                    let saldoAntesCorretaje = item.monto; 
                    let corretaje = 0; 

                    let cuentaTecnica_saldo = ContratosProp_cuentas_saldos.findOne(saldoCuentaTecnica_id, { fields: 
                                                                                                            { 
                                                                                                                contratoID: true, 
                                                                                                                definicionID: true, 
                                                                                                                corretaje: true, 
                                                                                                            }}); 

                    if (cuentaTecnica_saldo && cuentaTecnica_saldo.corretaje) { 
                        // el saldo del reasegurador es normalmente negativo (a su favor); el corretaje es positivo (a nuestro favor); 
                        // la idea es agregar el corretaje al saldo del reasegurador, pero antes convertirlo a negativo (para que sume)
                        saldoAntesCorretaje += (cuentaTecnica_saldo.corretaje * -1); 
                        corretaje = cuentaTecnica_saldo.corretaje; 
                    }

                    let tempItem = {
                        _id: new Mongo.ObjectID()._str,
                        
                        // este valor nos permitirá ordenar la consulta, para mostrar primero el saldo inicial y luego los registros 
                        // determinados por el cierre ... 
                        orden: 1,                                                   
                        fecha: item.fecha,
        
                        moneda: { 
                            moneda: moneda._id,
                            descripcion: moneda.descripcion,
                            simbolo: moneda.simbolo,
                        }, 
        
                        compania: { 
                            compania: compania._id,
                            nombre: compania.nombre,
                            abreviatura: compania.abreviatura,
                        }, 

                        cedente: { 
                            cedente: cedente ? cedente._id : "",
                            nombre: cedente ? cedente.nombre : "",
                            abreviatura: cedente ? cedente.abreviatura : "",
                        }, 
                        
                        tipo: item.tipo === "A" ? "Auto" : "Man",
                        origen: item.origen,
        
                        cobroPagoFlag: item.cobroPagoFlag,
                        serie: item.serie,
                        tipoNegocio: item.tipoNegocio,
                        categoria: item.categoria, 
        
                        referencia: item.referencia,
                        descripcion: item.descripcion,
                        monto: saldoAntesCorretaje,
                        
                        cia: { 
                            cia: empresaSeleccionada._id,
                            nombre: empresaSeleccionada.nombre,
                            abreviatura: empresaSeleccionada.abreviatura,
                        }, 
        
                        user: Meteor.userId(), 
                    }
        
                    Temp_consulta_cierreRegistro.insert(tempItem); 
                    tempItemsAgregados++; 

                    if (corretaje) { 
                        // solo agregamos el registro de corretaje cuando hay un monto 

                        // leemos la definción de cuenta técnica para obtener el período de la cuenta y contruir la descripción 
                        // para este registro ... 
                        let contrato = Contratos.findOne(cuentaTecnica_saldo.contratoID, { fields: { cuentasTecnicas_definicion: true, }}); 

                        let descripcionCorretaje = "Corretaje (contrato indefinido ???)"; 

                        if (contrato && contrato.cuentasTecnicas_definicion) { 
                            let definicionCuentaTecnica = contrato.cuentasTecnicas_definicion.find(x => x._id === cuentaTecnica_saldo.definicionID); 

                            if (definicionCuentaTecnica) { 
                                descripcionCorretaje = `Corretaje para el período ${moment(definicionCuentaTecnica.desde).format("DD-MMM-YYYY")} a ${moment(definicionCuentaTecnica.hasta).format("DD-MMM-YYYY")}`; 
                            }
                        }

                        let tempItem = {
                            _id: new Mongo.ObjectID()._str,
                            
                            // este valor nos permitirá ordenar la consulta, para mostrar primero el saldo inicial y luego los registros 
                            // determinados por el cierre ... 
                            orden: 1,                                                   
                            fecha: item.fecha,
            
                            moneda: { 
                                moneda: moneda._id,
                                descripcion: moneda.descripcion,
                                simbolo: moneda.simbolo,
                            }, 
            
                            compania: { 
                                compania: compania._id,
                                nombre: compania.nombre,
                                abreviatura: compania.abreviatura,
                            }, 

                            cedente: { 
                                cedente: cedente ? cedente._id : "",
                                nombre: cedente ? cedente.nombre : "",
                                abreviatura: cedente ? cedente.abreviatura : "",
                            }, 
                            
                            tipo: item.tipo === "A" ? "Auto" : "Man",
                            origen: item.origen,
            
                            cobroPagoFlag: item.cobroPagoFlag,
                            serie: item.serie,
                            tipoNegocio: item.tipoNegocio,              // mismo tipo negocio: 'Prop' 
                            categoria: "Corr", 
            
                            referencia: item.referencia,
                            descripcion: descripcionCorretaje, 
                            monto: corretaje,
                            
                            cia: { 
                                cia: empresaSeleccionada._id,
                                nombre: empresaSeleccionada.nombre,
                                abreviatura: empresaSeleccionada.abreviatura,
                            }, 
            
                            user: Meteor.userId(), 
                        }
            
                        Temp_consulta_cierreRegistro.insert(tempItem); 
                        tempItemsAgregados++; 
                    }

            } else { 

                let tempItem = {
                    _id: new Mongo.ObjectID()._str,
                    
                    // este valor nos permitirá ordenar la consulta, para mostrar primero el saldo inicial y luego los registros 
                    // determinados por el cierre ... 
                    orden: 1,                                                   
                    fecha: item.fecha,
    
                    moneda: { 
                        moneda: moneda._id,
                        descripcion: moneda.descripcion,
                        simbolo: moneda.simbolo,
                    }, 
    
                    compania: { 
                        compania: compania._id,
                        nombre: compania.nombre,
                        abreviatura: compania.abreviatura,
                    }, 

                    cedente: { 
                        cedente: cedente ? cedente._id : "",
                        nombre: cedente ? cedente.nombre : "",
                        abreviatura: cedente ? cedente.abreviatura : "",
                    }, 
                    
                    tipo: item.tipo === "A" ? "Auto" : "Man",
                    origen: item.origen,
    
                    cobroPagoFlag: item.cobroPagoFlag,
                    serie: item.serie,
                    tipoNegocio: item.tipoNegocio,
                    categoria: item.categoria, 
    
                    referencia: item.referencia,
                    descripcion: item.descripcion,
                    monto: item.monto,
                    
                    cia: { 
                        cia: empresaSeleccionada._id,
                        nombre: empresaSeleccionada.nombre,
                        abreviatura: empresaSeleccionada.abreviatura,
                    }, 
    
                    user: Meteor.userId(), 
                }
    
                Temp_consulta_cierreRegistro.insert(tempItem); 
                tempItemsAgregados++; 
            }

            
            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, 
                              max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: message
                            };
                Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, 
                                  max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: message
                                };
                    Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        })

        // ahora leemos los registros agregados pero agrupamos por moneda-compania; la idea es agregar un registro con el  
        // saldo inicial para cada uno de estos grupos. Para calcular el saldo inicial, debemos leer los registros de 
        // cierre anteriores a la fecha inicial del período y obtener la suma de sus montos ... 
        let registroConsulta = Temp_consulta_cierreRegistro.find({ user: Meteor.userId() }).fetch(); 

        // NOTA IMPORTANTE: si el usuario quiere las cuenta corrientes, debemos agregar la referencia a la agrupación que sigue. 
        // La referencia contiene siempre el *código* del contrato en registros de proporcionales. La idea es, en consulta de 
        // cuentas corrientes, agrupar por contrato y obtener saldos para cada contrato. Para otros casos, solo por: moneda y compañía 

        let registro_groupBy_moneda_compania = {}; 

        if (cuentasCorrientes) { 
            registro_groupBy_moneda_compania = lodash.groupBy(registroConsulta, x => x.moneda.moneda + '-' + x.compania.compania + '-' + x.referencia); 
        } else { 
            registro_groupBy_moneda_compania = lodash.groupBy(registroConsulta, x => x.moneda.moneda + '-' + x.compania.compania); 
        }
        

        let registrosSaldoInicialAgregados = 0; 

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = Object.keys(registro_groupBy_moneda_compania).length;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        message = `determinando saldos iniciales ... `

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        for (const key in registro_groupBy_moneda_compania) { 
            // obtenemos el 1er. registro del grupo, para obtener valores comunes, como: moneda, compania, cia, ... 
            let primerItemGrupo = registro_groupBy_moneda_compania[key][0]; 

            // usamos mongo aggregation para obtener el sum para el saldo inicial ... 
            // al igual que la agrupación, los saldos iniciales incluyen la referencia (contrato) para 
            // consultas de cuentas corrientes (Prop)
            let sumOfMontoArray = 0; 

            if (cuentasCorrientes) { 
                sumOfMontoArray =
                CierreRegistro.aggregate(
                    [
                        { $match : { fecha: { $lt: fechaInicialPeriodo }, 
                                moneda: primerItemGrupo.moneda.moneda, 
                                compania: primerItemGrupo.compania.compania, 
                                referencia: primerItemGrupo.referencia,      // la diferencia es que incluimos aquí la referencia (contrato)
                                cia: primerItemGrupo.cia.cia, }
                        }, 
                        { $project: { compania: 1, monto: 1, } }, 
                        { $group: { _id: "$compania", sumOfMonto: { $sum: "$monto" }, }
                        }
                    ]
                 ); 
            } else { 
                sumOfMontoArray =
                CierreRegistro.aggregate(
                    [
                        { $match : { fecha: { $lt: fechaInicialPeriodo }, 
                                moneda: primerItemGrupo.moneda.moneda, 
                                compania: primerItemGrupo.compania.compania, 
                                cia: primerItemGrupo.cia.cia, }
                        }, 
                        { $project: { compania: 1, monto: 1, } }, 
                        { $group: { _id: "$compania", sumOfMonto: { $sum: "$monto" }, }
                        }
                    ]
                 ); 
            }
            
             let saldoInicialPeriodo = (sumOfMontoArray && Array.isArray(sumOfMontoArray) && sumOfMontoArray.length) ? sumOfMontoArray[0].sumOfMonto : 0; 

            // Ok, ahora agregamos el registro para el saldo inicial ... 
            let tempItem = {
                _id: new Mongo.ObjectID()._str,
                
                // para ordenar la consulta y poder mostrar siempre el saldo inicial al principio, para cada mooneda-compañía 
                orden: 0,                                                  
                fecha: fechaInicialPeriodo,

                moneda: { 
                    moneda: primerItemGrupo.moneda.moneda,
                    descripcion: primerItemGrupo.moneda.descripcion,
                    simbolo: primerItemGrupo.moneda.simbolo,
                }, 

                compania: { 
                    compania: primerItemGrupo.compania.compania,
                    nombre: primerItemGrupo.compania.nombre,
                    abreviatura: primerItemGrupo.compania.abreviatura,
                }, 

                tipo: "SI",
                origen: " ",

                cobroPagoFlag: false,
                serie: null,
                tipoNegocio: null,

                referencia: cuentasCorrientes ? primerItemGrupo.referencia : "",
                descripcion: "Saldo inicial del período",
                monto: saldoInicialPeriodo, 

                cia: { 
                    cia: primerItemGrupo.cia.cia,
                    nombre: primerItemGrupo.cia.nombre,
                    abreviatura: primerItemGrupo.cia.abreviatura,
                }, 
            
                user: Meteor.userId(), 
            }

            Temp_consulta_cierreRegistro.insert(tempItem); 
            registrosSaldoInicialAgregados++; 


            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, 
                              max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: message
                            };
                Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, 
                                  max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: message
                                };
                    Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            }
            // -------------------------------------------------------------------------------------------------------
        }

        return { 
            error: false, 
            message: `Ok, el proceso se ha ejecutado en forma satisfactoria. <br /><br /> 
                    <b>${tempItemsAgregados.toString()}</b> registros han sido seleccionados para el filtro indicado.<br /> 
                    <b>${registrosSaldoInicialAgregados.toString()}</b> registros de tipo saldo inicial han sido calculados y agregados.<br /> 
            `, 
        }
    }
})