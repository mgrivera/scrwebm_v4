
import { Meteor } from 'meteor/meteor'; 

import moment from 'moment';
import lodash from 'lodash';

import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util'; 

import SimpleSchema from 'simpl-schema';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 

// import { myMkdirSync } from '/server/generalFunctions/myMkdirSync'; 
import { dropBoxCreateSharedLink } from '/server/imports/general/dropbox/createSharedLink'; 
import { readFromDropBox_writeToFS, readFileFromDisk_writeToDropBox } from '/server/imports/general/dropbox/exportToExcel'; 

Meteor.methods(
{
    'contratos.capas.exportar.Excel': async function (contratoID, ciaSeleccionada, fileName, dropBoxPath) {

        new SimpleSchema({
            contratoID: { type: String, optional: false },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false },
        }).validate({ contratoID, ciaSeleccionada, });

        // ---------------------------------------------------------------------------------------------
        // aquí comienza el proceso de obtención de datos para la consulta 
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

        if (!Array.isArray(infoCapasArray) || !infoCapasArray.length) { 
            const message = `<b>*)</b> Error al intentar leer el contrato que Ud. ha consultado. Aparentemente, no hay información de capas 
                          registradas para el mismo. <br /><br />
                          Esta función, en particular, corresponde a contratos que tienen información de capas registrada. 
                          Por favor revise. 
                         `
            return {
                error: true,
                message
            }
        }

        // --------------------------------------------------------------------------------------------
        // al igual que hicimos arriba para las primas, leemos las cuotas y agrupamos para construir un
        // array y combinar en Excel
        const cuotas = Cuotas.find({
            'source.entityID': contrato._id,
            'source.origen': 'capa',
        }).fetch();

        if (!Array.isArray(cuotas) || !cuotas.length) {
            const message = `<b>*)</b> Error al intentar leer el contrato que Ud. ha consultado. Aparentemente, no hay información de cuotas 
                          registradas para el mismo. <br /><br />
                          Esta función, en particular, corresponde a contratos que tienen capas y cuotas registrada. 
                          Por favor revise. 
                         `
            return {
                error: true,
                message
            }
        }

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

        // -----------------------------------------------------------------------------------------------
        // Ok, aquí termina el proceso propio de la consulta;
        // comienza:
        // 1) conversión a Excel.
        // 2) grabar a DropBox.
        // 3) regresar download link

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
    }
})