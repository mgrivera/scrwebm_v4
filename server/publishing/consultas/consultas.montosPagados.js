
import { Meteor } from 'meteor/meteor';

import { Monedas } from '/imports/collections/catalogos/monedas';
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Temp_consulta_montosPagados2 } from '/imports/collections/consultas/temp_consulta_montosPagados';

Meteor.publish("consulta.montosPagados.catalogos", function () {
    // nótese como la idea es regresar aquí todos los catálogos ...
    // nota: como el nombre de método es null, los collections se regresan a
    // cada client en forma automática ...

    return [
        Monedas.find({}),
        Companias.find({})
    ];
})

Meteor.publish("consulta.montosPagados.tempCollection.paging", function (page, recsPerPage, recordCount) {
    // regresamos solo los items que corresponden al usuario ... 
    if (this.userId) {

        // leemos hasta la página indicada 
        let limit = page * recsPerPage;

        // evitamos leer más allá de la propia cantidad de registros seleccionados
        limit = limit > recordCount ? recordCount : limit;

        return Temp_consulta_montosPagados2.find({ user: this.userId }, {
            sort: { 'moneda.simbolo': 1, 'compania.abreviatura': 1, 'ramo.abreviatura': 1, 'source.origen': 1, 'source.numero': 1 },
            limit: limit
        });
    }
    return this.ready();
})