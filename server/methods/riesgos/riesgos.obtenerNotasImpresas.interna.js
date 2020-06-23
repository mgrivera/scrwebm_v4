
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

import SimpleSchema from 'simpl-schema';
import { Riesgos } from '/imports/collections/principales/riesgos';  

import { leerInfoAutos } from '/server/imports/general/riesgos_leerInfoAutos'; 

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Indoles } from '/imports/collections/catalogos/indoles'; 

Meteor.methods(
{
    'riesgos.obtenerNotasImpresas.interna': async function (folderPath, fileName, riesgoID, movimientoID, fecha) {

        new SimpleSchema({
            fileName: { type: String, optional: false, },
            folderPath: { type: String, optional: false, },
            riesgoID: { type: String, optional: false, },
            movimientoID: { type: String, optional: false, },
            fecha: { type: String, optional: false, },
        }).validate({ fileName, folderPath, riesgoID, movimientoID, fecha, });

        // nos aseguramos que el usuario tenga un nombre en la tabla de usuarios 
        const usuario = Meteor.user(); 

        if (!usuario || !usuario.personales || !usuario.personales.nombre) { 
            let message = `Error: el usuario no tiene un nombre asociado en la tabla de usuarios. <br /> 
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
            let message = `El archivo debe ser un documento Word (.docx).`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        } 

        const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionada) {
            let message = `Error inesperado: no pudimos leer la compañía seleccionada por el usuario.<br />
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
            let message = `Error inesperado: no pudimos leer el riesgo en la base de datos.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        const movimiento = lodash.find(riesgo.movimientos, (x) => { return x._id === movimientoID; });

        if (!movimiento) {
            let message = `Error inesperado: aunque pudimos leer el riesgo en la base de datos, no pudimos obtener el movimiento seleccionado.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

         const tiposMovimiento = [
             { tipo: 'OR', descripcion: 'Original' },
             { tipo: 'AS', descripcion: 'Aumento de Suma Asegurada' },
             { tipo: 'DS', descripcion: 'Disminución de Suma Asegurada' },
             { tipo: 'COAD', descripcion: 'Cobro Adicional de Prima' },
             { tipo: 'DP', descripcion: 'Devolucion de Prima' },
             { tipo: 'EC', descripcion: 'Extensión de Cobertura' },
             { tipo: 'CR', descripcion: 'Cambio de Reasegurador' },
             { tipo: 'SE', descripcion: 'Sin Efecto' },
             { tipo: 'AN', descripcion: 'Anulación' },
             { tipo: 'AE', descripcion: 'Anulación de Endoso' },
             { tipo: 'CAPA', descripcion: 'Cambio de Participación' },
             { tipo: 'PRAJ', descripcion: 'Prima de Ajuste' },
             { tipo: 'AJPR', descripcion: 'Ajuste de Prima' },
             { tipo: 'FRPR', descripcion: 'Fraccionamiento de Prima' },
             { tipo: 'DE', descripcion: 'Endoso declarativo' },
             { tipo: 'IncCob', descripcion: 'Inclusión de Cobertura' }
         ];

         const tipoMovimiento = lodash.find(tiposMovimiento, (x) => { return movimiento.tipo === x.tipo; });

         const compania = Companias.findOne(riesgo.compania);
         const asegurado = Asegurados.findOne(riesgo.asegurado);
         const ramo = Ramos.findOne(riesgo.ramo);
         const moneda = Monedas.findOne(riesgo.moneda);
         const suscriptor = Suscriptores.findOne(riesgo.suscriptor);
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

        const companiaNosotros = lodash.find(movimiento.companias, (x) => { return x.nosotros; });

        let retencionCedente = 0;
        if (companiaNosotros && companiaNosotros.ordenPorc) {
            retencionCedente = 100 - companiaNosotros.ordenPorc;
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

        // para calcular un corretaje aún cuando éste no sea explicito, sino que corresonda a una diferencia entre primas netas, 
        // nuestra y de reaseguradores ... 
        const nuestraPrimaNeta = primas.primaNeta; 
        const primaNetaReaseguradores = lodash(movimiento.primas).filter((x) => { return !x.nosotros && x.primaNeta; }).sumBy('primaNeta'); 
        let corretajeTotal = nuestraPrimaNeta + primaNetaReaseguradores;        // ambas primas tienen signos contrarios 
        if (!corretajeTotal) { corretajeTotal = 0; }

        // para obtener totales para cifras de reaseguradores 
        let reaseg_total_orden = 0; 
        let reaseg_total_primaBruta = 0; 
        let reaseg_total_comMasImp = 0; 
        let reaseg_total_corretaje = 0; 
        let reaseg_total_primaNeta0 = 0; 
        let reaseg_total_impSPN = 0; 
        let reaseg_total_primaNeta1 = 0; 
        
        // preparamos un array de reaseguradores, para mostrarlas en la nota de cobertura
        const reaseguradores = [];
        lodash(movimiento.companias).filter((x) => { return !x.nosotros; }).forEach((x) => {

            const primaItem = lodash.find(movimiento.primas, (r) => { return r.compania === x.compania; });

            let comMasImp = 0;
            comMasImp += primaItem.comision ? primaItem.comision : 0;
            comMasImp += primaItem.impuesto ? primaItem.impuesto : 0;

            // calculamos el corretaje del reasegurador como una proporción de su prima y la prima total de reaseguradores 
            const suPrimaNeta = primaItem && primaItem.primaNeta ? primaItem.primaNeta : 0; 
            const proporcionReasegurador = suPrimaNeta / primaNetaReaseguradores; 
            const suParteCorretaje = corretajeTotal * proporcionReasegurador; 

            const compania = {
                nombre: Companias.findOne(x.compania).abreviatura,
                participacion: numeral(abs(x.ordenPorc)).format('0,0.00'),
                primaBruta: primaItem && primaItem.primaBruta ? numeral(abs(primaItem.primaBruta)).format('0,0.00') : "",
                comMasImp: comMasImp ? numeral(abs(comMasImp)).format('0,0.00') : "",
                corretaje: suParteCorretaje ? numeral(abs(suParteCorretaje)).format('0,0.00') : "",
                primaNeta0: primaItem && primaItem.primaNeta0 ? numeral(abs(primaItem.primaNeta0)).format('0,0.00') : "",
                impuestoSobrePrimaNeta: primaItem && primaItem.impuestoSobrePN ? numeral(abs(primaItem.impuestoSobrePN)).format('0,0.00') : "",
                primaNeta1: primaItem && primaItem.primaNeta ? numeral(abs(primaItem.primaNeta)).format('0,0.00') : "",
            };
            reaseguradores.push(compania);

            reaseg_total_orden += x.ordenPorc; 
            reaseg_total_primaBruta += primaItem && primaItem.primaBruta ? primaItem.primaBruta : 0; 
            reaseg_total_comMasImp += comMasImp; 
            reaseg_total_corretaje += suParteCorretaje; 
            reaseg_total_primaNeta0 += primaItem && primaItem.primaNeta0 ? primaItem.primaNeta0 : 0;  
            reaseg_total_impSPN += primaItem && primaItem.impuestoSobrePN ? primaItem.impuestoSobrePN : 0;   
            reaseg_total_primaNeta1 += primaItem && primaItem.primaNeta ? primaItem.primaNeta : 0;    
        })

        const cuotas = [];
        Cuotas.find({ 'source.entityID': riesgo._id, 'source.subEntityID': movimiento._id, compania: riesgo.compania, },
                    { sort: { fecha: 1, }}).
               forEach((x) => {

            const monedaCuota = Monedas.findOne(x.moneda, { fields: { simbolo: 1, }}); 

            const cuota = {
                moneda: monedaCuota && monedaCuota.simbolo ? monedaCuota.simbolo : "indef", 
                fecha: moment(x.fecha).format('DD-MMM-YYYY'),
                vencimiento: moment(x.fechaVencimiento).format('DD-MMM-YYYY'),
                monto: numeral(abs(x.monto)).format('0,0.00'),
            };
            cuotas.push(cuota);
        })

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
        const dropBoxAccessToken = Meteor.settings.public.dropBox_appToken;      // this is the Dropbox app token 
        let readStream = null; 

        try {
            readStream = Promise.await(readFile(dropBoxAccessToken, filePath));
        } catch(err) { 
            let message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
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
            let message = `Error: se ha producido un error al intentar leer el archivo ${filePath} desde Dropbox. <br />
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
            fecha: fecha,
            riesgo: riesgo.numero,
            movimiento: movimiento.numero,
            referencia: riesgo.referencia,
            tipoMovimiento: tipoMovimiento && tipoMovimiento.descripcion ? tipoMovimiento.descripcion : 'Indefinido',
            cedente: compania.nombre,
            direccionCedente: compania.direccion ? compania.direccion : "Indefinida (por registrar en catálogo)",
            retencionCedente: `${numeral(abs(retencionCedente)).format('0,0.00')}`,
            ramo: ramo.descripcion,
            moneda: moneda.descripcion,
            monedaSimbolo: moneda.simbolo,
            asegurado: asegurado.nombre,
            indole: indole.descripcion,
            suscriptor: suscriptor.nombre,
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
            nuestraOrdenPorc: companiaNosotros && companiaNosotros.ordenPorc ? `${numeral(abs(companiaNosotros.ordenPorc)).format('0,0.00')}` : numeral(0).format('0,0.00'),
            prima: numeral(abs(prima)).format('0,0.00'),
            primaBruta: primas && primas.primaBruta ? numeral(abs(primas.primaBruta)).format('0,0.00'): numeral(0).format('0,0.00'),
            comisionPorc: primas && primas.comisionPorc ? `${numeral(abs(primas.comisionPorc)).format('0,0.00')}`: numeral(0).format('0,0.00'),
            comision: primas && primas.comision ? numeral(abs(primas.comision)).format('0,0.00'): numeral(0).format('0,0.00'),
            impuestoPorc: primas && primas.impuestoPorc ? `${numeral(abs(primas.impuestoPorc)).format('0,0.00')}` : numeral(0).format('0,0.00'),
            impuesto: primas && primas.impuesto ? numeral(abs(primas.impuesto)).format('0,0.00'): numeral(0).format('0,0.00'),
            primaNeta: primas && primas.primaNeta ? numeral(abs(primas.primaNeta)).format('0,0.00'): numeral(0).format('0,0.00'),
            reaseg: lodash.orderBy(reaseguradores, ['nombre'], ['asc']),

            // montos totales para el array de reaseguradores ... 
            tot_orden: numeral(abs(reaseg_total_orden)).format('0,0.00'), 
            total_pb: numeral(abs(reaseg_total_primaBruta)).format('0,0.00'), 
            total_comImp: numeral(abs(reaseg_total_comMasImp)).format('0,0.00'), 
            total_corr: numeral(abs(reaseg_total_corretaje)).format('0,0.00'), 
            total_pn0: numeral(abs(reaseg_total_primaNeta0)).format('0,0.00'), 
            total_impSPN: numeral(abs(reaseg_total_impSPN)).format('0,0.00'), 
            total_pn1: numeral(abs(reaseg_total_primaNeta1)).format('0,0.00'), 

            cuotas: cuotas,
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
            Promise.await(writeFile(dropBoxAccessToken, filePath2, buf));
        } catch(err) { 
            let message = `Error: se ha producido un error al intentar escribir el archivo ${filePath2} a Dropbox. <br />
                        El mensaje del error obtenido es: ${err}
                        `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        } 

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