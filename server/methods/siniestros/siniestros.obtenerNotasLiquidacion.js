
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 

import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash';

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

import { Promise } from 'meteor/promise'; 
import path from 'path';
import { readFile, writeFile } from '@cloudcmd/dropbox';

// para leer un node stream y convertirlo en un string; nota: returns a promise 
import getStream from 'get-stream'; 

import SimpleSchema from 'simpl-schema';

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Riesgos } from '/imports/collections/principales/riesgos';
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos';   
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

import { dropBoxCreateSharedLink } from '/server/imports/general/dropbox/createSharedLink'; 

Meteor.methods(
{
    'siniestros.obtenerNotasLiquidacion': async function (folderPath, fileName, siniestroId, liquidacionId, fecha) {

        new SimpleSchema({
            fileName: { type: String, optional: false, },
            folderPath: { type: String, optional: false, },
            siniestroId: { type: String, optional: false, },
            liquidacionId: { type: String, optional: false, },
            fecha: { type: String, optional: false, },
        }).validate({ fileName, folderPath, siniestroId, liquidacionId, fecha, });


        // nos aseguramos que el usuario tenga un nombre en la tabla de usuarios 
        const usuario = Meteor.user(); 
        let message = ""; 

        if (!usuario || !usuario.personales || !usuario.personales.nombre) { 
            message = `Error: el usuario no tiene un nombre asociado en la tabla de usuarios. <br /> 
                        Para resolver este error, abra la opción: <em>Administración / Usuarios</em> y asocie un nombre al usuario.
                        `; 
            return { 
                error: true, 
                message: message, 
            }
        }

        // el template debe ser siempre un documento word ...
        if (!fileName || !fileName.endsWith('.docx')) {
            message = `El archivo debe ser un documento Word (.docx).`; 

            return { 
                error: true, 
                message: message, 
            }
        } 

        const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionada) {
            message = `Error inesperado: no pudimos leer la compañía seleccionada por el usuario.<br />
                       Se ha seleccionado una compañía antes de ejecutar este proceso?`; 

            return { 
                error: true, 
                message: message, 
            }
        }

        // antes que nada, leemos el siniestro
        const siniestro = Siniestros.findOne(siniestroId);

        if (!siniestro) {
            message = `Error inesperado: no pudimos leer el siniestro indicado en la base de datos`; 

            return { 
                error: true, 
                message: message, 
            }
        }

        const liquidacion = lodash.find(siniestro.liquidaciones, (x) => { return x._id === liquidacionId; });

        if (!liquidacion) {
            message = `Error inesperado: aunque pudimos leer el siniestro en la base de datos, no pudimos obtener la 
                       liquidación que Ud. ha seleccionado.`; 

            return { 
                error: true, 
                message: message, 
            }
        }

        const compania = Companias.findOne(siniestro.compania);
        const asegurado = Asegurados.findOne(siniestro.asegurado);
        const ramo = Ramos.findOne(siniestro.ramo);
        const ajustador = Companias.findOne(siniestro.ajustador);
        const suscriptor = Suscriptores.findOne(siniestro.suscriptor);
        const moneda = Monedas.findOne(liquidacion.moneda);

        // intentamos leer el riesgo (el usuario pudo o no asociar uno)
        let riesgo = {};
        let riesgoMovimiento = {};
        let poliza = "";
        let movimientoDocumentos = [];

         if (siniestro.source && siniestro.source.origen == 'fac' && siniestro.source.entityID && siniestro.source.subEntityID) {
             riesgo = Riesgos.findOne(siniestro.source.entityID);

             if (riesgo) {
                 riesgoMovimiento = lodash.find(riesgo.movimientos, (x) => { return x._id === siniestro.source.subEntityID; });

                 poliza = lodash.find(riesgo.documentos, (x) => { return x.tipo === 'POL'; });

                 if (riesgoMovimiento) {
                     movimientoDocumentos = riesgoMovimiento.documentos;
                 }
             }
         }

        // leemos los reaseguradores y creamos un documento para cada uno
        const reaseguradores = siniestro && siniestro.companias && lodash.isArray(siniestro.companias) ?
                             lodash.filter(siniestro.companias, (x) => { return !x.nosotros; }) :
                             [];

        const reaseguradoresArray = [];
        let reaseguradorItem = {};

        reaseguradores.forEach((reasegurador) => {

            const datosReasegurador = Companias.findOne(reasegurador.compania);
            const persona = lodash.find(siniestro.personas, (x) => { return x.compania === reasegurador.compania; });

            let totalLiquidacion = 0;
            totalLiquidacion += liquidacion.indemnizado ? liquidacion.indemnizado : 0;
            totalLiquidacion += liquidacion.ajuste ? liquidacion.ajuste : 0;
            totalLiquidacion += liquidacion.adicional ? liquidacion.adicional : 0;
            totalLiquidacion += liquidacion.otrosGastos ? liquidacion.otrosGastos : 0;

            reaseguradorItem = {
                fecha: fecha,
                numeroSiniestro: siniestro.numero,
                numeroLiquidacion: liquidacion.numero,
                nombreReasegurador: datosReasegurador.nombre,
                atencion: persona ? `${persona.titulo} ${persona.nombre}` : '',
                cedente: compania.nombre,
                asegurado: asegurado.nombre,
                ajustador: ajustador ? ajustador.nombre : '',
                ramo: ramo.descripcion,
                suscriptor: suscriptor.nombre,
                fechaOcurrencia: moment(siniestro.fechaOcurrencia).format('DD-MMM-YYYY'),
                fechaNotificacion: moment(siniestro.fechaNotificacion).format('DD-MMM-YYYY'),

                siniestroDescripcion: siniestro.notas && siniestro.notas.descripcion ? siniestro.notas.descripcion : '',
                siniestroLugar: siniestro.notas && siniestro.notas.lugar ? siniestro.notas.lugar : '',
                siniestroDetalles: siniestro.notas && siniestro.notas.detalles ? siniestro.notas.detalles : '',
                siniestroCausa: siniestro.notas && siniestro.notas.causa ? siniestro.notas.causa : '',
                siniestroConsecuencias: siniestro.notas && siniestro.notas.consecuencias ? siniestro.notas.consecuencias : '',
                siniestroObservaciones: siniestro.notas && siniestro.notas.observaciones ? siniestro.notas.observaciones : '',

                poliza: poliza ? poliza.numero : '',

                cesion: lodash.find(movimientoDocumentos, (x) => { return x.tipo === 'CES'; }) ?
                        lodash.find(movimientoDocumentos, (x) => { return x.tipo === 'CES'; }).numero : '',

                recibo: lodash.find(movimientoDocumentos, (x) => { return x.tipo === 'REC'; }) ?
                        lodash.find(movimientoDocumentos, (x) => { return x.tipo === 'REC'; }).numero : '',

                siniestro: siniestro.numero,

                siniestroCedente: lodash.find(siniestro.documentos, (x) => { return x.tipo === 'SINCED'; }) ?
                                  lodash.find(siniestro.documentos, (x) => { return x.tipo === 'SINCED'; }).numero : '',

                  moneda: moneda.descripcion,
                  fechaLiquidacion: moment(liquidacion.fecha).format('DD-MMM-YYYY'),
                  definitivo: liquidacion.definitivo ? 'si' : 'no',
                  comentarios: liquidacion.comentarios ? liquidacion.comentarios : '',

                  Indemnizado: liquidacion.indemnizado ? numeral(liquidacion.indemnizado).format('0,0.00') : '',
                  ajuste: liquidacion.ajuste ? numeral(liquidacion.ajuste).format('0,0.00') : '',
                  adicional: liquidacion.adicional ? numeral(liquidacion.adicional).format('0,0.00') : '',
                  otrosGastos: liquidacion.otrosGastos ? numeral(liquidacion.otrosGastos).format('0,0.00') : '',
                  total: numeral(totalLiquidacion).format('0,0.00'),

                  totalLiquidacion: numeral(totalLiquidacion).format('0,0.00'),
                  suOrdenPorc: numeral(reasegurador.ordenPorc).format('0.000000'),
                  suParte: numeral(totalLiquidacion * reasegurador.ordenPorc / 100).format('0,0.00')
            };

            reaseguradoresArray.push(reaseguradorItem);
        })

        // -----------------------------------------------------------------------------------------------
        // PRIMERO construimos el file path 
        let filePath = path.join(folderPath, fileName); 

        // en windows, path regresa back en vez de forward slashes ... 
        filePath = filePath.replace(/\\/g,"/");

        // SEGUNDO leemos el file 
        const dropBoxAccessToken = Meteor.settings.public.dropBox_appToken;      // this is the Dropbox app token 
        let readStream = null; 

        try {
            readStream = Promise.await(readFile(dropBoxAccessToken, filePath));
        } catch(err) { 
            message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
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
        } catch(err) { 
            message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `; 

            return { 
                error: true, 
                message: message, 
            }
        } 

        const zip = new PizZip(content);
        const doc = new Docxtemplater();
        doc.loadZip(zip);

        //set the templateVariables
        doc.setData({
            reaseguradores: reaseguradoresArray,
        });

        //apply them (replace all occurences of {first_name} by Hipp, ...)
        try {
            // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
            doc.render();
        }
        catch (error) {
            var e = {
                message: error.message,
                name: error.name,
                stack: error.stack,
                properties: error.properties,
            }
            throw new Meteor.Error('error-render-Docxtemplater',
                `Error: se ha producido un error al intentar generar un documento docx usando DocxTemplater.
                 El mensaje de error recibido es: ${JSON.stringify({error: e})}.
                `);
        }


        const buf = doc.getZip().generate({ type:"nodebuffer" });

        // -----------------------------------------------------------------------------------------------
        // -----------------------------------------------------------------------------------------------
        const nombreUsuario = usuario.personales.nombre;

        let nombreUsuario2 = nombreUsuario.replace(/\./g, "_");           // nombre del usuario: reemplazamos un posible '.' por un '_' 
        nombreUsuario2 = nombreUsuario2.replace(/@/g, "_");              // nombre del usuario: reemplazamos un posible '@' por un '_' 

        // construimos un id único para el archivo, para que el usuario pueda tener más de un resultado para la misma 
        // plantilla. La fecha está en Dropbox ... 
        const fileId = new Mongo.ObjectID()._str.substring(0, 6);

        const fileName2 = fileName.replace('.docx', `_${nombreUsuario2}_${fileId}.docx`);

        // finalmente, escribimos el archivo resultado, al directorio tmp 
        let filePath2 = path.join(folderPath, "tmp", fileName2);

        // en windows, path regresa back en vez de forward slashes ... 
        filePath2 = filePath2.replace(/\\/g, "/");

        try {
            Promise.await(writeFile(dropBoxAccessToken, filePath2, buf));
        } catch (err) {
            message = `Error: se ha producido un error al intentar escribir el archivo ${filePath2} a Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `;

            return {
                error: true,
                message: message,
            }
        }

        // ------------------------------------------------------------------------------------------------
        // con esta función creamos un download link para que el usuario pueda tener el archivo en su pc 
        const result = await dropBoxCreateSharedLink(filePath2);

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