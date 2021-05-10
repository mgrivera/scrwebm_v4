
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check'; 
import { Match } from 'meteor/check'; 
import { Email } from 'meteor/email';

import lodash from 'lodash'; 
import moment from 'moment';
import numeral from 'numeral';

import Mustache from 'mustache'; 

import { Contratos } from '/imports/collections/principales/contratos';
import { Riesgos } from '/imports/collections/principales/riesgos';
import { Siniestros } from '/imports/collections/principales/siniestros';
import { Companias } from '/imports/collections/catalogos/companias';

import { readTextFileFromDropBox } from '/server/imports/general/dropbox/readTextFileFromDropBox'; 

import fs from 'fs';
import { promisify } from 'util';

import { myMkdirSync } from '/server/imports/general/generalFunctions';

Meteor.methods(
    {
        'consultas.montosPendientesCobroVencimientos.generarEmailsCobranza': async function (dropBoxFilePath, plantilla, cuotas, datosConfiguracion) {

            check(plantilla, Object);
            check(cuotas, [Match.Any]);

            // simplificamos un poco el objeto que trae los datos de configuración (user, nombre empresa, etc.) 
            const user = {
                nombreCompania: datosConfiguracion.nombreCompania,

                usuario_titulo: datosConfiguracion?.usuario?.titulo,
                usuario_nombre: datosConfiguracion?.usuario?.nombre,
                usuario_cargo: datosConfiguracion?.usuario?.cargo
            };

            const fileContent = await readTextFileFromDropBox(dropBoxFilePath, plantilla.name);

            // ----------------------------------------------------------------------------------------------------
            // ahora intentamos grabar el archivo leído desde DropBox a un archivo en el filesystem 
            const finalPath = process.env.PWD + '/.temp/html';
            const fileName = plantilla.name;

            const result = await saveFileToDisk(finalPath, fileName, fileContent);

            const cuotasGroupByEmail = lodash.groupBy(cuotas, 'persona.email'); 

            let count = 0; 

            // tenemos que inicializar esta variable para que sea usada por el Email package 
            process.env.MAIL_URL = Meteor.settings.mail_url;

            // agrupamos las cuotas por email; la idea es construir *un solo* email para todas las cuotas que tengan la misma dirección de corro 
            for (const [key, value] of Object.entries(cuotasGroupByEmail)) { 

                // obtenemos los datos de la persona para el 1er. item en el array. Los datos de la persona no deben cambiar en el array, pues 
                // estamos agrupando por array. No deben haber dos personas con el *mismo* email ... 
                const persona = { ...value[0].persona };    // título, nombre, cargo, departamento, email 

                const items = value.map(x => (
                    { 
                        moneda: x.monedaSimbolo,
                        // para contratos aquí va su referencia 
                        asegurado: x.aseguradoAbreviatura,
                        compania: x.companiaAbreviatura,
                        ramo: x.ramoAbreviatura, 
                        suscriptor: x.suscriptorAbreviatura, 

                        numeroCuota: x.numeroCuota,     // 1/3, 2/3, 3/3, ...
                        origen: x.origen,               // ej: cuenta-65-1, sinFac-10-1, fac-415-1, ...

                        diasPendientes: x.diasPendientes,
                        diasVencidos: x.diasVencidos,

                        fecha: moment(x.fecha).format('DD-MMM-YY'),
                        fechaVencimiento: moment(x.fechaVencimiento).format('DD-MMM-YY'),
                        
                        montoCuota: numeral(x.montoCuota).format('0,0.00'),       // monto de la cuota

                        // monto previamente cobrado; es el monto en el sub array de pagos (puede haber más de 1 cobro parcial)
                        montoCobrado: numeral(x.montoCobrado).format('0,0.00'),
                        saldo: numeral(x.montoCuota - x.montoCobrado).format('0,0.00'),

                        // true si el monto cobrado se hizo con la misma moneda de la cuota 
                        // false si, al menos, uno de los cobros en el array de pagos, es hecho con *otra* moneda 
                        montoCobradoMismaMoneda: x.montoCobradoMismaMoneda,
                    }))

                const email = { 
                    user, 
                    persona, 
                    items
                }

                // usamos mustache para reemplazar los campos en el texto con los valores en el object 
                const output = Mustache.render(fileContent.toString(), email);

                // Let other method calls from the same client start running, without waiting for the email sending to complete.
                this.unblock();

                // finalmente, enviamos el Email 
                const to = []; 
                const from = datosConfiguracion.copiar_1.email; 
                const cc = []; 
                const subject = datosConfiguracion.emailSubject; 

                if (datosConfiguracion.copiar_1?.copiar && datosConfiguracion.copiar_1?.email) {
                    cc.push(datosConfiguracion.copiar_1.email)
                }

                if (datosConfiguracion.copiar_2?.copiar && datosConfiguracion.copiar_2?.email) {
                    cc.push(datosConfiguracion.copiar_2.email)
                }

                if (!datosConfiguracion.enviarSoloEmailsCC) {
                    // el usuario puede indicar que solo se envien copias del Email 
                    // en key está la dirección de correo de la persona en la compañia ... 
                    // recuérdese que arriba se agruparon las cuotas, justamente, por dirección de correo, para enviar un solo correo a 
                    // cada grupo de cuotas que compartan un correo 
                    to.push(key);
                }

                try {
                    Email.send({ to, from, cc, subject, html: output });
                    count++;
                } catch (error) {
                    return {
                        error: true,
                        message: error.message
                    }
                }
            }

            if (result.error) { 
                return { 
                    error: true, 
                    message: result.message
                }
            }

            const message = `Ok, Ud. seleccionó <b>${cuotas.length}</b> elementos en la lista. <br />
                             Esta función ha construido y enviado <b>${count}</b> Emails para notificar el estado de estos montos
                             pendientes a las compañías que corresponden.`;

            return {
                error: false,
                message
            }
        }, 

        'consultas.montosPendientesCobroVencimientos.leerEmailAddresses': (selectedRows) => {

            check(selectedRows, [Object]);

            // recibimos la lista de cuotas pendientes que el usuario ha seleccionado en la lista. Vamos a intentar encontrar 
            // los datos de la persona para cada una, en especial, su dirección de correo. 

            // primero buscamos en la entidad (riesgo, contrato, siniestro) a ver si allí se ha registrado la persona. De ser así, 
            // leemos su _id y buscamos en la compañía. 

            // si no encontramos la persona en la entidad, intentamos buscar directamente en la compañía; en este caso, tomamos la 
            // primera persona que leamos en el array de personas en la compañía  

            const finalRows = []; 

            let personasNoEncontradas = 0; 
            let personasEncontradasEnEnEntidadDeOrigen = 0;     // se encontraron en la compañía aunque no en la entidad (ej: riesgo) 
            let personasEncontradasNoEnEntidadDeOrigen = 0;     // se encontraron en la entidad y luego en la compañía  

            for (const row of selectedRows) { 
 
                let entidadPersonas = []; 

                // buscamos la entidad a ver si tiene personas definidas 
                switch (row.entidadOriginalTipo) { 

                    case 'cuenta': 
                    case 'capa': {
                        const contrato = Contratos.findOne(row.entidadOriginalID, { fields: { personas: 1 } });

                        if (contrato && Array.isArray(contrato.personas) && contrato.personas.length) {
                            entidadPersonas = contrato.personas;
                        }
                        break;
                    }
                    case 'fac': {
                        const riesgo = Riesgos.findOne(row.entidadOriginalID, { fields: { personas: 1 } });

                        if (riesgo && Array.isArray(riesgo.personas) && riesgo.personas.length) {
                            entidadPersonas = riesgo.personas;
                        }
                        break;
                    }
                    case 'sinFac': {
                        const siniestro = Siniestros.findOne(row.entidadOriginalID, { fields: { personas: 1 } });

                        if (siniestro && Array.isArray(siniestro.personas) && siniestro.personas.length) {
                            entidadPersonas = siniestro.personas;
                        }
                        break;
                    }
                }

                // si había un array de personas en la entidad, intentamos encontrar la persona especifica allí 
                // nótese que buscamos por Id 
                let entidadPersona = {}; 

                if (entidadPersonas.length) { 
                    entidadPersona = entidadPersonas.find(x => x.compania === row.compania);
                }

                // si, finalmente, encontramos la persona en el array de personas en la entidad, buscamos en el catálogo 
                // de compañías, por companiaId y personaId; de otra forma, buscamos igual pero solo usando la compañía. 

                // la idea de hacerlo así, es que el usuario puede haber registrado *vairas* personas para una misma 
                // compañía 
                const compania = Companias.findOne(row.compania, { fields: { nombre: 1, personas: 1 }}); 

                // 1) la compañía debe tener un array de personas 
                if (!compania || !compania.personas || !Array.isArray(compania.personas) || !compania.personas.length) {

                    row.persona = []; 
                    finalRows.push(row);

                    personasNoEncontradas++;
                    continue;
                }

                // 5) si encontramos una persona en la entidad, la usamos para buscarla en el array de personas 
                if (entidadPersona && entidadPersona.persona) {
                    if (compania.personas.some(x => x._id === entidadPersona.persona)) {

                        const p = compania.personas.find(x => x._id === entidadPersona.persona);
                        p.nombreCompania = compania.nombre;
                        row.persona = p;
                        finalRows.push(row);

                        personasEncontradasEnEnEntidadDeOrigen++;
                        continue;
                    }
                }

                // 6) no había una persona en la entidad o no la encontramos en el array de personas en la compania 
                // regresamos la primera persona en el compañía; nota: aquí sabemos que la compañía tiene personas registradas 
                const p = compania.personas[0];
                p.nombreCompania = compania.nombre; 
                row.persona = p;

                finalRows.push(row);
                personasEncontradasNoEnEntidadDeOrigen++;
            }

            let message = `Ok, el proceso se ha ejecutado en forma satisfactoria. En total, <br /><br />
                             <b>${selectedRows.length}</b> cuotas han sido procesadas, pues fueron seleccionadas, de las cuales: <br />
                             <b>${personasNoEncontradas}:</b> no tienen una persona registrada en la entidad (riesgo, contrato, ...) ni en la compañía;  <br />
                             <b>${personasEncontradasNoEnEntidadDeOrigen}:</b> se encontró una persona en la compañía, más no en la entidad; <br />
                             <b>${personasEncontradasEnEnEntidadDeOrigen}:</b> se encontró una persona en la entidad y en la compañía. <br /><br />
                             Si las personas y sus direcciones de correo han sido encontradas para las cuotas, Ud. debe ahora seleccionar 
                             una plantilla (html) y hacer un click en el botón que permite construir y enviar los emails.
            `; 

            // si algunos rows quedaron sin email, aunque sí tengan una persona, no serán seleccionados en el grid en el client 
            // lo indicamos con una nota adicional al usuario
            if (finalRows.some(x => !(x.persona && x.persona.email))) { 
                message += `<br /><br />
                            <b>Nota importante:</b> solo se han seleccionado en la lista las cuotas para las cuales se ha encontrado una
                            dirección de correo.<br /><br />
                            Ud. puede hacer un click en <em>Generar Emails</em> para construir y enviar Emails a estas cuotas. 
                            `
            }

            return { 
                error: false, 
                message,
                finalRows
            }
        }
    })

const saveFileToDisk = async (finalPath, fileName, text) => { 

    // ----------------------------------------------------------------------------------------------------
    // ahora intentamos grabar el archivo leído desde DropBox a un archivo en el filesystem 
    const fullFileName = finalPath + "/" + fileName;

    const writeFileAsync = promisify(fs.writeFile);
    const encoding = 'utf8';

    // ahora escribimos el archivo al disco para pasarlo luego, en realidad el path, a xlsx-injector
    try {
        myMkdirSync(finalPath);        // para crear dirs y sub-dirs si no existen
        await writeFileAsync(fullFileName, text, encoding);
    } catch (err) {
        return {
            error: true,
            message: `<b>*)</b> Error al intentar grabar el archivo: ${fileName}, en la ubicación: ${finalPath}. <br />
                        El mensaje obtenido para el error es: ${err.message} 
                        `
        }
    }

    return {
        error: false,
        message: `Ok, el archivo ${fullFileName} ha sido grabado en forma exitosa al file system ... `
    }
}