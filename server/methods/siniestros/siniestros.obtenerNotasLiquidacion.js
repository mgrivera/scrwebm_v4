

import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash';

import JSZip from 'jszip';
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

Meteor.methods(
{
    'siniestros.obtenerNotasLiquidacion': function (folderPath, fileName, siniestroId, liquidacionId, fecha) {

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
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        // el template debe ser siempre un documento word ...
        if (!fileName || !fileName.endsWith('.docx')) {
            message = `El archivo debe ser un documento Word (.docx).`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        } 

        let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionada) {
            message = `Error inesperado: no pudimos leer la compañía seleccionada por el usuario.<br />
                       Se ha seleccionado una compañía antes de ejecutar este proceso?`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        // antes que nada, leemos el siniestro
        let siniestro = Siniestros.findOne(siniestroId);

        if (!siniestro) {
            message = `Error inesperado: no pudimos leer el siniestro indicado en la base de datos`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        let liquidacion = lodash.find(siniestro.liquidaciones, (x) => { return x._id === liquidacionId; });

        if (!liquidacion) {
            message = `Error inesperado: aunque pudimos leer el siniestro en la base de datos, no pudimos obtener la 
                       liquidación que Ud. ha seleccionado.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

         let compania = Companias.findOne(siniestro.compania);
         let asegurado = Asegurados.findOne(siniestro.asegurado);
         let ramo = Ramos.findOne(siniestro.ramo);
         let ajustador = Companias.findOne(siniestro.ajustador);
         let suscriptor = Suscriptores.findOne(siniestro.suscriptor);
         let moneda = Monedas.findOne(liquidacion.moneda);

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
        let reaseguradores = siniestro && siniestro.companias && lodash.isArray(siniestro.companias) ?
                             lodash.filter(siniestro.companias, (x) => { return !x.nosotros; }) :
                             [];

        let reaseguradoresArray = [];
        let reaseguradorItem = {};

        reaseguradores.forEach((reasegurador) => {

            let datosReasegurador = Companias.findOne(reasegurador.compania);
            let persona = lodash.find(siniestro.personas, (x) => { return x.compania === reasegurador.compania; });

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

                  numeroLiquidacion: liquidacion.numero,
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
        const token = Meteor.settings.public.dropBox_appToken;      // this is the Dropbox app token 
        let readStream = null; 

        try {
            readStream = Promise.await(readFile(token, filePath));
        } catch(err) { 
            message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

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
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        } 

        let zip = new JSZip(content);
        let doc = new Docxtemplater();
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


        let buf = doc.getZip().generate({ type:"nodebuffer" });

        // -----------------------------------------------------------------------------------------------
        let nombreUsuario = usuario.personales.nombre;

        let nombreUsuario2 = nombreUsuario.replace(/\./g, "_");           // nombre del usuario: reemplazamos un posible '.' por un '_' 
        nombreUsuario2 = nombreUsuario2.replace(/\@/g, "_");              // nombre del usuario: reemplazamos un posible '@' por un '_' 
        
        // construimos un id único para el archivo, para que el usuario pueda tener más de un resultado para la misma 
        // plantilla. La fecha está en Dropbox ... 
        let fileId = new Mongo.ObjectID()._str.substring(0, 6); 

        let fileName2 = fileName.replace('.docx', `_${nombreUsuario2}_${fileId}.docx`);

        // finalmente, escribimos el archivo resultado, al directorio tmp 
        filePath2 = path.join(folderPath, "tmp", fileName2); 

        // en windows, path regresa back en vez de forward slashes ... 
        filePath2 = filePath2.replace(/\\/g,"/");

        try {
            Promise.await(writeFile(token, filePath2, buf));
        } catch(err) { 
            message = `Error: se ha producido un error al intentar escribir el archivo ${filePath2} a Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        } 

        message = `Ok, la plantilla ha sido aplicada a los datos seleccionados y el documento Word ha sido construido 
                   en forma satisfactoria. <br /> 
                   El resultado ha sido escrito al archivo <b><em>${filePath2}</em></b>, en el Dropbox del programa.  
                  `; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

        return { 
            error: false, 
            message: message, 
        }
    }
})
