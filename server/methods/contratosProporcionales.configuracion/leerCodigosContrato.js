

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 

import lodash from 'lodash';
import SimpleSchema from 'simpl-schema';

import { Contratos } from '/imports/collections/principales/contratos'; 

Meteor.methods(
{
    'contratosProporcionales.configuracion.leerCodigosContrato': function (ciaSeleccionadaID) {

        // leemos los códigos de contrato que el usuario ha registrado para la compañía seleccionada y
        // los regresamos en un array, para que el programa los muestre en una lista ...
        new SimpleSchema({
            ciaSeleccionadaID: { type: String, optional: false },
        }).validate({ ciaSeleccionadaID, });

        const codigosContato_list = [];

        const codigos = Contratos.find({ $and: [
            { codigo: { $exists: true }}, { codigo: { $ne: null }}, { cia: ciaSeleccionadaID }
        ]}, { fields: { codigo: true, _id: false, }}).fetch();

        const codigos2 = lodash.uniqBy(codigos, 'codigo');

        codigos2.forEach((x) => {
            codigosContato_list.push({ _id: new Mongo.ObjectID()._str, codigo: x.codigo, });
        });

        return JSON.stringify(codigosContato_list);
    }
});
