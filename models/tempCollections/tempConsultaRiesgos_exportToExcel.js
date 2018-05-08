
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    numero: { type: Number, label: "Número", optional: false },
    estado: { type: String, label: "Estado", optional: false },
    desde: { type: Date, label: "Desde", optional: false },
    hasta: { type: Date, label: "Hasta", optional: false },
    moneda: { type: String, label: "Moneda", optional: false },
    compania: { type: String, label: "Compañía", optional: false },
    ramo: { type: String, label: "Ramo", optional: false },
    asegurado: { type: String, label: "Asegurado", optional: false },
    suscriptor: { type: String, label: "Suscriptor", optional: false },

    sumaAsegurada: { type: Number, optional: true,  },
    nuestraOrdenPorc: { type: Number, optional: true,  },
    sumaReasegurada: { type: Number, optional: true,  },
    prima: { type: Number, optional: true,  },
    primaBruta: { type: Number, optional: true,  },
    comMasImp: { type: Number, optional: true,  },
    primaNeta: { type: Number, optional: true,  },
    corretaje: { type: Number, optional: true,  },

    cia: { type: String, label: 'Cia scrwebM', optional: false },
    user: { type: String, label: 'Mongo user', optional: false },
})

Temp_Consulta_Riesgos_ExportExcel = new Mongo.Collection("temp_Consulta_Riesgos_exportExcel");
Temp_Consulta_Riesgos_ExportExcel.attachSchema(schema);
