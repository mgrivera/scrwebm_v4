
import { Mongo } from 'meteor/mongo'; 
import lodash from 'lodash'; 
import { leerCuentaContableAsociada } from '/server/imports/general/leerCuentaContableAsociada'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 

export const cuadre_pagoSiniestros = (remesa, cuota, siniestro, numeroTransaccion) => {

    // grabamos la partida # 10 de la transaccion, con la cuota cobrada ...
    const compania = Companias.findOne(cuota.compania);
    const pago = lodash.find(cuota.pagos, pago => { return pago.remesaID === remesa._id; });
    const moneda = Monedas.findOne(pago.moneda);

    numeroTransaccion += 10;

    const transaccion = {
        _id: new Mongo.ObjectID()._str,
        transaccion: {
            numero: numeroTransaccion,
            descripcion: `Pago de siniestros - Siniestro y número de liq: (${cuota.source.origen}) ${cuota.source.numero} - cuota: ${cuota.numero.toString()} de ${cuota.cantidad.toString()}`,
        },
        partidas: []
    };

    
    // leemos la cuenta contable asociada, para asignar a la partida 
    const cuentaContable = leerCuentaContableAsociada(70, pago.moneda, cuota.compania, cuota.source.origen); 

    const partida = {};
    const numeroPartida = 10;

    partida._id = new Mongo.ObjectID()._str;
    partida.numero = numeroPartida;
    partida.tipo = 800;      // 800: siniestro pagado al cedente (débito a la cuenta siniestros por pagar)
    partida.codigo = cuentaContable && cuentaContable.cuentaContable ? cuentaContable.cuentaContable : null;
    partida.compania = cuota.compania;
    partida.descripcion = `Siniestro pagado - ${compania.abreviatura} - ${moneda.simbolo}`;
    partida.referencia = `${cuota.source.origen}-${cuota.source.numero}; cuota: ${cuota.numero.toString()}/${cuota.cantidad.toString()}`;
    partida.moneda = pago.moneda;
    partida.monto = lodash.round(pago.monto, 2);  // el monto debe venir positivo y lo dejamos así, pues hacemos un débito a la cuenta 'siniestros por pagar'

    transaccion.partidas.push(partida);

    // finalmente, agregamos la transacción (con todas sus partidas) al cuadre de la remesa
    remesa.cuadre.push(transaccion);

    return numeroTransaccion;
}