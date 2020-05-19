
import { Meteor } from 'meteor/meteor';
import { Temp_consulta_riesgosEmitidosReaseguradores } from '/imports/collections/consultas/temp_consulta_riesgosEmitidos_reaseguradores'; 

Meteor.publish('primasEmitidas.reaseguradores.consulta', function publish(page, recsPerPage, recordCount) {
    if (this.userId) {
        // leemos hasta la página indicada 
        let limit = page * recsPerPage; 

        // evitamos leer más allá de la propia cantidad de registros seleccionados
        limit = limit > recordCount ? recordCount : limit;  

        return Temp_consulta_riesgosEmitidosReaseguradores.find({ user: this.userId }, 
                                                            { 
                                                                sort: { numero: 1, movimiento: 1 }, 
                                                                limit: limit 
                                                            }); 
    }
    return this.ready();
})