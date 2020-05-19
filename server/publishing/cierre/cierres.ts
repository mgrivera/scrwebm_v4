
import { Meteor } from 'meteor/meteor';
import { Cierre } from 'imports/collections/cierre/cierre'; 

Meteor.publish("cierres", function (companiaSeleccionadaID) {

    // leemos y regresamos todos los cierres abiertos; la idea es que el proceso de cierre los vea todos y permita al 
    // usuario seleccionar y cerrar más de un cierre a la vez; uno por uno, por supuesto ... 
    return Cierre.find({ cia: companiaSeleccionadaID, cerradoFlag: false, }, { sort: { hasta: -1, }, });
})