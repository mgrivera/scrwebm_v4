

import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema';

import { Companias } from '/imports/collections/catalogos/companias'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 

Meteor.methods(
{
    'remesas.importarRemesas': function (cuentaBancariaNumero, companiaAbreviatura) {

        new SimpleSchema({
            cuentaBancariaNumero: { type: String, optional: false, },
            companiaAbreviatura: { type: String, optional: false, min: 0, },        // la compañía puede o no venir 
        }).validate({ cuentaBancariaNumero, companiaAbreviatura, });

        let error = false; 
        let message = ""; 

        // leemos la compañía que tiene la misma abreviatura; regresamos el _id de la compañía; nótese cómo usamos regex para 
        // que el find encuentre case insensitive ... 
        const compania = Companias.findOne({ abreviatura: { $regex: companiaAbreviatura, $options: 'i' }}, { fields: { _id: 1, }}); 

        if (!compania) { 
            error = true; 
            message = `No existe una compañía cuya abreviatura sea <b>'${companiaAbreviatura}'</b>. Para que el proceso sea capaz de encontrar la 
                       compañía, su abreviatura <b>debe ser la misma</b> de la que se está importando mediante este proceso. 
                      `; 
        }

        // leemos la cuenta contable con el mismo número; regresamos su _id, banco y moneda 
        const cuentaBancaria = CuentasBancarias.findOne({ numero: cuentaBancariaNumero }, { fields: { _id: 1, moneda: 1, banco: 1, }}); 
        
        if (!cuentaBancaria) { 
            error = true; 

            if (!message) { 
                message = `No existe una cuenta bancaria cuyo número sea <b>'${cuentaBancariaNumero}'</b>. 
                           Para que el proceso sea capaz de encontrar la 
                           cuenta bancaria, su número <b>debe ser el mismo</b> de la que se está importando mediante este proceso. 
                          `; 
            } else { 
                message += `<br /><br />No existe una cuenta bancaria cuyo número sea <b>'${cuentaBancariaNumero}'</b>. 
                            Para que el proceso sea capaz de encontrar la 
                            cuenta bancaria, su número <b>debe ser el mismo</b> de la que se está importando mediante este proceso. 
                           `; 
            }
        }

        return { 
            error: error, 
            message: message, 
            cuentaBancaria: cuentaBancaria, 
            compania: compania, 
        }
    }
})