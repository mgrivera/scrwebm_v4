
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import moment from 'moment';

import { check } from 'meteor/check';
import { Match } from 'meteor/check'

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { Contratos } from '/imports/collections/principales/contratos'; 

import { ContratosProp_cuentas_resumen } from '/imports/collections/principales/contratos';
import { ContratosProp_comAdic_resumen } from '/imports/collections/principales/contratos';
import { ContratosProp_partBeneficios_resumen } from '/imports/collections/principales/contratos';
import { ContratosProp_entCartPr_resumen } from '/imports/collections/principales/contratos';
import { ContratosProp_entCartSn_resumen } from '/imports/collections/principales/contratos';
import { ContratosProp_retCartPr_resumen } from '/imports/collections/principales/contratos';
import { ContratosProp_retCartSn_resumen } from '/imports/collections/principales/contratos'; 

import { calcularNumeroReferencia } from '/server/imports/general/calcularNumeroReferencia'; 
import { validarItemContraSchema } from '/imports/generales/validarArrayContraSchema'; 

Meteor.methods(
    {
        'contratos.importFromTextFile': function (contratoString, companiaSeleccionada) {

            check(contratoString, String);
            check(companiaSeleccionada, Match.ObjectIncluding({ _id: String, nombre: String }));

            let contrato = "";
            try {
                contrato = JSON.parse(contratoString);
            } catch(error) { 
                const message = `Ha ocurrido un error al intentar convertir el contenido del archivo seleccionado en un objeto Json. <br />
                              El error obtenido es: ${error.message ? error.message : JSON.stringify(error, null, '\t')}
                             `; 
                return { 
                    error: true, 
                    message
                }
            }

            // ----------------------------------------------------------------------------------------------------------------
            // leemos la compañía usuaria original del contrato pues puede cambiar y queremos mencionar esto en el mensaje 
            const companiaContratoOriginal = EmpresasUsuarias.findOne(contrato.cia, { fields: { nombre: 1 } });

            let empresaUsuariaDiferente = false; 

            // determinamos si el contrato que estamos importando se registró bajo una empresa usuaria diferente 
            if (contrato.cia != companiaSeleccionada._id) {
                empresaUsuariaDiferente = true;
            }

            const contratoOriginal_id = contrato._id; 
            const contratoOriginal_numero = contrato.numero; 

            // usamos un nuevo _id; además, ponemos el numero en cero 
            contrato._id = new Mongo.ObjectID()._str;
            contrato.numero = 0;
            contrato.fechaEmision = new Date();
            contrato.ingreso = new Date();
            contrato.usuario = Meteor.user().username ? Meteor.user().username : Meteor.user().emails[0].address;
            contrato.cia = companiaSeleccionada._id;

            contrato.ultAct = null;
            contrato.ultUsuario = null;

            // nótese como las fechas vienen como strings (pues hicimos un json.parse del objecto original)
            contrato.desde = new Date(contrato.desde);
            contrato.hasta = new Date(contrato.hasta);

            if (contrato.documentos) {
                // cambiamos el id para cada documento en el array 
                contrato.documentos.forEach((x) => x._id = new Mongo.ObjectID()._str);
            }

            if (contrato.cuentasTecnicas_definicion && Array.isArray(contrato.cuentasTecnicas_definicion)) {
                // cambiamos el id para cada período en el array 
                contrato.cuentasTecnicas_definicion.forEach((x) => x._id = new Mongo.ObjectID()._str);
            }

            // siempre eliminamos alguna información de renovación que pueda existir en el contrato de origen 
            contrato.renovacion = {};

            // ----------------------------------------------------------------------------------------------------------------
            // validamos el contrato que hemos contruido contra su schema 
            // validamos el contenido del item contra el simple-schema que se ha asociado al mongo collection 
            const errores = []; 
            validarItemContraSchema(contrato, Contratos, errores);

            if (errores && errores.length) {
                const message = "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                        errores.reduce((previous, current) => {
                            if (previous == "")
                                // first value
                                return current;
                            else
                                return previous + "<br />" + current;
                        }, "")

                return {
                    error: true,
                    message
                }
            }

            // ----------------------------------------------------------------------------------------------------------------
            // finalmente, intentamos grabar el contrato 

            // si el número viene en '0', asignamos un número consecutivo al contrato
            const numeroAnterior = Contratos.findOne({ cia: contrato.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
            if (!numeroAnterior || !numeroAnterior.numero) {
                contrato.numero = 1;
            }
            else {
                contrato.numero = numeroAnterior.numero + 1;
            }

            // si la referencia viene en '0', asignamos una ...
            if (!contrato.referencia || contrato.referencia === '0') {
                const ano = parseInt(moment(contrato.desde).format('YYYY'));
                const result = calcularNumeroReferencia('contr', contrato.tipo, ano, contrato.cia);

                if (result.error) {
                    throw new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                }

                contrato.referencia = result.referencia;
            }

            // si el usuario editó el array de personas, pueden venir con docState ... 
            if (contrato.personas && Array.isArray(contrato.personas)) {
                contrato.personas.forEach(x => delete x.docState);
            }

            Contratos.insert(contrato);

            // =============================================================================================================== 
            // ahora debemos grabar el contenido que para el contrato pueda existir en las tablas de: cuentas, com adic, 
            // ret cart, ent cart, etc. 
            const contratoOriginal = Contratos.findOne({ _id: contratoOriginal_id }, { cuentasTecnicas_definicion: 1 }); 
             
            if (contratoOriginal && Array.isArray(contratoOriginal.cuentasTecnicas_definicion)) { 
                for (const periodoOriginal of contratoOriginal.cuentasTecnicas_definicion) { 
                    // obtenemos el período del nuevo contrato 
                    const periodoCopia = contrato.cuentasTecnicas_definicion.find(x => x.numero === periodoOriginal.numero); 

                    if (periodoCopia) { 
                        // grabamos las cuentas técnicas para el nuevo contrato (nota: para cada período) 
                        grabar_cuentaTecnica_paraUnPeriodo(contratoOriginal_id, periodoOriginal._id, contrato._id, periodoCopia._id); 

                        // grabamos también a las otras tablas 
                        grabar_comAdic_paraUnPeriodo(contratoOriginal_id, periodoOriginal._id, contrato._id, periodoCopia._id); 
                        grabar_partBeneficios_paraUnPeriodo(contratoOriginal_id, periodoOriginal._id, contrato._id, periodoCopia._id); 
                        grabar_entCartPr_paraUnPeriodo(contratoOriginal_id, periodoOriginal._id, contrato._id, periodoCopia._id); 
                        grabar_entCartSn_paraUnPeriodo(contratoOriginal_id, periodoOriginal._id, contrato._id, periodoCopia._id); 
                        grabar_retCartPr_paraUnPeriodo(contratoOriginal_id, periodoOriginal._id, contrato._id, periodoCopia._id); 
                        grabar_retCartSn_paraUnPeriodo(contratoOriginal_id, periodoOriginal._id, contrato._id, periodoCopia._id); 
                    }
                }
            }

            let message = `Ok, el contrato ha sido copiado en uno nuevo. <br />
                           El número asignado al nuevo contrato es: <b>${contrato.numero}</b>. <br />
                           El número del contrato original es: <b>${contratoOriginal_numero}</b>. <br />
                           La compañía usuaria del contrato original es: <b>${companiaContratoOriginal.nombre}</b>. <br />
                           La compañía usuaria del nuevo contrato es: <b>${companiaSeleccionada.nombre}</b> <br /> 
                          `;

            !empresaUsuariaDiferente ? message += `El contrato ha sido copiado a uno en <em>la misma</em> compañía. `  
                                     : message += `El contrato ha sido copiado a uno en una compañía <em>diferente</em>.`
            return {
                error: false,
                message
            }
        }
    })

