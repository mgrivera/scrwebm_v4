
import { Meteor } from 'meteor/meteor'; 

import moment from 'moment'; 
import numeral from 'numeral'; 
import { Mongo } from 'meteor/mongo'; 

import { CierreRegistro } from '/imports/collections/cierre/registroCierre'; 
import { Cierre, Cierre_schema } from '/imports/collections/cierre/cierre'; 
import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Remesas } from '/imports/collections/principales/remesas';  
import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 

// siguen todos las tablas (collections) para el registro de contratos proporcionales 
import { ContratosProp_cuentas_saldos, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_comAdic_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_partBeneficios_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 

Meteor.methods({

    'cierre.cerrarPeriodo': function (periodoCierre) {

        const isValid = Cierre_schema.namedContext().validate(periodoCierre);
            
        if (!isValid) { 
            const errorsArray = Cierre_schema.namedContext().validationErrors(); 
            return { 
                validationError: true, 
                validationErrors: errorsArray, 
            }
        }

        if (!(periodoCierre.desde <= periodoCierre.hasta)) {
            throw new Meteor.Error("Error: aparentemente, el período indicado no está bien construido.");
        }

        // eliminamos los registros *automáticos* (los manuales se quedan) que puedan existir para el período de cierre 
        CierreRegistro.remove({ fecha: { $gte: periodoCierre.desde, $lte: periodoCierre.hasta }, tipo: "A", cia: periodoCierre.cia }); 

        // -----------------------------------------------------------------------------------------------------------------
        // leemos la cuotas para el período y las grabamos al registro
        const userEmail = Meteor.user().emails[0].address;
        
        let cuotasAgregadas = 0; 

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = Cuotas.find({ 
            fecha: { $gte: periodoCierre.desde, $lte: periodoCierre.hasta }, 
            'cuota.source.origen': { $ne: 'cuenta' }, 
            cia: periodoCierre.cia }).count();

        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 3;
        let currentProcess = 1;
        let message = `leyendo las cuotas (fac, capas, sinFac) ... `

        // nótese que 'eventName' y 'eventSelector' no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "cierre_procesoCierre_reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'cierre_procesoCierre' };
        let eventData = {
                          current: currentProcess, 
                          max: numberOfProcess, 
                          progress: '0 %',
                          message: message
                        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        // nótese que, para el caso de proporcionales, no leemos sus cuotas. Más bien, leemos los registros que se ha grabado para: 
        // cuentas y complementarios (com adic, part utilidades, ret cart pr, ...)
        Cuotas.find(
            { fecha: { $gte: periodoCierre.desde, $lte: periodoCierre.hasta }, 
              'source.origen': { $ne: 'cuenta' }, 
              cia: periodoCierre.cia 
            }).forEach((cuota) => { 

            // leemos la entidad de origen, para obtener la referencia 
            let referenciaEntidadOrigen = ""; 
            let tipoNegocio = ""; 
            let categoria = ""; 
            let origen_keys = []; 
            let cedente = ""; 

            switch(cuota.source.origen) { 
                case 'fac': { 
                    const riesgo = Riesgos.findOne(cuota.source.entityID, { fields: { asegurado: 1, compania: 1, }}); 
                    if (riesgo) { 
                        cedente = riesgo.compania; 
                        const asegurado = Asegurados.findOne({ _id: riesgo.asegurado }, { fields: { abreviatura: true, }}); 
                        if (asegurado) { 
                            referenciaEntidadOrigen = asegurado.abreviatura; 
                        }
                    }
                    tipoNegocio = "Fac"; 
                    categoria = "Prima"; 
                    // en este array agregamos keys que nos ayuden, de ser necesario, a encontrar el registro que dió origen a este 
                    // monto. Eso en caso de que alguna consulta deba, por ejemplo, ubicar la cuota que dió  origen a este monto de 
                    // riesgo facultativo. Si se debe obtener el riesgo o movimiento, en la cuota están los _ids de éstos. 
                    origen_keys = [ cuota._id, ];  

                    break; 
                }
                case 'capa': { 
                    const contrato = Contratos.findOne(cuota.source.entityID, { fields: { codigo: true, compania: 1, }}); 
                    if (contrato) { 
                        cedente = contrato.compania; 
                        referenciaEntidadOrigen = contrato.codigo ? contrato.codigo : "Indefinida"; 
                    }
                    tipoNegocio = "NoProp"; 
                    categoria = "Prima"; 
                    // ver comentario arriba 
                    origen_keys = [ cuota._id, ];  

                    break; 
                }
                case 'sinFac': { 
                    const siniestro = Siniestros.findOne(cuota.source.entityID, { fields: { asegurado: 1, compania: 1, }}); 
                    if (siniestro) { 
                        cedente = siniestro.compania; 
                        const asegurado = Asegurados.findOne({ _id: siniestro.asegurado }, { fields: { abreviatura: true, }}); 
                        if (asegurado) { 
                            referenciaEntidadOrigen = asegurado.abreviatura; 
                        }
                    }
                    tipoNegocio = "Fac"; 
                    categoria = "SinFac"; 
                    // ver comentario arriba 
                    origen_keys = [ cuota._id, ];  

                    break; 
                }
            }

            if (!referenciaEntidadOrigen) { 
                referenciaEntidadOrigen = "indefinida (???)"; 
            }

            const registro = {
                _id: new Mongo.ObjectID()._str,
                
                fecha: cuota.fecha,
                moneda: cuota.moneda,
                compania: cuota.compania,
                cedente: cedente, 
                tipo: "A",
                origen: `${cuota.source.origen} ${cuota.source.numero}`,
                referencia: referenciaEntidadOrigen,

                cobroPagoFlag: false, 

                serie: null,            // solo aplica a registros de proporcionales 
                tipoNegocio: tipoNegocio,
                categoria: categoria, 

                descripcion: `Cuota ${cuota.numero.toString()} de ${cuota.cantidad.toString()} de fecha ${moment(cuota.fecha).format("DD-MMM-YY")} para ${cuota.source.origen}-${cuota.source.numero}.`,
                monto: cuota.monto ? cuota.monto : 0, 

                origen_keys, 
            
                usuario: userEmail,
                ingreso: new Date(),
                ultAct: new Date(),
                cia: periodoCierre.cia,
            }

            CierreRegistro.insert(registro); 
            cuotasAgregadas++; 

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
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = Remesas.find({ fecha: { $gte: periodoCierre.desde, $lte: periodoCierre.hasta }, cia: periodoCierre.cia }).count();
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        message = `leyendo los montos de contratos proporcionales ... `

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: message
                    };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // para montos de contratos proporcionales, leemos los registros en sus tablas específicas, y no sus cuotas ... la idea es 
        // separarlos en: cuentas, comisión adicional, participación de beneficios, entrada de cartera, etc. 

        // ahora leemos registros, cuentas y complementarios, de contratos proporcionales. Para hacerlo, debemos leer los contratos de 
        // la compañía seleccionada que tengan una definición para la fecha del cierre. Entonces, con el _id del contrato y de la 
        // definición, leeremos sus registros (cuentas y complementarios) 
        const contratosProporcionales = Contratos.find({ 
            'cuentasTecnicas_definicion.desde': { $gte: periodoCierre.desde, $lte: periodoCierre.hasta }, 
            cia: periodoCierre.cia, 
        }, { fields: { _id: 1, numero: 1, codigo: 1, cuentasTecnicas_definicion: 1, compania: 1, }}).fetch(); 

        cantidadRecs = contratosProporcionales.length;

        let cantidadCuentasYComp_contProp = 0; 

        for (const contrato of contratosProporcionales) { 

            // el contrato tiene varias definiciones; obtenemos la que corresponden al período del cierre 
            const definiciones = contrato.cuentasTecnicas_definicion.filter((d) => { return d.desde >= periodoCierre.desde && d.desde <= periodoCierre.hasta }); 

            for (const definicion of definiciones) { 
                
                // ahora leemos las cuentas y complementarios para el contrato y definición ... 
                const contratosProp_cuentas_saldos = ContratosProp_cuentas_saldos
                    .find({ contratoID: contrato._id, definicionID: definicion._id }, 
                          { fields: { compania: 1, nosotros: 1, moneda: 1, serie: 1, saldo: 1, }})
                    .fetch(); 

                for (const cuenta of contratosProp_cuentas_saldos) { 
                    
                    const registro = {
                        _id: new Mongo.ObjectID()._str,
                
                        fecha: definicion.desde,
                        moneda: cuenta.moneda,
                        compania: cuenta.nosotros ? contrato.compania : cuenta.compania,   // nosotros: usamos el cedente 
                        cedente: contrato.compania, 
                        tipo: "A",
                        origen: `cuenta ${contrato.numero}-${definicion.numero.toString()}`,
                        referencia: contrato.codigo ? contrato.codigo : "Indefinida",

                        cobroPagoFlag: false, 

                        serie: cuenta.serie, 
                        tipoNegocio: "Prop", 
                        categoria: "Saldo",  

                        descripcion: `Saldo del movimiento técnico - Período ${moment(definicion.desde).format("DD-MMM-YY")} a ${moment(definicion.hasta).format("DD-MMM-YY")}`,
                        monto: cuenta.saldo, 

                        // para poder leer posteriormente el registro que dió origen a éste. Por ejemplo, para obtener el saldo 
                        // de cuenta técnica original y obtener el corretaje ... 
                        origen_keys: [ cuenta._id, ], 
                    
                        usuario: userEmail,
                        ingreso: new Date(),
                        ultAct: new Date(),
                        cia: periodoCierre.cia,
                    }

                    CierreRegistro.insert(registro); 
                    cantidadCuentasYComp_contProp++; 
                }

                // al menos por ahora, los saldos (montos finales) en complementarios, son registros super similares (iguales!). En un 
                // futuro, cada complementario podría irse diferenciando, cuando códifiquemos especificidades de cada uno. Por eso, ahora
                // usamos una función para leer y grabar los complementarios para la definición y grabarlos como registros de cierre ... 

                let cantComplementarios_contProp = 0; 

                cantComplementarios_contProp = grabarAlCierreRegistrosComplementario("comAdic", contrato, definicion, periodoCierre.cia, ContratosProp_comAdic_montosFinales);  
                cantidadCuentasYComp_contProp += cantComplementarios_contProp; 
                
                cantComplementarios_contProp = grabarAlCierreRegistrosComplementario("partBeneficios", contrato, definicion, periodoCierre.cia, ContratosProp_partBeneficios_montosFinales); 
                cantidadCuentasYComp_contProp += cantComplementarios_contProp; 
                
                cantComplementarios_contProp = grabarAlCierreRegistrosComplementario("retCartPr", contrato, definicion, periodoCierre.cia, ContratosProp_retCartPr_montosFinales); 
                cantidadCuentasYComp_contProp += cantComplementarios_contProp; 
                
                cantComplementarios_contProp = grabarAlCierreRegistrosComplementario("entCartPr", contrato, definicion, periodoCierre.cia, ContratosProp_entCartPr_montosFinales); 
                cantidadCuentasYComp_contProp += cantComplementarios_contProp; 
                
                cantComplementarios_contProp = grabarAlCierreRegistrosComplementario("retCartSn", contrato, definicion, periodoCierre.cia, ContratosProp_retCartSn_montosFinales); 
                cantidadCuentasYComp_contProp += cantComplementarios_contProp; 
                
                cantComplementarios_contProp = grabarAlCierreRegistrosComplementario("entCartSn", contrato, definicion, periodoCierre.cia, ContratosProp_entCartSn_montosFinales); 
                cantidadCuentasYComp_contProp += cantComplementarios_contProp; 
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
                }
            }
            // -------------------------------------------------------------------------------------------------------
        }


        // NOTA IMPORTANTE: aquí vamos a leer pagos, en cuotas, en vez de remesas. La idea es que podamos separarlas de acuerdo a su 
        // tipo de negocio: Prop, NoProp, Fac, 
        // ----------------------------------------------------------------------------------------------------------------
        // ahora grabamos las remesas al registro 
        let cobrosPagosAgregados = 0; 
        let erroresEncontrados = 0; 
        const erroresArray = []; 

        // contamos las cuotas que leeremos más abajo, para mostrar el meteor en el cliente 
        const cantidadCuotasConPagos = Cuotas.find({ 'pagos.fecha': { $gte: periodoCierre.desde, $lte: periodoCierre.hasta }, cia: periodoCierre.cia }).count(); 

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = cantidadCuotasConPagos;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 3;
        message = `leyendo los pagos y cobros ... `

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: message
                    };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        const cuotasCobradasPagadas = Cuotas.find({ 'pagos.fecha': { $gte: periodoCierre.desde, $lte: periodoCierre.hasta }, cia: periodoCierre.cia }).fetch(); 

        for (const cuota of cuotasCobradasPagadas) { 

            // la cuota puede tener varios pagos, aunque no es muy usual; leemos solo los que apliquen ... 
            const pagos = cuota.pagos.filter(p => p.fecha >= periodoCierre.desde && p.fecha <= periodoCierre.hasta); 

            for (const p of pagos) { 

                const remesa = Remesas.findOne(p.remesaID, { fields: { 
                    fecha: 1, instrumentoPago: 1, compania: 1, moneda: 1, numero: 1, miSu: 1, 
                }}); 

                if (!remesa) {  
                    const message = `Error: no hemos podido leer la remesa que corresponde a uno de los pagos registrados en el período de cierre. <br />
                                Los datos del pago mencionado son: origen: <b>${cuota.source.origen} ${cuota.source.numero}</b>, 
                                fecha: <b>${moment(p.fecha).format("DD-MMM-YYYY")}</b>, 
                                monto: <b>${numeral(p.monto).format("0,0.00")}</b>.  
                    `; 

                    erroresArray.push(message); 
                    erroresEncontrados++; 

                    continue; 
                }

                const banco = Bancos.findOne(remesa.instrumentoPago && remesa.instrumentoPago.banco ? remesa.instrumentoPago.banco : null, { fields: { abreviatura: 1 }});
                const compania = Companias.findOne(cuota.compania, { fields: { abreviatura: 1 }});  
                const cuentaBancaria = CuentasBancarias.findOne(remesa.instrumentoPago && remesa.instrumentoPago.cuentaBancaria ? remesa.instrumentoPago.cuentaBancaria : null, { numero: 1, tipo: 1 })
                
                // leemos la entidad de origen, para obtener la referencia 
                let referenciaEntidadOrigen = null; 
                let tipoNegocio = ""; 
                let origen_keys = []; 
                let cedente = ""; 

                switch(cuota.source.origen) { 
                    case 'fac': { 
                        const riesgo = Riesgos.findOne(cuota.source.entityID, { fields: { asegurado: 1, compania: 1, }}); 
                        if (riesgo) { 
                            cedente = riesgo.compania; 
                            const asegurado = Asegurados.findOne({ _id: riesgo.asegurado }, { fields: { abreviatura: true, }}); 
                            if (asegurado) { 
                                referenciaEntidadOrigen = asegurado.abreviatura; 
                            }
                        }
                        tipoNegocio = "Fac"; 

                        // para, por ejemplo, en consultas posteriores, poder encontrar fácilmente, el registro (cuota) que dió origen 
                        // a éste ... 
                        origen_keys = [ cuota._id, ];   

                        break; 
                    }
                    case 'cuenta':  { // la verdad es que éstas ahora no se leen 
                        const contrato = Contratos.findOne(cuota.source.entityID, { fields: { codigo: true, compania: 1, }}); 

                        if (contrato) { 
                            cedente = contrato.compania; 
                            referenciaEntidadOrigen = contrato.codigo ? contrato.codigo : "Indefinida"; 
                        }
                        tipoNegocio = "Prop"; 

                        // para, por ejemplo, en consultas posteriores, poder encontrar fácilmente, el registro (cuota) que dió origen 
                        // a éste ... 
                        origen_keys = [ cuota._id, ];   

                        break; 
                    }
                    case 'capa': { 
                        const contrato = Contratos.findOne(cuota.source.entityID, { fields: { codigo: true, compania: 1, }}); 
                        if (contrato) { 
                            cedente = contrato.compania; 
                            referenciaEntidadOrigen = contrato.codigo ? contrato.codigo : "Indefinida"; 
                        }
                        tipoNegocio = "NoProp"; 

                        // para, por ejemplo, en consultas posteriores, poder encontrar fácilmente, el registro (cuota) que dió origen 
                        // a éste ... 
                        origen_keys = [ cuota._id, ];   

                        break; 
                    }
                    case 'sinFac': { 
                        const siniestro = Siniestros.findOne(cuota.source.entityID, { fields: { asegurado: 1, compania: 1, }}); 
                        if (siniestro) { 
                            cedente = siniestro.compania; 
                            const asegurado = Asegurados.findOne({ _id: siniestro.asegurado }, { fields: { abreviatura: true, }}); 
                            if (asegurado) { 
                                referenciaEntidadOrigen = asegurado.abreviatura; 
                            }
                        }
                        tipoNegocio = "Fac"; 

                        // para, por ejemplo, en consultas posteriores, poder encontrar fácilmente, el registro (cuota) que dió origen 
                        // a éste ... 
                        origen_keys = [ cuota._id, ];   

                        break; 
                    }
                }

                let pagoCompletoParcial = "completo"; 
                if (!p.completo) { 
                    pagoCompletoParcial = "parcial"; 
                }

                const registro = {
                    _id: new Mongo.ObjectID()._str,
                    
                    fecha: p.fecha,
                    moneda: p.moneda,
                    compania: cuota.compania,
                    cedente: cedente, 
                    tipo: "A",
                    origen: `Rem ${remesa.numero.toString()} ${remesa.miSu}`,
                    referencia: referenciaEntidadOrigen,

                    cobroPagoFlag: true, 

                    serie: null,            // solo aplica a registros de proporcionales 
                    tipoNegocio: tipoNegocio, 

                    categoria: p.monto < 0 ? "Cobro" : "Pago",  

                    descripcion: `Remesa ${remesa.numero.toString()} - ${compania.abreviatura} - ${remesa.miSu} - ${moment(remesa.fecha).format("DD-MMM-YY")} - ${banco ? banco.abreviatura : ''} - ${cuentaBancaria ? cuentaBancaria.tipo : ''} - ${cuentaBancaria ? cuentaBancaria.numero : ''} - ${pagoCompletoParcial}.`,
                    monto: p.monto, 
                    
                    origen_keys, 

                    usuario: userEmail,
                    ingreso: new Date(),
                    ultAct: new Date(),
                    cia: periodoCierre.cia,
                }

                CierreRegistro.insert(registro); 
                cobrosPagosAgregados++; 
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
        }

        // finalmente, grabamos el cierre; si el período ya se había cerrado, lo actualizamos; de otra forma, lo agregamos ... 
        const cierreEfectuado = Cierre.findOne(periodoCierre._id); 

        const itemUsuariosArray = { 
            _id: new Mongo.ObjectID()._str,
            user: userEmail, 
            fecha: new Date(), 
            comentarios: `Período cerrado: desde ${moment(periodoCierre.desde).format("DD-MMM-YYYY")} hasta ${moment(periodoCierre.hasta).format("DD-MMM-YYYY")}.`
        }; 

        if (cierreEfectuado) { 
            Cierre.update({ _id: periodoCierre._id }, 
                { $set: { 
                    desde: periodoCierre.desde,
                    hasta: periodoCierre.hasta,
                    fechaEjecucion: new Date(),
                    cerradoFlag: true, 
                    }, 
                  $push: { usuarios: itemUsuariosArray }
                }); 
        } else {
            Cierre.insert({ 
                _id: new Mongo.ObjectID()._str,
                
                desde: periodoCierre.desde,
                hasta: periodoCierre.hasta,
                fechaEjecucion: new Date(),
                cerradoFlag: true, 
                usuarios: [ itemUsuariosArray ], 
                cia: periodoCierre.cia,
            }); 
        }

        itemUsuariosArray

        if (!erroresEncontrados) {      
            return { 
                error: false, 
                message: `Ok, el proceso se ha ejecutado en forma satisfactoria. <br /> 
                          Período cerrado: desde <b>${moment(periodoCierre.desde).format("DD-MMM-YYYY")}</b> hasta <b>${moment(periodoCierre.hasta).format("DD-MMM-YYYY")}</b>. <br />
                          <b>${cuotasAgregadas.toString()}</b> cuotas <em>emitidas</em> han sido leídas para el período indicado y agregadas al cierre. <br /> 
                          <b>${cantidadCuentasYComp_contProp.toString()}</b> saldos y/o complementarios de cont prop, que han sido leídos para el período indicado y agregadas al cierre. <br /> 
                          <b>${cobrosPagosAgregados.toString()}</b> cuotas <em>cobradas o pagadas</em> han sido leídas para el período indicado y agregadas al cierre. 
                `, 
            }
        } else { 

            let message = `El proceso se ha ejecutado, pero con errores. <br /><br /> 
            Período cerrado: desde <b>${moment(periodoCierre.desde).format("DD-MMM-YYYY")}</b> hasta <b>${moment(periodoCierre.hasta).format("DD-MMM-YYYY")}</b>. <br />
                        <b>${cuotasAgregadas.toString()}</b> cuotas <em>emitidas</em> han sido leídas para el período indicado y agregadas al cierre. <br /> 
                        <b>${cantidadCuentasYComp_contProp.toString()}</b> saldos y/o complementarios de cont prop, que han sido leídos para el período indicado y agregadas al cierre. <br /> 
                        <b>${cobrosPagosAgregados.toString()}</b> cuotas <em>cobradas o pagadas</em> han sido leídas para el período indicado y agregadas al cierre.<br /><br />
                        Aunque el proceso de cierre se ha ejecutado en forma completa, se han encontrado algunos errores; los mostramos a continuación ... 
                        `

            let times = 0; 
            for (const e of erroresArray) { 
                message += `<br /><br /> ${e}`

                times++; 
                if (times === 3) { 
                    break;      // mostramos hasta tres mensajes de error ... 
                }
            }

            return { 
                error: false, 
                message: message
            }
        }
    }
})


function grabarAlCierreRegistrosComplementario(tipoComplementario, contrato, definicion, ciaSeleccionada, mongoCollection) { 

    // en esta función leemos registros de un complementario en particular, comAdic, partBenef, entCartPr, etc., y los grabamos a 
    // la tabla de registros del cierre. Como son hasta seis tipos de complementario diferentes, centralizamos este código en esta
    // función para no repetirlo por cada tipo de complementario 
    const userEmail = Meteor.user().emails[0].address;
    let descripcion = ""; 
    let categoria = ""; 
    
    switch (tipoComplementario) { 
        case "comAdic": { 
            descripcion = `Comisión adicional - Período ${moment(definicion.desde).format("DD-MMM-YY")} a ${moment(definicion.hasta).format("DD-MMM-YY")}`; 
            categoria = "ComAdic"; 

            break; 
        }
        case "partBeneficios": { 
            descripcion = `Participación de beneficios - Período ${moment(definicion.desde).format("DD-MMM-YY")} a ${moment(definicion.hasta).format("DD-MMM-YY")}`; 
            categoria = "PartBeneficios"; 
            
            break; 
        }
        case "retCartPr": { 
            descripcion = `Retirada cartera de primas - Período ${moment(definicion.desde).format("DD-MMM-YY")} a ${moment(definicion.hasta).format("DD-MMM-YY")}`; 
            categoria = "RetCartPr"; 
            
            break; 
        }
        case "entCartPr": { 
            descripcion = `Entrada cartera de primas - Período ${moment(definicion.desde).format("DD-MMM-YY")} a ${moment(definicion.hasta).format("DD-MMM-YY")}`; 
            categoria = "EntCartPr"; 
            
            break; 
        }
        case "retCartSn": { 
            descripcion = `Retirada cartera de siniestros - Período ${moment(definicion.desde).format("DD-MMM-YY")} a ${moment(definicion.hasta).format("DD-MMM-YY")}`; 
            categoria = "RetCartSn"; 
            
            break; 
        }
        case "entCartSn": { 
            descripcion = `Entrada cartera de siniestros - Período ${moment(definicion.desde).format("DD-MMM-YY")} a ${moment(definicion.hasta).format("DD-MMM-YY")}`; 
            categoria = "EntCartSn"; 
            
            break; 
        }
    }

    const complementarioArray = mongoCollection.find({ contratoID: contrato._id, definicionID: definicion._id }, 
                                                   { fields: { compania: 1, nosotros: 1, moneda: 1, serie: 1, monto: 1, }})
                                             .fetch(); 

    let cantidadRegistrosAgregados = 0; 

    for (const complementario of complementarioArray) { 
        
        const registro = {
            _id: new Mongo.ObjectID()._str,

            fecha: definicion.desde,
            moneda: complementario.moneda,
            compania: complementario.nosotros ? contrato.compania : complementario.compania,    // nosotros: usamos el cedente en el contrato
            cedente: contrato.compania, 
            tipo: "A",
            origen: `cuenta ${contrato.numero}-${definicion.numero.toString()}`,
            referencia: contrato.codigo ? contrato.codigo : "Indefinida",

            cobroPagoFlag: false, 

            serie: complementario.serie, 
            tipoNegocio: "Prop", 
            categoria: categoria, 

            descripcion: descripcion, 
            monto: complementario.monto, 

            // para poder leer posteriormente el registro que dió origen a éste. Por ejemplo, para obtener el saldo 
            // de cuenta técnica original y obtener el corretaje ... 
            origen_keys: [ complementario._id, ], 
        
            usuario: userEmail,
            ingreso: new Date(),
            ultAct: new Date(),
            cia: ciaSeleccionada,
        }

        CierreRegistro.insert(registro); 
        cantidadRegistrosAgregados++; 
    }

    return cantidadRegistrosAgregados; 
}