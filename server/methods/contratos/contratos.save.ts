
import * as lodash from 'lodash'; 
import * as moment from 'moment';

import { Contratos } from 'imports/collections/principales/contratos'; 
import { Cuotas } from 'imports/collections/principales/cuotas'; 

// siguen todos las tablas (collections) para el registro de contratos proporcionales 
import { ContratosProp_cuentas_resumen, ContratosProp_cuentas_distribucion, ContratosProp_cuentas_saldos, } from 'imports/collections/principales/contratos'; 
import { ContratosProp_comAdic_resumen, ContratosProp_comAdic_distribucion, ContratosProp_comAdic_montosFinales, } from 'imports/collections/principales/contratos'; 
import { ContratosProp_partBeneficios_resumen, ContratosProp_partBeneficios_distribucion, ContratosProp_partBeneficios_montosFinales, } from 'imports/collections/principales/contratos'; 
import { ContratosProp_entCartPr_resumen, ContratosProp_entCartPr_distribucion, ContratosProp_entCartPr_montosFinales, } from 'imports/collections/principales/contratos'; 
import { ContratosProp_entCartSn_resumen, ContratosProp_entCartSn_distribucion, ContratosProp_entCartSn_montosFinales, } from 'imports/collections/principales/contratos'; 
import { ContratosProp_retCartPr_resumen, ContratosProp_retCartPr_distribucion, ContratosProp_retCartPr_montosFinales, } from 'imports/collections/principales/contratos'; 
import { ContratosProp_retCartSn_resumen, ContratosProp_retCartSn_distribucion, ContratosProp_retCartSn_montosFinales, } from 'imports/collections/principales/contratos'; 

import { mongoCollection_array_grabar } from 'server/imports/general/mongoCollection.grabar'; 
import { calcularNumeroReferencia } from 'server/imports/general/calcularNumeroReferencia'; 

