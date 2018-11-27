

import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash';
import JSZip from 'jszip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';

import SimpleSchema from 'simpl-schema';
import { Riesgos } from '/imports/collections/principales/riesgos';  

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';
import { leerInfoAutos } from '/server/imports/general/riesgos_leerInfoAutos'; 

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Indoles } from '/imports/collections/catalogos/indoles'; 

import { CollectionFS_templates } from '/imports/collectionFS/Files_CollectionFS_templates'; 
import { CollectionFS_tempFiles } from '/imports/collectionFS/Files_CollectionFS_tempFiles'; 

Meteor.methods(
{
    'riesgos.obtenerNotasImpresas.interna': function (fileID, riesgoID, movimientoID, fecha) {

        new SimpleSchema({
            fileID: { type: String, optional: false, },
            riesgoID: { type: String, optional: false, },
            movimientoID: { type: String, optional: false, },
            fecha: { type: String, optional: false, },
        }).validate({ fileID, riesgoID, movimientoID, fecha, });

        // TODO: recuperar el file (collectionFS)
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

        let movimiento = lodash.find(riesgo.movimientos, (x) => { return x._id === movimientoID; });

        if (!movimiento) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: aunque pudimos leer el riesgo en la base de datos, no pudimos obtener el movimiento seleccionado.`);
        }

         let tiposMovimiento = [
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

         let tipoMovimiento = _.find(tiposMovimiento, (x) => { return movimiento.tipo === x.tipo; });

         let compania = Companias.findOne(riesgo.compania);
         let asegurado = Asegurados.findOne(riesgo.asegurado);
         let ramo = Ramos.findOne(riesgo.ramo);
         let moneda = Monedas.findOne(riesgo.moneda);
         let suscriptor = Suscriptores.findOne(riesgo.suscriptor);
         let indole = Indoles.findOne(riesgo.indole);

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
        let content = null; 
        try { 
            content = fs.readFileSync(fileNameWithPath, "binary");            
        } catch(err) { 
            throw new Meteor.Error('error-archivo-indicado',
            `Error: por alguna razón, no ha sido posible leer el archivo indicado en el disco en el servidor. Por favor revise.`);
        }

        let zip = new JSZip(content);
        let doc = new Docxtemplater();
        doc.loadZip(zip);

        // leemos las personas definidas para el riesgo
        let persona = "";
        if (riesgo.personas && _.isArray(riesgo.personas) && riesgo.personas.length) {
            let personaItem = _.find(riesgo.personas, (x) => { return x.compania === riesgo.compania; });
            if (personaItem) {
                persona = `${personaItem.titulo} ${personaItem.nombre}`;
            }
        }

        // leemos la póliza en el array de documentos del riesgo
        let poliza = "";
        if (riesgo.documentos && _.isArray(riesgo.documentos) && riesgo.documentos.length) {
            let polizaItem = _.find(riesgo.documentos, (x) => { return x.tipo === 'POL'; });
            if (polizaItem) {
                poliza = polizaItem.numero;
            }
        }

        // leemos la cesion y el recibo en el array de documentos del movimiento
        let cesion = "";
        let recibo = "";
        if (movimiento.documentos && _.isArray(movimiento.documentos) && movimiento.documentos.length) {
            let cesionItem = _.find(movimiento.documentos, (x) => { return x.tipo === 'CES'; });
            if (cesionItem) {
                cesion = cesionItem.numero;
            }

            let reciboItem = _.find(movimiento.documentos, (x) => { return x.tipo === 'REC'; });
            if (reciboItem) {
                recibo = reciboItem.numero;
            }
        }


        // seleccionamos el movimiento de primas que corresponde a 'nosotros' (nuestra orden)
        let primas = lodash.find(movimiento.primas, (x) => { return x.nosotros; });

        let companiaNosotros = lodash.find(movimiento.companias, (x) => { return x.nosotros; });

        let retencionCedente = 0;
        if (companiaNosotros && companiaNosotros.ordenPorc) {
            retencionCedente = 100 - companiaNosotros.ordenPorc;
        }


        // la suma asegurada, reasegurada, etc., está en el array coberturasCompanias, pero debemos sumarizar ...
        let valoresARiesgo = lodash(movimiento.coberturasCompanias).
                            filter((x) => { return x.nosotros; }).
                            sumBy('valorARiesgo');

        let sumaAsegurada = lodash(movimiento.coberturasCompanias).
                            filter((x) => { return x.nosotros; }).
                            sumBy('sumaAsegurada');

        let sumaReasegurada = lodash(movimiento.coberturasCompanias).
                            filter((x) => { return x.nosotros; }).
                            sumBy('sumaReasegurada');

        let prima = lodash(movimiento.coberturasCompanias).
                            filter((x) => { return x.nosotros; }).
                            sumBy('prima');

        // para calcular un corretaje aún cuando éste no sea explicito, sino que corresonda a una diferencia entre primas netas, 
        // nuestra y de reaseguradores ... 
        let nuestraPrimaNeta = primas.primaNeta; 
        let primaNetaReaseguradores = lodash(movimiento.primas).filter((x) => { return !x.nosotros && x.primaNeta; }).sumBy('primaNeta'); 
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
        let reaseguradores = [];
        lodash(movimiento.companias).filter((x) => { return !x.nosotros; }).forEach((x) => {

            let primaItem = lodash.find(movimiento.primas, (r) => { return r.compania === x.compania; });

            let comMasImp = 0;
            comMasImp += primaItem.comision ? primaItem.comision : 0;
            comMasImp += primaItem.impuesto ? primaItem.impuesto : 0;

            // calculamos el corretaje del reasegurador como una proporción de su prima y la prima total de reaseguradores 
            let suPrimaNeta = primaItem && primaItem.primaNeta ? primaItem.primaNeta : 0; 
            let proporcionReasegurador = suPrimaNeta / primaNetaReaseguradores; 
            let suParteCorretaje = corretajeTotal * proporcionReasegurador; 

            let compania = {
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

        let cuotas = [];
        Cuotas.find({ 'source.entityID': riesgo._id, 'source.subEntityID': movimiento._id, compania: riesgo.compania, },
                    { sort: { fecha: 1, }}).
               forEach((x) => {

            let monedaCuota = Monedas.findOne(x.moneda, { fields: { simbolo: 1, }}); 

            let cuota = {
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

function abs(value) {
    if (lodash.isFinite(value)) {
        return Math.abs(value);
    } else {
        return 0;
    }
}
