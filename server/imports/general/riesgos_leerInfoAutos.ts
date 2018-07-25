

import * as lodash from 'lodash'; 

import { Riesgos } from 'imports/collections/principales/riesgos';  
import { Riesgos_InfoRamo } from 'imports/collections/principales/riesgos';
import { AutosMarcas } from 'imports/collections/catalogos/autosMarcas';  

// --------------------------------------------------------------------------------------
// para leer la información de automovil para un riesgo y movimiento particulares 
// --------------------------------------------------------------------------------------
export const leerInfoAutos = function(riesgoID, movimientoID) { 

    // 1) intentamos leer los items para el riesgo 
    let riesgo_infoRamo = Riesgos_InfoRamo.find({ riesgoID: riesgoID }).fetch(); 

    // 2) no existe --> return (vacío) ... 
    if (!riesgo_infoRamo || !riesgo_infoRamo.length) { 
        return {}; 
    }

    // 3) intentamos leer un registro justo para el movimiento 
    let riesgo_infoRamo_movimiento = riesgo_infoRamo.find(x => x.movimientoID === movimientoID); 

    // 4) existe --> leer marca y modelo y regresarlo 
    if (riesgo_infoRamo_movimiento) { 
        // ok, encontramos uno justo para el movimiento; leemos marca y modelo y regresamos ... 
        let marca = AutosMarcas.findOne(riesgo_infoRamo_movimiento.marca); 

        if (!marca || !marca.modelos) { 
            return {}; 
        }

        let modelo = marca.modelos.find(x => x._id === riesgo_infoRamo_movimiento.modelo); 

        if (!modelo) { 
            return {}; 
        }

        return { 
            marca: marca.marca, 
            modelo: modelo.modelo, 
            año: riesgo_infoRamo_movimiento.ano, 
            placa: riesgo_infoRamo_movimiento.placa, 
            serialCarroceria: riesgo_infoRamo_movimiento.serialCarroceria, 
        }; 
    }

    // 5) no encontramos un item infoRamo para el movimiento indicado; buscamos el más reciente; para hacerlo, debemos 
    // leer los números de movimiento para cada item en infoRamo y determinar cual es el movimiento que estamos 
    // recibiendo ... 
    let riesgo = Riesgos.findOne({ _id: riesgoID }, { fields: { 'movimientos._id': 1, 'movimientos.numero': 1, }}); 

    if (!riesgo) { 
        return {}; 
    }


    let riesgo_infoRamo_masNumeroMovimiento = riesgo_infoRamo.map((x) => { 
        // para cada infoRamo debemos leer su número de movimiento ... 
        let movimiento = riesgo.movimientos.find(m => m._id === x.movimientoID); 
        let numeroMovimiento = movimiento.numero; 

        x.numeroMovimiento = numeroMovimiento; 
        return x; 
    })

    // ahora ordenamos los items (infoRamo) por numeroMovimiento y regresamos el más reciente, el cual es el justo anterior; 
    // si el movimiento pasado es el 5, intentamos regresar el 4 pero no el 6 ... 
    let riesgo_infoRamo_ordenadoPorMovimiento = lodash.sortBy(riesgo_infoRamo_masNumeroMovimiento, 'numeroMovimiento'); 
    let movimientoAnterior = {} as any;        // el justo anterior es el que vamos a regresar ... 

    for(let infoRamoItem of riesgo_infoRamo_ordenadoPorMovimiento) { 
        if (infoRamoItem.numeroMovimiento > riesgo_infoRamo_movimiento.numero) { 
            break; 
        }

        movimientoAnterior = infoRamoItem; 
    }

    // en 'movimientoAnterior' debemos tener el item infoRamo que corresponden al movimiento; es decir, el más reciente
    // leemos marca y modelo y regresamos 

    let marca = AutosMarcas.findOne(movimientoAnterior.marca); 

    if (!marca || !marca.modelos) { 
        return {}; 
    }

    let modelo = marca.modelos.find(x => x._id === movimientoAnterior.modelo); 

    if (!modelo) { 
        return {}; 
    }

    return { 
        marca: marca.marca, 
        modelo: modelo.modelo, 
        año: movimientoAnterior.ano, 
        placa: movimientoAnterior.placa, 
        serialCarroceria: movimientoAnterior.serialCarroceria, 
    }; 
}