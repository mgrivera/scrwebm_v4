


import * as moment from 'moment';
import * as numeral from 'numeral';
import * as lodash from 'lodash';
import * as JSZip from 'jszip';
import * as Docxtemplater from 'docxtemplater';
import * as fs from 'fs';

import SimpleSchema from 'simpl-schema';

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from 'server/imports/general/grabarDatosACollectionFS_regresarUrl';

import { Riesgos } from 'imports/collections/principales/riesgos'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Cuotas } from 'imports/collections/principales/cuotas'; 
import { NotasDebitoCredito } from 'imports/collections/principales/notasDebitoCredito'; 
import { TiposFacultativo } from 'imports/collections/catalogos/tiposFacultativo'; 
import { CuentasBancarias } from 'imports/collections/catalogos/cuentasBancarias'; 
import { Bancos } from 'imports/collections/catalogos/bancos'; 

import { CollectionFS_templates } from 'server/imports/collectionFS/Files_CollectionFS_templates'; 
import { CollectionFS_tempFiles } from 'server/imports/collectionFS/Files_CollectionFS_tempFiles'; 

Meteor.methods(
{
    'notasDebito.obtenerNotasImpresas': function (fileID: string, riesgoID: string, movimientoID: string) {

        new SimpleSchema({
            fileID: { type: String, optional: false, },
            riesgoID: { type: String, optional: false, },
            movimientoID: { type: String, optional: false, },
        }).validate({ fileID, riesgoID, movimientoID, });

        // recuperamos el file (collectionFS)
        let template = CollectionFS_templates.findOne(fileID);

        if (!template) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no hemos podido leer (un registro en la base de datos para) el archivo (template) que se ha seleccionado.`);
        }

        // el template debe ser siempre un documento word ...
        let nombreArchivo = template.original.name;
        if (!nombreArchivo || !nombreArchivo.endsWith('.docx')) {
            throw new Meteor.Error('archivo-debe-ser-word-docx', 'El archivo debe ser un documento Word (.docx).');
        }

        let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionada) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no pudimos leer la compañía seleccionada por el usuario.<br />
             Se ha seleccionado una compañía antes de ejecutar este proceso?
            `);
        }

        // antes que nada, leemos el riesgo
        let riesgo = Riesgos.findOne(riesgoID);

        if (!riesgo) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no pudimos leer el riesgo en la base de datos.`);
        }

        let movimiento = riesgo.movimientos.find((x: any) => x._id === movimientoID);

        if (!movimiento) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: aunque pudimos leer el riesgo en la base de datos, no pudimos obtener el movimiento seleccionado.`);
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
        
        // aunque el file pueda existir en collectionFS puede no hacerlo en el disco (pues alguien lo eliminó???)
        let content: any = null; 
        try { 
            content = fs.readFileSync(fileNameWithPath, "binary");            
        } catch(err) { 
            throw new Meteor.Error('error-archivo-indicado',
            `Error: por alguna razón, no ha sido posible leer el archivo indicado en el disco en el servidor. Por favor revise.`);
        }

        let zip = new JSZip(content);
        let doc = new Docxtemplater();
        doc.loadZip(zip);

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

            notaDebito.cuotas.push(cuota as never); 

            notasDebitoWord.push(notaDebito as never); 
        }

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

        // agregamos un nombre del archivo al 'metadata' en collectionFS; así, identificamos este archivo
        // en particular, y lo podemos eliminar en un futuro, antes de volver a registrarlo ...
        let userID = Meteor.user().emails[0].address;

        let userID2 = userID.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let nombreArchivo2 = nombreArchivo.replace('.docx', `_${userID2}.docx`);

        let removedFiles = CollectionFS_tempFiles.remove({ 'original.name': nombreArchivo2 });

        // el tipo del archivo debe estar guardado con el 'template'
        let tipoArchivo = template.metadata.tipo;

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // promise y no el promise object ...
        return grabarDatosACollectionFS_regresarUrl(buf, nombreArchivo2, tipoArchivo, 'scrwebm', companiaSeleccionada, Meteor.user(), 'docx');
    }
})

function abs(value: any) {
    if (lodash.isFinite(value)) {
        return Math.abs(value);
    } else {
        return 0;
    }
}