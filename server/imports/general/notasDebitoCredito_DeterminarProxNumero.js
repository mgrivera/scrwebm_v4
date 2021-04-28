
import { Meteor } from 'meteor/meteor'; 
import { NotasDebitoCredito_proxNumero } from '/imports/collections/catalogos/notasDebitoCredito_proxNumero'; 

const determinarProxNumero = function(tipo, ano, cia) { 
    
    // en NotasDebitoCredito_proxNumero está el último número usado. Debemos incrementar 1 para usar como el 
    // número de la próxima nota 
    const filter = { ano: ano, tipo: tipo, cia: cia }; 
    const update = { $inc: { numero: 1 } }; 
    const options = { sort: { ano: 1, tipo: 1, cia: 1 }, upsert: true, returnOriginal: false, }; 

    const notasDebito_proxNumero_raw = NotasDebitoCredito_proxNumero.rawCollection();
    notasDebito_proxNumero_raw.findOneAndUpdate_sync = Meteor.wrapAsync(notasDebito_proxNumero_raw.findOneAndUpdate); 

    let result = {}; 

    try { 
        const result2 = notasDebito_proxNumero_raw.findOneAndUpdate_sync(filter, update, options); 

        result = { 
            error: false, 
            message: "", 
            result: result2.value       // the new or updated item comes in result.value 
        }
    } catch(err) { 

        const message = `Ha ocurrido un error al intentar obtener el número de la próxima nota de débito/crédito.<br /> 
                       El mensaje de error es: ${err.number ? err.number.toString() : ''} - ${err.name ? err.name : ''} - 
                       ${err.message ? err.message : ''}. 
                      `; 

        result = { 
            error: true, 
            message: message, 
            result: {} 
        }
    }
    

    return result; 
}

export default determinarProxNumero; 