
import { Mongo } from 'meteor/mongo'; 
import lodash from 'lodash'; 
import { leerCuentaContableAsociada } from '/server/imports/general/leerCuentaContableAsociada'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 

export const cuadre_cobroSiniestros = (remesa, cuota, siniestro, numeroTransaccion) => {

    // grabamos la partida # 10 de la transaccion, con la cuota cobrada ...
    let compania = Companias.findOne(cuota.compania);
    const pago = lodash.find(cuota.pagos, pago => { return pago.remesaID === remesa._id; });
    const moneda = Monedas.findOne(pago.moneda);

    // leemos la cuenta contable asociada, para asignar a la partida 
    let cuentaContable = leerCuentaContableAsociada(60, pago.moneda, cuota.compania, cuota.source.origen); 

    numeroTransaccion += 10;

    const transaccion = {
        _id: new Mongo.ObjectID()._str,
        transaccion: {
            numero: numeroTransaccion,
            descripcion: `Cobro de siniestros - Siniestro y número de liq: (${cuota.source.origen}) ${cuota.source.numero} - cuota: ${cuota.numero.toString()} de ${cuota.cantidad.toString()}`,
        },
        partidas: []
    };

    let partida = {};
    // let numeroPartida = 10;

    // partida._id = new Mongo.ObjectID()._str;
    // partida.numero = numeroPartida;
    // partida.tipo = 600;      // 600: siniestro cobrado
    // partida.codigo = cuentaContable && cuentaContable.cuentaContable ? cuentaContable.cuentaContable : null;
    // partida.compania = cuota.compania;
    // partida.descripcion = `Siniestro cobrado - ${compania.abreviatura} - ${moneda.simbolo}`;
    // partida.referencia = `${cuota.source.origen}-${cuota.source.numero}; cuota: ${cuota.numero.toString()}/${cuota.cantidad.toString()}`;
    // partida.moneda = pago.moneda;
    // partida.monto = pago.monto * -1;  // el monto cobrado normalmente viene negativo

    // transaccion.partidas.push(partida);

    // ahora grabamos el monto a la cuenta primas por pagar (nótese que 'cancelamos' la prima por pagar con un débito a la cuenta)

    // leemos la cuenta contable asociada, para asignar a la partida 
    cuentaContable = leerCuentaContableAsociada(70, pago.moneda, siniestro.compania, cuota.source.origen); 

    partida = {};
    const numeroPartida = 10;

    compania = Companias.findOne(siniestro.compania);

    partida._id = new Mongo.ObjectID()._str;
    partida.numero = numeroPartida;
    partida.tipo = 700;      // 700: siniestros por pagar
    partida.codigo = cuentaContable && cuentaContable.cuentaContable ? cuentaContable.cuentaContable : null;
    partida.compania = siniestro.compania;
    partida.descripcion = `Siniestros por pagar - ${compania.abreviatura} - ${moneda.simbolo}`;
    partida.referencia = `${cuota.source.origen}-${cuota.source.numero}; cuota: ${cuota.numero.toString()}/${cuota.cantidad.toString()}`;
    partida.moneda = pago.moneda;
    partida.monto = lodash.round(pago.monto, 2);    // el monto del pago es negativo; debe serlo pues ahora corresponde a un monto por pagar

    transaccion.partidas.push(partida);

    // finalmente, agregamos la transacción (con todas sus partidas) al cuadre de la remesa
    remesa.cuadre.push(transaccion);

    return numeroTransaccion;
}