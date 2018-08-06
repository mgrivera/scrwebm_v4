

import { Cumulos_Registro } from 'imports/collections/principales/cumulos_registro'; 

Meteor.publish("cumulos.registro", function (filter) {
    return [
        Cumulos_Registro.find(filter), 
    ]
})