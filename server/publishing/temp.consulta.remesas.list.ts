

import { Meteor } from 'meteor/meteor'; 
import { Temp_Consulta_Remesas } from '../../imports/collections/consultas/tempConsultaRemesas'; 

Meteor.publish("temp.consulta.remesas.list", function () {

    // al menos por ahora, no paginamos en la consulta de remesas. Es decir, leemos y publicamos *todas* las 
    // remesas que cumplen el filtro. Ahora lo hacemos por partes, pero no aquí ...  
    // Cuando lo hagamos, debemos leer por partes, como en riesgos, contratos, etc.. Copiar desde allí ... 

    return Temp_Consulta_Remesas.find({ user: this.userId });
})
