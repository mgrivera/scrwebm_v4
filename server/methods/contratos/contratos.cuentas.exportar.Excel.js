
import { Meteor } from 'meteor/meteor'; 

import moment from 'moment';
import lodash from 'lodash';

import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util'; 

import SimpleSchema from 'simpl-schema';

import { Contratos } from '/imports/collections/principales/contratos'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { ContratosProp_cuentas_resumen, ContratosProp_cuentas_distribucion, ContratosProp_cuentas_saldos, } from '/imports/collections/principales/contratos'; 

// import { myMkdirSync } from '/server/generalFunctions/myMkdirSync'; 
import { dropBoxCreateSharedLink } from '/server/imports/general/dropbox/createSharedLink';
import { readFromDropBox_writeToFS, readFileFromDisk_writeToDropBox } from '/server/imports/general/dropbox/exportToExcel'; 

Meteor.methods(
{
    'contratos.cuentas.exportar.Excel': async function (contratoID, definicionCuentaTecnicaID, ciaSeleccionada, fileName, dropBoxPath) {

        new SimpleSchema({
            contratoID: { type: String, optional: false },
            definicionCuentaTecnicaID: { type: String, optional: false },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false },
        }).validate({ contratoID, definicionCuentaTecnicaID, ciaSeleccionada, });

        // ---------------------------------------------------------------------------------------------
        // aquí comienza el proceso de obtención de datos para la consulta 
        const companias = Companias.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();
        const monedas = Monedas.find({}, { fields: { _id: true, descripcion: true, simbolo: true, }}).fetch();

        const contrato = Contratos.findOne(contratoID);
        const definicionCuentaTecnicaSeleccionada = lodash.find(contrato.cuentasTecnicas_definicion, (x) => { return x._id === definicionCuentaTecnicaID; });

        const infoDefinicionCuentaTecnicaSeleccionada =
            `Cifras para la cuenta técnica ${definicionCuentaTecnicaSeleccionada.numero.toString()} - ${lodash.find(monedas, (x) => { return x._id === definicionCuentaTecnicaSeleccionada.moneda; }).descripcion} - ${moment(definicionCuentaTecnicaSeleccionada.fecha).format('DD-MMM-YYYY')}`;

        const cedente = Companias.findOne(contrato.compania);
        const tipoContrato = TiposContrato.findOne(contrato.tipo);
        const ramo = Ramos.findOne(contrato.ramo);

        const definicionesArray = [];
        let definicion = {};

        contrato.cuentasTecnicas_definicion.forEach((def) => {

            const moneda = monedas.find((x) => { return x._id === def.moneda; });

            definicion = {
                numero: def.numero,
                moneda: moneda.simbolo ? moneda.simbolo : 'Indef',
                desde: moment(def.desde).format("DD-MMM-YYYY"),
                hasta: moment(def.hasta).format("DD-MMM-YYYY"),
                fechaVencimiento: moment(def.fechaVencimiento).format("DD-MMM-YYYY"),
                fechaRecepcion: def.fechaRecepcion ? moment(def.fechaRecepcion).format("DD-MMM-YYYY") : '',
                grupo: '',
            };

            definicionesArray.push(definicion);
        })

        // ----------------------------------------------------------------------------------------------------- 
        // leemos el contenido de las tablas de cuentas técnicas: resumen, distribución y saldos, y los ponemos en 
        // arrays, para tener estos registros disponibles en lo sucesivo. Nótese como filtramos usando el id de la 
        // definición seleccionada 
        const cuentas_resumen = ContratosProp_cuentas_resumen.find({ contratoID: contratoID, definicionID: definicionCuentaTecnicaID }).fetch(); 
        const cuentas_distribucion = ContratosProp_cuentas_distribucion.find({ contratoID: contratoID, definicionID: definicionCuentaTecnicaID }).fetch(); 
        const cuentas_saldos = ContratosProp_cuentas_saldos.find({ contratoID: contratoID, definicionID: definicionCuentaTecnicaID }).fetch(); 

        // ------------------------------------------------------------------------------------------------------
        // resumen de primas y siniestros
        const resumenPrimasSiniestrosArray = [];
        let resumenPrimasSiniestros = {};

        const ramos = Ramos.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();
        const tiposContrato = TiposContrato.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();

        const resumenPrSin_GroupByMoneda = lodash.groupBy(cuentas_resumen, 'moneda');

        for (const monedaKey in resumenPrSin_GroupByMoneda) {

            const resumenPrSin_GroupByMoneda_array = resumenPrSin_GroupByMoneda[monedaKey];

            resumenPrSin_GroupByMoneda_array.forEach((resumen) => {

                const moneda = monedas.find((x) => { return x._id === resumen.moneda; });
                const ramo = ramos.find((x) => { return x._id === resumen.ramo; });
                const tipoContrato = tiposContrato.find((x) => { return x._id === resumen.tipoContrato; });

                resumenPrimasSiniestros = {
                    moneda: moneda.simbolo ? moneda.simbolo : 'Indef',
                    monedaTipoRow: 'd',
                    ramo: ramo.abreviatura ? ramo.abreviatura : 'Indef',
                    tipo: tipoContrato.abreviatura ? tipoContrato.abreviatura : 'Indef',
                    serie: resumen.serie,
                    primas: resumen.primas ? resumen.primas : 0,
                    siniestros: resumen.siniestros ? resumen.siniestros : 0,
                    grupo: '',
                };

                resumenPrimasSiniestrosArray.push(resumenPrimasSiniestros);
            })

            // agregamos un total para la moneda
            // leemos la moneda del 1er. item en el array; todos tienen la misma maneda ...
            const moneda = monedas.find((x) => { return x._id === resumenPrSin_GroupByMoneda_array[0].moneda; });
            const sumOfPrimas_byMoneda = lodash.sumBy(resumenPrSin_GroupByMoneda_array, 'primas');
            const sumOfSiniestros_byMoneda = lodash.sumBy(resumenPrSin_GroupByMoneda_array, 'siniestros');

            resumenPrimasSiniestros = {
                moneda: moneda.simbolo ? moneda.simbolo : 'Indef',
                monedaTipoRow: 't',
                ramo: '',
                tipo: '',
                serie: '',
                primas: sumOfPrimas_byMoneda ? sumOfPrimas_byMoneda : 0,
                siniestros: sumOfSiniestros_byMoneda ? sumOfSiniestros_byMoneda : 0,
                grupo: '*',
            };
            resumenPrimasSiniestrosArray.push(resumenPrimasSiniestros);
        }

        // ------------------------------------------------------------------------------------------------------
        // mostramos la distribución de primas y siniestros en compañías ... agrupamos por moneda y compañía
        const distribucionArray = [];
        let distribucion = {};

        const distribucion_groupByMoneda = lodash.groupBy(cuentas_distribucion, 'moneda');

        for (const monedaKey in distribucion_groupByMoneda) {

            // ahora agrupamos por compañía
            const distribucion_groupByMoneda_array = lodash.cloneDeep(distribucion_groupByMoneda[monedaKey]);    
            const firstItemInArray = lodash.cloneDeep(distribucion_groupByMoneda_array[0]);                    

            const moneda = monedas.find((x) => { return x._id === firstItemInArray.moneda; });

            const distribucion_groupByMonComp = lodash.groupBy(distribucion_groupByMoneda_array, 'compania');

            for (const companiaKey in distribucion_groupByMonComp) {

                const distribucion_groupByMonComp_array = distribucion_groupByMonComp[companiaKey];
                const firstItemInArray = distribucion_groupByMonComp_array[0];

                const compania = companias.find((x) => { return x._id === firstItemInArray.compania; });

                distribucion_groupByMonComp_array.forEach((dist) => {

                    const ramo = ramos.find((x) => { return x._id === dist.ramo; });
                    const tipoContrato = tiposContrato.find((x) => { return x._id === dist.tipoContrato; });

                    distribucion = {
                        moneda: moneda.simbolo ? moneda.simbolo : 'Indef',
                        monedaTipoRow: 'd',
                        compania: compania.abreviatura ? compania.abreviatura : 'Indef',
                        companiaTipoRow: 'd',
                        nosotros: dist.nosotros ? 'ok' : '',
                        ramo: ramo.abreviatura ? ramo.abreviatura : 'Indef',
                        tipo: tipoContrato.abreviatura ? tipoContrato.abreviatura : 'Indef',
                        serie: dist.serie,
                        primas: dist.prima ? dist.prima : 0,
                        ordenPorc: dist.ordenPorc,
                        primaBruta: dist.primaBruta,
                        comisionPorc: dist.comisionPorc ? dist.comisionPorc : 0,
                        comision: dist.comision ? dist.comision : 0,
                        imp1Porc: dist.imp1Porc ? dist.imp1Porc : 0,
                        imp1: dist.imp1 ? dist.imp1 : 0,
                        imp2Porc: dist.imp2Porc ? dist.imp2Porc : 0,
                        imp2: dist.imp2 ? dist.imp2 : 0,
                        imp3Porc: dist.imp3Porc ? dist.imp3Porc : 0,
                        imp3: dist.imp3 ? dist.imp3 : 0,
                        primaNetaAntesCorretaje: dist.primaNetaAntesCorretaje,
                        corretajePorc: dist.corretajePorc ? dist.corretajePorc : 0,
                        corretaje: dist.corretaje ? dist.corretaje : 0,
                        primaNeta: dist.primaNeta,
                        siniestros: dist.siniestros ? dist.siniestros : 0,
                        siniestros_suParte: dist.siniestros_suParte ? dist.siniestros_suParte : 0,
                        saldo: dist.saldo,

                        grupo: '',
                    };
                    distribucionArray.push(distribucion);
                })

                // agregamos total para la compañía
                // const sumByMonCom_primas = lodash.sumBy(distribucion_groupByMonComp_array, 'prima');
                const sumByMonCom_primaBruta = lodash.sumBy(distribucion_groupByMonComp_array, 'primaBruta');
                const sumByMonCom_comision = lodash.sumBy(distribucion_groupByMonComp_array, 'comision');
                const sumByMonCom_imp1 = lodash.sumBy(distribucion_groupByMonComp_array, 'imp1');
                const sumByMonCom_imp2 = lodash.sumBy(distribucion_groupByMonComp_array, 'imp2');
                const sumByMonCom_imp3 = lodash.sumBy(distribucion_groupByMonComp_array, 'imp3');
                const sumByMonCom_primaNetaAntesCorretaje = lodash.sumBy(distribucion_groupByMonComp_array, 'primaNetaAntesCorretaje');
                const sumByMonCom_corretaje = lodash.sumBy(distribucion_groupByMonComp_array, 'corretaje');
                const sumByMonCom_primaNeta = lodash.sumBy(distribucion_groupByMonComp_array, 'primaNeta');
                // const sumByMonCom_siniestros = lodash.sumBy(distribucion_groupByMonComp_array, 'siniestros');
                const sumByMonCom_siniestros_suParte = lodash.sumBy(distribucion_groupByMonComp_array, 'siniestros_suParte');
                const sumByMonCom_saldo = lodash.sumBy(distribucion_groupByMonComp_array, 'saldo');

                distribucion = {
                    moneda: moneda.simbolo,
                    monedaTipoRow: 'd',
                    compania: compania.abreviatura,
                    companiaTipoRow: 't',
                    nosotros: firstItemInArray.nosotros ? 'ok' : '',
                    ramo: '',
                    tipo: '',
                    serie: '',
                    primas: 0,                  // las primas (100%) son siempre las mismas para todas las compañías
                    ordenPorc: 0,
                    primaBruta: sumByMonCom_primaBruta ? sumByMonCom_primaBruta : 0,
                    comisionPorc: 0,
                    comision: sumByMonCom_comision ? sumByMonCom_comision : 0,
                    imp1Porc: 0,
                    imp1: sumByMonCom_imp1 ? sumByMonCom_imp1 : 0,
                    imp2Porc: 0,
                    imp2: sumByMonCom_imp2 ? sumByMonCom_imp2 : 0,
                    imp3Porc: 0,
                    imp3: sumByMonCom_imp3 ? sumByMonCom_imp3 : 0,
                    primaNetaAntesCorretaje: sumByMonCom_primaNetaAntesCorretaje ? sumByMonCom_primaNetaAntesCorretaje : 0,
                    corretajePorc: 0,
                    corretaje: sumByMonCom_corretaje ? sumByMonCom_corretaje : 0,
                    primaNeta: sumByMonCom_primaNeta ? sumByMonCom_primaNeta : 0,
                    siniestros: 0,                  // los siniestros (100%) son siempre los mismas para todas las compañías
                    siniestros_suParte: sumByMonCom_siniestros_suParte ? sumByMonCom_siniestros_suParte : 0,
                    saldo: sumByMonCom_saldo,
                    grupo: '*',
                };
                distribucionArray.push(distribucion);
            }

            // agregamos total para la moneda
            // const sumByMon_primas = lodash.sumBy(distribucion_groupByMoneda_array, 'prima');
            const sumByMon_primaBruta = lodash.sumBy(distribucion_groupByMoneda_array, 'primaBruta');
            const sumByMon_comision = lodash.sumBy(distribucion_groupByMoneda_array, 'comision');
            const sumByMon_imp1 = lodash.sumBy(distribucion_groupByMoneda_array, 'imp1');
            const sumByMon_imp2 = lodash.sumBy(distribucion_groupByMoneda_array, 'imp2');
            const sumByMon_imp3 = lodash.sumBy(distribucion_groupByMoneda_array, 'imp3');
            const sumByMon_primaNetaAntesCorretaje = lodash.sumBy(distribucion_groupByMoneda_array, 'primaNetaAntesCorretaje');
            const sumByMon_corretaje = lodash.sumBy(distribucion_groupByMoneda_array, 'corretaje');
            const sumByMon_primaNeta = lodash.sumBy(distribucion_groupByMoneda_array, 'primaNeta');
            // const sumByMon_siniestros = lodash.sumBy(distribucion_groupByMoneda_array, 'siniestros');
            const sumByMon_siniestros_suParte = lodash.sumBy(distribucion_groupByMoneda_array, 'siniestros_suParte');
            const sumByMon_saldo = lodash.sumBy(distribucion_groupByMoneda_array, 'saldo');

            distribucion = {
                moneda: moneda.simbolo,
                monedaTipoRow: 't',
                compania: '',
                companiaTipoRow: 'd',
                nosotros: '',
                ramo: '',
                tipo: '',
                serie: '',
                primas: 0,                  // las primas (100%) son siempre las mismas para todas las compañías
                ordenPorc: '0',
                primaBruta: sumByMon_primaBruta ? sumByMon_primaBruta : 0,
                comisionPorc: '0',
                comision: sumByMon_comision ? sumByMon_comision : 0,
                imp1Porc: '0',
                imp1: sumByMon_imp1 ? sumByMon_imp1 : 0,
                imp2Porc: '0',
                imp2: sumByMon_imp2 ? sumByMon_imp2 : 0,
                imp3Porc: '0',
                imp3: sumByMon_imp3 ? sumByMon_imp3 : 0,
                primaNetaAntesCorretaje: sumByMon_primaNetaAntesCorretaje ? sumByMon_primaNetaAntesCorretaje : 0,
                corretajePorc: '0',
                corretaje: sumByMon_corretaje ? sumByMon_corretaje : 0,
                primaNeta: sumByMon_primaNeta ? sumByMon_primaNeta : 0,
                siniestros: 0,                  // los siniestros (100%) son siempre los mismas para todas las compañías
                siniestros_suParte: sumByMon_siniestros_suParte ? sumByMon_siniestros_suParte : 0,
                saldo: sumByMon_saldo,

                grupo: '**',
            };
            distribucionArray.push(distribucion);
        }

        // ----------------------------------------------------------------------------------------------
        // saldos de compañías
        const saldosArray = [];
        let saldo = {};

        const saldos_GroupByMoneda = lodash.groupBy(cuentas_saldos, 'moneda');

        for (const monedaKey in saldos_GroupByMoneda) {

            const saldos_GroupByMoneda_array = [ ...saldos_GroupByMoneda[monedaKey] ];
            const firstMonedaItem = saldos_GroupByMoneda_array[0];
            const moneda = monedas.find((x) => { return x._id === firstMonedaItem.moneda; });

            saldos_GroupByMoneda_array.forEach((s) => {
                saldo = {
                    moneda: moneda.simbolo ? moneda.simbolo : 'Indef',
                    monedaTipoRow: 'd',
                    compania: companias.find((x) => { return x._id === s.compania; }).abreviatura,
                    nosotros: s.nosotros ? 'ok' : '',
                    primas: s.prima ? s.prima : 0,
                    ordenPorc: '0',
                    primaBruta: s.primaBruta ? s.primaBruta : 0,
                    comision: s.comision ? s.comision : 0,
                    imp1: s.imp1 ? s.imp1 : 0,
                    imp2: s.imp2 ? s.imp2 : 0,
                    imp3: s.imp3 ? s.imp3 : 0,
                    primaNetaAntesCorretaje: s.primaNetaAntesCorretaje ? s.primaNetaAntesCorretaje : 0,
                    corretaje: s.corretaje ? s.corretaje : 0,
                    primaNeta: s.primaNeta ? s.primaNeta : 0,
                    siniestros: s.siniestros ? s.siniestros : 0,
                    siniestros_suParte: s.siniestros_suParte ? s.siniestros_suParte : 0,
                    saldo: s.saldo ? s.saldo : 0,
                    grupo: '',
                };
                saldosArray.push(saldo);
            })

            // agregamos un total para la moneda
            // const sumByMon_primas = lodash.sumBy(saldos_GroupByMoneda_array, 'prima');
            const sumByMon_primaBruta = lodash.sumBy(saldos_GroupByMoneda_array, 'primaBruta');
            const sumByMon_comision = lodash.sumBy(saldos_GroupByMoneda_array, 'comision');
            const sumByMon_imp1 = lodash.sumBy(saldos_GroupByMoneda_array, 'imp1');
            const sumByMon_imp2 = lodash.sumBy(saldos_GroupByMoneda_array, 'imp2');
            const sumByMon_imp3 = lodash.sumBy(saldos_GroupByMoneda_array, 'imp3');
            const sumByMon_primaNetaAntesCorretaje = lodash.sumBy(saldos_GroupByMoneda_array, 'primaNetaAntesCorretaje');
            const sumByMon_corretaje = lodash.sumBy(saldos_GroupByMoneda_array, 'corretaje');
            const sumByMon_primaNeta = lodash.sumBy(saldos_GroupByMoneda_array, 'primaNeta');
            // const sumByMon_siniestros = lodash.sumBy(saldos_GroupByMoneda_array, 'siniestros');
            const sumByMon_siniestros_suParte = lodash.sumBy(saldos_GroupByMoneda_array, 'siniestros_suParte');
            const sumByMon_saldo = lodash.sumBy(saldos_GroupByMoneda_array, 'saldo');

            saldo = {
                moneda: moneda.simbolo ? moneda.simbolo : 'Indef',
                monedaTipoRow: 't',
                compania: '',
                nosotros: '',
                primas: 0,                  // las primas (100%) son siempre las mismas para todas las compañías
                primaBruta: sumByMon_primaBruta ? sumByMon_primaBruta : 0,
                comision: sumByMon_comision ? sumByMon_comision : 0,
                imp1: sumByMon_imp1 ? sumByMon_imp1 : 0,
                imp2: sumByMon_imp2 ? sumByMon_imp2 : 0,
                imp3: sumByMon_imp3 ? sumByMon_imp3 : 0,
                primaNetaAntesCorretaje: sumByMon_primaNetaAntesCorretaje ? sumByMon_primaNetaAntesCorretaje : 0,
                corretaje: sumByMon_corretaje ? sumByMon_corretaje : 0,
                primaNeta: sumByMon_primaNeta ? sumByMon_primaNeta : 0,
                siniestros: 0,                  // los siniestros (100%) son siempre los mismas para todas las compañías
                siniestros_suParte: sumByMon_siniestros_suParte ? sumByMon_siniestros_suParte : 0,
                saldo: sumByMon_saldo,

                grupo: '*',
            };
            saldosArray.push(saldo);
        }

        // ----------------------------------------------------------------------------------------------
        // cuotas - las cuotas están en un collection diferente
        const cuotas = Cuotas.find({ 'source.entityID': contratoID,
                                   'source.subEntityID': definicionCuentaTecnicaID
                         }).fetch();

        const cuotasArray = [];
        // const cuota = {};

        const cuotas_GroupByMoneda = lodash.groupBy(cuotas, 'moneda');

        for (const monedaKey in cuotas_GroupByMoneda) {

            const cuotas_GroupByMoneda_items = cuotas_GroupByMoneda[monedaKey];
            const firstMonedaItem = cuotas_GroupByMoneda_items[0];
            const moneda = monedas.find((x) => { return x._id === firstMonedaItem.moneda; });

            cuotas_GroupByMoneda_items.forEach((c) => {
                saldo = {
                    moneda: moneda.simbolo ? moneda.simbolo : 'Indef',
                    monedaTipoRow: 'd',
                    compania: companias.find((x) => { return x._id === c.compania; }).abreviatura,
                    numero: `${c.numero.toString()}/${c.cantidad.toString()}`,
                    fecha: moment(c.fecha).format('DD-MMM-YYYY'),
                    fechaVencimiento: moment(c.fechaVencimiento).format('DD-MMM-YYYY'),
                    monto: c.monto,
                    grupo: '',
                };
                cuotasArray.push(saldo);
            })

            // agregamos un total para la moneda
            const sumByMon_monto = lodash.sumBy(cuotas_GroupByMoneda_items, 'monto');

            saldo = {
                moneda: moneda.simbolo ? moneda.simbolo : 'Indef',
                monedaTipoRow: 't',
                compania: '',
                numero: '',
                fecha: '',
                fechaVencimiento: '',
                monto: sumByMon_monto,
                grupo: '*',
            };
            cuotasArray.push(saldo);
        }

        // ----------------------------------------------------------------------------------
        // Object containing attributes that match the placeholder tokens in the template
        const values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            cedente: cedente.abreviatura,
            numero: contrato.numero.toString(),
            desde: moment(contrato.desde).format("DD-MMM-YYYY"),
            hasta: moment(contrato.hasta).format("DD-MMM-YYYY"),
            codigo: contrato.codigo ? contrato.codigo : '',
            referencia: contrato.referencia ? contrato.referencia : '',
            tipo: tipoContrato.abreviatura ? tipoContrato.abreviatura : '',
            ramo: ramo.descripcion,
            infoDefinicionCuentaTecnicaSeleccionada: infoDefinicionCuentaTecnicaSeleccionada,

            definiciones: lodash.orderBy(definicionesArray, ['numero'], ['asc']),

            resumenPrimasSiniestros: lodash.orderBy(resumenPrimasSiniestrosArray, ['moneda', 'monedaTipoRow', 'ramo', 'tipo', 'serie'],
                                                                                  ['asc', 'asc', 'asc', 'asc', 'asc']),

            distribucion: lodash.orderBy(distribucionArray, ['moneda', 'monedaTipoRow', 'nosotros', 'compania', 'companiaTipoRow', 'ramo', 'tipo', 'serie'],
                                                            ['asc', 'asc', 'desc', 'asc', 'asc', 'asc', 'asc', 'asc']),

            saldos: lodash.orderBy(saldosArray, ['moneda', 'monedaTipoRow', 'nosotros', 'compania', 'companiaTipoRow'],
                                                ['asc', 'asc', 'desc', 'asc', 'asc']),

            cuotas: lodash.orderBy(cuotasArray, ['moneda', 'monedaTipoRow', 'compania', 'fecha'],
                                                ['asc', 'asc', 'asc', 'asc']),
        };


        // // Open a workbook
        // const workbook = new XlsxInjector(templatePath);
        // const sheetNumber = 1;
        // workbook.substitute(sheetNumber, values);
        // // Save the workbook
        // workbook.writeFile(outputPath);


        // // leemos el archivo que resulta de la instrucción anterior; la idea es pasar este 'nodebuffer' a la función que sigue para:
        // // 1) grabar el archivo a collectionFS; 2) regresar su url (para hacer un download desde el client) ...
        // const buf = fs.readFileSync(outputPath);      // no pasamos 'utf8' como 2do. parámetro; readFile regresa un buffer

        // // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // // promise y no el promise object; en este caso, el url del archivo que se ha recién grabado (a collectionFS) ...

        // // nótese que en el tipo de plantilla ponemos 'no aplica'; la razón es que esta plantilla no es 'cargada' por el usuario y de las
        // // cuales hay diferentes tipos (islr, iva, facturas, cheques, ...). Este tipo de plantilla es para obtener algún tipo de reporte
        // // en excel y no tiene un tipo definido ...
        // return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'scrwebm', ciaSeleccionada, Meteor.user(), 'xlsx');













        // ---------------------------------------------------------------------------------------------------------------
        // leemos la plantilla (excel) desde el DropBox y la escribimos a un archivo en el fs
        // xlsx-injector espera el nombre de la plantilla (con su path completo)
        const dropBoxAccessToken = Meteor.settings.public.dropBox_appToken;

        const usuario = Meteor.user();
        const userNameOrEmail = usuario?.username ? usuario.username : usuario.emails[0].address;

        // para leer el template (excel) desde DropBox y grabarlo al fs (node) 
        // XlsxInjector solo necesita el nombre de este archivo para leerlo desde el fs y usarlo como plantilla (excel) 
        const result1 = await readFromDropBox_writeToFS(fileName, dropBoxPath, dropBoxAccessToken, userNameOrEmail).then();

        if (result1.error) {
            return {
                error: true,
                message: result1.message
            }
        }

        const templateName_fs = result1.fileNameWithPath;

        // Open a workbook
        const workbook = new XlsxInjector(templateName_fs);
        const sheetNumber = 1;
        workbook.substitute(sheetNumber, values);

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo (fs en node) que contendrá los resultados ...
        const resultsFileName_withUserInfo = fileName.replace('.xlsx', `_${userNameOrEmail}_result.xlsx`);
        let resultsName_fs = path.join(process.env.PWD, '.temp', dropBoxPath, resultsFileName_withUserInfo);

        // en windows, path regresa back en vez de forward slashes ... 
        resultsName_fs = resultsName_fs.replace(/\\/g, "/");

        // Save the workbook
        workbook.writeFile(resultsName_fs);

        // resultsFileName_withUserInfo: si el nombre es contratoCapas.xlsx, este valor es: contratoCapas_admin_result.xlsx
        // la idea es personalizar el nombre que se usará para grabar los resultados, pues esta función la pueden ejecutar 
        // *varios* usuarios en forma simultanea 
        const result2 = await readFileFromDisk_writeToDropBox(resultsName_fs, resultsFileName_withUserInfo, dropBoxPath, dropBoxAccessToken).then();

        if (result2.error) {
            return {
                error: true,
                message: result2.message
            }
        }

        const resultsName_db = result2.dropBoxFileNameMasPath;

        // 4) eliminamos *ambos* files desde el fs 
        // ahora eliminamos el file del disco, pues solo lo hacemos, *mientras tanto*, pues no sabemos como grabar al 
        // Dropbox sin hacer ésto antes !!!!?????
        const unlinkFileAsync = promisify(fs.unlink);
        try {
            await unlinkFileAsync(templateName_fs);             // aquí eliminamos la plantilla (excel) qye leímos desde el dropbox 
        } catch (err) {
            return {
                error: true,
                message: `<b>*)</b> Error al intentar eliminar el archivo en el fs (node): <em>${templateName_fs}</em>. <br /> 
                          El mensaje obtenido para el error es: ${err.message} 
                         `
            }
        }

        try {
            await unlinkFileAsync(resultsName_fs);                      // aquí eliminamos el resultado de aplicar la plantilla 
        } catch (err) {
            return {
                error: true,
                message: `<b>*)</b> Error al intentar eliminar el archivo en el fs (node): <em>${resultsName_fs}</em>. <br /> 
                          El mensaje obtenido para el error es: ${err.message} 
                         `
            }
        }

        // ------------------------------------------------------------------------------------------------
        // 5) con esta función creamos un (sharable) download link para que el usuario pueda tener
        //    el archivo en su pc 
        const result3 = await dropBoxCreateSharedLink(resultsName_db);

        if (result3.error) {
            return {
                error: true,
                message: result3.message
            }
        } else {
            // regresamos el link 
            return {
                error: false,
                sharedLink: result3.sharedLink,
            }
        }
}})