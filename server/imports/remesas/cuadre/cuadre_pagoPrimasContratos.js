
import { Mongo } from 'meteor/mongo'; 
import lodash from 'lodash'; 
import { leerCuentaContableAsociada } from '/server/imports/general/leerCuentaContableAsociada'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 

export const cuadre_pagoPrimasContratos = (remesa, cuota, contrato, numeroTransaccion) => {

    // grabamos una transacción al cuadre que corresponde a una prima (fac) pagada
    const compania = Companias.findOne(cuota.compania);
    const moneda = Monedas.findOne(cuota.moneda);

    // leemos el pago específico, en el array de pagos de la cuota, que corresponde a la remesa
    const pago = lodash.find(cuota.pagos, pago => { return pago.remesaID === remesa._id; });

    numeroTransaccion += 10;

    const transaccion = {
        _id: new Mongo.ObjectID()._str,
        transaccion: {
            numero: numeroTransaccion,
            descripcion: `Pago de primas (contr) - Contrato: (${cuota.source.origen}) ${cuota.source.numero} - cuota: ${cuota.numero.toString()} de ${cuota.cantidad.toString()}`,
        },
        partidas: []
    };

    // leemos la cuenta contable asociada, para asignar a la partida 
    const cuentaContable = leerCuentaContableAsociada(50, pago.moneda, cuota.compania, cuota.source.origen); 

    const partida = {};
    const numeroPartida = 10;

    partida._id = new Mongo.ObjectID()._str;
    partida.numero = numeroPartida;
    partida.tipo = 1200;      // 1200: prima pagada (contratos)
    partida.codigo = cuentaContable && cuentaContable.cuentaContable ? cuentaContable.cuentaContable : null;
    partida.compania = cuota.compania;
    partida.descripcion = `Prima pagada - ${compania.abreviatura} - ${moneda.simbolo}`;
    partida.referencia = `${cuota.source.origen}-${cuota.source.numero}; cuota: ${cuota.numero.toString()}/${cuota.cantidad.toString()}`;
    partida.moneda = pago.moneda;
    partida.monto = lodash.round(pago.monto, 2);    // el pago viene positivo; lo dejamos pues debemos hacer un débito a la cuenta 'primas por pagar'

    transaccion.partidas.push(partida);

    // finalmente, agregamos la transacción (con todas sus partidas) al cuadre de la remesa
    remesa.cuadre.push(transaccion);

    return numeroTransaccion;
}