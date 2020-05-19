
import { Meteor } from 'meteor/meteor';
import { CierreRegistro } from '/imports/collections/cierre/registroCierre'; 
import SimpleSchema from 'simpl-schema';

Meteor.publish("cierre.leerRegistro", function (filtro, cantRecords) {

    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }, 
        filtro: { type: Object, blackbox: true, optional: false, }
    }).validate({ cantRecords, filtro });

    const options = { sort: { fecha: 1, moneda: 1, compania: 1, }, limit: cantRecords, };

    return CierreRegistro.find(filtro, options);
})