
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { RegistrosManuales } from '/imports/collections/principales/registrosManuales'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Catalogos_deletedItems } from '/imports/collections/general/catalogos_deletedItems'; 

Meteor.methods(
    {
        // ==============================================================================================
        // insert 
        // ==============================================================================================
        'registrosManuales.save.insert': async function (item) {

            let result = {}; 
            
            await insertItem(item)
                .then((_id) => { 
                    // Ok, el item fue agregado en forma exitosa; lo leemos para regresarlo tal como fue agregado 
                    const item = RegistrosManuales.findOne(_id);

                    if (!item) {
                        const message = `<b>Error inesperado:</b> no hemos podido leer el registro en el db justo luego que ha sido grabado (???!!!). 
                                        `
                        result = {
                            error: true,
                            message
                        }
                    } else {
                        const message = `Ok, el registro ha sido grabado al db en forma exitosa. 
                                        `
                        result = {
                            error: false,
                            message,
                            item
                        }
                    }
                })
                .catch((error) => {
                    result = {
                        error: true, 
                        message: error.message
                    }
                })

            return result; 
        },

        // ==============================================================================================
        // update 
        // ==============================================================================================
        'registrosManuales.save.update': function (item, cuotas) {

            RegistrosManuales.update({ _id: item._id }, { $set: item }, {}, function (error) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error) {
                    if (error.invalidKeys) {
                        throw new Meteor.Error('error-base-datos',
                            `Error inesperado al intentar ejecutar la operación de base de datos: 
                                           ${error.invalidKeys.toString()}.`);
                    } else {
                        throw new Meteor.Error('error-base-datos',
                            `Error inesperado al intentar ejecutar la operación de base de datos: 
                                           ${error.message}.`);
                    }
                }

                // el registro manual fue registrado (updated) en forma correcta 
                // ahora vamos a registrar sus cuotas, si existen 
                cuotas.forEach(c => {
                    // el usuario puede haber reconstruido las cuotas; en ese caso, vendrán las originales para ser eliminadas 
                    // y las nuevas para ser registradas 
                    if (c.docState === 1) { 
                        delete c.docState; 
                        Cuotas.insert(c); 
                    } else if (c.docState === 2) { 
                        delete c.docState; 
                        // -----------------------------------------------------------------------------------------------------
                        // para que el registro se copie a sql en la prox copia que efectúe el usuario 
                        if (c?.fechaCopiadoSql) {
                            c.fechaCopiadoSql = null;
                        }
                        // -----------------------------------------------------------------------------------------------------
                        Cuotas.update({ _id: c._id }, { set: { c }})
                    } else if (c.docState === 3) { 
                        Cuotas.remove({ _id: c._id })

                        // -----------------------------------------------------------------------------------------------------
                        // para que el registro se elimine en sql la prox copia que efectúe el usuario 
                        Catalogos_deletedItems.insert({ _id: new Mongo.ObjectID()._str, collection: "cuotas", itemId: c._id, fecha: new Date() });
                        // -----------------------------------------------------------------------------------------------------
                    }
                })
            })

            // leemos las cuotas desde el db para regresarlas tal como fueron grabadas 
            const cuotas2 = Cuotas.find({ 'source.entityID': item._id }).fetch(); 

            return {
                error: false,
                message: "Ok, los datos han sido actualizados en la base de datos.",
                item, 
                cuotas: cuotas2
            }
        },

        // ==============================================================================================
        // remove 
        // ==============================================================================================
        'registrosManuales.save.remove': function (itemId) {

            RegistrosManuales.remove({ _id: itemId });

            return {
                error: false,
                message: "Ok, el registro ha sido eliminado en la base de datos.",
            }
        }
    })

    // ==============================================================================================
    // hacemos el Insert en el db 
    // ==============================================================================================
    const insertItem = (item) => { 
        return new Promise((resolve, reject) => { 

            RegistrosManuales.insert(item, (error, _id) => {
                if (error) {
                    if (error.invalidKeys) {
                        const message = error.invalidKeys.toString();
                        console.log("# 02 - error")
                        reject(message) 
                    } else {
                        const message = error.message;
                        console.log("# 02 - error")
                        reject(message) 
                    }
                }

                console.log("# 02 - resolve")
                resolve(_id); 
            })
        })
    }