
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

var schema = new SimpleSchema({
    _id: { type: String, optional: false, },

    imp1Porc: { type: Number, label: "Imp1 %", optional: true, },
    imp1Descripcion: { type: String, label: "Descripción para Imp1", optional: true, },

    imp2Porc: { type: Number, label: "Imp1 %", optional: true, },
    imp2Descripcion: { type: String, label: "Descripción para Imp2", optional: true, },

    impSPNPorc: { type: Number, label: "Imp1/pn %", optional: true, },
    impSPNDescripcion: { type: String, label: "Descripción para Imp/pn", optional: true, },

    corrPorc: { type: Number, label: "Corretaje - Porcentaje por defecto", optional: true, },
    docState: { type: Number, optional: true, }
});

export const ContratosParametros:any = new Mongo.Collection("contratosParametros");
ContratosParametros.attachSchema(schema);
