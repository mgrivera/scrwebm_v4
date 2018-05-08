

import numeral from 'numeral';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';

import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Contratos } from '/imports/collections/principales/contratos'; 

Meteor.methods(
{
    'contratos.leerDesdeMongo': function (filtro, ciaSeleccionadaID) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaSeleccionadaID: { type: String, optional: false, },
        }).validate({ filtro2, ciaSeleccionadaID, });

        let where = {};

        if (filtro2._id)
            where._id = filtro2._id;

        if (filtro2.numero1)
            if (filtro2.numero2)
                where.numero = { $gte: filtro2.numero1, $lte: filtro2.numero2 };
            else
                where.numero = filtro2.numero1;

        if (filtro2.codigo) {
            var search = new RegExp(filtro2.codigo, 'i');
            where.codigo = search;
        }

        if (filtro2.referencia) {
            var search = new RegExp(filtro2.referencia, 'i');
            where.referencia = search;
        }

        // nótese como los 'dates' vienen como strings y deben ser convertidos ...
        if (filtro2.desde1 && moment(filtro2.desde1).isValid())
            if (filtro2.desde2 && moment(filtro2.desde2).isValid())
                where.desde = { $gte: moment(filtro2.desde1).toDate(), $lte: moment(filtro2.desde2).toDate() };
            else
                where.desde = moment(filtro2.desde1).toDate();

        if (filtro2.hasta1 && moment(filtro2.hasta1).isValid())
            if (filtro2.hasta2 && moment(filtro2.hasta2).isValid())
                where.hasta = { $gte: moment(filtro2.hasta1).toDate(), $lte: moment(filtro2.hasta2).toDate() };
            else
                where.hasta = moment(filtro2.hasta1).toDate();

        if (filtro2.compania && filtro2.compania.length) {
            let array = _.clone(filtro2.compania);
            where.compania = { $in: array };
        };

        if (filtro2.tipo && filtro2.tipo.length) {
            let array = _.clone(filtro2.tipo);
            where.tipo = { $in: array };
        };

        if (filtro2.ramo && filtro2.ramo.length) {
            let array = _.clone(filtro2.ramo);
            where.ramo = { $in: array };
        };

        if (filtro2.suscriptor && filtro2.suscriptor.length) {
            let array = _.clone(filtro2.suscriptor);
            where.suscriptor = { $in: array };
        };

        if (filtro2.descripcion) {
            let search = new RegExp(filtro2.descripcion, 'i');
            where.descripcion = search;
        };

        where.cia = ciaSeleccionadaID;

        // eliminamos los items que el usuario pueda haber registrado antes ...
        Temp_Consulta_Contratos.remove({ user: this.userId });

        let contratos = Contratos.find(where).fetch();

        if (contratos.length == 0) {
            return "Cero registros han sido leídos desde la base de datos";
        };

        let companias = Companias.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        let suscriptores = Suscriptores.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        let tipos = TiposContrato.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        let ramos = Ramos.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 30 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = contratos.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('contratos_leerContratos_reportProgress',
                            { myuserId: this.userId, app: 'contratos', process: 'leerContratos' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        contratos.forEach((item) => {

            let suscriptor = _.some(suscriptores, (x) => { return x._id === item.suscriptor; }) ?
                             _.find(suscriptores, (x) => { return x._id === item.suscriptor; }).abreviatura :
                             'Indefinido';

            let tipo = _.some(tipos, (x) => { return x._id === item.tipo; }) ?
                         _.find(tipos, (x) => { return x._id === item.tipo; }).abreviatura :
                         'Indefinido';

            let compania = _.some(companias, (x) => { return x._id === item.compania; }) ?
                           _.find(companias, (x) => { return x._id === item.compania; }).abreviatura :
                           'Indefinido';

            let ramo = _.some(ramos, (x) => { return x._id === item.ramo; }) ?
                       _.find(ramos, (x) => { return x._id === item.ramo; }).abreviatura :
                       'Indefinido';

            let contrato = {};

            contrato._id = new Mongo.ObjectID()._str;

            contrato.id = item._id,
            contrato.numero = item.numero;
            contrato.codigo = item.codigo;
            contrato.referencia = item.referencia;
            contrato.desde = item.desde;
            contrato.hasta = item.hasta;
            contrato.compania = compania;
            contrato.suscriptor = suscriptor;
            contrato.tipo = tipo;
            contrato.ramo = ramo;
            contrato.descripcion = item.descripcion;

            contrato.cia = item.cia;
            contrato.user = Meteor.userId();

            Temp_Consulta_Contratos.insert(contrato);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contratos_leerContratos_reportProgress',
                                    { myuserId: this.userId, app: 'contratos', process: 'leerContratos' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contratos_leerContratos_reportProgress',
                                        { myuserId: this.userId, app: 'contratos', process: 'leerContratos' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, los contratos que cumplen el criterio indicado, han sido leídos desde la base de datos.";
    }
});
