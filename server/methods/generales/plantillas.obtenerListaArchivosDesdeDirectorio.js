
import { Meteor } from 'meteor/meteor';
import lodash from 'lodash';

import SimpleSchema from 'simpl-schema';

import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';

Meteor.methods({
    'plantillas.obtenerListaArchivosDesdeDirectorio': async function (folderPath) {

        new SimpleSchema({
            folderPath: { type: String }
        }).validate({ folderPath });

        const accessToken = Meteor.settings.public.dropBox_appToken;

        let files = [];
        let message = "";

        try {
            const dbx = new Dropbox({ accessToken, fetch });

            const files0 = await dbx.filesListFolder({ path: folderPath });
            const files1 = files0.entries.filter(x => x[".tag"] === "file").map(x => ({ name: x.name }));

            files = lodash.orderBy(files1, ['name'], ['asc']);

        } catch (err) {
            message = err && err.message ? err.message : (err && err.error && err.error.error_summary ? err.error.error_summary : err);
            message = `Error: se ha producido un error al intentar obtener el contenido del directorio (${folderPath}) en Dropbox. <br />
                El mensaje del error obtenido es: <br /><br />${message}
                `;
            return {
                error: true,
                message: message,
            }
        }

        if (files && Array.isArray(files) && files.length) {
            const filesCount = files.length.toString();
            message = `Ok, hemos leído <b>${filesCount}</b> archivos para este tipo de plantillas. `;
        } else {
            message = `Error: no hemos podido leer plantillas registradas en Dropbox, para este tipo de proceso en particular. <br /> 
                       Ud. debe registrar al menos una plantilla para este tipo de proceso, en el directorio adecuado 
                       (<em>${folderPath}</em>) en el Dropbox del programa. 
                      `;
            return {
                error: true,
                message: message,
            }
        }

        return {
            error: false,
            message: message,
            files: files,
        }
    },
})