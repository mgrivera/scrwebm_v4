

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

import { Riesgos } from '/imports/collections/principales/riesgos'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { NotasDebitoCredito } from '/imports/collections/principales/notasDebitoCredito'; 
import { TiposFacultativo } from '/imports/collections/catalogos/tiposFacultativo'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
import { Bancos } from '/imports/collections/catalogos/bancos';  

Meteor.methods(
{
    'notasDebito.obtenerNotasImpresas': function (folderPath, fileName, riesgoID, movimientoID) {

        new SimpleSchema({
            fileName: { type: String, optional: false, },
            folderPath: { type: String, optional: false, },
            riesgoID: { type: String, optional: false, },
            movimientoID: { type: String, optional: false, },
        }).validate({ fileName, folderPath, riesgoID, movimientoID, });

        let message = ""; 

        // nos aseguramos que el usuario tenga un nombre en la tabla de usuarios 
        const usuario = Meteor.user(); 

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

        // antes que nada, leemos el riesgo
        let riesgo = Riesgos.findOne(riesgoID);

        if (!riesgo) {
            message = `Error inesperado: no pudimos leer el riesgo en la base de datos.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        let movimiento = riesgo.movimientos.find((x: any) => x._id === movimientoID);

        if (!movimiento) {
            message = `Error inesperado: aunque pudimos leer el riesgo en la base de datos, no pudimos obtener el movimiento seleccionado.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

        // leemos la póliza en el array de documentos del riesgo
        let poliza = "";
        if (riesgo.documentos && Array.isArray(riesgo.documentos) && riesgo.documentos.length) {
            let polizaItem = lodash.find(riesgo.documentos, (x) => { return x.tipo === 'POL'; });
            if (polizaItem) {
                poliza = polizaItem.numero;
            }
        }

        // leemos la cesion y el recibo en el array de documentos del movimiento
        let cesion = "";
        let recibo = "";
        if (movimiento.documentos && Array.isArray(movimiento.documentos) && movimiento.documentos.length) {
            let cesionItem = lodash.find(movimiento.documentos, (x) => { return x.tipo === 'CES'; });
            if (cesionItem) {
                cesion = cesionItem.numero;
            }

            let reciboItem = lodash.find(movimiento.documentos, (x) => { return x.tipo === 'REC'; });
            if (reciboItem) {
                recibo = reciboItem.numero;
            }
        }

        // para obtener la orden de reaseguro (nuestra), buscamos la compañía 'nosotros' en el array de compañías en 
        // movimientos. Desde allí, obtenemos la orden sobre el 100%. Nótese que esta no es la orden de un reasegurador, 
        // si la nota de débito es para éste (una devolución, por ejemplo). Siempre es para nuestra orden. 
        const companias = movimiento.companias; 
        const nosotros = companias.find(x => x.nosotros); 

        let ordenPorc = 0; 

        if (nosotros) { 
            ordenPorc = nosotros.ordenPorc; 
        }

        // leemos las notas de débito que puedan existir para el riesgo y movimiento indicados 
        let notasDebito = NotasDebitoCredito.find({ 
            'source.entityID': riesgo._id, 'source.subEntityID': movimiento._id }, { sort: { fecha: 1, }
        }).fetch(); 

        let notasDebitoWord = []; 

        for (const nd of notasDebito) { 

            let compania = Companias.findOne(nd.compania);
            let moneda = Monedas.findOne(nd.moneda);
            let cuotas = Cuotas.find(nd.cuota).fetch();      // tal vez en el futuro podrán haber más de una cuota para una nota de débito 
            let tipoNegocio = TiposFacultativo.findOne(nd.tipoNegocio); 
            let cuentaBancaria = CuentasBancarias.findOne(nd.cuentaBancaria); 

            let cuentaBancariaBanco; 
            let cuentaBancariaMoneda; 

            if (cuentaBancaria) { 
                cuentaBancariaBanco = Bancos.findOne(cuentaBancaria.banco); 
                cuentaBancariaMoneda = Monedas.findOne(cuentaBancaria.moneda); 
            }


            let notaDebito = {
                año: nd.ano, 
                numero: nd.numero, 
                fecha: moment(nd.fecha).format('DD-MMM-YYYY'),

                nombreCompania: compania.nombre, 
                rifCompania: compania.rif ? compania.rif : "Indefinido", 

                tipoNegocio: tipoNegocio.descripcion, 
                numeroCesion: cesion, 

                vigDesde: moment(movimiento.desde).format('DD-MMM-YYYY'),
                vigHasta: moment(movimiento.hasta).format('DD-MMM-YYYY'),

                ordenPorc: ordenPorc, 

                // datos de la cuenta bancaria (coordenadas para el pago) 
                nombreBanco: cuentaBancariaBanco.nombre,  
                tipoCuenta: (cuentaBancaria.tipo === 'CORR' ? "Corriente" : "Ahorros"), 
                numeroCuenta: cuentaBancaria.numero,  
                simboloMonedaCuenta: cuentaBancariaMoneda.simbolo, 

                cuotas: [], 
            }; 

            // tal vez en el futuro, una nd pueda tener más de una cuota de cobro. No por ahora ... 
            let cuota = {
                fechaCuota: moment(nd.fechaCuota).format('DD-MMM-YYYY'),
                fechaVencimientoCuota: moment(nd.fechaVencimientoCuota).format('DD-MMM-YYYY'),
                monedaCuota: moneda.simbolo, 
                montoCuota: numeral(abs(nd.monto)).format('0,0.00'),
            }

            notaDebito.cuotas.push(cuota); 

            notasDebitoWord.push(notaDebito); 
        }

        if (!notasDebitoWord.length) { 
            message = `Error: no hemos podido leer, al menos, una nota de débito registrada para el riesgo y movimiento seleccionados.
                      `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            return { 
                error: true, 
                message: message, 
            }
        }

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
            notasDebito: notasDebitoWord,
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

function abs(value) {
    if (lodash.isFinite(value)) {
        return Math.abs(value);
    } else {
        return 0;
    }
}