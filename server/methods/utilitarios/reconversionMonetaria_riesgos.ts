

import * as lodash from 'lodash'; 

import { Riesgos } from 'imports/collections/principales/riesgos'; 
import { ReconversionMonetaria_log } from 'imports/collections/otros/reconversionMonetaria_log'; 

Meteor.methods(
{
    'reconversionMonetaria_riesgos': function (monedaDefault, parametros, companiaSeleccionada) {

        let inicio = new Date(2018, 0, 1); 
        let final = new Date(2018, 7, 20); 

        // calcumos el divisor en base a la cantidad de dígitos indicada 
        let divisor = 1;

        for (let i = 1; i <= parametros.cantidadDigitos; i++) {
            divisor = divisor * 10;
        }

        let riesgos = Riesgos.find({ 
            cia: companiaSeleccionada._id, 
            moneda: monedaDefault._id, 
            $and: [ { desde: { $gte: inicio }}, { desde: { $lt: final }} ], 
            }).fetch(); 

        let cantidadRiesgosActualizadas = 0; 

        for (let riesgo of riesgos) { 

            riesgo.movimientos.forEach((mov) => { 
        
                // coberturas 
                if (mov.coberturas) { 
                    mov.coberturas.forEach((cob) => { 
                        if (cob.valorARiesgo) cob.valorARiesgo = lodash.round(cob.valorARiesgo / divisor, 2); 
                        if (cob.sumaAsegurada) cob.sumaAsegurada = lodash.round(cob.sumaAsegurada / divisor, 2); 
                        if (cob.prima) cob.prima = lodash.round(cob.prima / divisor, 2); 
                    }); 
                }
                
                // coberturasCompanias 
                if (mov.coberturasCompanias) { 
                    mov.coberturasCompanias.forEach((cob) => { 
                        if (cob.valorARiesgo) cob.valorARiesgo = lodash.round(cob.valorARiesgo / divisor, 2); 
                        if (cob.sumaAsegurada) cob.sumaAsegurada = lodash.round(cob.sumaAsegurada / divisor, 2); 
                        if (cob.prima) cob.prima = lodash.round(cob.prima / divisor, 2); 
                        if (cob.sumaReasegurada) cob.sumaReasegurada = lodash.round(cob.sumaReasegurada / divisor, 2); 
                        if (cob.primaBrutaAntesProrrata) cob.primaBrutaAntesProrrata = lodash.round(cob.primaBrutaAntesProrrata / divisor, 2); 
                        if (cob.primaBruta) cob.primaBruta = lodash.round(cob.primaBruta / divisor, 2); 
                    }); 
                }
                
                // primas 
                if (mov.primas) { 
                    mov.primas.forEach((cob) => { 
                        if (cob.primaBruta) cob.primaBruta = lodash.round(cob.primaBruta / divisor, 2); 
                        if (cob.comision) cob.comision = lodash.round(cob.comision / divisor, 2); 
                        if (cob.impuesto) cob.impuesto = lodash.round(cob.impuesto / divisor, 2); 
                        if (cob.corretaje) cob.corretaje = lodash.round(cob.corretaje / divisor, 2); 
                        if (cob.primaNeta0) cob.primaNeta0 = lodash.round(cob.primaNeta0 / divisor, 2); 
                        if (cob.impuestoSobrePN) cob.impuestoSobrePN = lodash.round(cob.impuestoSobrePN / divisor, 2); 
                        if (cob.primaNeta) cob.primaNeta = lodash.round(cob.primaNeta / divisor, 2); 
                    }); 
                }
                
            }) 
            
            try { 
                Riesgos.update({ _id: riesgo._id }, { $set: riesgo });  
            } catch (error) { 
                return { 
                    error: true, 
                    message: "Error: se ha producido un error al intentar actualizar un riesgo. El mensaje del error es: " + error, 
                }
            } finally { 
                cantidadRiesgosActualizadas++; 
            }
        }

        let message = `Proceso de reconversión ejecutado en forma satisfactoria.
                       La cantidad de dígitos indicada fue ${parametros.cantidadDigitos.toString()} y el divisor que resultó es ${divisor.toString()}.
                       En total, ${cantidadRiesgosActualizadas.toString()} riesgos fueron actualizados; 
                    `; 

            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        // agregamos un registro al log  
        ReconversionMonetaria_log.insert({ 
            _id: new Mongo.ObjectID()._str, 
            fecha: new Date(), 
            descripcion: message, 
            cantidadDigitos: parametros.cantidadDigitos, 
            user: Meteor.user().emails[0].address, 
            cia: companiaSeleccionada._id, 
        })

        return { 
            error: false, 
            message: "Ok, el proceso de reconversión de riesgos ha sido efectuado en forma satisfactoria.", 
        }
    }
})