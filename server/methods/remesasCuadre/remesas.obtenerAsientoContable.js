
import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';

import SimpleSchema from 'simpl-schema';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Remesas } from '/imports/collections/principales/remesas';  

Meteor.methods(
{
    'remesas.obtenerAsientoContable': function (remesaID, ciaSeleccionada, opciones) {

        new SimpleSchema({
            remesaID: { type: String, optional: false },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false },
            opciones: { type: Object, blackbox: true, optional: false },
        }).validate({ remesaID, ciaSeleccionada, opciones, });

        let remesa = Remesas.findOne(remesaID);

        if (!remesa) {
            throw new Meteor.Error('error-base-datos',
                `Error inesperado: no hemos podido leer la remesa indicada en la base de datos
                 del programa en el servidor.
                `);
        }

        if (!remesa.cuadre || !lodash.isArray(remesa.cuadre) || !remesa.cuadre.length) {
            throw new Meteor.Error('error-cuadre-remesas',
                `Error: no hemos podido leer un cuadre en la remesa que se ha indicado.<br />
                 Probablemente, esta remesa <b>no tiene un cuadre registrado aún</b>. Ud. debe construir un cuadre
                 para la remesa y solo luego intentar ejecutar esta función.
                `);
        }

        // si ya fue obtenido un asiento para esta remesa, lo eliminamos antes de intentar obtenerlo y grabarlo nuevamente
        if (remesa.asientoContable && remesa.asientoContable.length) { 
            remesa.asientoContable.length = 0;
        }
            
        if (!remesa.asientoContable) { 
            remesa.asientoContable = [];
        }

        if (opciones.resumirPartidasAsientoContable) { 

        }

        let instrumentoPago = remesa.instrumentoPago;

        let companias = Companias.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();
        let monedas = Monedas.find({}, { fields: { _id: true, simbolo: true, }}).fetch();
        let bancos = Bancos.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();

        let compania = companias.find((x) => { return x._id === remesa.compania; });
        let moneda = monedas.find((x) => { return x._id === remesa.moneda; });
        let banco = bancos.find((x) => { return x._id === instrumentoPago.banco });
        let cuentaBancaria = null;

        if (instrumentoPago && instrumentoPago.banco && instrumentoPago.cuentaBancaria) {
            cuentaBancaria = CuentasBancarias.findOne(instrumentoPago.cuentaBancaria);
        }

        // -------------------------------------------------------------------------------------------------
        // resumimos las partidas del cuadre para obtener el asiento contable; además, obviamos las partidas 
        // nota: primero creamos un array simple con las partidas del asiento (obtenidas desde el cuadre); luego, 
        // iteramos el array para resumirlo por tipo, cuenta, moneda, compañía, etc. 
        let partidasArray = [];
        let consecutivo = 1; 

        remesa.cuadre.forEach((transaccion) => {
            transaccion.partidas.forEach((p) => {
                let partida = {};

                let compania = companias.find((x) => { return x._id === p.compania; });
                let moneda = monedas.find((x) => { return x._id === p.moneda; });

                // el usuario puede decidir si resumir por cuenta contable o no. De no hacerlo, agregamos un valor diferente 
                // para cada partida abajo, para que el código nunca agrupe ... 
                let grupo = ""; 
                if (opciones.resumirPartidasAsientoContable) { 
                    // el usuario quiere agrupar por cuenta contable 
                    grupo = `${p.tipo} ${(p.codigo ? p.codigo : 'x')} ${compania.abreviatura} ${moneda.simbolo}`; 
                } else { 
                    // el usuario quiere todas las partidas, sin agrupar ... 
                    grupo = consecutivo.toString(); 
                }

                partida = {
                    // para agrupar (y resumir) más abajo por: tipo-codigoContable-compania-moneda 
                    grupo: grupo, 
                    tipo: p.tipo,
                    codigo: p.codigo,
                    compania: compania._id,
                    moneda: moneda._id,
                    monto: lodash.round(p.monto, 2),
                };
                partidasArray.push(partida);
                consecutivo += 1; 
            })
        })

        let partidasResumenArray = [];
        partida = {};
        granTotal = 0;
        let numero = 0; 
        let partidasGroupByTipoCodigoCompaniaMoneda_array = lodash.groupBy(partidasArray, 'grupo');

        for (let key in partidasGroupByTipoCodigoCompaniaMoneda_array) {

            let groupArray = partidasGroupByTipoCodigoCompaniaMoneda_array[key];
            let firstItemInGroup = groupArray[0];

            let rubro = firstItemInGroup.tipo;
            let codigo = firstItemInGroup.codigo;
            let compania = firstItemInGroup.compania;
            let moneda = firstItemInGroup.moneda;

            let sumOfMonto = lodash.sumBy(groupArray, 'monto');
            numero += 10; 

            partida = {
                _id: new Mongo.ObjectID()._str, 
                numero: numero, 
                moneda: moneda,
                tipo: rubro,
                codigo: codigo ? codigo : '',
                compania: compania,
                descripcion: remesa.observaciones ? remesa.observaciones : "Indefinido",
                referencia: `${remesa.instrumentoPago.numero} ${remesa.instrumentoPago.tipo} ${banco.abreviatura}`,
                monto: lodash.round(sumOfMonto, 2),
            };

            partidasResumenArray.push(partida);
        }

        // grabamos el asiento obtenido a la remesa en mongo 
        partidasResumenArray.forEach((p) => { 
            remesa.asientoContable.push(p); 
        })

        Remesas.update( { _id: remesa._id }, { $set: { asientoContable: remesa.asientoContable }});
        
        return 'Ok, el asiento contable para la remesa ha sido construido en forma satisfactoria.'; 
    }
})


function descripcionTipoPartida(rubro) {
    // esta función regresa el nombre del rubro, para que sirva como descripción en el resumen de la
    // remesa ...
    switch (rubro) {
        case 10: {
            return 'Monto cobrado/pagado en la remesa';
            break;
        }
        case 100: {
            return 'Primas cobradas - facultativo';
            break;
        }
        case 200: {
            return 'Primas por pagar - facultativo';
            break;
        }
        case 300: {
            return 'Corretaje - facultativo';
            break;
        }
        case 400: {
            return 'Prima pagada - facultativo';
            break;
        }
        case 600: {
            return 'Siniestros cobrados';
            break;
        }
        case 700: {
            return 'Siniestros por pagar';
            break;
        }
        case 800: {
            return 'Siniestros pagados';
            break;
        }
        case 900: {
            return 'Primas cobradas - contratos';
            break;
        }
        case 1000: {
            return 'Primas por pagar - contratos';
            break;
        }
        case 1100: {
            return 'Corretaje - contratos';
            break;
        }
        default: { 
            return 'Rubro indefinido';
        }
    }
}