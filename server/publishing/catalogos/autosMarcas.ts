
import { Meteor } from 'meteor/meteor';
import { AutosMarcas } from 'imports/collections/catalogos/autosMarcas'; 

Meteor.publish("autosMarcas", function () {
    return AutosMarcas.find();
})