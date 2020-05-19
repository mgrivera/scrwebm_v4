
import { Meteor } from 'meteor/meteor'; 
import { TiposObjetoAsegurado } from 'imports/collections/catalogos/tiposObjetoAsegurado'; 

Meteor.publish("tiposObjetoAsegurado", function () {
    return TiposObjetoAsegurado.find();
})