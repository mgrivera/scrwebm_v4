
import { Meteor } from 'meteor/meteor'

import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';
import path from 'path';

const readTextFileFromDropBox = async (folderPath, fileName) => {

    // -----------------------------------------------------------------------------------------------
    // LEEMOS el template (Word this case) from DropBox 
    // PRIMERO construimos el file path 
    let filePath = path.join(folderPath, fileName);

    // en windows, path regresa back en vez de forward slashes ... 
    filePath = filePath.replace(/\\/g, "/");

    // este es el token de nuestra aplicación en DropBox
    const dropBoxAccessToken = Meteor.settings.public.dropBox_appToken;

    // ----------------------------------------------------------------------------------------------------------------
    // authenticamos en dropbox para usar la clase y sus métodos; la idea es obtner un 'shared link' que pasaremos al 
    // browser para hacer el download ... 
    const dbx = new Dropbox({
        accessToken: dropBoxAccessToken,
        fetch: fetch
    });

    let dbxResponse;

    try {
        dbxResponse = await dbx.filesDownload({ path: filePath });
    } catch (error) {
        const message = `Error: se ha producido un error al intentar leer el archivo <em><b>${filePath}</b></em> desde Dropbox. <br />
                            El mensaje del error obtenido es: ${error}
                            `;

        return {
            error: true,
            message: message,
        }
    }

    const blob = dbxResponse.fileBinary;

    return blob; 
}

export { readTextFileFromDropBox }; 