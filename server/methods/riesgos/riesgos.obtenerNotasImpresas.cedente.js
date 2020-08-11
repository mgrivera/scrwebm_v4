
import { Meteor } from 'meteor/meteor'; 
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

import { dropBoxCreateSharedLink } from '/server/imports/general/dropbox/createSharedLink'; 
import { LeerCompaniaNosotros } from '/imports/generales/leerCompaniaNosotros'; 

import SimpleSchema from 'simpl-schema';

import { leerInfoAutos } from '/server/imports/general/riesgos_leerInfoAutos'; 

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Indoles } from '/imports/collections/catalogos/indoles'; 

Meteor.methods({
    'riesgos.obtenerNotasImpresas.cedente': async function (folderPath, fileName, riesgoID, movimientoID, fecha) {

        new SimpleSchema({
            fileName: { type: String, optional: false, },
            folderPath: { type: String, optional: false, },
            riesgoID: { type: String, optional: false, },
            movimientoID: { type: String, optional: false, },
            fecha: { type: String, optional: false, },
        }).validate({ fileName, folderPath, riesgoID, movimientoID, fecha, });

        let message = ""; 

        // nos aseguramos que el usuario tenga un nombre en la tabla de usuarios 
        const usuario = Meteor.user(); 

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

        // ----------------------------------------------------------------------------------------------------------------------------
        // leemos la compañía 'nosotros'; esta es la compañía, registrada en la tabla Compañías, como todas las demás, que asociamos 
        // a nosotros. Uno de los objetivos más fundamentales de leer esta compañía, es saber si 'nosotros' somos un reasegurador o 
        // un corredor de reaseguros (REA/CORRR)
        const resultLeerCompaniaNosotros = LeerCompaniaNosotros(Meteor.userId());

        if (resultLeerCompaniaNosotros.error) {
            message = `<em>Riesgos - Error al intentar leer la compañía 'nosotros':</em><br /><br /> ${resultLeerCompaniaNosotros.message}`;

            return {
                error: true,
                message: message,
            }
        }

        const companiaNosotros = resultLeerCompaniaNosotros.companiaNosotros; 
        // ----------------------------------------------------------------------------------------------------------------------------

        // antes que nada, leemos el riesgo
        const riesgo = Riesgos.findOne(riesgoID);

        if (!riesgo) {
            message = `Error inesperado: no pudimos leer el riesgo en la base de datos.`; 

            return { 
                error: true, 
                message: message, 
            }
        }

        const movimiento = lodash.find(riesgo.movimientos, (x) => { return x._id === movimientoID; });

        if (!movimiento) {
            message = `Error inesperado: aunque pudimos leer el riesgo en la base de datos, no pudimos obtener el movimiento seleccionado.`; 

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

        // leemos las personas definidas para el riesgo
        let persona = "";
        if (riesgo.personas && lodash.isArray(riesgo.personas) && riesgo.personas.length) {
            const personaItem = lodash.find(riesgo.personas, (x) => { return x.compania === riesgo.compania; });
            if (personaItem) {
                persona = `${personaItem.titulo} ${personaItem.nombre}`;
            }
        }

        // leemos la póliza en el array de documentos del riesgo
        let poliza = "";
        if (riesgo.documentos && lodash.isArray(riesgo.documentos) && riesgo.documentos.length) {
            const polizaItem = lodash.find(riesgo.documentos, (x) => { return x.tipo === 'POL'; });
            if (polizaItem) {
                poliza = polizaItem.numero;
            }
        }

        // leemos la cesion y el recibo en el array de documentos del movimiento
        let cesion = "";
        let recibo = "";
        if (movimiento.documentos && lodash.isArray(movimiento.documentos) && movimiento.documentos.length) {
            const cesionItem = lodash.find(movimiento.documentos, (x) => { return x.tipo === 'CES'; });
            if (cesionItem) {
                cesion = cesionItem.numero;
            }

            const reciboItem = lodash.find(movimiento.documentos, (x) => { return x.tipo === 'REC'; });
            if (reciboItem) {
                recibo = reciboItem.numero;
            }
        }

        // seleccionamos el movimiento de primas que corresponde a 'nosotros' (nuestra orden)
        const primas = lodash.find(movimiento.primas, (x) => { return x.nosotros; });

        const ordenCompaniaNosotros = lodash.find(movimiento.companias, (x) => { return x.nosotros; });

        let retencionCedente = 0;
        if (ordenCompaniaNosotros && ordenCompaniaNosotros.ordenPorc) {
            retencionCedente = 100 - ordenCompaniaNosotros.ordenPorc;
        }

        // la suma asegurada, reasegurada, etc., está en el array coberturasCompanias, pero debemos sumarizar ...
        const valoresARiesgo = lodash(movimiento.coberturasCompanias).
                            filter((x) => { return x.nosotros; }).
                            sumBy('valorARiesgo');

        const sumaAsegurada = lodash(movimiento.coberturasCompanias).
                            filter((x) => { return x.nosotros; }).
                            sumBy('sumaAsegurada');

        const sumaReasegurada = lodash(movimiento.coberturasCompanias).
                            filter((x) => { return x.nosotros; }).
                            sumBy('sumaReasegurada');

        const prima = lodash(movimiento.coberturasCompanias).
                            filter((x) => { return x.nosotros; }).
                            sumBy('prima');

        // preparamos un array de reaseguradores, para mostrarlas en la nota de cobertura

        // si el tipo de compañía 'nosotros' es REA (reasegurador), agregamos a esta compañía (nosotros) como el único  
        // reasegurador en la nota de cobertura 
        const reaseguradores = [];

        if (companiaNosotros.tipo === "CORRR") { 
            // nosotros somos un corredeor de reaseguros; agregamos a las compañías, menos nosotros, como reaseguradores 
            movimiento.companias.filter((x) => { return !x.nosotros; }).forEach((x) => {
                const compania = {
                    nombre: Companias.findOne(x.compania).abreviatura,
                    nombreCompleto: Companias.findOne(x.compania).nombre,
                    participacion: numeral(x.ordenPorc).format('0,0.00'),
                };
                reaseguradores.push(compania);
            });
        } else { 
            // nosotros somos un reasegurador; nos agregamos (y solo nosotros) como el reasegurador 
            movimiento.companias.filter((x) => { return x.nosotros; }).forEach((x) => {
                const compania = {
                    nombre: Companias.findOne(x.compania).abreviatura,
                    nombreCompleto: Companias.findOne(x.compania).nombre,
                    participacion: numeral(x.ordenPorc).format('0,0.00'),
                };
                reaseguradores.push(compania);
            });
        }

        const cuotas = [];
        Cuotas.find({ 'source.entityID': riesgo._id, 'source.subEntityID': movimiento._id, compania: riesgo.compania, },
                    { sort: { fecha: 1, }}).
               forEach((x) => {
            const cuota = {
                fecha: moment(x.fecha).format('DD-MMM-YYYY'),
                vencimiento: moment(x.fechaVencimiento).format('DD-MMM-YYYY'),
                monto: numeral(abs(x.monto)).format('0,0.00'),
            };
            cuotas.push(cuota);
        });

        // leemos los datos del auto, si el ramo es automovil y si se han registrado ... 
        let infoAutos = {}; 
        if (ramo.tipoRamo && ramo.tipoRamo === 'automovil') { 
            infoAutos = leerInfoAutos(riesgoID, movimientoID); 
        }

        // -----------------------------------------------------------------------------------------------
        // PRIMERO construimos el file path 
        let filePath = path.join(folderPath, fileName); 

        // en windows, path regresa back en vez de forward slashes ... 
        filePath = filePath.replace(/\\/g,"/");

        // SEGUNDO leemos el file 
        const dropBoxAccessToken = Meteor.settings.public.dropBox_appToken;      // this is the Dropbox app dropBoxAccessToken 
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
        
        const zip = new JSZip(content);
        const doc = new Docxtemplater();
        doc.loadZip(zip);
        
        //set the templateVariables
        doc.setData({
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
            atencion: persona ? persona : "",
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
            nuestraOrdenPorc: ordenCompaniaNosotros && ordenCompaniaNosotros.ordenPorc ? `${numeral(abs(ordenCompaniaNosotros.ordenPorc)).format('0,0.00')}` : numeral(0).format('0,0.00'),
            prima: numeral(abs(prima)).format('0,0.00'),
            primaBruta: primas && primas.primaBruta ? numeral(abs(primas.primaBruta)).format('0,0.00'): numeral(0).format('0,0.00'),
            comisionPorc: primas && primas.comisionPorc ? `${numeral(abs(primas.comisionPorc)).format('0,0.00')}`: numeral(0).format('0,0.00'),
            comision: primas && primas.comision ? numeral(abs(primas.comision)).format('0,0.00'): numeral(0).format('0,0.00'),
            impuestoPorc: primas && primas.impuestoPorc ? `${numeral(abs(primas.impuestoPorc)).format('0,0.00')}` : numeral(0).format('0,0.00'),
            impuesto: primas && primas.impuesto ? numeral(abs(primas.impuesto)).format('0,0.00'): numeral(0).format('0,0.00'),
            primaNeta: primas && primas.primaNeta ? numeral(abs(primas.primaNeta)).format('0,0.00'): numeral(0).format('0,0.00'),
            reaseg: lodash.orderBy(reaseguradores, ['nombre'], ['asc']),
            cuotas: cuotas,
        });

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
            Promise.await(writeFile(dropBoxAccessToken, filePath2, buf));
        } catch(err) { 
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

function abs(value) {
    if (lodash.isFinite(value)) {
        return Math.abs(value);
    } else {
        return 0;
    }
}