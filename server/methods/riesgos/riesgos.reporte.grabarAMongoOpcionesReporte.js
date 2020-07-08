
import { Temp_consulta_riesgosEmitidos_config, Temp_consulta_riesgosEmitidos } from 'imports/collections/consultas/temp_consulta_riesgosEmitidos'; 
import { Temp_Consulta_Riesgos } from 'imports/collections/consultas/tempConsultaRiesgos'; 
import { Riesgos } from 'imports/collections/principales/riesgos'; 
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 

import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 

import lodash from 'lodash'; 
import numeral from 'numeral'; 

Meteor.methods(
{
    'riesgos.reporte.grabarAMongoOpcionesReporte': function (opcionesReporte, empresaSeleccionada) {

        new SimpleSchema({
            opcionesReporte: { type: Object, blackbox: true, optional: false, }, 
            empresaSeleccionada: { type: Object, blackbox: true, optional: false, }, 
        }).validate({ opcionesReporte, empresaSeleccionada, });

        Temp_consulta_riesgosEmitidos_config.remove({ user: Meteor.userId() }); 
        Temp_consulta_riesgosEmitidos.remove({ user: Meteor.userId() }); 

        // grabamos un registro 'config' para que el proceso asp.net pueda saber el valor de algunos parámetros, 
        // como período, compañía, etc. 
        Temp_consulta_riesgosEmitidos_config.insert({ 
            opcionesReporte: opcionesReporte, 
            compania: empresaSeleccionada, 
            user: Meteor.userId() 
        }); 


        const monedas = Monedas.find({}, { fields: { _id: 1, simbolo: true, descripcion: true, }}).fetch();
        const companias = Companias.find({}, { fields: { _id: 1, nombre: true, abreviatura: true, }}).fetch();
        const ramos = Ramos.find({}, { fields: { _id: 1, descripcion: true, abreviatura: true, }}).fetch();


        // leemos los riesgos que el usuario ha seleccionado, completamos con las cifras de emisión y grabamos a un collection en mongo para 
        // que el proceso que ejecuta el report (asp.net) los lea y muestre en el report 
        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        const riesgos = Temp_Consulta_Riesgos.find({ user: this.userId }).fetch();

        const numberOfItems = riesgos.length;
        const reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 1;
        const currentProcess = 1;
        const message = `leyendo los riesgos seleccionados ... `; 

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "riesgos.consulta.riesgosEmitidos.reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'riesgos.consulta.riesgosEmitidos' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: message
                        };

        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        riesgos.forEach(riesgo => {

            let sumaAsegurada = 0;
            let nuestraOrdenPorc = 0;
            let sumaReasegurada = 0;
            let prima = 0;
            let primaBruta = 0;
            let comMasImp = 0;
            let primaNeta = 0;
            let corretaje = 0;

            // leemos el riesgo para obtener otros datos: suma asegurada, prima, etc.
            const riesgo2 = Riesgos.findOne(riesgo.id);

            if (riesgo2 && riesgo2.movimientos && lodash.isArray(riesgo2.movimientos)) {
                // leemos el 1er. movimiento del riesgo (puede haber más)
                const movimiento = lodash.find(riesgo2.movimientos, (x) => { return x.numero === 1; });
                if (movimiento && movimiento.coberturasCompanias && lodash.isArray(movimiento.coberturasCompanias)) {
                    const coberturasCompania = lodash.filter(movimiento.coberturasCompanias, (x) => { return x.nosotros; });
                    if (coberturasCompania && lodash.isArray(coberturasCompania)) {
                        // coberturasCompania es siempre un array, aunque puede ser de 1 solo item. Pueden
                        // venir cifras para varias coberturas y debemos sumar todos estos montos ...
                        sumaAsegurada = lodash.sumBy(coberturasCompania, 'sumaAsegurada');
                        nuestraOrdenPorc = 0;
                        sumaReasegurada = lodash.sumBy(coberturasCompania, 'sumaReasegurada');
                        prima = lodash.sumBy(coberturasCompania, 'prima');
                        primaBruta = lodash.sumBy(coberturasCompania, 'primaBruta');

                        if (sumaAsegurada && sumaAsegurada != 0) {
                            nuestraOrdenPorc = sumaReasegurada * 100 / sumaAsegurada;
                        }
                    }
                }

                // ahora leemos comisión, impuestos y prima neta en el array de primas ...
                if (movimiento && movimiento.primas && lodash.isArray(movimiento.primas)) {
                    const primas = lodash.filter(movimiento.primas, (x) => { return x.nosotros; });
                    if (primas && lodash.isArray(primas)) {

                        const comision = lodash.sumBy(primas, 'comision');
                        const impuesto = lodash.sumBy(primas, 'impuesto');
                        const impSobrePN = lodash.sumBy(primas, 'impuestoSobrePN');

                        comMasImp += comision ? comision : 0;
                        comMasImp += impuesto ? impuesto : 0;
                        comMasImp += impSobrePN ? impSobrePN : 0;

                        primaNeta = lodash.sumBy(primas, 'primaNeta');
                    }
                }

                // finalmente, obtenemos el corretaje, como la sumatoria de todas las primas netas del
                // movimiento ...
                if (movimiento && movimiento.primas && lodash.isArray(movimiento.primas)) {
                    corretaje = lodash.sumBy(movimiento.primas, 'primaNeta');
                }
            }

            const moneda = lodash.find(monedas, (x) => { return x._id === riesgo2.moneda; });
            const compania = lodash.find(companias, (x) => { return x._id === riesgo2.compania; });
            const ramo = lodash.find(ramos, (x) => { return x._id === riesgo2.ramo; });

            const item = {
                _id: new Mongo.ObjectID()._str,
                numero: riesgo.numero,
                estado: riesgo.estado,
                desde: riesgo.desde,
                hasta: riesgo.hasta,

                monedaDescripcion: moneda ? moneda.descripcion : 'Indef',
                monedaSimbolo: moneda ? moneda.simbolo : 'Indef',

                companiaNombre: compania ? compania.nombre : 'Indef',
                companiaAbreviatura: compania ? compania.abreviatura : 'Indef', 

                ramoDescripcion: ramo ? ramo.descripcion : 'Indef',
                ramoAbreviatura: ramo ? ramo.abreviatura : 'Indef', 

                asegurado: riesgo.asegurado,
                nombreAsegurado: riesgo.nombreAsegurado,
                suscriptor: riesgo.suscriptor,

                'sumaAsegurada': sumaAsegurada,
                'nuestraOrdenPorc': nuestraOrdenPorc,
                'sumaReasegurada': sumaReasegurada,
                'prima': prima,
                'primaBruta': primaBruta,
                'comMasImp': comMasImp,
                'primaNeta': primaNeta,
                'corretaje': corretaje,

                cia: riesgo.cia,
                user: this.userId,
            };

            Temp_consulta_riesgosEmitidos.insert(item);

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