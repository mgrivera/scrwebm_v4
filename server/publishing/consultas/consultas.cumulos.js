
import { Meteor } from 'meteor/meteor';
import { Temp_consulta_cumulos } from '/imports/collections/consultas/temp_consulta_cumulos'; 

Meteor.publish("consulta.cumulos.tempCollection.paging", function (page, recsPerPage, recordCount) {
    // regresamos solo los items que corresponden al usuario ... 
    if (this.userId) { 

        // leemos hasta la página indicada 
        let limit = page * recsPerPage; 

        // evitamos leer más allá de la propia cantidad de registros seleccionados
        limit = limit > recordCount ? recordCount : limit;  

        return Temp_consulta_cumulos.find({ user: this.userId }, { 
            sort: { 'monedas.simbolo': 1, 'companias.abreviatura': 1, 'ramos.abreviatura': 1, 'cumulos.origen': 1, numero: 1 }, 
            limit: limit 
        }); 
    }
    return this.ready();
})