
import { Meteor } from 'meteor/meteor'; 

import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';
import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';

import SimpleSchema from 'simpl-schema';

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Remesas } from '/imports/collections/principales/remesas';  

Meteor.methods(
{
    'remesas.cuadre.exportar.Excel': function (remesaID, ciaSeleccionada) {

        new SimpleSchema({
            remesaID: { type: String, optional: false },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false },
        }).validate({ remesaID, ciaSeleccionada, });

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'consultas', 'remesasCuadre.xlsx');

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'remesasCuadre.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'consultas', outputFileName);

        let remesa = Remesas.findOne(remesaID);

        if (!remesa) {
            throw new Meteor.Error('error-base-datos',
                `Error inesperado: no hemos podido leer la remesa indicada en la base de datos
                 del programa en el servidor.
                `);
        }

        if (!remesa.cuadre || !lodash.isArray(remesa.cuadre) || !remesa.cuadre.length) {
            throw new Meteor.Error('error-cuadre-remesas',
                `Error: no hemos podido leer un cuadre en la remesa que se ha indicado.<br />
                 Probablemente, esta remesa no tiene un cuadre registrado aún. Ud. debe construir un cuadre
                 para la remesa y solo luego intentar ejecutar esta función.
                `);
        }

        let instrumentoPago = remesa.instrumentoPago;

        let companias = Companias.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();
        let monedas = Monedas.find({}, { fields: { _id: true, simbolo: true, }}).fetch();
        let bancos = Bancos.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();

        let compania = companias.find((x) => { return x._id === remesa.compania; });
        let moneda = monedas.find((x) => { return x._id === remesa.moneda; });
        let banco = bancos.find((x) => { return x._id === instrumentoPago.banco });
        let cuentaBancaria = null;

        if (instrumentoPago && instrumentoPago.banco && instrumentoPago.cuentaBancaria) {
            cuentaBancaria = CuentasBancarias.findOne(instrumentoPago.cuentaBancaria);
        }

        let partida = {};
        let partidasCuadre = [];
        let granTotal = 0;

        // el primer cuadre muestra todas las operaciones del cuadre y sus partidas. Si, por ejemplo, una remesa corresponde al 
        // cobro de 5 cuotas, serán: una operación inicial por el monto de la remesa,  5 operaciones (de cobro), cada una con sus  
        // partidas asociadas, y, finalmente, una operación por la diferencia, si existe. 
        remesa.cuadre.forEach((t) => {

            let transaccion = t.transaccion;
            let partidas = t.partidas;
            partida = {};
            let sumOfMonto = 0;

            partida = {};

            partida = {
                grupo: '*',
                numero: '',
                tipo: '',
                codigo: '',
                compania: '',
                descripcion: transaccion.descripcion,
                referencia: '',
                moneda: '',
                monto: '',
                tipoReg: '1',
            };

            partidasCuadre.push(partida);

            partidas.forEach((p) => {
                partida = {
                    grupo: ' ',
                    numero: p.numero,
                    tipo: p.tipo,
                    codigo: p.codigo ? p.codigo : ' ',
                    compania: companias.find((x) => { return x._id === p.compania; }).abreviatura,
                    descripcion: p.descripcion,
                    referencia: p.referencia,
                    moneda: monedas.find((x) => { return x._id === p.moneda; }).simbolo,
                    monto: p.monto,
                    tipoReg: '0',
                };

                partidasCuadre.push(partida);
                sumOfMonto += p.monto;
                granTotal += p.monto;
            })

            // al final de las partidas de cada transacción, agregamos un item al array con el total
            // de las mimas
            partida = {
                grupo: '*',
                numero: '',
                tipo: '',
                codigo: '',
                compania: '',
                descripcion: 'Total transacción: ',
                referencia: '',
                moneda: '',
                monto: sumOfMonto,
                tipoReg: '1',
            };
            partidasCuadre.push(partida);
        })

        // finalmente, agregamos un item al array para mostrar el gran total de todas las partidas que existen en todas la operaciones 
        partida = {};
        partida = {
            grupo: '*',
            numero: '',
            tipo: '',
            codigo: '',
            compania: '',
            descripcion: 'Gran total de la remesa: ',
            referencia: '',
            moneda: '',
            monto: granTotal,
            tipoReg: '1',
        };
        partidasCuadre.push(partida);

        // -------------------------------------------------------------------------------------------------
        // para la 2da. lista, en la hoja Excel, creamos un array que contiene solo las partidas de cada
        // transacción; recordar que el cuadre tiene un array de transacciones; cada transacción tiene un
        // array de partidas
        // además de lo anterior, obviamos la primera las partidas que corresponden al cobro de primas y siniestros, 
        // pues no deben ser mostradas como parte del asiento contable. 
        let partidasArray = [];
        partida = {};
        let sumOfMonto = 0;

        remesa.cuadre.forEach((transaccion) => {
            transaccion.partidas.forEach((p) => {
                if (!(p.tipo === 100 || p.tipo === 900 || p.tipo === 600)) {
                    // solo leemos partidas diferentes a: primas cobradas, siniestros cobrados ... 
                    let partida = {};

                    let compania = companias.find((x) => { return x._id === p.compania; }).abreviatura;
                    let moneda = monedas.find((x) => { return x._id === p.moneda; }).simbolo;

                    partida = {
                        // para agrupar (y resumir) más abajo por: tipo-codigoContable-compania-moneda 
                        grupo: `${p.tipo} ${(p.codigo ? p.codigo : 'x')} ${compania} ${moneda}`,
                        tipo: p.tipo,
                        codigo: p.codigo,
                        compania: compania,
                        moneda: moneda,
                        monto: p.monto,
                    };
                    partidasArray.push(partida);
                }
            })
        })

        let partidasResumenArray = [];
        partida = {};
        granTotal = 0;
        let partidasGroupByTipoCodigoCompaniaMoneda_array = lodash.groupBy(partidasArray, 'grupo');

        for (let key in partidasGroupByTipoCodigoCompaniaMoneda_array) {

            let groupArray = partidasGroupByTipoCodigoCompaniaMoneda_array[key];
            let firstItemInGroup = groupArray[0];

            let rubro = firstItemInGroup.tipo;
            let codigo = firstItemInGroup.codigo;
            let compania = firstItemInGroup.compania;
            let moneda = firstItemInGroup.moneda;

            let sumOfMonto = lodash.sumBy(groupArray, 'monto');

            partida = {
                grupo: ' ',
                tipo: rubro,
                codigo: codigo ? codigo : '',
                compania: compania,
                descripcion: descripcionTipoPartida(rubro),
                referencia: `Rem # ${remesa.numero} - ${compania}`,
                moneda: moneda,
                monto: sumOfMonto,
                tipoReg: '0',
            };

            partidasResumenArray.push(partida);
            granTotal += sumOfMonto;
        }

        // agregamos un item al array con el gran total de las partidas ...
        partida = {
            grupo: '*',
            tipo: '',
            codigo: '',
            compania: '',
            descripcion: 'Gran total de la remesa: ',
            referencia: '',
            moneda: '',
            monto: granTotal,
            tipoReg: '1',
        };
        partidasResumenArray.push(partida);

        let infoBanco = banco.abreviatura;

        if (cuentaBancaria) {
            let monedaCuentaBancaria = Monedas.findOne(cuentaBancaria.moneda);
            infoBanco += ` (${monedaCuentaBancaria.simbolo} ${cuentaBancaria.tipo} ${cuentaBancaria.numero})`
        }


        // Object containing attributes that match the placeholder tokens in the template
        let values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,

            numeroRemesa: remesa.numero.toString(),
            fecha: moment(remesa.fecha).format('DD-MMM-YYYY'),
            moneda: moneda.simbolo,
            compania: compania.abreviatura,
            miSu: remesa.miSu,
            factorCambio: remesa.factorCambio,
            instrumentoPago: `${instrumentoPago.numero.toString()} - ${moment(instrumentoPago.fecha).format('DD-MMM-YYYY')} - ${instrumentoPago.tipo} - ${infoBanco} - ${numeral(instrumentoPago.monto).format('0,000.00')}`,
            observaciones: remesa.observaciones,

            partidas: partidasCuadre,
            resumen: partidasResumenArray,
        };

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
        // promise y no el promise object; en este caso, el url del archivo que se ha recién grabado (a collectionFS) ...

        // nótese que en el tipo de plantilla ponemos 'no aplica'; la razón es que esta plantilla no es 'cargada' por el usuario y de las
        // cuales hay diferentes tipos (islr, iva, facturas, cheques, ...). Este tipo de plantilla es para obtener algún tipo de reporte
        // en excel y no tiene un tipo definido ...
        return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'scrwebm', ciaSeleccionada, Meteor.user(), 'xlsx');
    }
});

function descripcionTipoPartida(rubro) {
    // esta función regresa el nombre del rubro, para que sirva como descripción en el resumen de la
    // remesa ...
    switch (rubro) {
        case 10: {
            return 'Monto cobrado/pagado en la remesa';
            break;
        }
        case 100: {
            return 'Primas cobradas - facultativo';
            break;
        }
        case 200: {
            return 'Primas por pagar - facultativo';
            break;
        }
        case 300: {
            return 'Corretaje - facultativo';
            break;
        }
        case 400: {
            return 'Prima pagada - facultativo';
            break;
        }
        case 600: {
            return 'Siniestros cobrados';
            break;
        }
        case 700: {
            return 'Siniestros por pagar';
            break;
        }
        case 800: {
            return 'Siniestros pagados';
            break;
        }
        case 900: {
            return 'Primas cobradas - contratos';
            break;
        }
        case 1000: {
            return 'Primas por pagar - contratos';
            break;
        }
        case 1100: {
            return 'Corretaje - contratos';
            break;
        }
        default: { 
            return 'Rubro indefinido';
        }
    }
}
