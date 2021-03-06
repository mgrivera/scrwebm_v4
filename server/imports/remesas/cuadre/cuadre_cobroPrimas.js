
import { Mongo } from 'meteor/mongo'; 

import lodash from 'lodash';
import numeral from 'numeral'; 

import { leerCuentaContableAsociada } from '/server/imports/general/leerCuentaContableAsociada';  

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 

// la empresa usuaria puede ser: corredor de reaseguros (CORRR) / reasegurador (REA)

export const cuadre_cobroPrimas = (remesa, cuota, numeroTransaccion, empresaUsuariaTipo, parametrosEjecucion) => {

    // parametrosEjecucion = {
    //     generarMontosEnFormaProporcional: boolean,
    //     leerMontosMismaMoneda: boolean,
    // };

    // grabamos una transacción que corresponde a un cobro de prima de un riesgo (facultativo)
    const compania = Companias.findOne(cuota.compania);
    const moneda = Monedas.findOne(cuota.moneda);

    // buscamos el pago específico en la cuota, pues una cuota puede tener más de un pago
    const pago = lodash.find(cuota.pagos, pago => { return pago.remesaID === remesa._id; });
    const monedaPago = Monedas.findOne(pago.moneda); 

    numeroTransaccion += 10;

    const transaccion = {
        _id: new Mongo.ObjectID()._str,
        transaccion: {
            numero: numeroTransaccion,
            descripcion: `Cobro de primas (fac) por ${monedaPago.simbolo} ${numeral(Math.abs(pago.monto)).format("0,0.00")} - Riesgo y movimiento: (${cuota.source.origen}) ${cuota.source.numero} - cuota: ${cuota.numero.toString()} de ${cuota.cantidad.toString()}`,
        },
        partidas: []
    };

    // let partida = {};
    let numeroPartida = 0;
    let balance = pago.monto * -1;

    // ---------------------------------------------------------------------------------------------------
    // calculamos el porcentaje del monto cobrado, para aplicar al monto de reaseguradores ...
    let proporcionCobro = 100;
    if (cuota.monto != 0) {
        proporcionCobro = (pago.monto * -1) / cuota.monto;
    }
    // ---------------------------------------------------------------------------------------------------

    // leemos las cuotas de reaseguradores y las agregamos a la transacción ...
    // nótese que leemos justo las cuotas que corresponden; si, por ejemplo, un movimiento de un riesgo tiene 3 cuotas
    // y estamos cobrando la 2 (ej: 2 de 3), debemos leer las 2das cuotas para reaseguradores
    const restoCuotas = Cuotas.find({ $and: [{ 'source.entityID': { $eq: cuota.source.entityID }},
                                          { 'source.subEntityID': { $eq: cuota.source.subEntityID }},
                                        //   { compania: { $ne: cuota.compania }},
                                          { numero: { $eq: cuota.numero }}
                                  ]}).fetch();

    // ---------------------------------------------------------------------------------------------------
    // el usuario puede indicar que se lean cuota de la misma moneda a la originalmente cobrada
    if (parametrosEjecucion.leerMontosMismaMoneda) {
        lodash.remove(restoCuotas, (x) => { return x.moneda != cuota.moneda; });
    }
    // ---------------------------------------------------------------------------------------------------

    // primero leemos solo los montos que corresponden a companias diferentes (ie: reaseguradores) a la compañía del cobro (cedente) 
    restoCuotas.filter(x => x.compania != cuota.compania ).forEach(cuotaReasegurador => {
        const partida = {};
        numeroPartida += 10;

        const reasegurador = Companias.findOne(cuotaReasegurador.compania);

        // leemos la cuenta contable asociada, para asignar a la partida 
        const cuentaContable = leerCuentaContableAsociada(50, cuotaReasegurador.moneda, cuotaReasegurador.compania, cuota.source.origen); 

        partida._id = new Mongo.ObjectID()._str;
        partida.numero = numeroPartida;
        partida.tipo = 200;      // 200: prima por pagar a reaseguradores (pendientes)
        partida.codigo = cuentaContable && cuentaContable.cuentaContable ? cuentaContable.cuentaContable : null;
        partida.compania = cuotaReasegurador.compania;
        partida.descripcion = `Prima por pagar - ${reasegurador.abreviatura} - ${moneda.simbolo}`;
        partida.referencia = `${cuota.source.origen}-${cuota.source.numero}; cuota: ${cuota.numero.toString()}/${cuota.cantidad.toString()}`;
        partida.moneda = cuotaReasegurador.moneda;
        partida.monto = cuotaReasegurador.monto;

        if (parametrosEjecucion.generarMontosEnFormaProporcional) {
            // aplicamos la proporción que corresponde al monto cobrado ...
            partida.monto *= proporcionCobro;
        }

        partida.monto = lodash.round(partida.monto, 2); 

        transaccion.partidas.push(partida);
        balance += partida.monto;
    });








    // ahora leemos cuotas diferentes a la original, pero para la *misma* compañía del cobro; las consideramos como un monto 
    // de corretaje por pagar 
    restoCuotas.filter(x => x.compania === cuota.compania && x._id != cuota._id).forEach(cuotacedente => {
        const partida = {};
        numeroPartida += 10;

        const cedente = Companias.findOne(cuotacedente.compania);

        // leemos la cuenta contable que corresonde al corretaje por pagar 
        const cuentaContable = leerCuentaContableAsociada(55, cuotacedente.moneda, cuotacedente.compania, cuota.source.origen);

        partida._id = new Mongo.ObjectID()._str;
        partida.numero = numeroPartida;
        partida.tipo = 250;      // 200: corretaje por pagar al cedente 
        partida.codigo = cuentaContable && cuentaContable.cuentaContable ? cuentaContable.cuentaContable : null;
        partida.compania = cuotacedente.compania;
        partida.descripcion = `Corretaje por pagar - ${cedente.abreviatura} - ${moneda.simbolo}`;
        partida.referencia = `${cuota.source.origen}-${cuota.source.numero}; cuota: ${cuota.numero.toString()}/${cuota.cantidad.toString()}`;
        partida.moneda = cuotacedente.moneda;
        partida.monto = cuotacedente.monto;

        if (parametrosEjecucion.generarMontosEnFormaProporcional) {
            // aplicamos la proporción que corresponde al monto cobrado ...
            partida.monto *= proporcionCobro;
        }

        partida.monto = lodash.round(partida.monto, 2);

        transaccion.partidas.push(partida);
        balance += partida.monto;
    });












    // finalmente, agregamos la partida que corresponde a la diferencia (corretaje)
    // nota: la diferencia es siempre considerada como un ingreso; sin embargo, depende del tipo de la empresa usuaria: 
    // CORRR: corretaje / REA: ingresos por negocio facultativo 
    if (balance != 0) {

        // leemos la cuenta contable asociada, para asignar a la partida 
        const cuentaContable = leerCuentaContableAsociada(90, pago.moneda, compania._id, cuota.source.origen); 

        const partida = {};
        numeroPartida += 10;

        partida._id = new Mongo.ObjectID()._str;
        partida.numero = numeroPartida;
        partida.tipo = 300;      // 300: ingresos por cobro de primas
        partida.codigo = cuentaContable && cuentaContable.cuentaContable ? cuentaContable.cuentaContable : null;
        partida.compania = compania._id;
        partida.descripcion = `Ingresos por cobro de prima (fac) - ${compania.abreviatura} - ${moneda.simbolo}`;
        partida.referencia = `${cuota.source.origen}-${cuota.source.numero}; cuota: ${cuota.numero.toString()}/${cuota.cantidad.toString()}`;
        partida.moneda = pago.moneda;
        partida.monto = balance * -1;

        partida.monto = lodash.round(partida.monto, 2); 

        transaccion.partidas.push(partida);
    }

    // finalmente, agregamos la transacción (con todas sus partidas) al cuadre de la remesa
    remesa.cuadre.push(transaccion);

    return numeroTransaccion;
}