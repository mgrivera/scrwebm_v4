
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 
import { check } from 'meteor/check';

import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';

import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

import { CollectionFS_templates } from '/server/imports/collectionFS/Files_CollectionFS_templates'; 
import { CollectionFS_tempFiles } from '/server/imports/collectionFS/Files_CollectionFS_tempFiles'; 

import { Consulta_MontosPendientesCobro_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesCobro_Vencimientos'; 

Meteor.methods(
{
    consultas_MontosPendientesCobro_GrabarTiposEmail: function (cuotas_tiposEmailAsignados) {

        check(cuotas_tiposEmailAsignados, [
            {
                cuotaID: String,
                tipoEmail: String
            }
        ]);

        // nos aseguramos que el tipoEmail este en nulls; este proceso puede ser ejecutado en forma sucesiva y
        // debe retener solo el último state
        Consulta_MontosPendientesCobro_Vencimientos.update(
            { user: this.userId, tipoEmail: { $ne: null }},
            { $unset: { tipoEmail: true }},
            { multi: true }
        );

        let cantidadCuotasActualizadas = 0;

        cuotas_tiposEmailAsignados.forEach((emailAsignado) => {

            Consulta_MontosPendientesCobro_Vencimientos.update(
                { _id: emailAsignado.cuotaID, user: this.userId },
                { $set: { tipoEmail: emailAsignado.tipoEmail }}
            );
            cantidadCuotasActualizadas++;
        });

        return { cantidadCuotasActualizadas: cantidadCuotasActualizadas };
    },

    consultas_MontosPendientesCobro_EnviarEmails: function (ciaSeleccionada) {
        // debugger;
        // este method lee las cuotas seleccionadas para la consulta 'montos pendientes de cobro' y selecciona,
        // en particular, las que tienen un e-mail asignado. Para éstas, hace básicamente dos cosas:
        // 1) genera el e-mail respectivo (usa la plantilla que corresponde al tipo de e-mail asignado)
        // 2) actualiza el array de e-mails enviados en la cuota

        const fs = Npm.require('fs');
        const path = Npm.require('path');
        const Future = Npm.require('fibers/future');

        // primero revisamos que existan, y estén correctamente registradas, las personas en las compañías
        const condicionesEmail =
        EmailsCobranzaCuotasPendientes.findOne({ cia: ciaSeleccionada });

        if (!condicionesEmail) {
            throw new Meteor.Error(`Error inesperado: no hemos podido leer el registro que contiene las
                                    condiciones de generación de e-mails, para la compañía seleccionada.
                                   `);
        };



        // ---------------------------------------------------------------------------------------------------
        // leemos las condiciones indicadas por el usuario; intentamos construir un e-mail para 'from' y
        // dos arrays de e-mails: uno para 'cc' y otro para 'bcc' (éstos dos arrays pueden estar vacíos) ...
        const fromUserID = lodash.find(condicionesEmail.usuarios, (x) => { return x.tipo == "From"; });
        const ccUsersID_array = lodash(condicionesEmail.usuarios).
                              filter((x) => { return x.tipo == "cc"; }).
                              map((x) => { return x.userID; }).
                              value();
        const bccUsersID_array = lodash(condicionesEmail.usuarios).
                               filter((x) => { return x.tipo == "bcc"; }).
                               map((x) => { return x.userID; }).
                               value();

        const fromUserEmail = Meteor.users.findOne(fromUserID.userID).emails[0].address;

        const ccUsersEmail_array = [];
        Meteor.users.find({ _id: { $in: ccUsersID_array }}).forEach((x) => {
            ccUsersEmail_array.push(x.emails[0].address);
        });

        const bccUsersEmail_array = [];
        Meteor.users.find({ _id: { $in: bccUsersID_array }}).forEach((x) => {
            bccUsersEmail_array.push(x.emails[0].address);
        });

        if (condicionesEmail.procesoPrueba_noEnviarEmailsACompanias && ccUsersEmail_array.length == 0) {
            throw new Meteor.Error(`Error: cuando se ejecuta el proceso en <em>modo de prueba</em>, para enviar
                                    e-mails a nosotros mismos, se debe indicar al menos un usuario como
                                    tipo 'cc', para que reciba los e-mails que este proceso envíe.
                                   `);
        }
        // ---------------------------------------------------------------------------------------------------






        if (!condicionesEmail.atencion) {
            throw new Meteor.Error(`Error: Ud. debe indicar, en el campo Atención, las personas
                                    que deben recibir el e-mail.
                                   `);
        }

        if (!condicionesEmail.atencion.nombre1 &&
            !condicionesEmail.atencion.nombre2 &&
            !condicionesEmail.atencion.nombre3 &&
            !condicionesEmail.atencion.nombre4 &&
            !condicionesEmail.atencion.nombre5) {
            throw new Meteor.Error(`Error: Ud. debe indicar, en el campo Atención, las personas
                                    que deben recibir el e-mail.
                                   `);
        }

        const atencion_personas_array = [];

        // pueden haber un max de 5 personas en el campo Atención ...
        if (condicionesEmail.atencion.nombre1) atencion_personas_array.push(1);
        if (condicionesEmail.atencion.nombre2) atencion_personas_array.push(2);
        if (condicionesEmail.atencion.nombre3) atencion_personas_array.push(3);
        if (condicionesEmail.atencion.nombre4) atencion_personas_array.push(4);
        if (condicionesEmail.atencion.nombre5) atencion_personas_array.push(5);


        // verificamos que las compañías seleccionadas tengan, todas, las personas que se indica
        // en el array 'Atención'; además, que sus datos (email, cargo, ...) estén completos
        const companias =
        Consulta_MontosPendientesCobro_Vencimientos.find(
            { user: this.userId, tipoEmail: { $ne: null } },
            { fields: { compania: 1 }}).
            fetch();

        // nótese que procesamos cada campañía una sola vez; pueden venir muchas cuotas para una misma compañía
        const companiasDiferentes = lodash.groupBy(companias, "compania");
        const companiasConErrores_array = [];

        // para registrar las personas en cada compañía y poder leerlas más adelante, cuando construyamos los e-mails
        const companias_nombresYCargos_array = [];

        for (const companiaID in companiasDiferentes) {

            const compania = Companias.findOne(companiaID);

            if (!compania) {
                throw new Meteor.Error(`Error inesperado: no hemos podido leer la compañía cuyo id es: ${companiaID}.`);
            }

            if (!compania.personas || !compania.personas.length) {
                companiasConErrores_array.push(compania.abreviatura);
            } else {
                // finalmente, buscamos las personas en la compañía que corresponden a los números indicados en el
                // campo 'atención' ...
                let error = false;
                atencion_personas_array.forEach((atencionNumero) => {
                    const persona = lodash.find(compania.personas, (x) => { return x.emailCobranzas == atencionNumero; });
                    if (!persona) {
                        if (!error) {
                            companiasConErrores_array.push(compania.abreviatura);
                            error = true;
                        }
                    } else if (!persona.titulo || !persona.nombre || !persona.cargo || !persona.email) {
                        if (!error) {
                            companiasConErrores_array.push(compania.abreviatura);
                            error = true;
                        }
                    } else {
                        // la persona existe; la grabamos para tenerla en un array al construir los e-mails
                        companias_nombresYCargos_array.push({
                            _id: new Mongo.ObjectID()._str,
                            companiaID: compania._id,
                            atencionNumero: persona.emailCobranzas,
                            titulo: persona.titulo,
                            nombre: persona.nombre,
                            email: persona.email,
                            cargo: persona.cargo,
                        })
                    }
                })
            }
        }

        if (companiasConErrores_array.length) {
            let mensajeError = `Error: Las siguientes compañías no contienen una persona que corresponda
                                a las indicadas en el campo 'Atención'. O las que existen está incompletas.
                                Por favor revise esta situación.<br />
                                `;

            companiasConErrores_array.forEach((c) => {
                mensajeError += c + " ";
            });

            throw new Meteor.Error(mensajeError);
        }
        // ---------------------------------------------------------------------------------------------

        // leemos y cargamos las cuentas bancarias en un array
        if (!condicionesEmail.cuentasBancarias || !lodash.isArray(condicionesEmail.cuentasBancarias)) {
            const mensajeError = `Error: aparentemente, no se han indicado las cuentas bancarias a ser usadas
                                en la construcción de los e-mails.
                                `;
            throw new Meteor.Error(mensajeError);
        }

        const cuentasBancarias_array = [];

        condicionesEmail.cuentasBancarias.forEach((c) => {
            const cuentaBancaria = CuentasBancarias.findOne(c.cuentaBancariaID);
            cuentasBancarias_array.push(cuentaBancaria);
        });

        const emailData = {
            // datos genéricos a todos los e-mails
            fecha: condicionesEmail.fecha,
        };

        // agregamos los firmantes a los datos del e-mail
        lodash(condicionesEmail.firmantes).sortBy(['numero'], ['asc']).forEach((x) => {

            const user = Meteor.users.findOne(x.userID);

            if (user) {
                switch (x.numero) {
                    case 1:
                        if (user.personales) {
                            emailData.representanteNosotros1 = user.personales.titulo + " " +
                                                                 user.personales.nombre;
                            emailData.representanteNosotros1_cargo  = user.personales.cargo;
                        }

                        break;
                    case 2:
                        if (user.personales) {
                            emailData.representanteNosotros2 = user.personales.titulo + " " +
                                                                 user.personales.nombre;
                            emailData.representanteNosotros2_cargo = user.personales.cargo;
                        }

                        break;
                    default:
                }
            }
        });


        // leemos las cuotas a las cuales se enviarán e-mails
        const cuotasSeleccionadas = Consulta_MontosPendientesCobro_Vencimientos.find(
                                    {
                                        user: this.userId,
                                        tipoEmail: { $ne: null },
                                        tipoEmial: { $ne: '' }
                                    }).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        const numberOfItems = cuotasSeleccionadas.length;
        const reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        const numberOfProcess = 1;
        const currentProcess = 1;

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        const eventName = "montosPendientesCobro_envioEmails_reportProgress";
        const eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'montosPendientesCobro_envioEmails' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `enviando los e-mails ... `
                        };

        // sync call
        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        const userEmail = Meteor.users.findOne(this.userId).emails[0].address;

        // para leer cada tipo de asiento una sola vez y agrupar todas las cuotas para cada tipo de e-mail
        const tiposEmail_array = lodash.groupBy(cuotasSeleccionadas, 'tipoEmail');

        // -------------------------------------------------------------------------------------
        // las plantillas están guardadas (por collectionFS) en este directorio
        const filesPath = Meteor.settings.public.collectionFS_path_templates;

        if (!filesPath) {
            const mensajeError = `Error: aparentemente, no existe, en el archivo de configuración (settings.json),
                                una entrada que indique el directorio en el cual se deben guardar las
                                plantillas (.html) que usa este proceso para generar los e-mails.<br />
                                Por favor revise esta situación.
                                `;

            throw new Meteor.Error(mensajeError);
        }

        // -------------------------------------------------------------------------------------
        // validamos que las plantillas necesarias exitan (collectionFS)
        for (const tipoEmail in tiposEmail_array) {

            let tipoPlantillaAsociada = null;

            switch (tipoEmail) {
                case "Email #1":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL1";
                    break;
                case "Email #2":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL2";
                    break;
                case "Email #3":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL3";
                    break;
                case "Email #4":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL4";
                    break;
                case "Email #5":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL5";
                    break;
                default: { const mensajeError = `Error: el tipo de email asociado a alguna de las cuota no es correcto.<br />
                                        Los tipos de e-mail asociados a las cuotas deben ser:
                                        'Email #1', 'Email #2', 'Email #3', ... <br />
                                        Por favor revise.
                                        `;

                            throw new Meteor.Error(mensajeError);
                }
            }

            const plantillaHTML = CollectionFS_templates.findOne({
                'metadata.tipo': tipoPlantillaAsociada,
                'metadata.cia': ciaSeleccionada
            });

            if (!plantillaHTML) {
                const mensajeError = `Error: no hemos podido leer la plantilla (arhivo.html) que corresponde
                                    al tipo de e-mail <em>${tipoPlantillaAsociada}</em>.<br />
                                    Las plantillas que usa este proceso para construir los e-mails, deben ser
                                    registradas al programa mediante la opción <em>Guardar archivos</em>, en el menú
                                    <em>Generales</em>.
                                    Por favor revise esta situación.<br />
                                    `;

                throw new Meteor.Error(mensajeError);
            }
        }

        // aqui vamos a ir agregando cada e-mail, para tenerlos todos al final en un solo texto.
        // la idea es grabar este archivo para que el usuario lo pueda revisar para saber como
        // serán los e-mails antes de enviarlos
        let mergedFiles = "";

        for (const tipoEmail in tiposEmail_array) {

            let tipoPlantillaAsociada = null;

            switch (tipoEmail) {
                case "Email #1":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL1";
                    break;
                case "Email #2":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL2";
                    break;
                case "Email #3":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL3";
                    break;
                case "Email #4":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL4";
                    break;
                case "Email #5":
                    tipoPlantillaAsociada = "TMP-CB-EMAIL5";
                    break;
            }

            // nótese que, más arriba, validamos que estos items existen (en collectionfs)
            const plantillaHTML = CollectionFS_templates.findOne({
                'metadata.tipo': tipoPlantillaAsociada,
                'metadata.cia': ciaSeleccionada
            });

            // nótese que el nombre 'real' que asigna collectionFS cuando el usuario hace el download del archivo,
            // lo encontramos en el item en collectionFS
            const fileNameWithPath = path.join(filesPath, plantillaHTML.copies.collectionFS_templates.key);

            // ----------------------------------------------------------------------------------------------------
            // ahora intentamos abrir el archivo con fs (node file system)
            // leemos el contenido del archivo (plantilla) en el server ...
            let fileContent = fs.readFileSync(fileNameWithPath);
            fileContent = fileContent.toString();

            // nótese como quitamos un posible Doctype, pues blaze no lo acepta; supusimos que esta es
            // una forma simple de resolver este problema, mientras permitirmos que venga este doctype
            fileContent = fileContent.replace("<!DOCTYPE html>", "");

            // meteorhacks:ssr - compilamos la plntilla (html file) para usarla para combinar
            try {
                SSR.compileTemplate('htmlEmail', fileContent);
            } catch (e) {
                const mensajeError = `Error: hemos obtenido un error al intentar compilar la plantilla (html).<br />
                                    Probablemente, la plantilla no está bien formada. <br />
                                    Por favor revise la
                                    plantilla; corrija cualquier error que pueda encontrar y regístrela nuevamente.<br />
                                    El mensaje específico del error es: ${e.toString()}
                                    `;

                throw new Meteor.Error(mensajeError);
            }


            // tratamos, separadamente, cada cuota asociada a este tipo de e-mail
            tiposEmail_array[tipoEmail].forEach((cuota) => {

                // leemos el contrato (agregar posibilidad de riesgos, siniestros, etc.)
                // antes leemos la cuota
                const datosCuota = Cuotas.findOne(cuota.cuotaID);

                let origen = null;
                let tipoContrato = null;

                switch (datosCuota.source.origen) {
                    case 'cuenta':
                    case 'capa':
                        origen = Contratos.findOne(datosCuota.source.entityID);
                        tipoContrato = TiposContrato.findOne(origen.tipo);
                        break;
                    case 'fac':
                        origen = Riesgos.findOne(datosCuota.source.entityID);
                        break;
                    default:
                }

                if (!origen) {
                    const mensajeError = `Error: aparentemente, existe una cuota que no pertenece a un
                                        origen (o entidad) determinado.<br />
                                        Por ejemplo, una cuota de un riesgo que se ha eliminado.<br />
                                        El origen indicado en la cuota es:
                                        ${datosCuota.source.origen}-${datosCuota.source.numero.toString()}<br />.
                                        Por favor revise.
                                        `;
                    throw new Meteor.Error(mensajeError);
                }

                const ramo = origen.ramo ? Ramos.findOne(origen.ramo) : null;
                const suscriptor = Suscriptores.findOne(origen.suscriptor);
                const compania = Companias.findOne(cuota.compania);
                const moneda = Monedas.findOne(cuota.moneda);

                const cuentaBancaria = lodash.find(cuentasBancarias_array, (x) => { return x.moneda === cuota.moneda; });

                if (!cuentaBancaria) {
                    const mensajeError = `Error: entre las cuentas bancarias indicadas, no hemos encontrado una
                                        para la moneda ${moneda.descripcion}.<br />
                                        Ud. debe seleccionar una cuenta bancaria para cada una de las monedas
                                        usadas en los montos de las cuotas pendientes.
                                        `;

                    throw new Meteor.Error(mensajeError);
                }

                emailData.datosCuentaBancaria = cuentaBancaria.descripcionPlantillas;

                emailData.nombreCompania = compania.nombre;
                emailData.origen_codigo = origen.codigo;
                emailData.origen_numero = origen.numero;

                // solo para contratos ...
                if (tipoContrato)
                    emailData.origen_tipo = tipoContrato.descripcion;

                emailData.suscriptor = suscriptor.nombre;
                emailData.ramo = ramo && ramo.descripcion ? ramo.descripcion : "<Indefinido>";

                emailData.cuota = `${cuota.numero.toString()} (de ${cuota.cantidad.toString()})`;
                emailData.fechaCuota = moment(cuota.fecha).format("DD-MM-YYYY");
                emailData.fechaVencimiento = moment(cuota.fechaVencimiento).format("DD-MM-YYYY");
                emailData.simboloMoneda = cuota.monedaSimbolo;
                emailData.descripcionMoneda = moneda.descripcion;
                emailData.cantDiasGarantia = moment(cuota.fechaVencimiento).diff(cuota.fecha, 'days');
                emailData.montoCuota = numeral(cuota.montoCuota).format('0,0.00');

                // -------------------------------------------------------------------------------------
                // personas (1 y 2) en la compañía de la cuota
                // debugger;

                const toUsersEmail_array = [];    // direcciones de correo en el cliente ...

                for (let i = 1; i <= 2; i++) {
                    const persona = lodash.find(companias_nombresYCargos_array,
                        (x) => { return x.atencionNumero === i && x.companiaID === cuota.compania; });

                    if (persona) {
                        emailData[`atencion_${i.toString()}_nombre`] = persona.titulo && persona.nombre ? `${persona.titulo} ${persona.nombre}` : "";
                        emailData[`atencion_${i.toString()}_cargo`] = persona.cargo ? persona.cargo : "";
                        emailData[`atencion_${i.toString()}_email`] = persona.email ? persona.email : "";

                        if (persona.email) {
                            toUsersEmail_array.push(persona.email);
                        }
                    }
                }
                // -------------------------------------------------------------------------------------
                // 'combinamos' el template, que ya está compilado, con los datos de la cuota
                const emailHtmlContent = SSR.render('htmlEmail', emailData);
                // ----------------------------------------------------------------------------------------
                // finalmente, enviamos el e-mail
                // ----------------------------------------------------------------------------------------
                // debugger;
                if (condicionesEmail.procesoPrueba_noEnviarEmailsACompanias) {
                    // prueba: siempre enviamos los e-mails a nosotros mismos; nótese como usamos el array de
                    // ccs como array de tos ...
                    try {
                        Email.send({
                                      to: ccUsersEmail_array,
                                      from: fromUserEmail,
                                      bcc: bccUsersEmail_array,
                                      subject: condicionesEmail.emailSubject,
                                      html: emailHtmlContent,
                                    });
                    } catch (e) {
                        const mensajeError = `Error: hemos obtenido un error al intentar enviar un e-mail.<br />
                                            El mensaje específico del error es: ${e.toString()}
                                            `;
                        throw new Meteor.Error(mensajeError);
                    };

                } else {
                    try {
                        Email.send({
                                      to: toUsersEmail_array,
                                      from: fromUserEmail,
                                      cc: ccUsersEmail_array,
                                      bcc: bccUsersEmail_array,
                                      subject: condicionesEmail.emailSubject,
                                      html: emailHtmlContent,
                                    });
                    } catch (e) {
                        const mensajeError = `Error: hemos obtenido un error al intentar enviar un e-mail.<br />
                                            El mensaje específico del error es: ${e.toString()}
                                            `;
                        throw new Meteor.Error(mensajeError);
                    }
                }

                // luego de enviar el e-mail, lo registramos en el array de emails enviados en la cuota
                const emailEnviado = {
                    _id: new Mongo.ObjectID()._str,
                    tipoEmail: cuota.tipoEmail,
                    fecha: new Date(),
                    user: userEmail
                };

                // el usuario puede indicar que quiere solo e-mails internos (a él mismo); solo para probar ...
                if (!condicionesEmail.noRegistrarEnvioEnCuotas) {
                    Cuotas.update(cuota.cuotaID, { $push: { emailsEnviados: emailEnviado }});

                    // también actualizamos el registro de la consulta, por si acaso el usuario ejecuta el
                    // proceso, nuevamente, de inmediato; nótese que cada cuota se actualiza en el client por
                    // reactivity  ...
                    Consulta_MontosPendientesCobro_Vencimientos.update(cuota._id, { $inc: { cantEmailsEnviadosAntes: 1 }});
                }

                // vamos acumulando el contenido de cada email, en un string que será luego guardado a disk como un
                // archivo, para que el usuario pueda hacer un download de este string
                mergedFiles += emailHtmlContent + "<hr>";

                // -------------------------------------------------------------------------------------------------------
                // vamos a reportar progreso al cliente; solo 20 veces ...
                cantidadRecs++;
                if (numberOfItems <= 25) {
                    // hay menos de 20 registros; reportamos siempre ...
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `enviando los e-mails ... `
                                };
                    Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                }
                else {
                    reportar++;
                    if (reportar === reportarCada) {
                        eventData = {
                                      current: currentProcess, max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                      message: `enviando los e-mails ... `
                                    };
                        Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                        reportar = 0;
                    }
                }
                // -----------------------------------------------------------------------------------------------
            });
        }

        // guardamos el contenido de todos los e-mails a un archivo en el disco duro ...
        // debugger;
        let fileName = `emailCobranzas_${userEmail}`;
        fileName = fileName.replace(/@/g, '_');
        fileName = fileName.replace(/\./g, '_');
        fileName += ".html";
        // filesPath = path.join(Meteor.absolutePath, "public", "temp", "emailCobranzas", fileName);
        //
        // fs.writeFileSync(filesPath, mergedFiles);

        // intentamos eliminar algún archivo del mismo nombre registrado antes
        CollectionFS_tempFiles.remove({ 'metadata.nombreArchivo': fileName });

        // el método regresa *antes* que la ejecución de este código que es asyncrono. Usamos Future para
        // que el método espere a que todo termine para regresar ...

        const future = new Future();

        var newFile = new FS.File();

        // nótese como convertimos el string a un buffer, pues collectionfs no acepta un string como
        // contenido del file que se intenta guardar
        // mergedFiles = new Buffer(mergedFiles);           // deprecated 
        mergedFiles = Buffer.from(mergedFiles); 

        newFile.attachData( mergedFiles, {type: 'html'}, function( err )
        {
            if(err)
                throw new Meteor.Error('error-grabar-archivo-collectionFS',
                    `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                     El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                     El mensaje de error recibido es: ${err.toString()}.
                    `);

            newFile.name(fileName);
            // Collections.Builds.insert( file );

            // agregamos algunos valores al file que vamos a registrar con collectionFS
            newFile.metadata = {
                user: Meteor.user().emails[0].address,
                fecha: new Date(),
                // tipo: tipoArchivo,
                nombreArchivo: fileName,
                aplicacion: 'emailsCobranza',
                cia: ciaSeleccionada,
            };

            CollectionFS_tempFiles.insert(newFile, function (err, fileObj) {
                // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP

                if (err) {
                    throw new Meteor.Error('error-grabar-archivo-collectionFS',
                        `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                         El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                         El mensaje de error recibido es: ${err.toString()}.
                        `);
                }

                // tenemos que esperar que el file efectivamente se guarde, para poder acceder su url ...
                // nótese como Meteor indica que debemos agregar un 'fiber' para correr el callback, pues
                // su naturaleza es asynchrona ...
                CollectionFS_tempFiles.on("stored", Meteor.bindEnvironment(function (fileObj, storeName) {
                    const url = fileObj.url({store: storeName});
                    future['return'](
                        {
                            cantidadCuotasLeidas: cantidadRecs,
                            procesoPrueba_noEnviarEmailsACompanias: condicionesEmail.procesoPrueba_noEnviarEmailsACompanias,
                            noRegistrarEnvioEnCuotas: condicionesEmail.noRegistrarEnvioEnCuotas,
                            url: url
                        }
                    );
                }));
            });
        });

        // Wait for async to finish before returning the result
        return future.wait();
    }
})