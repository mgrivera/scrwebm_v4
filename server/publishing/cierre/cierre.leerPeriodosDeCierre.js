
import SimpleSchema from 'simpl-schema'; 
import { Meteor } from 'meteor/meteor'; 

import { Cierre } from '/imports/collections/cierre/cierre'; 

Meteor.publish("cierre.leerPeriodosDeCierre", function (filtro, cantRecords) {

    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }, 
        filtro: { type: Object, blackbox: true, optional: false, }
    }).validate({ cantRecords, filtro });

    const options = { sort: { desde: -1, }, limit: cantRecords, };

    return [ 
        Cierre.find(filtro, options) 
    ];
})