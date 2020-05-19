
import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { Temp_consulta_cierreRegistro } from '/imports/collections/consultas/temp_consulta_cierreRegistro'; 

Meteor.publish("cierre.consulta.leer_Temp_consulta_cierreRegistro", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente,
    // los items que coresponden al usuario
    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
    }).validate({ cantRecords });

    const options = { sort: 
                        { 
                            'moneda.simbolo': 1, 
                            'compania.abreviatura': 1, 
                            referencia: 1, 
                            orden: 1, 
                            fecha: 1, 
                            serie: 1,  
                        }, 
                      limit: cantRecords, };

    return Temp_consulta_cierreRegistro.find( { user: this.userId }, options );
});