

import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash';
import JSZip from 'jszip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';

import SimpleSchema from 'simpl-schema';

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 

Meteor.methods(
{
    'contratos.obtenerNotasImpresas.primas': function (fileID, contratoId, fecha) {

        new SimpleSchema({
            fileID: { type: String, optional: false, },
            contratoId: { type: String, optional: false, },
            fecha: { type: String, optional: false, },
        }).validate({ fileID, contratoId, fecha, });

        // TODO: recuperar el file (collectionFS)
        let template = CollectionFS_templates.findOne(fileID);

        if (!template) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no hemos podido leer el archivo (template) que se ha seleccionado.`);
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

        // leemos el contrato
        let contrato = Contratos.findOne(contratoId);

        if (!contrato) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no pudimos leer el contrato en la base de datos.`);
        }

         let cedente = Companias.findOne(contrato.compania);
         let ramo = Ramos.findOne(contrato.ramo);
         let tipo = TiposContrato.findOne(contrato.tipo);

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

        // construimos un array con las compañías diferentes a 'nosotros'; es decir, los reaseguradores
        let reaseguradoresArray = [];

        let groupByReaseguradores = lodash(contrato.capasPrimasCompanias).filter((x) => { return !x.nosotros; }).groupBy('compania').value();

        for (r in groupByReaseguradores) {
            reaseguradoresArray.push(r);
        }

        let reaseguradoresWordData = [];
        let reaseguradorWordData = {};

        reaseguradoresArray.forEach((r) => {

            reaseguradorWordData = {};

            let compania = Companias.findOne(r);

            // leemos las personas definidas para el contrato
            let persona = "";
            if (contrato.personas && _.isArray(contrato.personas) && contrato.personas.length) {
                let personaItem = _.find(contrato.personas, (x) => { return x.compania === r; });
                if (personaItem) {
                    persona = `${personaItem.titulo} ${personaItem.nombre}`;
                }
            }

            // preparamos un array para mostrar los montos para cada capa y compañía
            let primasCapas = [];
            let primaCapa = {};

            let sum_pb = 0, sum_imp = 0, sum_corr = 0,	sum_pn = 0;

            // _.tap recibe el array y hace algo con él; luego el chaining continúa
            // nótese que la idea es sustituir un 'foreach()', pues este método *no* es chainable en lodash ...
            lodash(contrato.capasPrimasCompanias).chain().filter((x) => { return x.compania === r; }).tap((x) => {
                x.forEach((x) => {
                    let moneda = Monedas.findOne(x.moneda);
                    let impuestos = 0;
                    impuestos += x.imp1 ? x.imp1 : 0;
                    impuestos += x.imp2 ? x.imp2 : 0;
                    impuestos += x.impSPN ? x.impSPN : 0;

                    primaCapa = {
                        capa: x.numeroCapa.toString(),
                        compania: compania && compania.abreviatura ? compania.abreviatura : '',
                        moneda: moneda && moneda.simbolo ? moneda.simbolo : '',
                        pmd: numeral(x.pmd).format('0,0.00'),
                        orden: numeral(x.ordenPorc).format('0.0'),
                        pb: numeral(x.primaBruta).format('0,0.00'),
                        imp: numeral(impuestos).format('0,0.00'),
                        corr: numeral(x.corretaje).format('0,0.00'),
                        corrPorc: numeral(x.corretajePorc).format('0.0'),
                        pn: numeral(x.primaNeta).format('0,0.00'),
                    };

                    primasCapas.push(primaCapa);

                    // calculamos totales para mostrarlos al final en la tabla en Word
                    sum_pb += x.primaBruta;
                    sum_imp += impuestos;
                    sum_corr += x.corretaje ? x.corretaje : 0;
                    sum_pn += x.primaNeta;
                })
            }).value();


            // preparamos un array para mostrar las cuotas de las diferentes capas del contrato
            let cuotas = [];
            let cuota = {};
            let sum_monto_cuota = 0;

            Cuotas.find({ 'source.entityID': contrato._id, 'source.origen': 'capa', compania: r }).forEach((x) => {

                let moneda = Monedas.findOne(x.moneda);

                cuota = {
                    cuota: x.numero.toString(),
                    fecha: moment(x.fecha).format('DD-MMM-YY'),
                    fVenc: moment(x.fechaVencimiento).format('DD-MMM-YY'),
                    diasVenc: x.diasVencimiento.toString(),
                    mon: moneda && moneda.simbolo ? moneda.simbolo : '',
                    monto: numeral(x.monto).format('0,0.00'),
                };

                cuotas.push(cuota);

                // sumarizamos el monto para mostrarlo como un totAl al final en la tabla Word }
                sum_monto_cuota += x.monto;
            })

            reaseguradorWordData = {
                fecha: fecha,
                nombreReasegurador: compania.nombre,
                atencion: persona,
                numeroContrato: contrato.numero,
                codigoContrato: contrato.codigo ? contrato.codigo : '',
                cedente: cedente.nombre,
                vigenciaInicial: contrato.desde ? moment(contrato.desde).format('DD-MMM-YYYY') : '',
                vigenciaFinal: contrato.hasta ? moment(contrato.hasta).format('DD-MMM-YYYY') : '',
                tipoContrato: tipo && tipo.descripcion ? tipo.descripcion : 'Indefinido',
                ramoContrato: ramo.descripcion,
                referencia: contrato.referencia,

                primasCapas: primasCapas,

                sum_pb: numeral(sum_pb).format('0,0.00'),
                sum_imp: numeral(sum_imp).format('0,0.00'),
                sum_corr: numeral(sum_corr).format('0,0.00'),
                sum_pn: numeral(sum_pn).format('0,0.00'),

                cuotas: cuotas,

                sum_monto_cuota: numeral(sum_monto_cuota).format('0,0.00'),
            };

            reaseguradoresWordData.push(reaseguradorWordData)
        })



        doc.setData({
            reaseguradores: reaseguradoresWordData,
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
});