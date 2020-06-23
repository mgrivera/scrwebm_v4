
import { Meteor } from 'meteor/meteor'; 

import { Contratos } from '/imports/collections/principales/contratos'; 

import { ContratosProp_cuentas_resumen, ContratosProp_cuentas_distribucion, ContratosProp_cuentas_saldos, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_comAdic_resumen, ContratosProp_comAdic_distribucion, ContratosProp_comAdic_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_partBeneficios_resumen, ContratosProp_partBeneficios_distribucion, ContratosProp_partBeneficios_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartPr_resumen, ContratosProp_entCartPr_distribucion, ContratosProp_entCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartSn_resumen, ContratosProp_entCartSn_distribucion, ContratosProp_entCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartPr_resumen, ContratosProp_retCartPr_distribucion, ContratosProp_retCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartSn_resumen, ContratosProp_retCartSn_distribucion, ContratosProp_retCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 

import { Cuotas } from '/imports/collections/principales/cuotas'; 

Meteor.publish("contrato", function (contrato_id) {

    // leemos y regresamos todas las tablas (collections) que existen para el registro de un contrato 
    return [ 
        Contratos.find({ _id: contrato_id }), 

        ContratosProp_cuentas_resumen.find({ contratoID: contrato_id }),  
        ContratosProp_cuentas_distribucion.find({ contratoID: contrato_id }),  
        ContratosProp_cuentas_saldos.find({ contratoID: contrato_id }),  
        ContratosProp_comAdic_resumen.find({ contratoID: contrato_id }),  
        ContratosProp_comAdic_distribucion.find({ contratoID: contrato_id }),  
        ContratosProp_comAdic_montosFinales.find({ contratoID: contrato_id }),  
        ContratosProp_partBeneficios_resumen.find({ contratoID: contrato_id }),  
        ContratosProp_partBeneficios_distribucion.find({ contratoID: contrato_id }),  
        ContratosProp_partBeneficios_montosFinales.find({ contratoID: contrato_id }),    
        ContratosProp_entCartPr_resumen.find({ contratoID: contrato_id }),  
        ContratosProp_entCartPr_distribucion.find({ contratoID: contrato_id }),  
        ContratosProp_entCartPr_montosFinales.find({ contratoID: contrato_id }),    
        ContratosProp_entCartSn_resumen.find({ contratoID: contrato_id }),  
        ContratosProp_entCartSn_distribucion.find({ contratoID: contrato_id }),  
        ContratosProp_entCartSn_montosFinales.find({ contratoID: contrato_id }),   
        ContratosProp_retCartPr_resumen.find({ contratoID: contrato_id }),  
        ContratosProp_retCartPr_distribucion.find({ contratoID: contrato_id }),  
        ContratosProp_retCartPr_montosFinales.find({ contratoID: contrato_id }),    
        ContratosProp_retCartSn_resumen.find({ contratoID: contrato_id }),  
        ContratosProp_retCartSn_distribucion.find({ contratoID: contrato_id }),  
        ContratosProp_retCartSn_montosFinales.find({ contratoID: contrato_id }),    

        Cuotas.find({ "source.entityID": contrato_id }), 
    ]
})