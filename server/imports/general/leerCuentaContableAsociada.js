
import { Meteor } from 'meteor/meteor'
import lodash from 'lodash'; 

import { CuentasContablesAsociadas } from '/imports/collections/catalogos/cuentasContablesAsociadas';
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

// esta función lee la cuenta contable asociada para un: tipo/moneda/compania/origen 
// la idea es que los campos moneda, compania y origen pueden ser null en mongo. 
// la función lee la cuenta que más se aproxime a los parámetros recibidos y la regresa. 
export function leerCuentaContableAsociada(tipo, moneda, compania, origen) { 

    // ------------------------------------------------------------------------------------------------
    // leemos la empresa usuaria seleccionada
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let empresaSeleccionadaID = null;

    if (companiaSeleccionada) {
        empresaSeleccionadaID = companiaSeleccionada.companiaID;
    }
    // ------------------------------------------------------------------------------------------------

    const filtro = { 
        $and: [ 
                { tipo: tipo },                 // el tipo nunca será null en mongo (primas por pagar, corretaje, sin por pagar, ...)
                { $or: [ 
                            { moneda: moneda }, // para el resto de los items, se busca el valor, o null si no se encuentra uno ...  
                            { moneda: null }, 
                            { moneda: { $exists: false } }
                        ]
                }, 
                { $or: [ 
                            { compania: compania }, 
                            { compania: null }, 
                            { compania: { $exists: false } }
                        ]
                }, 
                { $or: [ 
                            { origen: origen }, 
                            { origen: null },
                            { origen: { $exists: false } }
                        ]
                }, 
                { cia: empresaSeleccionadaID }
            ]
    }; 

    const cuentasContablesLeidas = CuentasContablesAsociadas.find(filtro).fetch(); 

    if (!cuentasContablesLeidas.length) { 
        return null; 
    }

    // si las cuentas asociadas no corresponden a una moneda, compañía u origen, pueden no tener esos 'keys' en el documento. 
    // de ser así, el sort que sigue pareciera que no funciona. Por esa razón, recorremos los registros y agregamos los keys cuando no existen ... 
    for (const cuentaAsociada of cuentasContablesLeidas) { 
        if (!cuentaAsociada.moneda) { 
            cuentaAsociada.moneda = null; 
        }
        if (!cuentaAsociada.compania) { 
            cuentaAsociada.compania = null; 
        }
        if (!cuentaAsociada.origen) { 
            cuentaAsociada.origen = null; 
        }
    }
             
    // mongo puede regresar varias cuentas; el objetivo del sort es regresar la que tenga un valor, por ejemplo, en la moneda, 
    // en vez de la que tenga un null ... 
    const cuentaContable = lodash(cuentasContablesLeidas).orderBy(['moneda', 'compania', 'origen'], ['asc', 'asc', 'asc']).first(); 

    return cuentaContable; 
}