// ===================================================================================================
// para grabar el resumen de cuentas técnicas de un período 
const grabar_cuentaTecnica_paraUnPeriodo = (contratoOriginal_id, periodoOriginal_id, contratoNuevo_id, periodoNuevo_id) => {

    // primero leemos las cuentas (resumen) para el período del contrato original 
    const cuentas = ContratosProp_cuentas_resumen.find({ contratoID: contratoOriginal_id, definicionID: periodoOriginal_id }).fetch();

    cuentas.forEach(x => {
        // para cada cuenta que leemos, cambiamos el id para el contrato y período 
        x._id = new Mongo.ObjectID()._str
        x.contratoID = contratoNuevo_id;
        x.definicionID = periodoNuevo_id;
        delete x.docState;

        // finalmente grabamos la cuenta, pero para el mismo período 
        ContratosProp_cuentas_resumen.insert(x);
    })
}

// ===================================================================================================
// para grabar el resumen de cuentas técnicas de un período (ContratosProp_comAdic_resumen)
const grabar_comAdic_paraUnPeriodo = (contratoOriginal_id, periodoOriginal_id, contratoNuevo_id, periodoNuevo_id) => {

    // primero leemos las cuentas (resumen) para el período del contrato original 
    const cuentas = ContratosProp_comAdic_resumen.find({ contratoID: contratoOriginal_id, definicionID: periodoOriginal_id }).fetch();

    cuentas.forEach(x => {
        // para cada cuenta que leemos, cambiamos el id para el contrato y período 
        x._id = new Mongo.ObjectID()._str
        x.contratoID = contratoNuevo_id;
        x.definicionID = periodoNuevo_id;
        delete x.docState;

        // finalmente grabamos la cuenta, pero para el mismo período 
        ContratosProp_comAdic_resumen.insert(x);
    })
}

