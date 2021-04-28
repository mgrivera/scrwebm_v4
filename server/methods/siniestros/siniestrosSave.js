
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash';
import moment from 'moment';

import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { calcularNumeroReferencia } from '/server/imports/general/calcularNumeroReferencia'; 

Meteor.methods(
{
    siniestrosSave: function (item) {

        if (item.docState && item.docState == 1) {

            delete item.docState;

            // si el número viene en '0', asignamos un número consecutivo al riesgo
            if (!item.numero) {
                var numeroAnterior = Siniestros.findOne({ cia: item.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior || !numeroAnterior.numero)
                    item.numero = 1;
                else
                    item.numero = numeroAnterior.numero + 1;
            }

            // si la referencia viene en '0', asignamos una ...
            if (!item.referencia || item.referencia === '0') {
                const ano = parseInt(moment(item.fechaEmision).format('YYYY'));
                const result = calcularNumeroReferencia('sin', item.tipo, ano, item.cia);

                if (result.error) {
                    throw new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                }
                item.referencia = result.referencia;
            }

            // si el usuario editó el array de personas, pueden venir con docState ... 
            if (item.personas && Array.isArray(item.personas)) {
                // primero eliminamos las personas que el usuario pueda haber eliminado 
                item.personas = item.personas.filter(x => !(x.docState && x.docState === 3));
                item.personas.forEach(x => delete x.docState);
            }

            Siniestros.insert(item);
        }

        if (item.docState && item.docState == 2) {

            var item2 = lodash.clone(item, true);

            delete item2.docState;
            delete item2._id;

            item2.ultAct = new Date();
            item2.ultUsuario = Meteor.user().emails[0].address; 

            // si el número viene en '0', asignamos un número consecutivo al riesgo
            if (!item2.numero) {
                const numeroAnterior = Siniestros.findOne({ cia: item.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior.numero)
                    item2.numero = 1;
                else
                    item2.numero = numeroAnterior.numero + 1;
            }

            // si la referencia viene en '0', asignamos una ...
            if (!item2.referencia || item2.referencia === '0') {
                const ano = parseInt(moment(item2.fechaEmision).format('YYYY'));
                const result = calcularNumeroReferencia('sin', item2.tipo, ano, item2.cia);

                if (result.error) {
                    throw new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                }
                item2.referencia = result.referencia;
            }

            // si el usuario editó el array de personas, pueden venir con docState ... 
            if (item2.personas && Array.isArray(item2.personas)) {
                // primero eliminamos las personas que el usuario pueda haber eliminado 
                item2.personas = item2.personas.filter(x => !(x.docState && x.docState === 3));
                item2.personas.forEach(x => delete x.docState);
            }

            Siniestros.update({ _id: item._id }, { $set: item2 });
        }

        if (item.docState && item.docState == 3) {
            Siniestros.remove({ _id: item._id });
        }

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})