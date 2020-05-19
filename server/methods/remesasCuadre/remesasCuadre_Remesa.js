
import { Mongo } from 'meteor/mongo'; 
import numeral from 'numeral';
import lodash from 'lodash'; 

import { leerCuentaContableAsociada } from '/server/imports/general/leerCuentaContableAsociada'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 

let transaccion_Remesa = function transaccion_Remesa(remesa, numeroTransaccion) {

    // grabamos la partida (o línea) # 10 del cuadre, con el monto (completo) de la remesa ...
    // esta primera partida del cuadre muestra, simplemente, el monto de la remesa
    let compania = Companias.findOne(remesa.compania);
    let moneda = Monedas.findOne(remesa.moneda);

    numeroTransaccion += 10;

    let transaccion = {
        _id: new Mongo.ObjectID()._str,
        transaccion: {
            numero: numeroTransaccion,
            descripcion: `Remesa número: ${remesa.numero.toString()} - ${remesa.miSu} -
                          ${compania.abreviatura} - ${moneda.simbolo} -
                          ${numeral(remesa.instrumentoPago.monto).format('0,0.00')}`,
        },
        partidas: []
    };

    // leemos la cuenta contable asociada, para asignar a la partida 
    // nótese como la cuenta contable de tipo 'transitoria' (para contabilizar el monto de la remesa) no tiene un valor en 'origen' 
    // la razón es que una remesa puede contener primas de varios origenes mesclados, por ejemplo, primas de fac y cont juntas 

    // si la remesa es del tipo 'SU' usamos la cuenta 'transitoria'; para remesas del tipo 'MI', usamos la cuenta contable 
    // asociada en la cuenta bancaria ... 

    let cuentaContable = null; 

    if (remesa.miSu === "SU") { 
        let cuentaContableAsociada = leerCuentaContableAsociada(10, remesa.moneda, remesa.compania, null); 
        if (cuentaContableAsociada) { 
            cuentaContable = cuentaContableAsociada.cuentaContable; 
        }
    } else { 
        let cuentaBancariaID = remesa && remesa.instrumentoPago && remesa.instrumentoPago.cuentaBancaria ? remesa.instrumentoPago.cuentaBancaria : "xyz"; 
        let cuentaBancaria = CuentasBancarias.findOne(cuentaBancariaID); 

        if (cuentaBancaria && cuentaBancaria.cuentaContable) { 
            cuentaContable = cuentaBancaria.cuentaContable; 
        }
    }
    

    let partida = {};
    let numeroPartida = 1;

    partida._id = new Mongo.ObjectID()._str;
    partida.numero = numeroPartida;
    partida.tipo = 10;      // 10: remesa
    partida.codigo = cuentaContable;
    partida.compania = remesa.compania;
    partida.descripcion = `Remesa número: ${remesa.numero.toString()} - ${remesa.miSu} - ${compania.abreviatura} - ${moneda.simbolo} - ${numeral(remesa.instrumentoPago.monto).format('0,0.00')}`;
    partida.referencia = `Remesa ${remesa.numero.toString()} - ${compania.abreviatura} - ${moneda.simbolo}`;
    partida.moneda = remesa.moneda;
    partida.monto = remesa.instrumentoPago.monto;

    if (remesa.miSu == 'MI') {
        partida.monto *= -1;
    }

    partida.monto = lodash.round(partida.monto, 2);

    transaccion.partidas.push(partida);

    remesa.cuadre.push(transaccion);

    return numeroTransaccion;
};

RemesasCuadre_Methods.transaccion_Remesa = transaccion_Remesa;
