
import { Meteor } from 'meteor/meteor'; 
import { check } from 'meteor/check';

import moment from 'moment';
import lodash from 'lodash';
import JSZip from 'jszip';
import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';

// para grabar el contenido (Excel) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

import { CuentasContables } from '/imports/collections/catalogos/cuentasContables';

Meteor.methods(
{
    'cuentasContables.exportarExcel': function (ciaSeleccionada)
    {
        check(ciaSeleccionada, Object);

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'generales', 'cuentasContables.xlsx');
        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'cuentasContables.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'generales', outputFileName);

        // leemos las cuentas contables que corresponden a la cia contab seleccionada por el usuario
        let cuentasContables = CuentasContables.find({ cia: ciaSeleccionada._id }).fetch();
        
        let items = [];
        let item = {};


        lodash.orderBy(cuentasContables, ['cuentaContable'], ['asc']).
               forEach((cuentaContable) => {
            item = {
                cuentaEditada: cuentaContable.cuentaContable,
                descripcion: cuentaContable.descripcion,
                ciaContab: ciaSeleccionada.abreviatura,
                _id: cuentaContable._id,
            };
            items.push(item);
        })

        // Object containing attributes that match the placeholder tokens in the template
        let values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            cuentasContables: items,
        }

        // Open a workbook
        let workbook = new XlsxInjector(templatePath);
        let sheetNumber = 1;
        workbook.substitute(sheetNumber, values);
        // Save the workbook
        workbook.writeFile(outputPath);

        // leemos el archivo que resulta de la instrucción anterior; la idea es pasar este 'nodebuffer' a la función que sigue para:
        // 1) grabar el archivo a collectionFS; 2) regresar su url (para hacer un download desde el client) ...
        let buf = fs.readFileSync(outputPath);      // no pasamos 'utf8' como 2do. parámetro; readFile regresa un buffer

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // promise y no el promise object ...

        // nótese que en el tipo de plantilla ponemos 'no aplica'; la razón es que esta plantilla no es 'cargada' por el usuario y de las
        // cuales hay diferentes tipos (islr, iva, facturas, cheques, ...). Este tipo de plantilla es para obtener algún tipo de reporte
        // en excel y no tiene un tipo definido ...
        return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'scrwebm', ciaSeleccionada, Meteor.user(), 'xlsx');
    }
})