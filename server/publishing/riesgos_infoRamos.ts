

import { Riesgos_InfoRamo } from 'imports/collections/principales/riesgos'; 

Meteor.publish("riesgos_infoRamo", function (riesgoID) {
    return Riesgos_InfoRamo.find({ riesgoID: riesgoID });
});