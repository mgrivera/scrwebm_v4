
import { Meteor } from 'meteor/meteor';
import { Temp_consulta_montosCobrados2 } from '/imports/collections/consultas/temp_consulta_montosCobrados';

Meteor.publish("consulta.montosCobrados.tempCollection.paging", function (page, recsPerPage, recordCount) {
    // regresamos solo los items que corresponden al usuario ... 
    if (this.userId) {

        // leemos hasta la página indicada 
        let limit = page * recsPerPage;

        // evitamos leer más allá de la propia cantidad de registros seleccionados
        limit = limit > recordCount ? recordCount : limit;

        return Temp_consulta_montosCobrados2.find({ user: this.userId }, {
            sort: { 'moneda.simbolo': 1, 'compania.abreviatura': 1, 'ramo.abreviatura': 1, 'source.origen': 1, 'source.numero': 1 },
            limit: limit
        });
    }
    return this.ready();
})