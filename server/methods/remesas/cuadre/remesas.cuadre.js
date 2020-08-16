
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

import { cuadre_cobroPrimas } from '/server/imports/remesas/cuadre/cuadre_cobroPrimas'; 
import { cuadre_cobroPrimasContratos } from '/server/imports/remesas/cuadre/cuadre_cobroPrimasContratos'; 
import { cuadre_cobroSiniestros } from '/server/imports/remesas/cuadre/cuadre_cobroSiniestros'; 
import { cuadre_pagoPrimas } from '/server/imports/remesas/cuadre/cuadre_pagoPrimas'; 
import { cuadre_pagoPrimasContratos } from '/server/imports/remesas/cuadre/cuadre_pagoPrimasContratos'; 
import { cuadre_pagoSiniestros } from '/server/imports/remesas/cuadre/cuadre_pagoSiniestros'; 
import { cuadre_remesa } from '/server/imports/remesas/cuadre/cuadre_remesa'; 

Meteor.methods(
{
    remesasObtenerCuadre: function (remesaID, empresaUsuariaTipo, parametrosEjecucion) {

        // empresaUsuariaTipo puede ser: CORRR: corredor de reaseguros / REA: reasegurador 

        new SimpleSchema({
            remesaID: { type: String, optional: false, },
            empresaUsuariaTipo: { type: String, optional: false, },
            parametrosEjecucion: { type: Object, blackbox: true, optional: false, },
        }).validate({ remesaID, empresaUsuariaTipo, parametrosEjecucion, });

        const remesa = Remesas.findOne(remesaID);

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
        numeroTransaccion = cuadre_remesa(remesa, numeroTransaccion);

        // leemos las cuotas, cobradas o pagadas, que corresponden a la remesa
        const cuotasRemesa = Cuotas.find( { pagos: { $elemMatch: { remesaID: remesa._id }}}).fetch();

        cuotasRemesa.forEach( cuota => {

            // con el 'source' de la cuota y la entidad de origen, determinamos el tipo de transacción
            // (fac, sin, cont, ...), y ejecutamos una función específica
            switch(cuota.source.origen) {

                case 'fac': {
                    const riesgo = Riesgos.findOne(cuota.source.entityID);

                    if (remesa.compania == riesgo.compania) { 
                        // la compañía en la remesa es el cedente en el riesgo; asumimos un cobro al cedente
                        numeroTransaccion = cuadre_cobroPrimas(remesa, cuota, numeroTransaccion, empresaUsuariaTipo, parametrosEjecucion);
                    }
                    else { 
                        // la compañía en la remesa no es el cedente en el riesgo; asumimos un pago a algún reasegurador
                        numeroTransaccion = cuadre_pagoPrimas(remesa, cuota, riesgo, numeroTransaccion);
                    }
                    break;
                }

                case 'sinFac': {
                    const siniestro = Siniestros.findOne(cuota.source.entityID);

                    if (remesa.compania == siniestro.compania) { 
                        // pago al cedente - la compañía de la remesa es el cedente en el siniestro
                        numeroTransaccion = cuadre_pagoSiniestros(remesa, cuota, siniestro, numeroTransaccion);
                    } 
                    else { 
                        // cobro al reasegurador - la compañía en la remesa no es el cedente en el siniestro
                        numeroTransaccion = cuadre_cobroSiniestros(remesa, cuota, siniestro, numeroTransaccion);
                    }
                    break;
                }

                case 'cuenta':
                case 'capa': {
                    const contrato = Contratos.findOne(cuota.source.entityID);

                    if (remesa.compania == contrato.compania) { 
                        // la compañía en la remesa es el cedente en el contrato; asumimos un cobro al cedente
                        numeroTransaccion = cuadre_cobroPrimasContratos(remesa, cuota, contrato, numeroTransaccion, parametrosEjecucion);
                    } 
                    else { 
                        // la compañía en la remesa no es el cedente en el contrato; asumimos un pago a algún reasegurador
                        numeroTransaccion = cuadre_pagoPrimasContratos(remesa, cuota, contrato, numeroTransaccion);
                    }
                    break;
                }
            }
        })

        // sumarizamos los montos del cuadre a ver si existe una diferencia que mostrar en el asiento ... 
        let diferenciaRemesa = 0; 
        
        // ordenamos por transacción y partida para obtener sus últimos números y usar en la nueva transacción y partida 
        for (const transaccion of remesa.cuadre) { 
            for (const partida of transaccion.partidas) { 
                diferenciaRemesa += partida.monto;
            }
        }

        // solo grabamos una transacción adicional si existe una diferencia ... 
        if (diferenciaRemesa != 0 && (lodash.round(diferenciaRemesa, 2) != 0)) { 
            // leemos la cuenta contable asociada, para asignar a la partida 
            const cuentaContable = leerCuentaContableAsociada(100, remesa.moneda, remesa.compania, null); 

            const transaccion = { 
                _id: new Mongo.ObjectID()._str, 
                transaccion: { 
                    numero: numeroTransaccion + 10, 
                    descripcion: "Diferencia en la remesa", 
                }, 
                partidas: [], 
            }

            const compania = Companias.findOne(remesa.compania);
            const moneda = Monedas.findOne(remesa.moneda);

            const partida = {};

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