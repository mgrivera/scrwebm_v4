
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 

import numeral from 'numeral'; 

import { Remesas } from '/imports/collections/principales/remesas'; 
import { Temp_Consulta_Remesas } from '/imports/collections/consultas/tempConsultaRemesas';  
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 

import { Temp_consulta_list_remesas, Temp_consulta_list_remesas_config } from '/imports/collections/consultas/temp_consulta_list_remesas'; 
import { Cuotas } from '/imports/collections/principales/cuotas';

Meteor.methods(
{
    'remesas.reporte.list.grabarAMongoOpcionesReporte': function (opcionesReporte, companiaSeleccionadaId) {

        new SimpleSchema({
            opcionesReporte: { type: Object, blackbox: true, optional: false, }, 
            companiaSeleccionadaId: { type: String, optional: false, }, 
        }).validate({ opcionesReporte, companiaSeleccionadaId, });

        const companiaSeleccionada = EmpresasUsuarias.findOne(companiaSeleccionadaId, { fields: { nombre: 1, nombreCorto: 1, } });

        Temp_consulta_list_remesas_config.remove({ user: Meteor.userId() }); 
        Temp_consulta_list_remesas.remove({ user: Meteor.userId() }); 

        // grabamos un registro 'config' para que el proceso asp.net pueda saber el valor de algunos parámetros, 
        // como período, compañía, etc. 
        Temp_consulta_list_remesas_config.insert({ 
            opcionesReporte: opcionesReporte, 
            compania: companiaSeleccionada, 
            user: Meteor.userId() 
        }); 
       
        // leemos las remesas que el usuario ha filtrado y que se muestran en la lista. Luego agregamos algunos datos para que  
        // estos items sean leídos por el proceso que ejecuta el report (ssrs desde asp.net)
        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        const remesasSeleccionadas = Temp_Consulta_Remesas.find({ user: Meteor.userId() }).fetch(); 

        const numberOfItems = remesasSeleccionadas.length;
        const reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 1;
        const currentProcess = 1;
        const message = `leyendo las remesas seleccionadas ... `; 

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "remesas.consulta.list.remesas.reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'remesas.consulta.list.remesas' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: message
                        };

        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        remesasSeleccionadas.forEach((item) => {

            // leemos el riesgo para obtener otros datos: suma asegurada, prima, etc.
            const remesa = Remesas.findOne(item.id);

            // leemos las cuotas que tienen pagos que corresponden a la remesa; nota: una cuota puede tener *varios* pagos; éstos 
            // pueden ser de *diferentes* remesas ... 
            const cuotasPagadasConLaRemesa = Cuotas.find({ 'pagos.remesaID': item.id }, { fields: { pagos: 1, }}).fetch(); 

            let cantPagos = 0; 
            let sumatoriaMontoPagos = 0; 
            let pagosMismaMonedaDeLaRemesa = true; 
            let pagosMultiMoneda = false;  
            let diferenciaMontoRemesaPagos = remesa.instrumentoPago ? remesa.instrumentoPago.monto : 0; 

            if (remesa.miSu === "MI") { 
                // el monto en remesas MI (nuestras) debe ser negativo, pues son pagos que hacemos, no que recibimos
                diferenciaMontoRemesaPagos *= -1; 
                item.monto *= -1; 
            }
            let completo = false;       // para indicar en el reporte si hay un pago de forma 'completo' 

            let pagoAnterior_moneda = ""; 

            // es posible que una cuota seleccionada tenga pagos de otras remesas 
            for (const cuota of cuotasPagadasConLaRemesa) { 
                for (const pago of cuota.pagos.filter((x) => x.remesaID === item.id)) { 

                    if (remesa.moneda != pago.moneda) { 
                        pagosMismaMonedaDeLaRemesa = false; 
                    }
    
                    if (pagoAnterior_moneda != "" && pagoAnterior_moneda != pago.moneda) { 
                        // los pagos se han registrado en varias monedas (ej: Bs y $) 
                        pagosMultiMoneda = true; 
                    }
    
                    if (pago.completo) { 
                        completo = true; 
                    }
    
                    diferenciaMontoRemesaPagos += pago.monto;       // nótese que el monto del pago es siempre de signo contrario al monto original 
                    sumatoriaMontoPagos += pago.monto;              // al monto original de la remesa, vamos rebajando el monto de cada pago 
                    cantPagos++; 
                    pagoAnterior_moneda = pago.moneda; 
                } 
            }
            

            item.infoOperaciones = { 
                cantPagos: cantPagos, 
                sumatoriaMontoPagos: sumatoriaMontoPagos,
                pagosMismaMonedaDeLaRemesa: pagosMismaMonedaDeLaRemesa,
                pagosMultiMoneda: pagosMultiMoneda,
                diferenciaMontoRemesaPagos: diferenciaMontoRemesaPagos,
                completo: completo,
            }

            Temp_consulta_list_remesas.insert(item);

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

        return { 
            error: false, 
            message: "Ok, las opciones del reporte han sido registradas.<br />" + 
                     "Ud. debe hacer un <em>click</em> en el <em>link</em> que se ha mostrado, para obtener el reporte. " 
        }
    }
})