
import numeral from 'numeral';
import moment from 'moment';
import lodash from 'lodash';
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 

import { Remesas } from '/imports/collections/principales/remesas';  
import { Temp_Consulta_Remesas } from '/imports/collections/consultas/tempConsultaRemesas'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 

Meteor.methods(
{
    'remesas.leerDesdeMongo': function (filtro) {

        filtro = JSON.parse(filtro);
        const selector = {};

        new SimpleSchema({
            filtro: { type: Object, blackbox: true, optional: false, },
        }).validate({ filtro, });

        // número
        if (filtro.numero1) { 
            if (filtro.numero2) { 
                selector.numero = { $gte: filtro.numero1, $lte: filtro.numero2 };
            }
            else { 
                selector.numero = filtro.numero1;
            }
        }
    
        // nótese como los 'dates' vienen como strings y deben ser convertidos ...
        if (filtro.fecha1 && moment(filtro.fecha1).isValid()) { 
            if (filtro.fecha2 && moment(filtro.fecha2).isValid()) { 
                selector.fecha = { $gte: moment(filtro.fecha1).toDate(), $lte: moment(filtro.fecha2).toDate() };
            }
        else { 
            selector.fecha = moment(filtro.fecha1).toDate();
            }  
        }
    
        // nótese como los 'dates' vienen como strings y deben ser convertidos ...
        if (filtro.fechaCerrada1 && moment(filtro.fechaCerrada1).isValid()) { 
            if (filtro.fechaCerrada2 && moment(filtro.fechaCerrada2).isValid()) { 
                selector.fechaCerrada = { $gte: moment(filtro.fechaCerrada1).toDate(), $lte: moment(filtro.fechaCerrada2).toDate() };
            }
        else { 
            selector.fechaCerrada = moment(filtro.fechaCerrada1).toDate();
            }  
        }
    
        if (filtro.compania && filtro.compania.length) {
            const array = lodash.clone(filtro.compania);
            selector.compania = { $in: array };
        }
    
        if (filtro.moneda && filtro.moneda.length) {
            const array = lodash.clone(filtro.moneda);
            selector.moneda = { $in: array };
        }
    
        if (filtro.observaciones) {
            const search = new RegExp(filtro.observaciones, 'i');
            selector.observaciones = search;
        }
    
        if (filtro.miSu) {
            selector.miSu = filtro.miSu;
        }
    
        if (!filtro.instrumentoPago) { 
            filtro.instrumentoPago = {}; 
        }
    
        if (filtro.instrumentoPago.numero) {
            if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
            const search = new RegExp(filtro.instrumentoPago.numero, 'i');
            selector.instrumentoPago.numero = search; 
        }
    
        if (filtro.instrumentoPago.fecha1 && moment(filtro.instrumentoPago.fecha1).isValid()) { 
            if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
            if (filtro.instrumentoPago.fecha2 && moment(filtro.instrumentoPago.fecha2).isValid()) { 
                selector.instrumentoPago.fecha = { $gte: moment(filtro.instrumentoPago.fecha1).toDate(), $lte: moment(filtro.instrumentoPago.fecha2).toDate() };
            }
        else { 
                selector.instrumentoPago.fecha = moment(filtro.instrumentoPago.fecha1).toDate();
            }  
        }
    
        if (filtro.instrumentoPago.banco && filtro.instrumentoPago.banco.length) {
            if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
            const array = lodash.clone(filtro.instrumentoPago.banco);
            selector.instrumentoPago.banco = { $in: array };
        }
    
        if (filtro.instrumentoPago.tipo && filtro.instrumentoPago.tipo.length) {
            if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
            const array = lodash.clone(filtro.instrumentoPago.tipo);
            selector.instrumentoPago.tipo = { $in: array };
        }
    
        if (filtro.instrumentoPago.monto1) { 
            if (!selector.instrumentoPago) { selector.instrumentoPago = {}; } 
            if (filtro.instrumentoPago.monto2) { 
                selector.instrumentoPago.monto = { $gte: filtro.instrumentoPago.monto1, $lte: filtro.instrumentoPago.monto2 };
            }
            else { 
                // selector.instrumentoPago.monto = filtro.instrumentoPago.monto1;
                selector.instrumentoPago = { monto: filtro.instrumentoPago.monto1 }; 
            }
        }
    
        // cia
        if (filtro.cia) { 
            selector.cia = filtro.cia;
        }
    
        // opciones 
        if (!filtro.opciones) { 
            filtro.opciones = {}; 
        }
    
        if (filtro.opciones.soloCerradas) { 
            selector.fechaCerrada = { $exists: true, $ne: null }; 
        }
    
        if (filtro.opciones.soloAbiertas) { 
            selector.$or = [{ fechaCerrada : { $exists: false }}, { fechaCerrada: { $eq: null }}]; 
        }
    
        if (filtro.opciones.conCuadre) { 
            selector.$and = [{ cuadre : { $exists: true }}, { cuadre: { $ne: [] }}]; 
        }
    
        if (filtro.opciones.conAsientoContable) { 
            selector.$and = [{ asientoContable : { $exists: true }}, { asientoContable: { $ne: [] }}]; 
        }
    
        if (filtro.opciones.sinCuadre) { 
            selector.$or = [{ cuadre : { $exists: false }}, { cuadre: { $eq: [] }}]; 
        }
    
        if (filtro.opciones.sinAsientoContable) { 
            selector.$or = [{ asientoContable : { $exists: false }}, { asientoContable: { $eq: [] }}]; 
        }

        // eliminamos los asientos que el usuario pueda haber registrado antes ...
        Temp_Consulta_Remesas.remove({ user: this.userId });

        const remesas = Remesas.find(selector).fetch();

        if (remesas.length == 0) {
            return "Cero registros han sido leídos desde la base de datos";
        }

        const monedas = Monedas.find({}, { fields: { _id: 1, simbolo: 1, }}).fetch();
        const companias = Companias.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
      
        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        const numberOfItems = remesas.length;
        const reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 1;
        const currentProcess = 1;
        const message = `leyendo las remesas seleccionadas ... `; 

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "remesas.consulta.remesasEmitidas.reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'remesas.consulta.remesasEmitidas' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: message
                        };

        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        remesas.forEach((item) => {

            const moneda = lodash.some(monedas, (x) => { return x._id === item.moneda; }) ?
                         lodash.find(monedas, (x) => { return x._id === item.moneda; }).simbolo :
                         'Indefinido';

            const compania = lodash.some(companias, (x) => { return x._id === item.compania; }) ?
                           lodash.find(companias, (x) => { return x._id === item.compania; }).abreviatura :
                           'Indefinido';

            const remesa = {};

            remesa._id = new Mongo.ObjectID()._str;
            remesa.user = Meteor.userId();

            remesa.id = item._id,
            remesa.numero = item.numero;
            remesa.compania = compania;
            remesa.miSu = item.miSu;
            remesa.moneda = moneda;
            remesa.factorCambio = item.factorCambio; 
            remesa.monto = item.instrumentoPago && item.instrumentoPago.monto ? item.instrumentoPago.monto : 0;
            remesa.fecha = item.fecha;
            remesa.fechaCerrada = item.fechaCerrada;
            remesa.observaciones = item.observaciones;
            remesa.cia = item.cia;

            Temp_Consulta_Remesas.insert(remesa);

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

        return "Ok, las remesas que cumplen el criterio indicado, han sido leídos desde la base de datos.";
    }
})