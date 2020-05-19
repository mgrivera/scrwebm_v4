
import { Meteor } from 'meteor/meteor'; 
import { ReconversionMonetaria_log } from 'imports/collections/otros/reconversionMonetaria_log'; 

Meteor.publish("reconversionMonetaria_log", function () {
    return [
        ReconversionMonetaria_log.find(), 
    ]
})