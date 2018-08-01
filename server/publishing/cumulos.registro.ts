

import { Asegurados } from 'imports/collections/catalogos/asegurados'; 

Meteor.publish("cumulos.registro", function () {
    return [
        Asegurados.find(), 
    ]
})