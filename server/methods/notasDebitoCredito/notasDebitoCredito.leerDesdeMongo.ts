

import * as numeral from 'numeral';
import * as moment from 'moment';
import SimpleSchema from 'simpl-schema';

import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 

import { NotasDebitoCredito } from 'imports/collections/principales/notasDebitoCredito'; 
import { Temp_Consulta_NotasDebitoCredito } from 'imports/collections/consultas/tempConsultaNotasDebitoCredito'; 
import { CuentasBancarias } from 'imports/collections/catalogos/cuentasBancarias';

Meteor.methods(
{
    'notasDebitoCredito.leerDesdeMongo': function (filtro, ciaSeleccionadaID) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaSeleccionadaID: { type: String, optional: false, },
        }).validate({ filtro2, ciaSeleccionadaID, });

        let where = {} as any;
            
        if (filtro2.numero1) { 
            if (filtro2.numero2) { 
                where.numero = { $gte: filtro2.numero1, $lte: filtro2.numero2 };
            }
            else { 
                where.numero = filtro2.numero1;
            }   
        }
            
        if (filtro2.codigo) {
            var search = new RegExp(filtro2.codigo, 'i');
            where.codigo = search;
        }

        // nótese como los 'dates' vienen como strings y deben ser convertidos ...
        if (filtro2.fecha1 && moment(filtro2.fecha1).isValid()) { 
            if (filtro2.fecha2 && moment(filtro2.fecha2).isValid()) { 
                where.fecha = { $gte: moment(filtro2.fecha1).toDate(), $lte: moment(filtro2.fecha2).toDate() };
            }
            else { 
                where.fecha = moment(filtro2.fecha1).toDate();
            }
        }
              
        if (filtro2.compania) {
            const search = new RegExp(filtro2.compania, 'i');
            const companias = Companias.find({ nombre: search }, { fields: { _id: true, }}); 
            const array = companias.map((x: any) => x._id ); 

            where.compania = { $in: array };
        }

        if (filtro2.moneda) {
            const search = new RegExp(filtro2.moneda, 'i');
            const monedas = Monedas.find({ descripcion: search }, { fields: { _id: true, }}); 
            const array = monedas.map((x: any) => x._id ); 

            where.moneda = { $in: array };
        }

        if (filtro2.cuentaBancaria) {
            const search = new RegExp(filtro2.cuentaBancaria, 'i');
            const cuentasBancarias = CuentasBancarias.find({ descripcion: search }, { fields: { _id: true, }}); 
            const array = cuentasBancarias.map((x: any) => x._id ); 

            where.cuentaBancaria = { $in: array };
        }

        if (filtro2.observaciones) {
            var search = new RegExp(filtro2.observaciones, 'i');
            where.observaciones = search;
        }

        where.cia = ciaSeleccionadaID;

        // eliminamos los asientos que el usuario pueda haber registrado antes ...
        Temp_Consulta_NotasDebitoCredito.remove({ user: this.userId });

        let notasDebitoCredito = NotasDebitoCredito.find(where).fetch();

        if (notasDebitoCredito.length == 0) {
            return "Cero registros han sido leídos desde la base de datos, para el criterio de selección indicado.";
        }

        let monedas = Monedas.find({}, { fields: { _id: 1, simbolo: 1, }}).fetch();
        let companias = Companias.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        let cuentasBancarias = CuentasBancarias.find({}, { fields: { _id: 1, tipo: 1, numero: 1, }}).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 30 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = notasDebitoCredito.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('notasDebitoCredito_leerDesdeMongo_reportProgress',
                            { myuserId: this.userId, app: 'notasDebitoCredito', process: 'leerNotasDebitoCredito' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        notasDebitoCredito.forEach((item: any) => {

            const moneda = monedas.find((x: any) => { return x._id === item.moneda; }).simbolo;
            const compania = companias.find((x: any) => { return x._id === item.compania; }).abreviatura;
            const cuentaBancariaItem = cuentasBancarias.find((x: any) => { return x._id === item.cuentaBancaria; });
            const cuentaBancaria = `${cuentaBancariaItem.numero} (${cuentaBancariaItem.tipo})`; 

            // "_id" : "7df2549b6c2b32c9c63561d3",
            // "source" : {
            //     "entityID" : "d46dfe9d55089b7084090103",
            //     "subEntityID" : "af73f99252bc843e425d651a",
            //     "origen" : "fac",
            //     "numero" : 1
            // },
            // "tipo" : "ND",
            // "tipoNegocio" : "8108e04069f62fb7c8760bac",
            // "ano" : 2019,
            // "numero" : 2,
            // "compania" : "4a3eedeba610d4116f8e5f7b",
            // "moneda" : "be3eabfd35eaca408b02a5c7",
            // "fecha" : ISODate("2019-02-05T00:00:00.000Z"),
            // "cuota" : "e91d1009daeb2efc7310a695",
            // "cuentaBancaria" : "bfbb6c21f6090f512becf576",
            // "fechaCuota" : ISODate("2018-08-01T00:00:00.000Z"),
            // "fechaVencimientoCuota" : ISODate("2018-08-31T00:00:00.000Z"),
            // "monto" : 942.17,
            // "cia" : "5b2de1753b96e06e25712bac",
            // "observaciones" : "Observaciones para la nota de débito  ..."

            let notaDbCr = {} as any;

            notaDbCr._id = new Mongo.ObjectID()._str;
            notaDbCr.user = Meteor.userId();

            notaDbCr.id = item._id,
            notaDbCr.tipo = item.tipo;
            notaDbCr.numero = `${item.ano.toString()}-${item.numero.toString()}`;
            notaDbCr.compania = compania;
            notaDbCr.moneda = moneda;
            notaDbCr.fecha = item.fecha;

            notaDbCr.fechaCuota = item.fechaCuota;
            notaDbCr.fechaVencimientoCuota = item.fechaVencimientoCuota;

            notaDbCr.cuentaBancaria = cuentaBancaria;
            notaDbCr.monto = item.monto;

            notaDbCr.cia = item.cia;

            Temp_Consulta_NotasDebitoCredito.insert(notaDbCr);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('notasDebitoCredito_leerDesdeMongo_reportProgress',
                                    { myuserId: this.userId, app: 'notasDebitoCredito', process: 'leerNotasDebitoCredito' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('notasDebitoCredito_leerDesdeMongo_reportProgress',
                                        { myuserId: this.userId, app: 'notasDebitoCredito', process: 'leerNotasDebitoCredito' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        return "Ok, hemos leído <b><em>${}</b></em> registros desde la base de datos, que cumplen con el criterio indicado.";
    }
})