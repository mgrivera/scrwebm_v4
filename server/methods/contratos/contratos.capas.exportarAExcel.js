
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

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 

Meteor.methods(
{
    'contratos.capas.exportar.Excel': function (contratoID, ciaSeleccionada) {

        new SimpleSchema({
            contratoID: { type: String, optional: false },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false },
        }).validate({ contratoID, ciaSeleccionada, });

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        const templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        const temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        const templatePath = path.join(templates_DirPath, 'consultas', 'contratoCapas.xlsx');

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        const outputFileName = 'contratoCapas.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        const outputPath  = path.join(temp_DirPath, 'consultas', outputFileName);

        const contrato = Contratos.findOne(contratoID);

        const cedente = Companias.findOne(contrato.compania);
        const tipoContrato = TiposContrato.findOne(contrato.tipo);
        const ramo = Ramos.findOne(contrato.ramo);

        const infoCapasArray = [];
        let capaItem = {};

        const companias = Companias.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();
        const monedas = Monedas.find({}, { fields: { _id: true, simbolo: true, }}).fetch();

        let sumOfPB = 0;
        let sumOfImp1 = 0;
        let sumOfImp2 = 0;
        let sumOfPN1 = 0;
        let sumOfCorretaje = 0;
        let sumOfPN2 = 0;
        let sumOfImp3 = 0;
        let sumOfPN3 = 0;

        // agrupamos por compañía para mostrar totales para éstas ...
        const infoCapasGroupByCompania = lodash.groupBy(contrato.capasPrimasCompanias, 'compania');

        // nótese como ordenamos el objeto por su (unica) key ...
        for (const compania in lodash(infoCapasGroupByCompania).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {

            const infoCapasByCompania = infoCapasGroupByCompania[compania];
            const companiaAbreviatura = lodash.find(companias, (x) => { return x._id === compania; }).abreviatura;

            const pb = lodash.sumBy(infoCapasByCompania, 'primaBruta');
            const imp1 = lodash.sumBy(infoCapasByCompania, 'imp1');
            const imp2 = lodash.sumBy(infoCapasByCompania, 'imp2');
            const corr = lodash.sumBy(infoCapasByCompania, 'corretaje');
            const impSPN = lodash.sumBy(infoCapasByCompania, 'impSPN');

            let pnAntesCorretaje = pb;
            pnAntesCorretaje += imp1 ? imp1 : 0;
            pnAntesCorretaje += imp2 ? imp2 : 0;

            capaItem = {
                nosotros: infoCapasByCompania[0].nosotros ? 0 : 1,
                compania: companiaAbreviatura,
                moneda: "",
                capa: 0,
                pmd: lodash.sumBy(infoCapasByCompania, 'pmd'),
                ordenPorc: 0,
                pb: lodash.sumBy(infoCapasByCompania, 'primaBruta'),
                imp1Porc: 0,
                imp1: imp1 ? imp1 : 0,
                imp2Porc: 0,
                imp2: imp2 ? imp2 : 0,
                pn1: pnAntesCorretaje,
                corrPorc: 0,
                corr: corr ? corr : 0,
                pn2: lodash.sumBy(infoCapasByCompania, 'primaNeta0'),
                imp3Porc: 0,
                imp3: impSPN ? impSPN : 0,
                pn3: lodash.sumBy(infoCapasByCompania, 'primaNeta'),

                grupo: '*',
                tipoReg: 1,
            };
            infoCapasArray.push(capaItem);

            // finalmente, leemos los items para la moneda/compañia y escribimos un row a Excel para cada uno ...
            lodash.orderBy(infoCapasByCompania, ['numeroCapa'], ['asc']).
                   forEach((capa) => {

                const monedaSimbolo = lodash.find(monedas, (x) => { return x._id === capa.moneda; }).simbolo;

                let pnAntesCorr = capa.primaBruta;
                pnAntesCorr += capa.imp1 ? capa.imp1 : 0;
                pnAntesCorr += capa.imp2 ? capa.imp2 : 0;

                capaItem = {
                    nosotros: capa.nosotros ? 0 : 1,
                    compania: companiaAbreviatura,
                    moneda: monedaSimbolo,
                    capa: capa.numeroCapa,
                    pmd: capa.pmd,
                    ordenPorc: capa.ordenPorc,
                    pb: capa.primaBruta,
                    imp1Porc: capa.imp1Porc ? capa.imp1Porc : 0,
                    imp1: capa.imp1 ? capa.imp1 : 0,
                    imp2Porc: capa.imp2Porc ? capa.imp2Porc : 0,
                    imp2: capa.imp2 ? capa.imp2 : 0,
                    pn1: pnAntesCorr,
                    corrPorc: capa.corretajePorc ? capa.corretajePorc : 0,
                    corr: capa.corretaje ? capa.corretaje : 0,
                    pn2: capa.primaNeta0,
                    imp3Porc: capa.impSPNPorc ? capa.impSPNPorc : 0,
                    imp3: capa.impSPN ? capa.impSPN : 0,
                    pn3: capa.primaNeta,

                    grupo: '',
                    tipoReg: 0,
                };
                infoCapasArray.push(capaItem);

                // agregamos a los totales
                sumOfPB += capa.primaBruta;
                sumOfImp1 += capa.imp1 ? capa.imp1 : 0;
                sumOfImp2 += capa.imp2 ? capa.imp2 : 0;
                sumOfPN1 += pnAntesCorr;
                sumOfCorretaje += capa.corretaje ? capa.corretaje : 0;
                sumOfPN2 += capa.primaNeta0;
                sumOfImp3 += capa.impSPN ? capa.impSPN : 0;
                sumOfPN3 += capa.primaNeta;
            });
        }


        // --------------------------------------------------------------------------------------------
        // al igual que hicimos arriba para las primas, leemos las cuotas y agrupamos para construir un
        // array y combinar en Excel
        const cuotas = Cuotas.find({
            'source.entityID': contrato._id,
            'source.origen': 'capa',
        }).fetch();
        const infoCuotasGroupByCompania = lodash.groupBy(cuotas, 'compania');

        const cuotasArray = [];
        let cuotaItem = {};

        let sumOfMontoCuota = 0;

        // nótese como ordenamos el objeto por su (unica) key ...
        for (const compania in lodash(infoCuotasGroupByCompania).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {

            const cuotasByCompania = infoCuotasGroupByCompania[compania];
            const companiaAbreviatura = lodash.find(companias, (x) => { return x._id === compania; }).abreviatura;

            // nótese como ponemos 'nosotros' en 0 si las cuotas corresponden a la compañía cedente;
            // la idea es que se muestren de primera en la lista. Más abajo, al pasar el array para
            // que combine en Excel, ordenamos por este valor ...

            cuotaItem = {
                nosotros: compania === contrato.compania ? 0 : 1,
                compania: companiaAbreviatura,
                moneda: "",
                numero: 0,
                fecha: "",
                fechaVencimiento:"",
                monto: lodash.sumBy(cuotasByCompania, 'monto'),

                grupo: '*',
                tipoReg: 1,
            };
            cuotasArray.push(cuotaItem);

            // finalmente, leemos los items para la moneda/compañia y escribimos un row a Excel para cada uno ...
            cuotasByCompania.forEach((cuota) => {

                const monedaSimbolo = lodash.find(monedas, (x) => { return x._id === cuota.moneda; }).simbolo;

                cuotaItem = {
                    nosotros: cuota.compania === contrato.compania ? 0 : 1,
                    compania: companiaAbreviatura,
                    moneda: monedaSimbolo,
                    numero: cuota.numero,
                    fecha: moment(cuota.fecha).format('DD-MM-YYYY'),
                    fechaVencimiento: moment(cuota.fechaVencimiento).format('DD-MM-YYYY'),
                    monto: cuota.monto,

                    grupo: '',
                    tipoReg: 0,
                };
                cuotasArray.push(cuotaItem);

                sumOfMontoCuota += cuota.monto;
            });
        }



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
            capas: lodash.orderBy(infoCapasArray, ['nosotros', 'compania', 'capa'], ['asc', 'asc', 'asc']),
            cuotas: lodash.orderBy(cuotasArray, ['nosotros', 'compania', 'numero'], ['asc', 'asc', 'asc']),

            sumOfPB: sumOfPB,
            sumOfImp1: sumOfImp1,
            sumOfImp2: sumOfImp2,
            sumOfPN1: sumOfPN1,
            sumOfCorretaje: sumOfCorretaje,
            sumOfPN2: sumOfPN2,
            sumOfImp3: sumOfImp3,
            sumOfPN3: sumOfPN3,
            sumOfMontoCuota: sumOfMontoCuota,
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