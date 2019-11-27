

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';
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

import { leerInfoAutos } from '/server/imports/general/riesgos_leerInfoAutos'; 

import { Riesgos } from '/imports/collections/principales/riesgos'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Indoles } from '/imports/collections/catalogos/indoles'; 

Meteor.methods(
{
    'riesgos.obtenerNotasImpresas.reaseguradores': function (folderPath, fileName, riesgoID, movimientoID, fecha) {

        new SimpleSchema({
            fileName: { type: String, optional: false, },
            folderPath: { type: String, optional: false, },
            riesgoID: { type: String, optional: false, },
            movimientoID: { type: String, optional: false, },
            fecha: { type: String, optional: false, },
        }).validate({ fileName, folderPath, riesgoID, movimientoID, fecha, });

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

        const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionada) {
            message = `Error inesperado: no pudimos leer la compañía seleccionada por el usuario.<br />
                       Se ha seleccionado una compañía antes de ejecutar este proceso?`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        // antes que nada, leemos el riesgo
        const riesgo = Riesgos.findOne(riesgoID);

        if (!riesgo) {
            message = `Error inesperado: no pudimos leer el riesgo en la base de datos.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        const movimiento = lodash.find(riesgo.movimientos, (x) => { return x._id === movimientoID; });

        if (!movimiento) {
            message = `Error inesperado: aunque pudimos leer el riesgo en la base de datos, no pudimos obtener el movimiento seleccionado.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        const compania = Companias.findOne(riesgo.compania);
        const asegurado = Asegurados.findOne(riesgo.asegurado);
        const ramo = Ramos.findOne(riesgo.ramo);
        const moneda = Monedas.findOne(riesgo.moneda);
        const indole = Indoles.findOne(riesgo.indole);

        // leemos la póliza en el array de documentos del riesgo
        let poliza = "";
        if (riesgo.documentos && Array.isArray(riesgo.documentos) && riesgo.documentos.length) {
            const polizaItem = lodash.find(riesgo.documentos, (x) => { return x.tipo === 'POL'; });
            if (polizaItem) {
                poliza = polizaItem.numero;
            }
        }

        // leemos la cesion y el recibo en el array de documentos del movimiento
        let cesion = "";
        let recibo = "";
        if (movimiento.documentos && Array.isArray(movimiento.documentos) && movimiento.documentos.length) {
            const cesionItem = lodash.find(movimiento.documentos, (x) => { return x.tipo === 'CES'; });
            if (cesionItem) {
                cesion = cesionItem.numero;
            }

            const reciboItem = lodash.find(movimiento.documentos, (x) => { return x.tipo === 'REC'; });
            if (reciboItem) {
                recibo = reciboItem.numero;
            }
        }

        // nótese como obtenemos nuestra parte (para luego obtener la retención del cedente) ...
        const nosotros = movimiento && movimiento.companias && Array.isArray(movimiento.companias) ?
                       lodash.find(movimiento.companias, (x) => { return x.nosotros; }) :
                       {};

        let retencionCedente = 0;
        if (nosotros && nosotros.ordenPorc) {
            retencionCedente = 100 - nosotros.ordenPorc;
        }


        // leemos los reaseguradores y creamos un documento para cada uno
        const reaseguradores = movimiento && movimiento.companias && Array.isArray(movimiento.companias) ?
                             lodash.filter(movimiento.companias, (x) => { return !x.nosotros; }) :
                             [];

        const reaseguradoresArray = [];

        reaseguradores.forEach((reasegurador) => {

            // leemos el reasegurador para mostrar su nombre
            let reaseguradorItem = Companias.findOne(reasegurador.compania);

            // leemos las persona definida para el reasegurador
            let persona = "";
            if (riesgo.personas && Array.isArray(riesgo.personas) && riesgo.personas.length) {
                const personaItem = lodash.find(riesgo.personas, (x) => { return x.compania === reasegurador.compania; });
                if (personaItem) {
                    persona = `${personaItem.titulo} ${personaItem.nombre}`;
                }
            }

            // seleccionamos el movimiento de primas que corresponde al reasegurador
            const primas = lodash.find(movimiento.primas, (x) => { return x.compania === reasegurador.compania; });

            // la suma asegurada, reasegurada, etc., está en el array coberturasCompanias, pero debemos sumarizar ...
            const valoresARiesgo = lodash(movimiento.coberturasCompanias).
                                filter((x) => { return x.compania === reasegurador.compania; }).
                                sumBy('valorARiesgo');

            const sumaAsegurada = lodash(movimiento.coberturasCompanias).
                                filter((x) => { return x.compania === reasegurador.compania; }).
                                sumBy('sumaAsegurada');

            const sumaReasegurada = lodash(movimiento.coberturasCompanias).
                                filter((x) => { return x.compania === reasegurador.compania; }).
                                sumBy('sumaReasegurada');

            const prima = lodash(movimiento.coberturasCompanias).
                                filter((x) => { return x.compania === reasegurador.compania; }).
                                sumBy('prima');

            const cuotas = [];
            Cuotas.find({
                            'source.entityID': riesgo._id,
                            'source.subEntityID': movimiento._id,
                            compania: reasegurador.compania, },
                        { sort: { fecha: 1, }}).
                   forEach((x) => {
                        const cuota = {
                                fecha: moment(x.fecha).format('DD-MMM-YYYY'),
                                vencimiento: moment(x.fechaVencimiento).format('DD-MMM-YYYY'),
                                monto: numeral(abs(x.monto)).format('0,0.00'),
                        };
                        cuotas.push(cuota);
                    });

            // -------------------------------------------------------------------------------------------------------------------------------
            // determinamos una especie de corretaje para el reasegurador; este corretaje no será perfecto; 
            // para calcularlo, determinamos la sumatoria (nuestra vs reasseguradores) de las primas netas; 
            // este es el corretaje; luego multiplizamos por su orden ... 
            let corretaje = 0; 
            
            if (movimiento.primas) { 
                // calculamos el corretaje como la sumatoria de todas las primas netas; la nuestra incluída; 
                // el resultado de sumar, en forma algebraíca, todas las primas netas, nuestra y de reaseguradores, 
                // es el corretaje ... 
                corretaje = lodash(movimiento.primas).sumBy('primaNeta');
            }

            // para calcular la proporción del corretaje que corresponde al reasegurador, obtenemos la proporción que existe entre las 
            // primas de reaseguradores y la prima de este reasegurador 
            let primaNetaReaseguradores = 0; 
            let primaNetaEsteReasegurador = 0; 

            if (movimiento.primas) { 
                primaNetaReaseguradores = lodash(movimiento.primas).filter(x => !x.nosotros).sumBy('primaNeta');
                primaNetaEsteReasegurador = movimiento.primas.find(x => x.compania === reasegurador.compania).primaNeta;
            }

            let corretajeReasegurador = 0; 
            let corretajePorc = 0; 

            if (primaNetaReaseguradores) { 
                const proporcionReasegurador = primaNetaEsteReasegurador * 100 / primaNetaReaseguradores; 
                corretajeReasegurador = corretaje * proporcionReasegurador / 100; 

                // finalmente, calculamos el %corretaje como la proporción entre el corretaje y la prima bruta del reasegurador 
                const primaBrutaEsteReasegurador = movimiento.primas.find(x => x.compania === reasegurador.compania).primaBruta;

                if (primaBrutaEsteReasegurador) { 
                    corretajePorc = corretajeReasegurador * 100 / primaBrutaEsteReasegurador; 
                }
            }
            // -------------------------------------------------------------------------------------------------------------------------------

            // leemos los datos del auto, si el ramo es automovil y si se han registrado ... 
            let infoAutos = {}; 
            if (ramo.tipoRamo && ramo.tipoRamo === 'automovil') { 
                infoAutos = leerInfoAutos(riesgoID, movimientoID); 
            }

            const primaBruta = primas && primas.primaBruta ? primas.primaBruta : 0; 
            const comision = primas && primas.comision ? primas.comision : 0; 
            const impuesto = primas && primas.impuesto ? primas.impuesto : 0; 
            const primaNetaAntesCorretaje = primaBruta + comision + impuesto;   // sumamos pues la com/imp ya son de signo contrario 

            reaseguradorItem = {
                nombreReasegurador: reaseguradorItem && reaseguradorItem.nombre ? reaseguradorItem.nombre : 'Indefinido',
                atencion: persona ? persona : "",
                fecha: fecha,
                riesgo: riesgo.numero,
                movimiento: movimiento.numero,
                referencia: riesgo.referencia,
                cedente: compania.nombre,
                retencionCedente: `${numeral(abs(retencionCedente)).format('0,0.00')}`,
                direccionCedente: compania.direccion ? compania.direccion : "Indefinida (por registrar en catálogo)",
                ramo: ramo.descripcion,
                moneda: moneda.descripcion,
                monedaSimbolo: moneda.simbolo,
                asegurado: asegurado.nombre,
                indole: indole.descripcion,
                poliza: poliza ? poliza : "",
                cesion: cesion ? cesion : "",
                recibo: recibo ? recibo : "",
                objetoAsegurado: riesgo.objetoAsegurado && riesgo.objetoAsegurado.descripcion ? riesgo.objetoAsegurado.descripcion : '',
                ubicacion: riesgo.objetoAsegurado && riesgo.objetoAsegurado.ubicacion ? riesgo.objetoAsegurado.ubicacion : '',
                vigPolDesde: riesgo.desde ? moment(riesgo.desde).format('DD-MMM-YYYY') : '',
                vigPolHasta: riesgo.hasta ? moment(riesgo.hasta).format('DD-MMM-YYYY') : '',
                vigCesDesde: movimiento.desde ? moment(movimiento.desde).format('DD-MMM-YYYY') : '',
                vigCesHasta: movimiento.hasta ? moment(movimiento.hasta).format('DD-MMM-YYYY') : '',

                // infoAutos: solo viene para ramo automovil ... 
                marca: infoAutos.marca ? infoAutos.marca : "", 
                modelo: infoAutos.modelo ? infoAutos.modelo : "", 
                año: infoAutos.año ? infoAutos.año : "", 
                placa: infoAutos.placa ? infoAutos.placa : "", 
                serialCarroceria: infoAutos.serialCarroceria ? infoAutos.serialCarroceria : "",

                valoresARiesgo: numeral(abs(valoresARiesgo)).format('0,0.00'),
                sumaAsegurada: numeral(abs(sumaAsegurada)).format('0,0.00'),
                sumaReasegurada: numeral(abs(sumaReasegurada)).format('0,0.00'),
                suOrdenPorc: reasegurador.ordenPorc ? `${numeral(abs(reasegurador.ordenPorc)).format('0,0.00')}` : numeral(0).format('0,0.00'),
                prima: numeral(abs(prima)).format('0,0.00'),
                primaBruta: numeral(abs(primaBruta)).format('0,0.00'),
                comisionPorc: primas && primas.comisionPorc ? `${numeral(abs(primas.comisionPorc)).format('0,0.00')}%`: numeral(0).format('0,0.00'),
                comision: numeral(abs(comision)).format('0,0.00'),
                impuestoPorc: primas && primas.impuestoPorc ? `${numeral(abs(primas.impuestoPorc)).format('0,0.00')}%` : numeral(0).format('0,0.00'),
                impuesto: numeral(abs(impuesto)).format('0,0.00'),
                primaNeta_antesCorretaje: numeral(abs(primaNetaAntesCorretaje)).format('0,0.00'),
                primaNeta_antesImpSPN: primas && primas.primaNeta0 ? numeral(abs(primas.primaNeta0)).format('0,0.00'): numeral(0).format('0,0.00'),
                primaNeta: primas && primas.primaNeta ? numeral(abs(primas.primaNeta)).format('0,0.00'): numeral(0).format('0,0.00'),
                corretajeReasegurador: numeral(abs(corretajeReasegurador)).format('0,0.00'),
                corretajePorc: numeral(abs(corretajePorc)).format('0.00'),

                cuotas: cuotas,
            };

            reaseguradoresArray.push(reaseguradorItem);
        });

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

        const zip = new JSZip(content);
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

function abs(value) {
    if (lodash.isFinite(value)) {
        return Math.abs(value);
    } else {
        return 0;
    }
}
