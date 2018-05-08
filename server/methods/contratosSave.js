
import lodash from 'lodash'; 
import moment from 'moment';

import { Contratos } from '/imports/collections/principales/contratos'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 

// siguen todos las tablas (collections) para el registro de contratos proporcionales 
import { ContratosProp_cuentas_resumen, ContratosProp_cuentas_distribucion, ContratosProp_cuentas_saldos, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_comAdic_resumen, ContratosProp_comAdic_distribucion, ContratosProp_comAdic_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_partBeneficios_resumen, ContratosProp_partBeneficios_distribucion, ContratosProp_partBeneficios_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartPr_resumen, ContratosProp_entCartPr_distribucion, ContratosProp_entCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartSn_resumen, ContratosProp_entCartSn_distribucion, ContratosProp_entCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartPr_resumen, ContratosProp_retCartPr_distribucion, ContratosProp_retCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartSn_resumen, ContratosProp_retCartSn_distribucion, ContratosProp_retCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 

import { mongoCollection_array_grabar } from '/server/generalFunctions/mongoCollection.grabar'; 

Meteor.methods(
{
    contratosSave: function (contrato, cuotas, 
                            contratosProp_cuentas_resumen, contratosProp_cuentas_distribucion, contratosProp_cuentas_saldos, 
                            contratosProp_comAdic_resumen, contratosProp_comAdic_distribucion, contratosProp_comAdic_montosFinales, 
                            contratosProp_partBeneficios_resumen, contratosProp_partBeneficios_distribucion, contratosProp_partBeneficios_montosFinales, 
                            contratosProp_entCartPr_resumen, contratosProp_entCartPr_distribucion, contratosProp_entCartPr_montosFinales, 
                            contratosProp_entCartSn_resumen, contratosProp_entCartSn_distribucion, contratosProp_entCartSn_montosFinales, 
                            contratosProp_retCartPr_resumen, contratosProp_retCartPr_distribucion, contratosProp_retCartPr_montosFinales, 
                            contratosProp_retCartSn_resumen, contratosProp_retCartSn_distribucion, contratosProp_retCartSn_montosFinales 
                            ) 
    {
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
                let result = ServerGlobal_Methods.calcularNumeroReferencia('contr', contrato.tipo, ano, contrato.cia);

                if (result.error) {
                    let error = new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                    reject(error); 
                }
                contrato.referencia = result.referencia;
            }

            Contratos.insert(contrato); 
        }

        if (contrato.docState && contrato.docState == 2) {

            var item2 = lodash.cloneDeep(contrato, true);

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
                let result = ServerGlobal_Methods.calcularNumeroReferencia('contr', item2.tipo, ano, item2.cia);

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
        mongoCollection_array_grabar(contratosProp_cuentas_resumen, ContratosProp_cuentas_resumen); 
        mongoCollection_array_grabar(contratosProp_cuentas_distribucion, ContratosProp_cuentas_distribucion); 
        mongoCollection_array_grabar(contratosProp_cuentas_saldos, ContratosProp_cuentas_saldos); 

        mongoCollection_array_grabar(contratosProp_comAdic_resumen, ContratosProp_comAdic_resumen); 
        mongoCollection_array_grabar(contratosProp_comAdic_distribucion, ContratosProp_comAdic_distribucion); 
        mongoCollection_array_grabar(contratosProp_comAdic_montosFinales, ContratosProp_comAdic_montosFinales); 

        mongoCollection_array_grabar(contratosProp_partBeneficios_resumen, ContratosProp_partBeneficios_resumen); 
        mongoCollection_array_grabar(contratosProp_partBeneficios_distribucion, ContratosProp_partBeneficios_distribucion); 
        mongoCollection_array_grabar(contratosProp_partBeneficios_montosFinales, ContratosProp_partBeneficios_montosFinales); 

        mongoCollection_array_grabar(contratosProp_entCartPr_resumen, ContratosProp_entCartPr_resumen); 
        mongoCollection_array_grabar(contratosProp_entCartPr_distribucion, ContratosProp_entCartPr_distribucion); 
        mongoCollection_array_grabar(contratosProp_entCartPr_montosFinales, ContratosProp_entCartPr_montosFinales); 

        mongoCollection_array_grabar(contratosProp_entCartSn_resumen, ContratosProp_entCartSn_resumen); 
        mongoCollection_array_grabar(contratosProp_entCartSn_distribucion, ContratosProp_entCartSn_distribucion); 
        mongoCollection_array_grabar(contratosProp_entCartSn_montosFinales, ContratosProp_entCartSn_montosFinales); 

        mongoCollection_array_grabar(contratosProp_retCartPr_resumen, ContratosProp_retCartPr_resumen); 
        mongoCollection_array_grabar(contratosProp_retCartPr_distribucion, ContratosProp_retCartPr_distribucion); 
        mongoCollection_array_grabar(contratosProp_retCartPr_montosFinales, ContratosProp_retCartPr_montosFinales); 

        mongoCollection_array_grabar(contratosProp_retCartSn_resumen, ContratosProp_retCartSn_resumen); 
        mongoCollection_array_grabar(contratosProp_retCartSn_distribucion, ContratosProp_retCartSn_distribucion); 
        mongoCollection_array_grabar(contratosProp_retCartSn_montosFinales, ContratosProp_retCartSn_montosFinales); 

        mongoCollection_array_grabar(cuotas, Cuotas); 

        return `Ok, los datos han sido actualizados en la base de datos.`; 
    }
})
