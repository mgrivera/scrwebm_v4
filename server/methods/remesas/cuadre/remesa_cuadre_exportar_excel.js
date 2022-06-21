
import { Meteor } from 'meteor/meteor'; 

import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';
import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util'; 

import { readFile } from '@cloudcmd/dropbox';        // para leer y escribir al Dropbox 
// para leer un node stream y convertirlo en un string; nota: returns a promise 
import getStream from 'get-stream';
import { Dropbox } from 'dropbox';

import SimpleSchema from 'simpl-schema';

import { dropBoxCreateSharedLink } from '/server/imports/general/dropbox/createSharedLink'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Remesas } from '/imports/collections/principales/remesas';  

import { myMkdirSync } from '/server/generalFunctions/myMkdirSync'; 

Meteor.methods(
{
    'remesas.cuadre.exportar.Excel': async function (remesaID, ciaSeleccionada) {

        new SimpleSchema({
            remesaID: { type: String, optional: false },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false },
        }).validate({ remesaID, ciaSeleccionada, });

        // con las instrucciones que siguen, leemos la plantilla desde el DropBox y la grabamos al fyle system (node) 
        const usuario = Meteor.user();
        const nombrePlantillaExcel = 'remesasCuadre.xlsx';

        // leemos la plantilla desde el DropBox del usuario 

        // -----------------------------------------------------------------------------------------------
        // LEEMOS el template (Excel in this case) from DropBox 
        // en windows, path regresa back en vez de forward slashes ... 
        let filePath = path.join('/remesas/excel', nombrePlantillaExcel);

        // en windows, path regresa back en vez de forward slashes ... 
        filePath = filePath.replace(/\\/g, "/");

        // SEGUNDO leemos el file 
        const dropBoxAccessToken = Meteor.settings.public.dropBox_appToken;      // this is the Dropbox app dropBoxAccessToken 
        let readStream = null;

        try {
            readStream = Promise.await(readFile(dropBoxAccessToken, filePath));
        } catch (err) {
            const message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `;
            return {
                error: true,
                message: message,
            }
        }

        let content = null;

        try {
            // from npm: convert a node stream to a string or buffer; note: returns a promise 
            content = Promise.await(getStream.buffer(readStream));
        } catch (err) {
            const message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `;
            return {
                error: true,
                message: message,
            }
        }

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá la plantilla excel 
        let userID2 = usuario.emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/@/g, "_");
        const outputFileName = nombrePlantillaExcel.replace('.xlsx', `_${userID2}.xlsx`);

        // para grabar temporalmente el archivo que resulta en el fs en node 
        const finalPath = process.env.PWD + '/.temp/remesas/excel';
        const fileName = finalPath + "/" + outputFileName;

        const readFileAsync = promisify(fs.readFile)
        const writeFileAsync = promisify(fs.writeFile);
        const unlinkFileAsync = promisify(fs.unlink);
        const encoding = 'binary';

        // ahora escribimos el archivo al disco para pasarlo luego, en realidad el path, a xlsx-injector
        try {
            myMkdirSync(path.dirname(fileName));        // para crear dirs y sub-dirs si no existen 
            await writeFileAsync(fileName, content, encoding);
        } catch (err) {
            return {
                error: true,
                message: `<b>*)</b> Error al intentar grabar el archivo: ${name}, en la ubicación: ${finalPath}. <br /> 
                          El mensaje obtenido para el error es: ${err.message} 
                         `
            }
        }

        // ---------------------------------------------------------------------------------------------
        // aquí comienza el proceso de obtención de datos para la consulta 
        const remesa = Remesas.findOne(remesaID);

        if (!remesa) {
            throw new Meteor.Error('error-base-datos',
                `Error inesperado: no hemos podido leer la remesa indicada en la base de datos
                 del programa en el servidor.
                `);
        }

        if (!remesa.cuadre || !lodash.isArray(remesa.cuadre) || !remesa.cuadre.length) {
            throw new Meteor.Error('error-cuadre-remesas',
                `Error: no hemos podido leer un cuadre en la remesa que se ha indicado.<br />
                 Probablemente, esta remesa no tiene un cuadre registrado aún. Ud. debe construir un cuadre
                 para la remesa y solo luego intentar ejecutar esta función.
                `);
        }

        const instrumentoPago = remesa.instrumentoPago;

        const companias = Companias.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();
        const monedas = Monedas.find({}, { fields: { _id: true, simbolo: true, }}).fetch();
        const bancos = Bancos.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();

        const compania = companias.find((x) => { return x._id === remesa.compania; });
        const moneda = monedas.find((x) => { return x._id === remesa.moneda; });
        const banco = bancos.find((x) => { return x._id === instrumentoPago.banco });
        let cuentaBancaria = null;

        if (instrumentoPago && instrumentoPago.banco && instrumentoPago.cuentaBancaria) {
            cuentaBancaria = CuentasBancarias.findOne(instrumentoPago.cuentaBancaria);
        }

        let partida = {};
        const partidasCuadre = [];
        let granTotal = 0;

        // el primer cuadre muestra todas las operaciones del cuadre y sus partidas. Si, por ejemplo, una remesa corresponde al 
        // cobro de 5 cuotas, serán: una operación inicial por el monto de la remesa,  5 operaciones (de cobro), cada una con sus  
        // partidas asociadas, y, finalmente, una operación por la diferencia, si existe. 
        remesa.cuadre.forEach((t) => {

            const transaccion = t.transaccion;
            const partidas = t.partidas;
            partida = {};
            let sumOfMonto = 0;

            partida = {};

            partida = {
                grupo: '*',
                numero: '',
                tipo: '',
                codigo: '',
                compania: '',
                descripcion: transaccion.descripcion,
                referencia: '',
                moneda: '',
                monto: '',
                tipoReg: '1',
            };

            partidasCuadre.push(partida);

            partidas.forEach((p) => {
                partida = {
                    grupo: ' ',
                    numero: p.numero,
                    tipo: p.tipo,
                    codigo: p.codigo ? p.codigo : ' ',
                    compania: companias.find((x) => { return x._id === p.compania; }).abreviatura,
                    descripcion: p.descripcion,
                    referencia: p.referencia,
                    moneda: monedas.find((x) => { return x._id === p.moneda; }).simbolo,
                    monto: p.monto,
                    tipoReg: '0',
                };

                partidasCuadre.push(partida);
                sumOfMonto += p.monto;
                granTotal += p.monto;
            })

            // al final de las partidas de cada transacción, agregamos un item al array con el total
            // de las mimas
            partida = {
                grupo: '*',
                numero: '',
                tipo: '',
                codigo: '',
                compania: '',
                descripcion: 'Total transacción: ',
                referencia: '',
                moneda: '',
                monto: sumOfMonto,
                tipoReg: '1',
            };
            partidasCuadre.push(partida);
        })

        // finalmente, agregamos un item al array para mostrar el gran total de todas las partidas que existen en todas la operaciones 
        partida = {};
        partida = {
            grupo: '*',
            numero: '',
            tipo: '',
            codigo: '',
            compania: '',
            descripcion: 'Gran total de la remesa: ',
            referencia: '',
            moneda: '',
            monto: granTotal,
            tipoReg: '1',
        };
        partidasCuadre.push(partida);

        // -------------------------------------------------------------------------------------------------
        // para la 2da. lista, en la hoja Excel, creamos un array que contiene solo las partidas de cada
        // transacción; recordar que el cuadre tiene un array de transacciones; cada transacción tiene un
        // array de partidas
        // además de lo anterior, obviamos la primera las partidas que corresponden al cobro de primas y siniestros, 
        // pues no deben ser mostradas como parte del asiento contable. 
        const partidasArray = [];
        partida = {};

        remesa.cuadre.forEach((transaccion) => {
            transaccion.partidas.forEach((p) => {
                if (!(p.tipo === 100 || p.tipo === 900 || p.tipo === 600)) {
                    // solo leemos partidas diferentes a: primas cobradas, siniestros cobrados ... 
                    let partida = {};

                    const compania = companias.find((x) => { return x._id === p.compania; }).abreviatura;
                    const moneda = monedas.find((x) => { return x._id === p.moneda; }).simbolo;

                    partida = {
                        // para agrupar (y resumir) más abajo por: tipo-codigoContable-compania-moneda 
                        grupo: `${p.tipo} ${(p.codigo ? p.codigo : 'x')} ${compania} ${moneda}`,
                        tipo: p.tipo,
                        codigo: p.codigo,
                        compania: compania,
                        moneda: moneda,
                        monto: p.monto,
                    };
                    partidasArray.push(partida);
                }
            })
        })

        const partidasResumenArray = [];
        partida = {};
        granTotal = 0;
        const partidasGroupByTipoCodigoCompaniaMoneda_array = lodash.groupBy(partidasArray, 'grupo');

        for (const key in partidasGroupByTipoCodigoCompaniaMoneda_array) {

            const groupArray = partidasGroupByTipoCodigoCompaniaMoneda_array[key];
            const firstItemInGroup = groupArray[0];

            const rubro = firstItemInGroup.tipo;
            const codigo = firstItemInGroup.codigo;
            const compania = firstItemInGroup.compania;
            const moneda = firstItemInGroup.moneda;

            const sumOfMonto = lodash.sumBy(groupArray, 'monto');

            partida = {
                grupo: ' ',
                tipo: rubro,
                codigo: codigo ? codigo : '',
                compania: compania,
                descripcion: descripcionTipoPartida(rubro),
                referencia: `Rem # ${remesa.numero} - ${compania}`,
                moneda: moneda,
                monto: sumOfMonto,
                tipoReg: '0',
            };

            partidasResumenArray.push(partida);
            granTotal += sumOfMonto;
        }

        // agregamos un item al array con el gran total de las partidas ...
        partida = {
            grupo: '*',
            tipo: '',
            codigo: '',
            compania: '',
            descripcion: 'Gran total de la remesa: ',
            referencia: '',
            moneda: '',
            monto: granTotal,
            tipoReg: '1',
        };
        partidasResumenArray.push(partida);

        let infoBanco = banco.abreviatura;

        if (cuentaBancaria) {
            const monedaCuentaBancaria = Monedas.findOne(cuentaBancaria.moneda);
            infoBanco += ` (${monedaCuentaBancaria.simbolo} ${cuentaBancaria.tipo} ${cuentaBancaria.numero})`
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

            numeroRemesa: remesa.numero.toString(),
            fecha: moment(remesa.fecha).format('DD-MMM-YYYY'),
            moneda: moneda.simbolo,
            compania: compania.abreviatura,
            miSu: remesa.miSu,
            factorCambio: remesa.factorCambio,
            instrumentoPago: `${instrumentoPago.numero.toString()} - ${moment(instrumentoPago.fecha).format('DD-MMM-YYYY')} - ${instrumentoPago.tipo} - ${infoBanco} - ${numeral(instrumentoPago.monto).format('0,000.00')}`,
            observaciones: remesa.observaciones,

            partidas: partidasCuadre,
            resumen: partidasResumenArray,
        };

        // Open a workbook
        const workbook = new XlsxInjector(fileName);
        const sheetNumber = 1;
        workbook.substitute(sheetNumber, values);

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo (fs en node) que contendrá los resultados ...
        const resultFileName = nombrePlantillaExcel.replace('.xlsx', `_${userID2}_result.xlsx`);
        const resultFilePath = finalPath + "/" + resultFileName;

        // Save the workbook
        workbook.writeFile(resultFilePath);

        // 1) leemos el archivo desde el fs 
        let fileContent;

        try {
            fileContent = await readFileAsync(resultFilePath);
        } catch (err) {
            return {
                error: true,
                message: `<b>*)</b> Error al intentar leer el archivo: ${resultFilePath}. <br /> 
                          El mensaje obtenido para el error es: ${err.message} 
                         `
            }
        }

        // 2) obtenemos el objeto con los métodos del dropbox api 
        const dbx = new Dropbox({
            accessToken: dropBoxAccessToken,
            fetch: fetch
        });

        // 3) grabamos el archivo con los resultados al dropbox 
        const fileName2 = `/remesas/excel/tmp/${outputFileName}`;

        try {
            await dbx.filesUpload({
                path: fileName2,
                contents: fileContent,
                mode: { ".tag": "overwrite" },
                autorename: false
            })
        } catch (err) {
            return {
                error: true,
                message: `<b>*)</b> Error al intentar grabar el archivo: ${name}, en la ubicación: ${fileName2}. <br /> 
                          El mensaje obtenido para el error es: ${err.message} 
                         `
            }
        }

        // 4) eliminamos *ambos* files desde el fs 
        // ahora eliminamos el file del disco, pues solo lo hacemos, *mientras tanto*, pues no sabemos como grabar al 
        // Dropbox sin hacer ésto antes !!!!?????
        try {
            await unlinkFileAsync(fileName);            // aquí grabamos la plantilla (excel) leímo desde el dropbox 
            await unlinkFileAsync(resultFilePath);      // aquí grabamos el resultado de aplicar la plantilla 
        } catch (err) {
            return {
                error: true,
                message: `<b>*)</b> Error al intentar leer el archivo: ${resultFilePath}. <br /> 
                          El mensaje obtenido para el error es: ${err.message} 
                         `
            }
        }

        // ------------------------------------------------------------------------------------------------
        // 5) con esta función creamos un (sharable) download link para que el usuario pueda tener
        //    el archivo en su pc 
        const result = await dropBoxCreateSharedLink(fileName2);

        if (result.error) {
            return {
                error: true,
                message: result.message
            }
        } else {
            // regresamos el link 
            return {
                error: false,
                sharedLink: result.sharedLink,
            }
        }
    }
});

function descripcionTipoPartida(rubro) {
    // esta función regresa el nombre del rubro, para que sirva como descripción en el resumen de la
    // remesa ...
    let descripcion = ""; 

    switch (rubro) {
        case 10: {
            descripcion = 'Monto cobrado/pagado en la remesa';
            break;
        }
        case 100: {
            descripcion = 'Primas cobradas - facultativo';
            break;
        }
        case 200: {
            descripcion = 'Primas por pagar - facultativo';
            break;
        }
        case 300: {
            descripcion = 'Corretaje - facultativo';
            break;
        }
        case 400: {
            descripcion = 'Prima pagada - facultativo';
            break;
        }
        case 600: {
            descripcion = 'Siniestros cobrados';
            break;
        }
        case 700: {
            descripcion = 'Siniestros por pagar';
            break;
        }
        case 800: {
            descripcion = 'Siniestros pagados';
            break;
        }
        case 900: {
            descripcion = 'Primas cobradas - contratos';
            break;
        }
        case 1000: {
            descripcion = 'Primas por pagar - contratos';
            break;
        }
        case 1100: {
            descripcion = 'Corretaje - contratos';
            break;
        }
        default: { 
            descripcion = 'Rubro indefinido';
        }
    }

    return descripcion; 
}
