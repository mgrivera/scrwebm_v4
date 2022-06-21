
// ===============================================================================================
// usamos estas funciones cuando usamos una plantilla Excel para crear un documento
// usando la librería (desde npm) xlsx-injector
// ===============================================================================================

import fs from 'fs';
import path from 'path';
import { readFile } from '@cloudcmd/dropbox';        // para leer y escribir al Dropbox 
// para leer un node stream y convertirlo en un string; nota: returns a promise 
import getStream from 'get-stream';
import { promisify } from 'util'; 
import { Dropbox } from 'dropbox';

import { myMkdirSync } from '/server/generalFunctions/myMkdirSync'; 

// -----------------------------------------------------------------------------------------------------
// para leer la plantilla desde el DropBox y grabarla a un archivo en disco (normalmente, con el
// mismo nombre). xlsx-injector espera el nombre del archivo que contiene la plantilla y que está
// en el fs (node) 
// -----------------------------------------------------------------------------------------------------
async function readFromDropBox_writeToFS(fileName, dropBoxPath, dropBoxAccessToken, userName) { 

    // leemos la plantilla desde el DropBox del usuario 

    // -----------------------------------------------------------------------------------------------
    // LEEMOS el template (Excel in this case) from DropBox 
    // en windows, path regresa back en vez de forward slashes ... 
    let filePath = path.join(dropBoxPath, fileName);

    // en windows, path regresa back en vez de forward slashes ... 
    filePath = filePath.replace(/\\/g, "/");

    // SEGUNDO leemos el file 
    let readStream = null;

    try {
        readStream = Promise.await(readFile(dropBoxAccessToken, filePath));
    } catch (err) {
        const message = `Error: se ha producido un error al intentar leer el archivo: <em>${filePath}</em> desde Dropbox. <br />
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
    let userID2 = userName.replace(/\./g, "_");
    userID2 = userID2.replace(/@/g, "_");
    const outputFileName = fileName.replace('.xlsx', `_${userID2}.xlsx`);

    // para grabar temporalmente el archivo que resulta en el fs en node 
    let fileNameWithPath = path.join(process.env.PWD, ".temp", dropBoxPath, outputFileName);

    // en windows, path regresa back en vez de forward slashes ... 
    fileNameWithPath = fileNameWithPath.replace(/\\/g, "/");

    const writeFileAsync = promisify(fs.writeFile);
    const encoding = 'binary';

    // ahora escribimos el archivo al disco (node) para pasarlo luego, en realidad el path, a xlsx-injector
    // nota: xlsx-injector espera un archivo en el file system (node); en realidad espera el path del archivo 
    try {
        myMkdirSync(path.dirname(fileNameWithPath));        // para crear dirs y sub-dirs si no existen 
        await writeFileAsync(fileNameWithPath, content, encoding);
    } catch (err) {
        return {
            error: true,
            message: `<b>*)</b> Error al intentar grabar el archivo: ${fileNameWithPath}, en el file system (fs en node). <br /> 
                          El mensaje obtenido para el error es: ${err.message} 
                         `
        }
    }

    return {
        error: false,
        fileNameWithPath                                // nombre (con su path) del archivo (plantilla) que se grabó al fs 
    }
}

// ---------------------------------------------------------------------------------------------------------
// con esta función leemos un archivo desde el disco y lo grabamos al DropBox del programa 
// La idea es que xlsx-injector produce sus resultados en un archivo en el fs (node). Este archivo es leído 
// por esta función para luego escribirlo al DropBox. Desde allí, luego, se genera un link para que el 
// usuario lo pueda consultar 
// ----------------------------------------------------------------------------------------------------------
async function readFileFromDisk_writeToDropBox(fileNameMasPathEnFS, fileName, dropBoxPath, dropBoxAccessToken) { 

    // 1) leemos el archivo desde el fs 
    let fileContent;

    try {
        const readFileAsync = promisify(fs.readFile); 
        fileContent = await readFileAsync(fileNameMasPathEnFS);
    } catch (err) {
        return {
            error: true,
            message: `<b>*)</b> Error al intentar leer el archivo: <em>${fileNameMasPathEnFS}</em> desde el fs (fs en node). <br /> 
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
    let fileName2 = path.join(dropBoxPath, 'tmp', fileName);
    // en windows, path regresa back en vez de forward slashes ... 
    fileName2 = fileName2.replace(/\\/g, "/");

    try {
        await 
        dbx.filesUpload({
            path: fileName2,
            contents: fileContent,
            mode: { ".tag": "overwrite" },
            autorename: false
        })
    } catch (err) {
        return {
            error: true,
            message: `<b>*)</b> Error al intentar grabar el archivo: ${fileName2} en la cuenta DropBox que usa el programa. <br /> 
                        El mensaje obtenido para el error es: ${err.message} 
                        `
        }
    }

    return { 
        error: false, 
        dropBoxFileNameMasPath: fileName2
    }
}

export { readFromDropBox_writeToFS, readFileFromDisk_writeToDropBox }; 