

import { Meteor } from 'meteor/meteor'; 
import { Promise } from 'meteor/promise'; 
import SimpleSchema from 'simpl-schema';
import path from 'path';
import { readDir, readFile, writeFile } from '@cloudcmd/dropbox';

// para leer un node stream y convertirlo en un string; nota: returns a promise 
import getStream from 'get-stream'; 

Meteor.methods({
    'plantillas.obtenerListaArchivosDesdeDirectorio': function (folderPath) {

        // agregamos este método para contar la cantidad de registros que contiene un collection;
        // Nota Importante: no usamos 'tmeasday:publish-counts' pues indica en su documentación que
        // puede ser muy ineficiente si el dataset contiene muchos registros; además, este package
        // es reactive, lo cual agregar un cierto costo a su ejecución ...

        // nota: solo a veces usamos filtro ... 

        new SimpleSchema({
            folderPath: { type: String }
        }).validate({ folderPath });

        const sort = 'name';
        const order = 'asc';
        const token = Meteor.settings.public.dropBox_appToken;
        const type = 'raw';

        let files = {}; 
        let message = ""; 
        let error = false; 
        
        try {
            files = Promise.await(readDir(token, folderPath, { type, sort, order }));
        } catch(err) { 
            error = true; 
            message = `Error: se ha producido un error al intentar obtener el contenido del directorio en Dropbox. <br />
                El mensaje del error obtenido es: ${err}
                `; 
        } 

        if (!error) { 
            const filesCount = files && files.files && files.files.length ? files.files.length.toString() : "(Indefinido (???))"; 
            message = `Ok, hemos leído <b>${filesCount}</b> archivos para este tipo de plantillas. `; 
        }

        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???
        
        return { 
            error: error, 
            message: message, 
            files: files, 
        }
   }, 
})