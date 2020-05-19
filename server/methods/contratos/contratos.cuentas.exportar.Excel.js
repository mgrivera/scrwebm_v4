
import { Meteor } from 'meteor/meteor'; 

import moment from 'moment';
import lodash from 'lodash';

import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';

import SimpleSchema from 'simpl-schema';

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

import { Contratos } from '/imports/collections/principales/contratos'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { ContratosProp_cuentas_resumen, ContratosProp_cuentas_distribucion, ContratosProp_cuentas_saldos, } from '/imports/collections/principales/contratos'; 

Meteor.methods(
{
    'contratos.cuentas.exportar.Excel': function (contratoID, definicionCuentaTecnicaID, ciaSeleccionada) {

        new SimpleSchema({
            contratoID: { type: String, optional: false },
            definicionCuentaTecnicaID: { type: String, optional: false },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false },
        }).validate({ contratoID, definicionCuentaTecnicaID, ciaSeleccionada, });

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        const templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        const temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        const templatePath = path.join(templates_DirPath, 'consultas', 'contratoCuentas.xlsx');

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        const outputFileName = 'contratoCuentas.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        const outputPath  = path.join(temp_DirPath, 'consultas', outputFileName);

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
            distribucion_groupByMoneda_array = distribucion_groupByMoneda[monedaKey];
            let firstItemInArray = distribucion_groupByMoneda_array[0];

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
                const sumByMonCom_primas = lodash.sumBy(distribucion_groupByMonComp_array, 'prima');
                const sumByMonCom_primaBruta = lodash.sumBy(distribucion_groupByMonComp_array, 'primaBruta');
                const sumByMonCom_comision = lodash.sumBy(distribucion_groupByMonComp_array, 'comision');
                const sumByMonCom_imp1 = lodash.sumBy(distribucion_groupByMonComp_array, 'imp1');
                const sumByMonCom_imp2 = lodash.sumBy(distribucion_groupByMonComp_array, 'imp2');
                const sumByMonCom_imp3 = lodash.sumBy(distribucion_groupByMonComp_array, 'imp3');
                const sumByMonCom_primaNetaAntesCorretaje = lodash.sumBy(distribucion_groupByMonComp_array, 'primaNetaAntesCorretaje');
                const sumByMonCom_corretaje = lodash.sumBy(distribucion_groupByMonComp_array, 'corretaje');
                const sumByMonCom_primaNeta = lodash.sumBy(distribucion_groupByMonComp_array, 'primaNeta');
                const sumByMonCom_siniestros = lodash.sumBy(distribucion_groupByMonComp_array, 'siniestros');
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
            const sumByMon_primas = lodash.sumBy(distribucion_groupByMoneda_array, 'prima');
            const sumByMon_primaBruta = lodash.sumBy(distribucion_groupByMoneda_array, 'primaBruta');
            const sumByMon_comision = lodash.sumBy(distribucion_groupByMoneda_array, 'comision');
            const sumByMon_imp1 = lodash.sumBy(distribucion_groupByMoneda_array, 'imp1');
            const sumByMon_imp2 = lodash.sumBy(distribucion_groupByMoneda_array, 'imp2');
            const sumByMon_imp3 = lodash.sumBy(distribucion_groupByMoneda_array, 'imp3');
            const sumByMon_primaNetaAntesCorretaje = lodash.sumBy(distribucion_groupByMoneda_array, 'primaNetaAntesCorretaje');
            const sumByMon_corretaje = lodash.sumBy(distribucion_groupByMoneda_array, 'corretaje');
            const sumByMon_primaNeta = lodash.sumBy(distribucion_groupByMoneda_array, 'primaNeta');
            const sumByMon_siniestros = lodash.sumBy(distribucion_groupByMoneda_array, 'siniestros');
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

            const saldos_GroupByMoneda_array = saldos_GroupByMoneda[monedaKey];
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
            const sumByMon_primas = lodash.sumBy(saldos_GroupByMoneda_array, 'prima');
            const sumByMon_primaBruta = lodash.sumBy(saldos_GroupByMoneda_array, 'primaBruta');
            const sumByMon_comision = lodash.sumBy(saldos_GroupByMoneda_array, 'comision');
            const sumByMon_imp1 = lodash.sumBy(saldos_GroupByMoneda_array, 'imp1');
            const sumByMon_imp2 = lodash.sumBy(saldos_GroupByMoneda_array, 'imp2');
            const sumByMon_imp3 = lodash.sumBy(saldos_GroupByMoneda_array, 'imp3');
            const sumByMon_primaNetaAntesCorretaje = lodash.sumBy(saldos_GroupByMoneda_array, 'primaNetaAntesCorretaje');
            const sumByMon_corretaje = lodash.sumBy(saldos_GroupByMoneda_array, 'corretaje');
            const sumByMon_primaNeta = lodash.sumBy(saldos_GroupByMoneda_array, 'primaNeta');
            const sumByMon_siniestros = lodash.sumBy(saldos_GroupByMoneda_array, 'siniestros');
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
        const cuota = {};

        let cuotas_GroupByMoneda = lodash.groupBy(cuotas, 'moneda');

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


        // Open a workbook
        const workbook = new XlsxInjector(templatePath);
        const sheetNumber = 1;
        workbook.substitute(sheetNumber, values);
        // Save the workbook
        workbook.writeFile(outputPath);


        // leemos el archivo que resulta de la instrucción anterior; la idea es pasar este 'nodebuffer' a la función que sigue para:
        // 1) grabar el archivo a collectionFS; 2) regresar su url (para hacer un download desde el client) ...
        const buf = fs.readFileSync(outputPath);      // no pasamos 'utf8' como 2do. parámetro; readFile regresa un buffer

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // promise y no el promise object; en este caso, el url del archivo que se ha recién grabado (a collectionFS) ...

        // nótese que en el tipo de plantilla ponemos 'no aplica'; la razón es que esta plantilla no es 'cargada' por el usuario y de las
        // cuales hay diferentes tipos (islr, iva, facturas, cheques, ...). Este tipo de plantilla es para obtener algún tipo de reporte
        // en excel y no tiene un tipo definido ...
        return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'scrwebm', ciaSeleccionada, Meteor.user(), 'xlsx');
    }
})