
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 

import lodash from 'lodash'; 
import SimpleSchema from 'simpl-schema';
import { leerCuentaContableAsociada } from '/server/imports/general/leerCuentaContableAsociada';  

import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { Remesas } from '/imports/collections/principales/remesas';  
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 

Meteor.methods(
{
    remesasObtenerCuadre: function (remesaID, parametrosEjecucion) {

        new SimpleSchema({
            remesaID: { type: String, optional: false, },
            parametrosEjecucion: { type: Object, blackbox: true, optional: false, },
        }).validate({ remesaID, parametrosEjecucion, });

        let remesa = Remesas.findOne(remesaID);

        if (!remesa) { 
            throw new Meteor.Error("remesa-no-encontrada",
                                   `Error inesperado: la remesa indicada no pudo ser leída en la base de datos.`);
        }

        // si ya fue obtenido un cuadre para esta remesa, lo eliminamos antes de intentar obtenerlo y grabarlo nuevamente
        if (remesa.cuadre && remesa.cuadre.length) { 
            remesa.cuadre.length = 0;
        }
            

        if (!remesa.cuadre) { 
            remesa.cuadre = [];
        }
            
        let numeroTransaccion = 0;

        // antes que nada, agregamos la transacción que corresponde, propiamente, a la remesa
        numeroTransaccion = RemesasCuadre_Methods.transaccion_Remesa(remesa, numeroTransaccion);

        // leemos las cuotas, cobradas o pagadas, que corresponden a la remesa
        var cuotasRemesa = Cuotas.find( { pagos: { $elemMatch: { remesaID: remesa._id }}}).fetch();

        cuotasRemesa.forEach( cuota => {

            // con el 'source' de la cuota y la entidad de origen, determinamos el tipo de transacción
            // (fac, sin, cont, ...), y ejecutamos una función específica
            switch(cuota.source.origen) {

                case 'fac': {
                    let riesgo = Riesgos.findOne(cuota.source.entityID);

                    if (remesa.compania == riesgo.compania) { 
                        // la compañía en la remesa es el cedente en el riesgo; asumimos un cobro al cedente
                        numeroTransaccion = RemesasCuadre_Methods.transaccion_CobroPrimas(remesa, cuota, riesgo, numeroTransaccion, parametrosEjecucion);
                    }
                    else { 
                        // la compañía en la remesa no es el cedente en el riesgo; asumimos un pago a algún reasegurador
                        numeroTransaccion = RemesasCuadre_Methods.transaccion_PagoPrimas(remesa, cuota, riesgo, numeroTransaccion);
                    }
                    break;
                }

                case 'sinFac': {
                    let siniestro = Siniestros.findOne(cuota.source.entityID);

                    if (remesa.compania == siniestro.compania) { 
                        // pago al cedente - la compañía de la remesa es el cedente en el siniestro
                        numeroTransaccion = RemesasCuadre_Methods.transaccion_PagoSiniestros(remesa, cuota, siniestro, numeroTransaccion);
                    } 
                    else { 
                        // cobro al reasegurador - la compañía en la remesa no es el cedente en el siniestro
                        numeroTransaccion = RemesasCuadre_Methods.transaccion_CobroSiniestros(remesa, cuota, siniestro, numeroTransaccion);
                    }
                    break;
                }

                case 'cuenta':
                case 'capa': {
                    let contrato = Contratos.findOne(cuota.source.entityID);

                    if (remesa.compania == contrato.compania) { 
                        // la compañía en la remesa es el cedente en el contrato; asumimos un cobro al cedente
                        numeroTransaccion = RemesasCuadre_Methods.transaccion_CobroPrimasContratos(remesa, cuota, contrato, numeroTransaccion, parametrosEjecucion);
                    } 
                    else { 
                        // la compañía en la remesa no es el cedente en el contrato; asumimos un pago a algún reasegurador
                        numeroTransaccion = RemesasCuadre_Methods.transaccion_PagoPrimasContratos(remesa, cuota, contrato, numeroTransaccion);
                    }
                    break;
                }
            }
        })

        // sumarizamos los montos del cuadre a ver si existe una diferencia que mostrar en el asiento ... 
        let diferenciaRemesa = 0; 
        
        // ordenamos por transacción y partida para obtener sus últimos números y usar en la nueva transacción y partida 
        for (let transaccion of remesa.cuadre) { 
            for (let partida of transaccion.partidas) { 
                diferenciaRemesa += partida.monto;
            }
        }

        // solo grabamos una transacción adicional si existe una diferencia ... 
        if (diferenciaRemesa != 0 && (lodash.round(diferenciaRemesa, 2) != 0)) { 
            // leemos la cuenta contable asociada, para asignar a la partida 
            let cuentaContable = leerCuentaContableAsociada(100, remesa.moneda, remesa.compania, null); 

            let transaccion = { 
                _id: new Mongo.ObjectID()._str, 
                transaccion: { 
                    numero: numeroTransaccion + 10, 
                    descripcion: "Diferencia en la remesa", 
                }, 
                partidas: [], 
            }

            let compania = Companias.findOne(remesa.compania);
            let moneda = Monedas.findOne(remesa.moneda);

            let partida = {};

            partida._id = new Mongo.ObjectID()._str;
            partida.numero = 10;
            partida.tipo = 5000;      // 5000: diferencia en remesa 
            partida.codigo = cuentaContable && cuentaContable.cuentaContable ? cuentaContable.cuentaContable : null;
            partida.compania = remesa.compania;
            partida.descripcion = `Diferencia en remesa ${remesa.numero.toString()} - ${compania.abreviatura} - ${moneda.simbolo}`;
            partida.referencia = `Dif en rem ${remesa.numero.toString()}`;
            partida.moneda = remesa.moneda;

            // el monto debe ser redondeado a 2 decimales; además, debe ser del monto opuesto a la diferencia 
            partida.monto = diferenciaRemesa * -1; 
            diferenciaRemesa = lodash.round(diferenciaRemesa, 2); 
            
            transaccion.partidas.push(partida);

            // finalmente, agregamos la transacción (con todas sus partidas) al cuadre de la remesa
            remesa.cuadre.push(transaccion);
        }

        // finalmente, actualizamos la remesa para registrar el 'cuadre' que acabamos de construir ...
        Remesas.update({ _id: remesa._id }, { $set: { cuadre: remesa.cuadre }});

        return "Ok, el cuadre de la remesa ha sido construído.";
    }
})
