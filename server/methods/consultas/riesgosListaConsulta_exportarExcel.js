

import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';
import JSZip from 'jszip';
import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';

import SimpleSchema from 'simpl-schema';
import { Temp_Consulta_Riesgos } from '/imports/collections/consultas/tempConsultaRiesgos'; 
import { Riesgos } from '/imports/collections/principales/riesgos';  

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

Meteor.methods(
{
    riesgosListaConsulta_exportarExcel: function (ciaSeleccionada) {

        new SimpleSchema({
            ciaSeleccionada: { type: Object, blackbox: true, optional: false }
        }).validate({ ciaSeleccionada, });

        // leemos los riesgos que el usuario ha seleccionado y los grabamos en otro collection,
        // para exportar a Excel ...

        // antes que nada, eliminamos del collection de la consulta, los registros de la consulta anterior
        Temp_Consulta_Riesgos_ExportExcel.remove({ user: this.userId });

        let riesgos = Temp_Consulta_Riesgos.find({ user: this.userId }).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = riesgos.length;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 1;
        let currentProcess = 1;

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "riesgosEmitidosLista_consulta_reportProgress";
        let eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'riesgosEmitidosLista_consulta' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `leyendo los riesgos seleccionados ... `
                        };

        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
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
            let riesgo2 = Riesgos.findOne(riesgo.id);

            if (riesgo2 && riesgo2.movimientos && _.isArray(riesgo2.movimientos)) {
                // leemos el 1er. movimiento del riesgo (puede haber más)
                let movimiento = _.find(riesgo2.movimientos, (x) => { return x.numero === 1; });
                if (movimiento && movimiento.coberturasCompanias && _.isArray(movimiento.coberturasCompanias)) {
                    let coberturasCompania = _.filter(movimiento.coberturasCompanias, (x) => { return x.nosotros; });
                    if (coberturasCompania && _.isArray(coberturasCompania)) {
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
                if (movimiento && movimiento.primas && _.isArray(movimiento.primas)) {
                    let primas = _.filter(movimiento.primas, (x) => { return x.nosotros; });
                    if (primas && _.isArray(primas)) {

                        let comision = lodash.sumBy(primas, 'comision');
                        let impuesto = lodash.sumBy(primas, 'impuesto');
                        let impSobrePN = lodash.sumBy(primas, 'impuestoSobrePN');

                        comMasImp += comision ? comision : 0;
                        comMasImp += impuesto ? impuesto : 0;
                        comMasImp += impSobrePN ? impSobrePN : 0;

                        primaNeta = lodash.sumBy(primas, 'primaNeta');
                    }
                }

                // finalmente, obtenemos el corretaje, como la sumatoria de todas las primas netas del
                // movimiento ...
                if (movimiento && movimiento.primas && _.isArray(movimiento.primas)) {
                    corretaje = lodash.sumBy(movimiento.primas, 'primaNeta');
                }
            }

            let item = {
                _id: new Mongo.ObjectID()._str,
                numero: riesgo.numero,
                estado: riesgo.estado,
                desde: riesgo.desde,
                hasta: riesgo.hasta,
                moneda: riesgo.moneda,
                compania: riesgo.compania,
                ramo: riesgo.ramo,
                asegurado: riesgo.asegurado,
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

            Temp_Consulta_Riesgos_ExportExcel.insert(item);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `leyendo los riesgos seleccionados ... `
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `leyendo los riesgos seleccionados ... `
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        // let Future = Npm.require('fibers/future');
        // let XlsxInjector = Meteor.npmRequire('xlsx-injector');
        // let fs = Npm.require('fs');
        // let path = Npm.require('path');

        // leemos los riesgos que el usuario selecciono para la lista
        let consultaRiesgosEmitidos = Temp_Consulta_Riesgos_ExportExcel.find({ user: this.userId }).fetch();

        let riesgosEmitidosArray = [];
        let riesgosEmitidosItem = {};

        // agrupamos por moneda y luego por compañía, para mostrar las cifras en esa forma
        // en el documento Excel
        let riesgosEmitidosGroupByMoneda = lodash.groupBy(consultaRiesgosEmitidos, 'moneda');

        // nótese como ordenamos el objeto por su (unica) key ...
        for (let moneda in lodash(riesgosEmitidosGroupByMoneda).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {

            let riesgosEmitidosByMoneda = riesgosEmitidosGroupByMoneda[moneda];

            riesgosEmitidosItem = {
                moneda: riesgosEmitidosByMoneda[0].moneda,
                compania: "",
                ramo: "",
                suscriptor: "",
                asegurado: "",

                numero: "",
                estado: "",
                desde: "",
                hasta: "",

                sumaAsegurada: lodash.sumBy(riesgosEmitidosByMoneda, 'sumaAsegurada'),
                nuestraOrdenPorc: "",
                sumaReasegurada: lodash.sumBy(riesgosEmitidosByMoneda, 'sumaReasegurada'),
                prima: lodash.sumBy(riesgosEmitidosByMoneda, 'prima'),
                primaBruta: lodash.sumBy(riesgosEmitidosByMoneda, 'primaBruta'),
                comMasImp: lodash.sumBy(riesgosEmitidosByMoneda, 'comMasImp'),
                primaNeta: lodash.sumBy(riesgosEmitidosByMoneda, 'primaNeta'),
                corretaje: lodash.sumBy(riesgosEmitidosByMoneda, 'corretaje'),

                grupo: '*',
                tipoReg: 2,
            };
            riesgosEmitidosArray.push(riesgosEmitidosItem);

            // agrupamos por año ...
            let riesgosEmitidosGroupByMonedaCompania = lodash.groupBy(riesgosEmitidosByMoneda, 'compania');

            // nótese como ordenamos el objeto por su (unica) key ...
            for (let compania in lodash(riesgosEmitidosGroupByMonedaCompania).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {

                let riesgosEmitidosByMonedaCompania = riesgosEmitidosGroupByMonedaCompania[compania];

                // TODO: totalizamos los items para la compañía y escrimos un row a excel
                riesgosEmitidosItem = {
                    moneda: riesgosEmitidosByMonedaCompania[0].moneda,
                    compania: riesgosEmitidosByMonedaCompania[0].compania,
                    ramo: "",
                    suscriptor: "",
                    asegurado: "",

                    numero: "",
                    estado: "",
                    desde: "",
                    hasta: "",

                    sumaAsegurada: lodash.sumBy(riesgosEmitidosByMonedaCompania, 'sumaAsegurada'),
                    nuestraOrdenPorc: "",
                    sumaReasegurada: lodash.sumBy(riesgosEmitidosByMonedaCompania, 'sumaReasegurada'),
                    prima: lodash.sumBy(riesgosEmitidosByMonedaCompania, 'prima'),
                    primaBruta: lodash.sumBy(riesgosEmitidosByMonedaCompania, 'primaBruta'),
                    comMasImp: lodash.sumBy(riesgosEmitidosByMonedaCompania, 'comMasImp'),
                    primaNeta: lodash.sumBy(riesgosEmitidosByMonedaCompania, 'primaNeta'),
                    corretaje: lodash.sumBy(riesgosEmitidosByMonedaCompania, 'corretaje'),

                    grupo: '**',
                    tipoReg: 1,
                };
                riesgosEmitidosArray.push(riesgosEmitidosItem);


                // finalmente, leemos los items para la moneda/compañia y escribimos un row a Excel para cada uno ...
                lodash.orderBy(riesgosEmitidosByMonedaCompania, ['numero'], ['asc']).
                       forEach((riesgo) => {
                    // finalmente, escribimos un row para cada mon/ano/cuenta/monOrig a Excel;
                    // estos son los rows de tipo 'detalle'
                    riesgosEmitidosItem = {
                        moneda: riesgo.moneda,
                        compania: riesgo.compania,
                        ramo: riesgo.ramo,
                        suscriptor: riesgo.suscriptor,
                        asegurado: riesgo.asegurado,

                        numero: riesgo.numero,
                        estado: riesgo.estado,
                        desde: moment(riesgo.desde).format("DD-MM-YYYY"),
                        hasta: moment(riesgo.hasta).format("DD-MM-YYYY"),

                        sumaAsegurada: riesgo.sumaAsegurada,
                        nuestraOrdenPorc: riesgo.nuestraOrdenPorc,
                        sumaReasegurada: riesgo.sumaReasegurada,
                        prima: riesgo.prima,
                        primaBruta: riesgo.primaBruta,
                        comMasImp: riesgo.comMasImp,
                        primaNeta: riesgo.primaNeta,
                        corretaje: riesgo.corretaje,

                        grupo: '',
                        tipoReg: 0,
                    };
                    riesgosEmitidosArray.push(riesgosEmitidosItem);
                });
            };
        };


        // Object containing attributes that match the placeholder tokens in the template
        let values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: riesgosEmitidosArray,
        };

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'consultas', 'consultaRiesgosEmitidosLista.xlsx');

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'consultaRiesgosEmitidosLista.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'consultas', outputFileName);
        // ----------------------------------------------------------------------------------------------------

        // Open a workbook
        let workbook = new XlsxInjector(templatePath);
        let sheetNumber = 1;
        workbook.substitute(sheetNumber, values);
        // Save the workbook
        workbook.writeFile(outputPath);

        // leemos el archivo que resulta de la instrucción anterior; la idea es pasar este 'nodebuffer' a la función que sigue para:
        // 1) grabar el archivo a collectionFS; 2) regresar su url (para hacer un download desde el client) ...
        let buf = fs.readFileSync(outputPath);      // no pasamos 'utf8' como 2do. parámetro; readFile regresa un buffer

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // promise y no el promise object; en este caso, el url del archivo que se ha recién grabado (a collectionFS) ...

        // nótese que en el tipo de plantilla ponemos 'no aplica'; la razón es que esta plantilla no es 'cargada' por el usuario y de las
        // cuales hay diferentes tipos (islr, iva, facturas, cheques, ...). Este tipo de plantilla es para obtener algún tipo de reporte
        // en excel y no tiene un tipo definido ...
        return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'scrwebm', ciaSeleccionada, Meteor.user(), 'xlsx');
    }
});
