
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 
import { check } from 'meteor/check';
import { Match } from 'meteor/check'

import * as moment from 'moment';
import * as lodash from 'lodash';
import * as numeral from 'numeral';

import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 
import { Consulta_Cumulos } from 'imports/collections/consultas/consulta_cumulos'; 
import { Cumulos_Registro } from 'imports/collections/principales/cumulos_registro'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 
import { Cumulos } from 'imports/collections/catalogos/cumulos'; 
import { TiposObjetoAsegurado } from 'imports/collections/catalogos/tiposObjetoAsegurado'; 

Meteor.methods(
{
    'consultas.cumulos': function (filtro) {

        check(filtro, Match.ObjectIncluding({ cia: String }));

        if (!filtro) {
            throw new Meteor.Error("Ud. debe indicar un criterio de selección a esta consulta.");
        }

        if (filtro.vigenciaDesde || filtro.vigenciaHasta) {
            if (!filtro.vigenciaDesde || !filtro.vigenciaHasta) {
                throw new Meteor.Error(`Ud. ha indicado un período incompleto en el filtro.<br /> 
                                        Por favor indique un período completo (desde y hasta).`);
            }
        }

        // antes que nada, eliminamos del collection de la consulta, los registros de la consulta anterior
        Consulta_Cumulos.remove({ user: this.userId });

        var matchCriteria = {
            cia: filtro.cia,
        } as any;

        if (filtro.vigenciaDesde) {
            matchCriteria.desde = {
                $gte: moment(filtro.vigenciaDesde).toDate(),
            };
        }

        if (filtro.vigenciaHasta) {
            matchCriteria.hasta = {
                $lte: moment(filtro.vigenciaHasta).toDate(),
            };
        }

        if (filtro.monedas && Array.isArray(filtro.monedas) && filtro.monedas.length > 0) {
            var array = lodash.clone(filtro.monedas);
            matchCriteria.moneda = { $in: array };
        }

        if (filtro.companias && Array.isArray(filtro.companias) && filtro.companias.length > 0) {
            var array = lodash.clone(filtro.companias);
            matchCriteria.cedente = { $in: array };
        }

        if (filtro.ramos && Array.isArray(filtro.ramos) && filtro.ramos.length > 0) {
            var array = lodash.clone(filtro.ramos);
            matchCriteria.ramo = { $in: array };
        }

        if (filtro.tiposCumulo && Array.isArray(filtro.tiposCumulo) && filtro.tiposCumulo.length > 0) {
            var array = lodash.clone(filtro.tiposCumulo);
            matchCriteria.tipoCumulo = { $in: array };
        }

        if (filtro.indoles && Array.isArray(filtro.indoles) && filtro.indoles.length > 0) {
            var array = lodash.clone(filtro.indoles);
            matchCriteria.indole = { $in: array };
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
        let numberOfProcess = 2;
        let currentProcess = 1;
        let message = `leyendo los registros de cúmulo ... `

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "cumulos_consulta_reportProgress";
        let eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'cumulos_consulta' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: message
                        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        let result = Cumulos_Registro.aggregate(pipeline);

        let monedas = Monedas.find({}, { fields: { simbolo: 1, descripcion: 1, }}).fetch();
        let companias = Companias.find({}, { fields: { abreviatura : 1, nombre: 1, }}).fetch();
        let ramos = Ramos.find({}, { fields: { abreviatura : 1, descripcion: 1, }}).fetch();
        let indoles = Indoles.find({}, { fields: { abreviatura : 1, descripcion: 1, }}).fetch();
        let cumulos = Cumulos.find({}, { fields: { abreviatura : 1, descripcion: 1, zonas: 1, }}).fetch();
        let tiposObjetoAsegurado = TiposObjetoAsegurado.find({}, { fields: { abreviatura : 1, descripcion: 1, }}).fetch();

        let cantidadRegistrosAgregados = 0;

        let moneda = {} as any;
        let compania = {} as any;
        let ramo = {} as any;
        let indole = {} as any;
        let cumulo = {} as any;
        let zona = {} as any;
        let tipoObjetoAsegurado = {} as any;

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = result.length;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        message = `leyendo descripciones en catálogos ... `

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: message
                    };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        result.forEach(item => {

            moneda = monedas.find((x) => { return item.moneda === x._id; });
            cumulo = cumulos.find((x) => { return item.tipoCumulo === x._id; });
            compania = companias.find((x) => { return item.cedente === x._id; });
            ramo = ramos.find((x) => { return item.ramo === x._id; });
            indole = indoles.find((x) => { return item.indole === x._id; });
            tipoObjetoAsegurado = tiposObjetoAsegurado.find((x) => { return item.tipoObjetoAsegurado === x._id; });

            // la zona está en el array de zonas en el cúmulo asociado al registro 
            zona = {}; 
            if (cumulo && cumulo.zonas && Array.isArray(cumulo.zonas)) { 
                zona = cumulo.zonas.find(x => x._id === item.zona); 
            }

            let cumulo_registro = {
                _id: new Mongo.ObjectID()._str,

                moneda: item.moneda,
                monedaSimbolo: moneda ? moneda.simbolo : "Indef",
                monedaDescripcion: moneda ? moneda.descripcion : "Indef",

                tipoCumulo: item.tipoCumulo,
                tipoCumuloAbreviatura: cumulo ? cumulo.abreviatura : "Indef",
                tipoCumuloDescripcion: cumulo ? cumulo.descripcion : "Indef",

                zona: item.zona,
                zonaAbreviatura: zona ? zona.abreviatura : "Indef",
                zonaDescripcion: zona ? zona.descripcion : "Indef",

                cumuloYZona: `${cumulo ? cumulo.abreviatura : "Indef"}/${zona ? zona.abreviatura : "Indef"}`, 

                cedente: item.cedente,
                cedenteAbreviatura: compania ? compania.abreviatura : "Indef",
                cedenteNombre: compania ? compania.nombre : "Indef",

                ramo: item.ramo,
                ramoAbreviatura: ramo ? ramo.abreviatura : "Indef",
                ramoDescripcion: ramo ? ramo.descripcion : "Indef",

                indole: item.indole,
                indoleAbreviatura: indole ? indole.abreviatura : "Indef",
                indoleDescripcion: indole ? indole.descripcion : "Indef",

                tipoObjetoAsegurado: item.tipoObjetoAsegurado,
                tipoObjetoAseguradoAbreviatura: tipoObjetoAsegurado ? tipoObjetoAsegurado.abreviatura : "Indef",
                tipoObjetoAseguradoDescripcion: tipoObjetoAsegurado ? tipoObjetoAsegurado.descripcion : "Indef",

                cumuloID: item._id,
                origen: item.source.origen + '-' + item.source.numero,

                desde: item.desde,
                hasta: item.hasta,

                valoresARiesgo: item.valoresARiesgo,
                sumaAsegurada: item.sumaAsegurada,
                prima: item.prima,
                nuestraOrdenPorc: item.nuestraOrdenPorc,
                sumaReasegurada: item.sumaReasegurada,
                primaBruta: item.primaBruta,

                cia: item.cia,
                user: this.userId,
            };

            Consulta_Cumulos.insert(cumulo_registro);
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
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        return `Ok, el proceso se ha ejecutado en forma satisfactoria.<br /><br /> +
                En total, ${cantidadRegistrosAgregados.toString()} registros han sido seleccionados y
                conforman esta consulta.`;
    }
})