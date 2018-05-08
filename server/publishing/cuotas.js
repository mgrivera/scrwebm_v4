

import { Cuotas } from '/imports/collections/principales/cuotas'; 

Meteor.publish("cuotas", function (filtro) {
    var selector = JSON.parse(filtro);
    return Cuotas.find(selector);
});
