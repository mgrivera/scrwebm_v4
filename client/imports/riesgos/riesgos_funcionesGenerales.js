
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 
import lodash from 'lodash'; 

export const copiarRiesgoEnUnoNuevo = function (riesgoACopiar) {

    const nuevoRiesgo = lodash.cloneDeep(riesgoACopiar);
    const numeroRiesgoAnterior = riesgoACopiar.numero;

    nuevoRiesgo._id =  new Mongo.ObjectID()._str;
    nuevoRiesgo.numero = 0;
    nuevoRiesgo.referencia = null; 
    nuevoRiesgo.comentarios = nuevoRiesgo.comentarios ?
        "(*** Copia del riesgo: " + numeroRiesgoAnterior.toString() + " ***)   " + nuevoRiesgo.comentarios :
        "(*** Copia del riesgo: " + numeroRiesgoAnterior.toString() + " ***)";
    nuevoRiesgo.renovacion = {};
    nuevoRiesgo.ingreso = new Date();
    nuevoRiesgo.usuario = Meteor.userId();
    nuevoRiesgo.ultAct = null;
    nuevoRiesgo.ultUsuario = null;
    nuevoRiesgo.docState = 1;

    // nótese como reasignamos valores para campos _id, para que sean diferentes ...
    if (nuevoRiesgo.documentos) {
        nuevoRiesgo.documentos.forEach(function (x) { x._id = new Mongo.ObjectID()._str; });
    }

    if (nuevoRiesgo.movimientos) {
        nuevoRiesgo.movimientos.forEach(function (movimiento) {
            movimiento._id = new Mongo.ObjectID()._str;

            if (movimiento.companias && movimiento.companias.length) {
                movimiento.companias.forEach(function (x) {
                    x._id = new Mongo.ObjectID()._str;
                })
            }

            if (movimiento.coberturas && movimiento.coberturas.length) {
                movimiento.coberturas.forEach(function (x) {
                    x._id = new Mongo.ObjectID()._str;
                })
            }

            if (movimiento.coberturasCompanias && movimiento.coberturasCompanias.length) {
                movimiento.coberturasCompanias.forEach(function (x) {
                    x._id = new Mongo.ObjectID()._str;
                })
            }

            if (movimiento.primas && movimiento.primas.length) {
                movimiento.primas.forEach(function (x) {
                    x._id = new Mongo.ObjectID()._str;
                })
            }

            if (movimiento.productores && movimiento.productores.length) {
                movimiento.productores.forEach(function (x) {
                    x._id = new Mongo.ObjectID()._str;
                })
            }

            if (movimiento.documentos && movimiento.documentos.length) { 
                movimiento.documentos.forEach((x) => { 
                    x._id = new Mongo.ObjectID()._str; 
                })
            }
        })
    }

    const message = `Ok, el riesgo <b>${numeroRiesgoAnterior.toString()}</b> ha sido copiado en un riesgo nuevo.<br />
                    Ahora Ud. puede revisarlo y editarlo según sea conveniente. Luego, haga un <em>click</em> en <em>Grabar</em>
                    para grabar el nuevo riesgo a la base de datos.<br /><br />
                    Las cuotas del riesgo original, por supuesto, no han sido copiadas. Ud. debe completar el registro del nuevo riesgo y 
                    generar sus propias cuotas.<br /><br />
                    Note que el nuevo riesgo <b>no tiene</b> un número ni una referencia asignados. Los tendrá cuando Ud. haga las modificaciones
                    que le parezca adecuadas y haga un <em>click</em> en <em>Grabar</em>.
                    `

    return { 
        nuevoRiesgo: nuevoRiesgo, 
        error: false, 
        message: message, 
    }
}