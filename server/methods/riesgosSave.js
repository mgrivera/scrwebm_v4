

import moment from 'moment';

import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Cuotas } from '/imports/collections/principales/cuotas'; 

Meteor.methods(
{
    riesgosSave: function (item) {

        if (item.docState && item.docState == 1) {

            delete item.docState;

            // si el número viene en '0', asignamos un número consecutivo al riesgo
            if (!item.numero) {
                var numeroAnterior = Riesgos.findOne({ cia: item.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior || !numeroAnterior.numero)
                    item.numero = 1;
                else
                    item.numero = numeroAnterior.numero + 1;
            }

            // si la referencia viene en '0', asignamos una ...
            if (!item.referencia || item.referencia === '0') {
                let ano = parseInt(moment(item.desde).format('YYYY'));
                let result = ServerGlobal_Methods.calcularNumeroReferencia('fac', item.tipo, ano, item.cia);

                if (result.error) {
                    throw new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                }
                item.referencia = result.referencia;
            }

            Riesgos.insert(item);
        }


        if (item.docState && item.docState == 2) {

            var item2 = _.clone(item, true);

            delete item2.docState;
            delete item2._id;

            item2.ultAct = new Date();
            item2.ultUsuario = this.userId;

            // si el número viene en '0', asignamos un número consecutivo al riesgo
            if (!item2.numero) {
                var numeroAnterior = Riesgos.findOne({ cia: item.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior.numero)
                    item2.numero = 1;
                else
                    item2.numero = numeroAnterior.numero + 1;
            }

            // si la referencia viene en '0', asignamos una ...
            if (!item2.referencia || item2.referencia === '0') {
                let ano = parseInt(moment(item2.desde).format('YYYY'));
                let result = ServerGlobal_Methods.calcularNumeroReferencia('fac', item2.tipo, ano, item2.cia);

                if (result.error) {
                    throw new Meteor.Error("error-asignar-referencia",
                        `Hemos obtenido un error al intentar asignar un número de referencia:<br />${result.message}`);
                }
                item2.referencia = result.referencia;
            }

            Riesgos.update({ _id: item._id }, { $set: item2 });
        };


        if (item.docState && item.docState == 3) {
            // hooks: si el riesgo tiene cuotas cobradas/pagadas, no podrá ser eliminado ... 
            Riesgos.remove({ _id: item._id });
            // ahora eliminamos las cuotas asociadas al riesgo 
            Cuotas.remove({ 'source.entityID': item._id });
        }

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
