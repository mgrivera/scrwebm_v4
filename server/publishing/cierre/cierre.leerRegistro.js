
import { Meteor } from 'meteor/meteor';
import moment from 'moment'; 

import { CierreRegistro } from '/imports/collections/cierre/registroCierre'; 
import SimpleSchema from 'simpl-schema';

Meteor.publish("cierre.leerRegistro", function (filtro, cantRecords) {

    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }, 
        filtro: { type: Object, blackbox: true, optional: false, }
    }).validate({ cantRecords, filtro });

    const filtro2 = agregarPeriodoAlFiltro(filtro); 

    const options = { sort: { fecha: 1, moneda: 1, compania: 1, }, limit: cantRecords, };

    return CierreRegistro.find(filtro2, options);
})

function agregarPeriodoAlFiltro(filtro) { 
    let { fecha1, fecha2 } = filtro; 

    fecha1 = moment(fecha1).isValid() ? moment(fecha1).toDate() : null; 
    fecha2 = moment(fecha2).isValid() ? moment(fecha2).toDate() : null; 

    // la fecha final del período debe ser el último momento del día, para que incluya cualquier fecha de ese día 
    fecha2 = fecha2 ? new Date(fecha2.getFullYear(), fecha2.getMonth(), fecha2.getDate(), 23, 59, 59) : null; 

    const fecha = {}; 

    if (fecha1) { 
        if (fecha2) {
            // las fechas vienen como strings ... 
            fecha.$gte = fecha1;
            fecha.$lte = fecha2;
        }
        else { 
            fecha.$eq = fecha1;
        }
    }

    const filtro2 = { ...filtro, fecha }; 

    delete filtro2.fecha1; 
    delete filtro2.fecha2; 

    return filtro2; 
}