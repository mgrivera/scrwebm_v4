
import { Meteor } from 'meteor/meteor'; 

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

import { CollectionFS_templates } from '/server/imports/collectionFS/Files_CollectionFS_templates'; 
import { CollectionFS_tempFiles } from '/server/imports/collectionFS/Files_CollectionFS_tempFiles'; 

Meteor.methods(
{
    'contratos.obtenerNotasImpresas.generales': function (fileID, contratoId, fecha) {

        new SimpleSchema({
            fileID: { type: String, optional: false, },
            contratoId: { type: String, optional: false, },
            fecha: { type: String, optional: false, },
        }).validate({ fileID, contratoId, fecha, });

        // TODO: recuperar el file (collectionFS)
        const template = CollectionFS_templates.findOne(fileID);

        if (!template) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no hemos podido leer el archivo (template) que se ha seleccionado.`);
        }

        // el template debe ser siempre un documento word ...
        const nombreArchivo = template.original.name;
        if (!nombreArchivo || !nombreArchivo.endsWith('.docx')) {
            throw new Meteor.Error('archivo-debe-ser-word-doc', 'El archivo debe ser un documento Word (.docx).');
        }

        const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

        if (!companiaSeleccionada) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no pudimos leer la compañía seleccionada por el usuario.<br />
             Se ha seleccionado una compañía antes de ejecutar este proceso?
            `);
        }

        // leemos el contrato
        const contrato = Contratos.findOne(contratoId);

        if (!contrato) {
            throw new Meteor.Error('db-registro-no-encontrado',
            `Error inesperado: no pudimos leer el contrato en la base de datos.`);
        }

         const compania = Companias.findOne(contrato.compania);
         const ramo = Ramos.findOne(contrato.ramo);
         const tipo = TiposContrato.findOne(contrato.tipo);

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        const filePath = Meteor.settings.public.collectionFS_path_templates;
        // nótese que el nombre 'real' que asigna collectionFS cuando el usuario hace el download del archivo,
        // lo encontramos en el item en collectionFS
        const fileNameWithPath = filePath + "/" + template.copies.collectionFS_templates.key;

        // ----------------------------------------------------------------------------------------------------
        // ahora intentamos abrir el archivo con fs (node file system)
        // leemos el contenido del archivo (plantilla) en el server ...
        const content = fs.readFileSync(fileNameWithPath, "binary");

        const zip = new JSZip(content);
        const doc = new Docxtemplater();
        doc.loadZip(zip);

        // leemos las personas definidas para el contrato
        let persona = "";
        if (contrato.personas && lodash.isArray(contrato.personas) && contrato.personas.length) {
            const personaItem = lodash.find(contrato.personas, (x) => { return x.compania === contrato.compania; });
            if (personaItem) {
                persona = `${personaItem.titulo} ${personaItem.nombre}`;
            }
        }

        // preparamos un array para mostrar los montos para cada capa y compañía
        const primasCapas = [];
        let primaCapa = {};

        let sum_pb = 0, sum_imp = 0, sum_corr = 0,	sum_pn = 0;

        contrato.capasPrimasCompanias.forEach((x) => {

            const compania = Companias.findOne(x.compania);
            const moneda = Monedas.findOne(x.moneda);
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


        // preparamos un array para mostrar las cuotas de las diferentes capas del contrato
        const cuotas = [];
        let cuota = {};
        let sum_monto_cuota = 0;

        Cuotas.find({ 'source.entityID': contrato._id, 'source.origen': 'capa', compania: contrato.compania }).forEach((x) => {

            const moneda = Monedas.findOne(x.moneda);

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

        doc.setData({
            fecha: fecha,
            nombreReasegurador: compania.nombre,
            atencion: persona,
            numeroContrato: contrato.numero,
            codigoContrato: contrato.codigo ? contrato.codigo : '',
            cedente: compania.nombre,
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
        });

        //apply them (replace all occurences of {first_name} by Hipp, ...)
        try {
            // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
            doc.render();
        }
        catch (error) {
            var e = {
                message: error.message ? error.message : "Indefinido",
                name: error.name ? error.name : "Indefinido",
                stack: error.stack ? error.stack : "Indefinido",
                properties: error.properties ? error.properties : "Indefinido",
            }
            throw new Meteor.Error('error-render-Docxtemplater',
                `Error: se ha producido un error al intentar generar un documento docx usando DocxTemplater.
                 El mensaje de error recibido es: ${JSON.stringify({error: e})}.
                `);
        }

        const buf = doc.getZip().generate({ type:"nodebuffer" });

        // agregamos un nombre del archivo al 'metadata' en collectionFS; así, identificamos este archivo
        // en particular, y lo podemos eliminar en un futuro, antes de volver a registrarlo ...
        const userID = Meteor.user().emails[0].address;

        let userID2 = userID.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        const nombreArchivo2 = nombreArchivo.replace('.docx', `_${userID2}.docx`);

        // el tipo del archivo debe estar guardado con el 'template'
        const tipoArchivo = template.metadata.tipo;

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // promise y no el promise object ...
        return grabarDatosACollectionFS_regresarUrl(buf, nombreArchivo2, tipoArchivo, 'scrwebm', companiaSeleccionada, Meteor.user(), 'docx');
    }
})