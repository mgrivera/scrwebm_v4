
import { Meteor } from 'meteor/meteor'; 

import { NotasDebitoCredito } from '/imports/collections/principales/notasDebitoCredito'; 

Meteor.publish("notasDebitoCredito", function (entityID, subEntityID) {

    const filter = { 
        'source.entityID': entityID
    }; 

    if (subEntityID) { 
        filter['source.subEntityID'] = subEntityID; 
    }

    return NotasDebitoCredito.find(filter);
})