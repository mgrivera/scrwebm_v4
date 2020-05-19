
import { Meteor } from 'meteor/meteor'; 
import { Referencias } from '/imports/collections/principales/referencias'; 

Meteor.publish("referencias", function (ciaSeleccionadaID) {
    return Referencias.find({ cia: ciaSeleccionadaID });
});
