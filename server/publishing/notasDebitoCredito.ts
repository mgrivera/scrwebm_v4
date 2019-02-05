

import { NotasDebitoCredito } from 'imports/collections/principales/notasDebitoCredito'; 

Meteor.publish("notasDebitoCredito", function (entityID: string, subEntityID: string) {

    let filter = { 
        'source.entityID': entityID
    }; 

    if (subEntityID) { 
        filter['source.subEntityID'] = subEntityID; 
    }

    return NotasDebitoCredito.find(filter);
})