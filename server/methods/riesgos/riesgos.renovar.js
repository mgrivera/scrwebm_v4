
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 

import SimpleSchema from 'simpl-schema';
import moment from 'moment'; 
import { Riesgos } from '/imports/collections/principales/riesgos';  

import { calcularNumeroReferencia } from '/server/imports/general/calcularNumeroReferencia'; 

Meteor.methods({
    'riesgos.renovar': function (riesgoOriginal, parametros) {

        // agregamos este método para contar la cantidad de registros que contiene un collection;
        // Nota Importante: no usamos 'tmeasday:publish-counts' pues indica en su documentación que
        // puede ser muy ineficiente si el dataset contiene muchos registros; además, este package
        // es reactive, lo cual agregar un cierto costo a su ejecución ...

        // nota: solo a veces usamos filtro ... 

        const parametrosSchema = new SimpleSchema({ 
            desde: { type: Date, optional: false, }, 
            hasta: { type: Date, optional: false, }, 
        })

        new SimpleSchema({
            riesgoOriginal: { type: Object, blackbox: true, }, 
            parametros: { type: parametrosSchema, optional: false, }
            }).validate({ riesgoOriginal, parametros });


        const riesgoNuevo = { 
            _id: new Mongo.ObjectID()._str,
            numero: 0,
            codigo: riesgoOriginal.codigo,
            tipo: riesgoOriginal.tipo,
            suscriptor : riesgoOriginal.suscriptor,
            estado : "RE",
            renovacion: { renuevaAl: riesgoOriginal.numero }, 
            desde : parametros.desde,
            hasta : parametros.hasta,
            moneda : riesgoOriginal.moneda,
            indole : riesgoOriginal.indole,
            compania : riesgoOriginal.compania,
            ramo : riesgoOriginal.ramo,
            asegurado : riesgoOriginal.asegurado,
            corredor: riesgoOriginal.corredor ? riesgoOriginal.corredor : null, 
            objetoAsegurado : {
                descripcion : riesgoOriginal.objetoAsegurado && riesgoOriginal.objetoAsegurado.descripcion ? riesgoOriginal.objetoAsegurado.descripcion : null,
                ubicacion : riesgoOriginal.objetoAsegurado && riesgoOriginal.objetoAsegurado.ubicacion ? riesgoOriginal.objetoAsegurado.ubicacion : null,
            },
            comentarios: riesgoOriginal.comentarios, 
            movimientos: [],
            documentos: [], 
            personas: [], 
            referencia : "0",
            ingreso: new Date(),
            usuario: this.userId,
            cia: riesgoOriginal.cia,
        }

        // agregamos el array de documentos 
        if (riesgoOriginal.documentos && riesgoOriginal.documentos.length) { 
            riesgoOriginal.documentos.forEach((x) => { 
                x._id = new Mongo.ObjectID()._str;          // asignamos un nuevo id al item
                riesgoNuevo.documentos.push(x); 
            })
        }

        // agregamos el array de personas 
        if (riesgoOriginal.personas && riesgoOriginal.personas.length) { 
            riesgoOriginal.personas.forEach((x) => { 
                // los items en el array de personas no tienen un _id; creo que ésto se nos pasó en su momento (????)
                riesgoNuevo.personas.push(x); 
            })
        }

        // determinamos un nuevo número para el riesgo 
        const numeroAnterior = Riesgos.findOne({ cia: riesgoNuevo.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
        if (!numeroAnterior || !numeroAnterior.numero) { 
            riesgoNuevo.numero = 1;
        } 
        else { 
            riesgoNuevo.numero = numeroAnterior.numero + 1;
        }

        // determinamos una referencia para el riesgo 
        const ano = parseInt(moment(riesgoNuevo.desde).format('YYYY'));
        const result = calcularNumeroReferencia('fac', riesgoNuevo.tipo, ano, riesgoNuevo.cia);

        if (result.error) {
            throw new Meteor.Error("error-asignar-referencia",
                `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
        }
        riesgoNuevo.referencia = result.referencia;

        // leemos, y agregamos al nuevo riesgo, el último movimiento del riesgo original 
        if (riesgoOriginal.movimientos && riesgoOriginal.movimientos.length) { 
            riesgoNuevo.movimientos.push(riesgoOriginal.movimientos[riesgoOriginal.movimientos.length - 1]); 

            // asignamos la nueva vigencia y determinamos la cantidad de días y el factor prorrata
            const movimiento = riesgoNuevo.movimientos[0]; 

            movimiento._id = new Mongo.ObjectID()._str; 
            movimiento.numero = 1; 
            movimiento.fechaEmision = new Date(); 
            movimiento.desde = parametros.desde; 
            movimiento.hasta = parametros.hasta; 
            movimiento.tipo = "OR"; 
            movimiento.factorProrrata = 1; 

            movimiento.cantidadDias = moment(movimiento.hasta).diff(moment(movimiento.desde), 'days');
            movimiento.factorProrrata = movimiento.cantidadDias / 365;

            // asignamos ids diferentes a los elementos de los diferentes arrays ... 
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
        }
            

        Riesgos.insert(riesgoNuevo); 

        const nuevoRiesgo = Riesgos.findOne(riesgoNuevo._id, { fields: { numero: true, }}); 

        if (!nuevoRiesgo || !nuevoRiesgo.numero) { 
            return { 
                error: true, 
                message: `Error: hemos obtenido un error al intentar grabar el nuevo riesgo a la base de datos. <br /> 
                          La renovación del riesgo original no ha sido exitosa; por favor revise. 
                        `
            }
        }
        
        // ahora actualizamos el riesgo original, para poner su valor renovadoPor y su nuevo tipo
        Riesgos.update({ _id: riesgoOriginal._id }, { $set: { 
            estado: "RV", 
            renovacion: { renovadoPor: nuevoRiesgo.numero }, 
            ultAct: new Date(),
            ultUsuario: this.userId,
        }})

        return { 
            error: false, 
            message: `Ok, el riesgo original ha sido renovado.<br /><br />
                    Ahora, Ud. debe acceder el riesgo recién agregado y modificarlo, según sea conveniente. <br />
                    El número asignado al nuevo riesgo es: <b>${nuevoRiesgo.numero.toString()}</b>. 
                    Note que el estado de este riesgo, original, ha cambiado a <em>Renovado</em>. 
                    `
        }
    }
})