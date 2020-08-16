
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 

import lodash from 'lodash';

import SimpleSchema from 'simpl-schema';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 
// import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
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

        const remesa = Remesas.findOne(remesaID);

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

        const instrumentoPago = remesa.instrumentoPago;

        const companias = Companias.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();
        const monedas = Monedas.find({}, { fields: { _id: true, simbolo: true, }}).fetch();
        const bancos = Bancos.find({}, { fields: { _id: true, abreviatura: true, }}).fetch();

        // const compania = companias.find((x) => { return x._id === remesa.compania; });
        // const moneda = monedas.find((x) => { return x._id === remesa.moneda; });
        const banco = bancos.find((x) => { return x._id === instrumentoPago.banco });
        // const cuentaBancaria = null;

        // if (instrumentoPago && instrumentoPago.banco && instrumentoPago.cuentaBancaria) {
        //     cuentaBancaria = CuentasBancarias.findOne(instrumentoPago.cuentaBancaria);
        // }

        // -------------------------------------------------------------------------------------------------
        // resumimos las partidas del cuadre para obtener el asiento contable; además, obviamos las partidas 
        // nota: primero creamos un array simple con las partidas del asiento (obtenidas desde el cuadre); luego, 
        // iteramos el array para resumirlo por tipo, cuenta, moneda, compañía, etc. 
        const partidasArray = [];
        let consecutivo = 1; 

        remesa.cuadre.forEach((transaccion) => {
            transaccion.partidas.forEach((p) => {
                let partida = {};

                const compania = companias.find((x) => { return x._id === p.compania; });
                const moneda = monedas.find((x) => { return x._id === p.moneda; });

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

        const partidasResumenArray = [];
        // const partida = {};
        // let granTotal = 0;
        let numero = 0; 
        const partidasGroupByTipoCodigoCompaniaMoneda_array = lodash.groupBy(partidasArray, 'grupo');

        for (const key in partidasGroupByTipoCodigoCompaniaMoneda_array) {

            const groupArray = partidasGroupByTipoCodigoCompaniaMoneda_array[key];
            const firstItemInGroup = groupArray[0];

            const rubro = firstItemInGroup.tipo;
            const codigo = firstItemInGroup.codigo;
            const compania = firstItemInGroup.compania;
            const moneda = firstItemInGroup.moneda;

            const sumOfMonto = lodash.sumBy(groupArray, 'monto');
            numero += 10; 

            const partida = {
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