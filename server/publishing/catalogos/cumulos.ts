
import { Meteor } from 'meteor/meteor';
import { Cumulos } from 'imports/collections/catalogos/cumulos'; 

Meteor.publish("cumulos", function () {
    return Cumulos.find();
})