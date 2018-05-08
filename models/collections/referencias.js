
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// usamos este collection para manterner los números de referencia asignados (a riesgos, contratos, siniestros, ...).
let mySimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    origen: { type: String, optional: false, },             // fac, cont, sin, ...
    prefijoReferencia: { type: String, optional: false, },               // _id en tablas de tipos (fac, cont, etc.)
    ano: { type: Number, optional: false, },
    cia: { type: String, optional: false, },                // _id de la compañía 'usuaria'
    consecutivo: { type: Number, optional: false, },        // último consecutivo usado para el: origen-tipo-año-cia
    docState: { type: Number, optional: true, },
})

Referencias = new Mongo.Collection("referencias");
Referencias.attachSchema(mySimpleSchema);
