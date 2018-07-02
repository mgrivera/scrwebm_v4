
import numeral from 'numeral';
import moment from 'moment';
import lodash from 'lodash';
import SimpleSchema from 'simpl-schema';

import { Temp_Consulta_Riesgos } from '/imports/collections/consultas/tempConsultaRiesgos'; 
import { Riesgos } from '/imports/collections/principales/riesgos'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { TiposFacultativo } from '/imports/collections/catalogos/tiposFacultativo'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

Meteor.methods(
{
    'riesgos.leerDesdeMongo': function (filtro, ciaSeleccionadaID) {

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
            let array = lodash.clone(filtro2.compania);
            where.compania = { $in: array };
        };

        if (filtro2.estado && filtro2.estado.length) {
            let array = lodash.clone(filtro2.estado);
            where.estado = { $in: array };
        };

        if (filtro2.moneda && filtro2.moneda.length) {
            let array = lodash.clone(filtro2.moneda);
            where.moneda = { $in: array };
        };

        if (filtro2.indole && filtro2.indole.length) {
            let array = lodash.clone(filtro2.indole);
            where.indole = { $in: array };
        };

        if (filtro2.ramo && filtro2.ramo.length) {
            let array = lodash.clone(filtro2.ramo);
            where.ramo = { $in: array };
        };

        if (filtro2.asegurado && filtro2.asegurado.length) {
            let array = lodash.clone(filtro2.asegurado);
            where.asegurado = { $in: array };
        };

        if (filtro2.corredor && filtro2.corredor.length) {
            let array = lodash.clone(filtro2.corredor);
            where.corredor = { $in: array };
        };

        if (filtro2.suscriptor && filtro2.suscriptor.length) {
            let array = lodash.clone(filtro2.suscriptor);
            where.suscriptor = { $in: array };
        };

        if (filtro2.tipo && filtro2.tipo.length) {
            let array = lodash.clone(filtro2.tipo);
            where.tipo = { $in: array };
        };

        if (filtro2.comentarios) {
            let search = new RegExp(filtro2.comentarios, 'i');
            where.comentarios = search;
        };

        where.cia = ciaSeleccionadaID;

        // eliminamos los asientos que el usuario pueda haber registrado antes ...
        Temp_Consulta_Riesgos.remove({ user: this.userId });

        let riesgos = Riesgos.find(where).fetch();

        if (riesgos.length == 0) {
            return "Cero registros han sido leídos desde la base de datos";
        };

        let suscriptores = Suscriptores.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        let monedas = Monedas.find({}, { fields: { _id: 1, simbolo: 1, }}).fetch();
        let companias = Companias.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        let ramos = Ramos.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        let asegurados = Asegurados.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        let tiposFacultativo = TiposFacultativo.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 30 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = riesgos.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('riesgos_leerRiesgos_reportProgress',
                            { myuserId: this.userId, app: 'riesgos', process: 'leerRiesgos' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        riesgos.forEach((item) => {

            let suscriptor = lodash.some(suscriptores, (x) => { return x._id === item.suscriptor; }) ?
                             lodash.find(suscriptores, (x) => { return x._id === item.suscriptor; }).abreviatura :
                             'Indefinido';

            let moneda = lodash.some(monedas, (x) => { return x._id === item.moneda; }) ?
                         lodash.find(monedas, (x) => { return x._id === item.moneda; }).simbolo :
                         'Indefinido';

            let compania = lodash.some(companias, (x) => { return x._id === item.compania; }) ?
                           lodash.find(companias, (x) => { return x._id === item.compania; }).abreviatura :
                           'Indefinido';

            let ramo = lodash.some(ramos, (x) => { return x._id === item.ramo; }) ?
                       lodash.find(ramos, (x) => { return x._id === item.ramo; }).abreviatura :
                       'Indefinido';

           let asegurado = lodash.some(asegurados, (x) => { return x._id === item.asegurado; }) ?
                           lodash.find(asegurados, (x) => { return x._id === item.asegurado; }).abreviatura :
                           'Indefinido';

           let tipo = lodash.some(tiposFacultativo, (x) => { return x._id === item.tipo; }) ?
                      lodash.find(tiposFacultativo, (x) => { return x._id === item.tipo; }).abreviatura :
                      'Indefinido';

            let riesgo = {};

            riesgo._id = new Mongo.ObjectID()._str;
            riesgo.user = Meteor.userId();

            riesgo.id = item._id,
            riesgo.numero = item.numero;
            riesgo.codigo = item.codigo;
            riesgo.referencia = item.referencia;
            riesgo.estado = item.estado;
            riesgo.desde = item.desde;
            riesgo.hasta = item.hasta;
            riesgo.suscriptor = suscriptor;
            riesgo.moneda = moneda;
            riesgo.compania = compania;
            riesgo.ramo = ramo;
            riesgo.asegurado = asegurado;
            riesgo.tipo = tipo;
            riesgo.cia = item.cia;

            Temp_Consulta_Riesgos.insert(riesgo);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('riesgos_leerRiesgos_reportProgress',
                                    { myuserId: this.userId, app: 'riesgos', process: 'leerRiesgos' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('riesgos_leerRiesgos_reportProgress',
                                        { myuserId: this.userId, app: 'riesgos', process: 'leerRiesgos' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, los riesgos que cumplen el criterio indicado, han sido leídos desde la base de datos.";
    }
});