Meteor.methods(
{
    'contratos.save': function (contrato, cuotas, 
                            contratosProp_cuentas_resumen, contratosProp_cuentas_distribucion, contratosProp_cuentas_saldos, 
                            contratosProp_comAdic_resumen, contratosProp_comAdic_distribucion, contratosProp_comAdic_montosFinales, 
                            contratosProp_partBeneficios_resumen, contratosProp_partBeneficios_distribucion, contratosProp_partBeneficios_montosFinales, 
                            contratosProp_entCartPr_resumen, contratosProp_entCartPr_distribucion, contratosProp_entCartPr_montosFinales, 
                            contratosProp_entCartSn_resumen, contratosProp_entCartSn_distribucion, contratosProp_entCartSn_montosFinales, 
                            contratosProp_retCartPr_resumen, contratosProp_retCartPr_distribucion, contratosProp_retCartPr_montosFinales, 
                            contratosProp_retCartSn_resumen, contratosProp_retCartSn_distribucion, contratosProp_retCartSn_montosFinales 
                            ) 
    {
        

        reportarProgresoAlCliente(4); 

        if (contrato.docState && contrato.docState == 1) {

            delete contrato.docState;

            // si el número viene en '0', asignamos un número consecutivo al contrato
            if (!contrato.numero) {
                var numeroAnterior = Contratos.findOne({ cia: contrato.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior || !numeroAnterior.numero) { 
                    contrato.numero = 1;
                }   
                else { 
                    contrato.numero = numeroAnterior.numero + 1;
                }   
            }

            // si la referencia viene en '0', asignamos una ...
            if (!contrato.referencia || contrato.referencia === '0') {
                let ano = parseInt(moment(contrato.desde).format('YYYY'));
                let result = calcularNumeroReferencia('contr', contrato.tipo, ano, contrato.cia);

                if (result.error) {
                    throw new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                }

                contrato.referencia = result.referencia;
            }

            Contratos.insert(contrato); 
        }

        if (contrato.docState && contrato.docState == 2) {

            var item2 = lodash.cloneDeep(contrato);

            delete item2.docState;
            delete item2._id;

            item2.ultAct = new Date();
            item2.ultUsuario = this.userId;

            // si el número viene en '0', asignamos un número consecutivo al contrato
            if (!item2.numero) {
                var numeroAnterior = Contratos.findOne({ cia: contrato.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior.numero) { 
                    item2.numero = 1;
                }  
                else { 
                    item2.numero = numeroAnterior.numero + 1;
                }
            }

            // si la referencia viene en '0', asignamos una ...
            if (!item2.referencia || item2.referencia === '0') {
                let ano = parseInt(moment(item2.desde).format('YYYY'));
                let result = calcularNumeroReferencia('contr', item2.tipo, ano, item2.cia);

                if (result.error) {
                    throw new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                }
                item2.referencia = result.referencia;
            }

            Contratos.update({ _id: contrato._id }, { $set: item2 });
        }


        if (contrato.docState && contrato.docState == 3) {
            
            Cuotas.remove({ 'source.entityID': contrato._id });

            ContratosProp_cuentas_resumen.remove({ contratoID: contrato._id }); 
            ContratosProp_cuentas_distribucion.remove({ contratoID: contrato._id }); 
            ContratosProp_cuentas_saldos.remove({ contratoID: contrato._id }); 

            ContratosProp_comAdic_resumen.remove({ contratoID: contrato._id }); 
            ContratosProp_comAdic_distribucion.remove({ contratoID: contrato._id }); 
            ContratosProp_comAdic_montosFinales.remove({ contratoID: contrato._id }); 
            ContratosProp_partBeneficios_resumen.remove({ contratoID: contrato._id }); 
            ContratosProp_partBeneficios_distribucion.remove({ contratoID: contrato._id }); 
            ContratosProp_partBeneficios_montosFinales.remove({ contratoID: contrato._id }); 
            ContratosProp_entCartPr_resumen.remove({ contratoID: contrato._id }); 
            ContratosProp_entCartPr_distribucion.remove({ contratoID: contrato._id }); 
            ContratosProp_entCartPr_montosFinales.remove({ contratoID: contrato._id }); 
            ContratosProp_entCartSn_resumen.remove({ contratoID: contrato._id }); 
            ContratosProp_entCartSn_distribucion.remove({ contratoID: contrato._id }); 
            ContratosProp_entCartSn_montosFinales.remove({ contratoID: contrato._id }); 
            ContratosProp_retCartPr_resumen.remove({ contratoID: contrato._id }); 
            ContratosProp_retCartPr_distribucion.remove({ contratoID: contrato._id }); 
            ContratosProp_retCartPr_montosFinales.remove({ contratoID: contrato._id }); 
            ContratosProp_retCartSn_resumen.remove({ contratoID: contrato._id }); 
            ContratosProp_retCartSn_distribucion.remove({ contratoID: contrato._id }); 
            ContratosProp_retCartSn_montosFinales.remove({ contratoID: contrato._id }); 

            Contratos.remove({ _id: contrato._id }); 
        }

        // usamos esta función para grabar a mongo el contenido de los arrays; nótese que pasamos el array y el mongo collection ... 

       
        reportarProgresoAlCliente(8); 
        mongoCollection_array_grabar(contratosProp_cuentas_resumen.filter(x => x.primas || x.siniestros), ContratosProp_cuentas_resumen); 

        reportarProgresoAlCliente(12); 
        mongoCollection_array_grabar(contratosProp_cuentas_distribucion, ContratosProp_cuentas_distribucion); 

        reportarProgresoAlCliente(16); 
        mongoCollection_array_grabar(contratosProp_cuentas_saldos, ContratosProp_cuentas_saldos); 


        reportarProgresoAlCliente(20); 
        mongoCollection_array_grabar(contratosProp_comAdic_resumen.filter(x => x.monto), ContratosProp_comAdic_resumen); 

        reportarProgresoAlCliente(24); 
        mongoCollection_array_grabar(contratosProp_comAdic_distribucion, ContratosProp_comAdic_distribucion); 

        reportarProgresoAlCliente(28); 
        mongoCollection_array_grabar(contratosProp_comAdic_montosFinales, ContratosProp_comAdic_montosFinales); 


        reportarProgresoAlCliente(32); 
        mongoCollection_array_grabar(contratosProp_partBeneficios_resumen.filter(x => x.monto), ContratosProp_partBeneficios_resumen); 

        reportarProgresoAlCliente(36); 
        mongoCollection_array_grabar(contratosProp_partBeneficios_distribucion, ContratosProp_partBeneficios_distribucion); 

        reportarProgresoAlCliente(40); 
        mongoCollection_array_grabar(contratosProp_partBeneficios_montosFinales, ContratosProp_partBeneficios_montosFinales); 



        reportarProgresoAlCliente(44); 
        mongoCollection_array_grabar(contratosProp_entCartPr_resumen.filter(x => x.monto), ContratosProp_entCartPr_resumen); 

        reportarProgresoAlCliente(48); 
        mongoCollection_array_grabar(contratosProp_entCartPr_distribucion, ContratosProp_entCartPr_distribucion); 

        reportarProgresoAlCliente(52); 
        mongoCollection_array_grabar(contratosProp_entCartPr_montosFinales, ContratosProp_entCartPr_montosFinales); 



        reportarProgresoAlCliente(56); 
        mongoCollection_array_grabar(contratosProp_entCartSn_resumen.filter(x => x.monto), ContratosProp_entCartSn_resumen); 

        reportarProgresoAlCliente(60); 
        mongoCollection_array_grabar(contratosProp_entCartSn_distribucion, ContratosProp_entCartSn_distribucion); 

        reportarProgresoAlCliente(64); 
        mongoCollection_array_grabar(contratosProp_entCartSn_montosFinales, ContratosProp_entCartSn_montosFinales); 


        reportarProgresoAlCliente(68); 
        mongoCollection_array_grabar(contratosProp_retCartPr_resumen.filter(x => x.monto), ContratosProp_retCartPr_resumen); 

        reportarProgresoAlCliente(72); 
        mongoCollection_array_grabar(contratosProp_retCartPr_distribucion, ContratosProp_retCartPr_distribucion); 

        reportarProgresoAlCliente(76); 
        mongoCollection_array_grabar(contratosProp_retCartPr_montosFinales, ContratosProp_retCartPr_montosFinales); 


        reportarProgresoAlCliente(80); 
        mongoCollection_array_grabar(contratosProp_retCartSn_resumen.filter(x => x.monto), ContratosProp_retCartSn_resumen); 

        reportarProgresoAlCliente(84); 
        mongoCollection_array_grabar(contratosProp_retCartSn_distribucion, ContratosProp_retCartSn_distribucion); 

        reportarProgresoAlCliente(88); 
        mongoCollection_array_grabar(contratosProp_retCartSn_montosFinales, ContratosProp_retCartSn_montosFinales); 


        reportarProgresoAlCliente(92); 
        mongoCollection_array_grabar(cuotas, Cuotas); 

        return `Ok, los datos han sido actualizados en la base de datos.`; 
    }
})

function reportarProgresoAlCliente(progress: number): void { 
   
    // valores para reportar el progreso
    let eventName = "contratos_grabar_reportProgress";
    let eventSelector = { myuserId: Meteor.userId(), app: 'scrwebm', process: 'contratos_grabar' };
    let eventData = { progress: progress, };

    // sync call
    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);   
}
