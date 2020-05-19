
import { Meteor } from 'meteor/meteor'; 
import { NotasDebitoCredito } from 'imports/collections/principales/notasDebitoCredito'; 

Meteor.methods(
{
    'notasDebito_grabar': function (notasDebito: object[]) {

        let cantidadItemsGrabados = 0; 

        // al menos por ahora, el usuario no agrega ni elimina notas de débito. Solo las edita y graba desde Riesgos. 
        // las construye también desde Riesgos 
        notasDebito.forEach((item: any) => { 
            NotasDebitoCredito.update({ _id: item._id }, { $set: item }, {}, function (error: any, result: any) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error) { 
                    let message = `Error inesperado: ha ocurrido un error al intentar grabar los cambios en una nota de débito.<br /><br />
                                   ${error.message} 
                          `; 
                    message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                    return { 
                        error: true, 
                        message: message, 
                    }
                }
                cantidadItemsGrabados++; 
            })
        })

        let message = `Ok, los cambios efectuados a las notas de débito para el riesgo y movimiento indicados se han grabado 
                        en forma satisfactoria.<br /><br /> 
                        En total, se han grabado <b>${cantidadItemsGrabados.toString()}</b> notas de débito para el 
                        movimiento y riesgo indicados.
                      `; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        return { 
            error: false, 
            message: message,  
        }
    }
})