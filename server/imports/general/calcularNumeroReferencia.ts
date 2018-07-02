

import * as lodash from 'lodash';

import { TiposContrato } from 'imports/collections/catalogos/tiposContrato'; 
import { TiposFacultativo } from 'imports/collections/catalogos/tiposFacultativo'; 
import { TiposSiniestro } from 'imports/collections/catalogos/tiposSiniestro'; 
import { Referencias } from 'imports/collections/principales/referencias'; 

// para asignar el número de referencia (interno) a: riesgos, contratos, ...
export const calcularNumeroReferencia = function(origen, tipoID, ano, ciaID) {

    // nótese que el consecutivo siempre es por año y no por tipo-año ...

    // leemos el tipo (de facultativo, contratos, ...), en base al origen, para obtener el prefijo;
    // con el prefijo, leemos el consecutivo, en la tabla de referencias
    let tipo: { prefijoReferencia?: string } = { };

    switch (origen) {
        case 'fac': {
            tipo = TiposFacultativo.findOne(tipoID);

            if (!tipo || !tipo.prefijoReferencia) {
                return {
                    error: true,
                    message: `Error: no hemos podido leer el tipo indicado en la tabla de tipos.
                              O el tipo no tiene un 'prefijo' definido en la maestra.`,
                };
            }
            break;
        }
        case 'contr': {
            tipo = TiposContrato.findOne(tipoID);

            if (!tipo || !tipo.prefijoReferencia) {
                return {
                    error: true,
                    message: `Error: no hemos podido leer el tipo indicado en la tabla de tipos.
                              O el tipo no tiene un 'prefijo' definido en la maestra.`,
                };
            }
            break;
        }
        case 'sin': {
            tipo = TiposSiniestro.findOne(tipoID);

            if (!tipo || !tipo.prefijoReferencia) {
                return {
                    error: true,
                    message: `Error: no hemos podido leer el tipo indicado en la tabla de tipos.
                              O el tipo no tiene un 'prefijo' definido en la maestra.`,
                };
            }
            break;
        }
        default:
            return {
                error: true,
                message: `Error: no existe (aún) una tabla de tipos para el origen: '${origen}'.`,
            };
    }


    // leemos el consecutivo para el año, origien (fac, contr, tipo y cia); en la tabla de referencias
    // si no existe agregamos un registro
    let referenciaItem = Referencias.findOne({
        origen: origen, prefijoReferencia: tipo.prefijoReferencia, ano: ano, cia: ciaID, },
        { fields: { _id: 1, consecutivo: 1, } });

    if (!referenciaItem) {
        Referencias.insert({
            _id: new Mongo.ObjectID()._str,
            origen: origen,
            prefijoReferencia: tipo.prefijoReferencia,
            ano: ano,
            cia: ciaID,
            consecutivo: 2,
        });

        referenciaItem = { consecutivo: 1, };
    } else {
        Referencias.update(
              { _id: referenciaItem._id, },
              { $inc: { consecutivo: 1 } },
        );
    }


    let consecutivo = referenciaItem.consecutivo;
    let consecutivoEditado = lodash.padStart(consecutivo.toString(), 4, '0');       // 90 -> 0090, ...

    let referencia = `${tipo.prefijoReferencia}-${ano.toString()}-${consecutivoEditado}`;

    return { error: false, referencia: referencia, };
}