// ===================================================================================================
// para grabar el resumen de cuentas técnicas de un período (ContratosProp_partBeneficios_resumen)
const grabar_partBeneficios_paraUnPeriodo = (contratoOriginal_id, periodoOriginal_id, contratoNuevo_id, periodoNuevo_id) => {

    // primero leemos las cuentas (resumen) para el período del contrato original 
    const cuentas = ContratosProp_partBeneficios_resumen.find({ contratoID: contratoOriginal_id, definicionID: periodoOriginal_id }).fetch();

    cuentas.forEach(x => {
        // para cada cuenta que leemos, cambiamos el id para el contrato y período 
        x._id = new Mongo.ObjectID()._str
        x.contratoID = contratoNuevo_id;
        x.definicionID = periodoNuevo_id;
        delete x.docState;

        // finalmente grabamos la cuenta, pero para el mismo período 
        ContratosProp_partBeneficios_resumen.insert(x);
    })
}

// ===================================================================================================
// para grabar el resumen de cuentas técnicas de un período (ContratosProp_entCartPr_resumen)
const grabar_entCartPr_paraUnPeriodo = (contratoOriginal_id, periodoOriginal_id, contratoNuevo_id, periodoNuevo_id) => {

    // primero leemos las cuentas (resumen) para el período del contrato original 
    const cuentas = ContratosProp_entCartPr_resumen.find({ contratoID: contratoOriginal_id, definicionID: periodoOriginal_id }).fetch();

    cuentas.forEach(x => {
        // para cada cuenta que leemos, cambiamos el id para el contrato y período 
        x._id = new Mongo.ObjectID()._str
        x.contratoID = contratoNuevo_id;
        x.definicionID = periodoNuevo_id;
        delete x.docState;

        // finalmente grabamos la cuenta, pero para el mismo período 
        ContratosProp_entCartPr_resumen.insert(x);
    })
}

// ===================================================================================================
// para grabar el resumen de cuentas técnicas de un período (ContratosProp_entCartSn_resumen)
const grabar_entCartSn_paraUnPeriodo = (contratoOriginal_id, periodoOriginal_id, contratoNuevo_id, periodoNuevo_id) => {

    // primero leemos las cuentas (resumen) para el período del contrato original 
    const cuentas = ContratosProp_entCartSn_resumen.find({ contratoID: contratoOriginal_id, definicionID: periodoOriginal_id }).fetch();

    cuentas.forEach(x => {
        // para cada cuenta que leemos, cambiamos el id para el contrato y período 
        x._id = new Mongo.ObjectID()._str
        x.contratoID = contratoNuevo_id;
        x.definicionID = periodoNuevo_id;
        delete x.docState;

        // finalmente grabamos la cuenta, pero para el mismo período 
        ContratosProp_entCartSn_resumen.insert(x);
    })
}

// ===================================================================================================
// para grabar el resumen de cuentas técnicas de un período (ContratosProp_retCartPr_resumen)
const grabar_retCartPr_paraUnPeriodo = (contratoOriginal_id, periodoOriginal_id, contratoNuevo_id, periodoNuevo_id) => {

    // primero leemos las cuentas (resumen) para el período del contrato original 
    const cuentas = ContratosProp_retCartPr_resumen.find({ contratoID: contratoOriginal_id, definicionID: periodoOriginal_id }).fetch();

    cuentas.forEach(x => {
        // para cada cuenta que leemos, cambiamos el id para el contrato y período 
        x._id = new Mongo.ObjectID()._str
        x.contratoID = contratoNuevo_id;
        x.definicionID = periodoNuevo_id;
        delete x.docState;

        // finalmente grabamos la cuenta, pero para el mismo período 
        ContratosProp_retCartPr_resumen.insert(x);
    })
}

// ===================================================================================================
// para grabar el resumen de cuentas técnicas de un período (ContratosProp_retCartSn_resumen)
const grabar_retCartSn_paraUnPeriodo = (contratoOriginal_id, periodoOriginal_id, contratoNuevo_id, periodoNuevo_id) => {

    // primero leemos las cuentas (resumen) para el período del contrato original 
    const cuentas = ContratosProp_retCartSn_resumen.find({ contratoID: contratoOriginal_id, definicionID: periodoOriginal_id }).fetch();

    cuentas.forEach(x => {
        // para cada cuenta que leemos, cambiamos el id para el contrato y período 
        x._id = new Mongo.ObjectID()._str
        x.contratoID = contratoNuevo_id;
        x.definicionID = periodoNuevo_id;
        delete x.docState;

        // finalmente grabamos la cuenta, pero para el mismo período 
        ContratosProp_retCartSn_resumen.insert(x);
    })
}