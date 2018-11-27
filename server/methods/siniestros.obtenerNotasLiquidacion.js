

import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash';
import JSZip from 'jszip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';

import SimpleSchema from 'simpl-schema';

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Riesgos } from '/imports/collections/principales/riesgos';
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos';   
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

import { CollectionFS_templates } from '/imports/collectionFS/Files_CollectionFS_templates'; 
import { CollectionFS_tempFiles } from '/imports/collectionFS/Files_CollectionFS_tempFiles'; 

Meteor.methods(
{
    'siniestros.obtenerNotasLiquidacion': function (fileID, siniestroId, liquidacionId, fecha) {

        new SimpleSchema({
            fileID: { type: String, optional: false, },
            siniestroId: { type: String, optional: false, },
            liquidacionId: { type: String, optional: false, },
            fecha: { type: String, optional: false, },
        }).validate({ fileID, siniestroId, liquidacionId, fecha, });


        // recuperamos el file (collectionFS)
        let template = CollectionFS_templates.findOne(fileID);

        if (!template) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no hemos podido leer el documento Word (template) que se ha seleccionado.`);
        }

        // el template debe ser siempre un documento word ...
        let nombreArchivo = template.original.name;
        if (!nombreArchivo || !nombreArchivo.endsWith('.docx')) {
            throw new Meteor.Error('archivo-debe-ser-word-doc', 'El archivo debe ser un documento Word (.docx).');
        }

        let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionada) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no pudimos leer la compañía seleccionada por el usuario.<br />
             Se ha seleccionado una compañía antes de ejecutar este proceso?
            `);
        }

        // antes que nada, leemos el siniestro
        let siniestro = Siniestros.findOne(siniestroId);

        if (!siniestro) {
            throw new Meteor.Error('db-registro-no-encontrado', `Error inesperado: no pudimos leer el siniestro indicado en la base de datos.`);
        }

        let liquidacion = lodash.find(siniestro.liquidaciones, (x) => { return x._id === liquidacionId; });

        if (!liquidacion) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: aunque pudimos leer el siniestro en la base de datos, no pudimos obtener la liquidación que Ud. ha seleccionado.`);
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

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        let filePath = Meteor.settings.public.collectionFS_path_templates;
        // nótese que el nombre 'real' que asigna collectionFS cuando el usuario hace el download del archivo,
        // lo encontramos en el item en collectionFS
        let fileNameWithPath = filePath + "/" + template.copies.collectionFS_templates.key;

        // ----------------------------------------------------------------------------------------------------
        // ahora intentamos abrir el archivo con fs (node file system)
        // leemos el contenido del archivo (plantilla) en el server ...
        let content = fs.readFileSync(fileNameWithPath, "binary");

        let zip = new JSZip(content);
        let doc = new Docxtemplater();
        doc.loadZip(zip);

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

        // agregamos un nombre del archivo al 'metadata' en collectionFS; así, identificamos este archivo
        // en particular, y lo podemos eliminar en un futuro, antes de volver a registrarlo ...
        let userID = Meteor.user().emails[0].address;

        let userID2 = userID.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let nombreArchivo2 = nombreArchivo.replace('.docx', `_${userID2}.docx`);

        try { 
            // esta instrucción puede fallar si collectionFS no encuentra el file 'físico' en el disco. 
            let removedFiles = CollectionFS_tempFiles.remove({ 'original.name': nombreArchivo2 });
        } catch(ex) { 
        }

        // el tipo del archivo debe estar guardado con el 'template'
        let tipoArchivo = template.metadata.tipo;

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // promise y no el promise object ...
        return grabarDatosACollectionFS_regresarUrl(buf, nombreArchivo2, tipoArchivo, 'scrwebm', companiaSeleccionada, Meteor.user(), 'docx');
    }
})
