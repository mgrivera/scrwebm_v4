
import { Meteor } from 'meteor/meteor'; 
import { check } from 'meteor/check';

import moment from 'moment';
import lodash from 'lodash';
import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';

import { promisify } from 'util'; 

import { readFile } from '@cloudcmd/dropbox';        // para leer y escribir al Dropbox 
import getStream from 'get-stream';
import { Dropbox } from 'dropbox';

import { dropBoxCreateSharedLink } from '/server/imports/general/dropbox/createSharedLink'; 
import { CuentasContables } from '/imports/collections/catalogos/cuentasContables';

import { myMkdirSync } from '/server/generalFunctions/myMkdirSync'; 

Meteor.methods(
{
    'cuentasContables.exportarExcel': async function (ciaSeleccionada)
    {
        check(ciaSeleccionada, Object);

        const usuario = Meteor.user();
        const nombrePlantillaExcel = 'cuentasContables.xlsx';
        
        // leemos la plantilla desde el DropBox del usuario 

        // -----------------------------------------------------------------------------------------------
        // LEEMOS el template (Excel in this case) from DropBox 
        // en windows, path regresa back en vez de forward slashes ... 
        let filePath = path.join('/catalogos/excel', nombrePlantillaExcel);

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
        const finalPath = process.env.PWD + '/.temp/catalogos/excel';
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

        // leemos las cuentas contables que corresponden a la cia contab seleccionada por el usuario
        const cuentasContables = CuentasContables.find({ cia: ciaSeleccionada._id }).fetch();
        
        const items = [];
        let item = {};

        lodash.orderBy(cuentasContables, ['cuentaContable'], ['asc']).
               forEach((cuentaContable) => {
            item = {
                cuentaEditada: cuentaContable.cuentaEditada,
                descripcion: cuentaContable.descripcion,
                ciaContab: ciaSeleccionada.abreviatura,
                _id: cuentaContable._id,
            };
            items.push(item);
        })

        // -----------------------------------------------------------------------------------------------
        // Ok, aquí termina el proceso propio de la consulta; 
        // comienza: 1) conversión a Excel. 2) grabar a DropBox. 3) regresar download link 

        // Object containing attributes that match the placeholder tokens in the template
        const values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            cuentasContables: items,
        }

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
})