
import { Meteor } from 'meteor/meteor'; 

import { check } from 'meteor/check';
import { Match } from 'meteor/check'

import moment from 'moment'; 
 
import { Riesgos } from '/imports/collections/principales/riesgos'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { Temp_consulta_cumulos } from '/imports/collections/consultas/temp_consulta_cumulos'; 

Meteor.methods(
{
    'consulta.cumulos': async function (filtro) {

        check(filtro, Match.ObjectIncluding({ cia: String }));

        // antes que nada, eliminamos del collection de la consulta, los registros de la consulta anterior
        Temp_consulta_cumulos.remove({ user: this.userId });

        // los dates pueden venir como strings; además, las fechas hasta siempre deben ser: ... 23:59:59 ... 
        filtro = prepararFechasEnFiltro(filtro); 

        // el usuario puede seleccionar *solo* algún tipo de negocio para la construcción de la consulta 
        const tipoNegocio = filtro.tipoNegocio && Array.isArray(filtro.tipoNegocio) ? filtro.tipoNegocio : []; 

        const todo = !tipoNegocio.length; 
        const fac = todo || tipoNegocio.some(x => x === "fac"); 
        const cont = todo || tipoNegocio.some(x => x === "cont"); 
        const prop = todo || cont || tipoNegocio.some(x => x === "prop"); 
        const noProp = todo || cont || tipoNegocio.some(x => x === "noProp"); 

        if (fac) { 
            await leerFacultativo(filtro); 
        }

        if (prop) { 
            await leerContratosProp(filtro); 
        }

        if (noProp) { 
            await leerContratosNoProp(filtro); 
        }
        
        return {
            error: false, 
            message: `Ok, la consulta de cúmulos se ha ejecutao en forma exitosa ...`
        };
    }, 

    'consultas.cumulos.getRecCount': function (userId) {

        check(userId, String);

        const recordCount = Temp_consulta_cumulos.find({ user: userId }).count(); 

        return { 
            error: false, 
            recordCount
        }
    }
})

async function leerFacultativo (filtro) { 

    const match = { $and: [] };

    match['$and'].push({ cia: filtro.cia }); 

    if (filtro.fechaEmision1) {
        match['$and'].push({ 'movimientos.fechaEmision': { $gte: filtro.fechaEmision1 } });
    }

    if (filtro.fechaEmision2) {
        match['$and'].push({ 'movimientos.fechaEmision': { $lte: filtro.fechaEmision2 } });
    }

    // ------------------------------------------------------------------------------------
    // ahora construimos el filtro pero para los cúmulos; recuérdese que la vigencia 
    // (desde, hasta) viene en cada cúmulo 
    const cumulos_match = []; 
   
    cumulos_match.push({ $eq: [ '$cia', filtro.cia ] });

   if (filtro.vigenciaInicial1) { 
       cumulos_match.push({ $gte: [ '$desde', filtro.vigenciaInicial1 ] }); 
   }

   if (filtro.vigenciaInicial2) { 
       cumulos_match.push({ $lte: ['$desde', filtro.vigenciaInicial2] }); 
   }

   if (filtro.vigenciaFinal1) { 
       cumulos_match.push({ $gte: ['$hasta', filtro.vigenciaFinal1] }); 
   }

   if (filtro.vigenciaFinal2) { 
       cumulos_match.push({ $lte: ['$hasta', filtro.vigenciaFinal2] }); 
   }

   // estas fechas deben siempre venir ambas (o ninguna) 
   // si el usuario indica un periodo de vigencia, seleccionamos items que se inician en el período *o* que terminan en el período 
   if (filtro.periodoVigencia1 && filtro.periodoVigencia2) { 
       cumulos_match.push({ '$or': [ 
           { $and: [{ $gte: ['$desde', filtro.periodoVigencia1] }, { $lte: ['$desde', filtro.periodoVigencia2] } ]}, 
           { $and: [{ $gte: ['$hasta', filtro.periodoVigencia1] }, { $lte: ['$hasta', filtro.periodoVigencia2] } ]}
       ] }); 
   }

   const userId = Meteor.userId(); 

   const pipeline = [
       { $match: match }, 
       { $unwind: "$movimientos" }, 
       // un riesgo con *más de un* movimiento es seleccionado si solo uno cumple el match; volvemos a aplicar para eliminar 
       // movimientos que no lo cumplan ... 
       { $match: match }, 
       { $project: { 
           // creamos cada item *sin* un _id, pues un item se puede repetir al hacer unwind más adelante; 
           // el _id hace que, si el unwind crea más de 1 item, solo 1 permanezca, pues no puede haber más de 1 item con el mismo _id 
           // agregamos un _id a cada item al final 
           _id: 0, 
           entityId: '$_id', 
           subEntityId: '$movimientos._id', 
           numero: { $concat: [{ $toString: '$numero'}, '-', {$toString: '$movimientos.numero'}] }, 
           moneda: 1, 
           compania: 1, 
           ramo: 1, 
           fechaEmision: '$movimientos.fechaEmision', 
           cia: 1 
        }}, 
        
        { $lookup:
            {
            from: "monedas",                        // este es el foreign collection 
            let: { monedaId: "$moneda" },           // estos son los local fields; pueden ser definidos como variables  
            pipeline: [
                    { $match:
                        // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                        // $$ para referenciar variables en let; $ para referenciar fields en el foreign collection 
                        { $expr: { $eq: ["$$monedaId", "$_id" ] }}
                    }, 
                    { $project: { _id: 0, descripcion: 1, simbolo: 1, }}
                ],
                as: "monedas"
            }
        }, 

        { $lookup:
            {
            from: "companias",                        // este es el foreign collection 
            let: { companiaId: "$compania" },           // estos son los local fields; pueden ser definidos como variables  
            pipeline: [
                    { $match:
                        // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                        { $expr: { $eq: ["$$companiaId", "$_id" ] }}
                    }, 
                    { $project: { _id: 0, nombre: 1, abreviatura: 1, }}
                ],
                as: "companias"
            }
        }, 

        { $lookup:
            {
            from: "ramos",                        // este es el foreign collection 
            let: { ramoId: "$ramo" },           // estos son los local fields; pueden ser definidos como variables  
            pipeline: [
                    { $match:
                        // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                        { $expr: { $eq: ["$$ramoId", "$_id" ] }}
                    }, 
                    { $project: { _id: 0, descripcion: 1, abreviatura: 1, }}
                ],
                as: "ramos"
            }
        }, 

        { $unwind: "$monedas" }, 
        { $unwind: "$companias" }, 
        { $unwind: "$ramos" }, 

        // para leer los cúmulos asociados a los movimientos de facultativo 
        {   $lookup: {
                // este es el foreign collection 
                from: "cumulos_registro",                        
                // (optional) estos son los local fields (from the aggregation); pueden ser definidos como variables  
                let: { entityId: "$entityId", subEntityId: "$subEntityId" },           
                pipeline: [
                            { 
                                $match: { $expr:
                                    {   $and:
                                        [
                                            { $eq: [ "$entityId",  "$$entityId" ] },
                                            { $eq: [ "$subEntityId", "$$subEntityId" ] }, 
                                            { $and: cumulos_match }
                                        ]
                                    }
                            }
                        },
                        { $project: { 
                            _id: 0, 
                            entityId: 0, 
                            subEntityId: 0, 
                            ingreso: 0, 
                            ultAct: 0, 
                            usuario: 0, 
                            ultUsuario: 0, 
                            cia: 0
                        }}
                    ],
                as: "cumulos"
            }
        },
        { $match: { cumulos: { $exists: true, $ne: [] }}},       // solo riesgos con cúmulos 
        { $unwind: "$cumulos" }, 

        // para leer el tipo de cúmulo que corresponde (terremoto, inundación, ... )
        { $lookup:
            {
            // este es el foreign collection 
            from: "cumulos",                        
            // (optional) estos son los local fields (from the aggregation); pueden ser definidos como variables  
            let: { tipoCumuloId: "$cumulos.tipoCumulo", zonaId: "$cumulos.zona" },           
            pipeline: [
                    { $match:
                        { $expr:
                            { $and:
                                [
                                    { $eq: [ "$_id",  "$$tipoCumuloId" ] },
                                ]
                            }
                        }
                    },
                    { $project: { 
                        _id: 0, 
                        descripcion: 1, 
                        abreviatura: 1, 
                        zonas: { $filter: { input: "$zonas", as: "zona", cond: { $eq: [ "$$zona._id", '$$zonaId' ] }}}
                    }}
                ],
                as: "tiposCumulo"
            }
        },
        { $unwind: '$tiposCumulo' },  
        { $unwind: '$tiposCumulo.zonas' },  
        { $project: { 'tiposCumulo.zonas._id': 0 }}, 

        { $addFields: { 
            user: userId, 
            'cumulos.montoCedido': { $sum: [ '$cumulos.cesionCuotaParte', '$cumulos.cesionExcedente', '$cumulos.cesionFacultativo' ] }
        } },
        { $merge: { into: "temp_consulta_cumulos", on: "_id", whenMatched: "replace", whenNotMatched: "insert" } }
   ]

    await Riesgos.rawCollection().aggregate(pipeline).toArray(); 
}

// ---------------------------------------------------------------------------------------
// leemos cúmulos de contratos proporcionales 
// ---------------------------------------------------------------------------------------
async function leerContratosProp (filtro) { 

   const match = { $and: [] }; 
   
   match['$and'].push({ cia: filtro.cia }); 

   if (filtro.fechaEmision1) { 
       match['$and'].push({ fechaEmision: { $gte: filtro.fechaEmision1 } }); 
   }

   if (filtro.fechaEmision2) { 
       match['$and'].push({ fechaEmision: { $lte: filtro.fechaEmision2 } }); 
   }

    // ------------------------------------------------------------------------------------
    // ahora construimos el filtro pero para los cúmulos; recuérdese que la vigencia 
    // (desde, hasta) viene en cada cúmulo 
    const cumulos_match = [];

    cumulos_match.push({ $eq: ['$cia', filtro.cia] });

    if (filtro.vigenciaInicial1) {
        cumulos_match.push({ $gte: ['$desde', filtro.vigenciaInicial1] });
    }

    if (filtro.vigenciaInicial2) {
        cumulos_match.push({ $lte: ['$desde', filtro.vigenciaInicial2] });
    }

    if (filtro.vigenciaFinal1) {
        cumulos_match.push({ $gte: ['$hasta', filtro.vigenciaFinal1] });
    }

    if (filtro.vigenciaFinal2) {
        cumulos_match.push({ $lte: ['$hasta', filtro.vigenciaFinal2] });
    }

    // estas fechas deben siempre venir ambas (o ninguna) 
    // si el usuario indica un periodo de vigencia, seleccionamos items que se inician en el período *o* que terminan en el período 
    if (filtro.periodoVigencia1 && filtro.periodoVigencia2) {
        cumulos_match.push({
            '$or': [
                { $and: [{ $gte: ['$desde', filtro.periodoVigencia1] }, { $lte: ['$desde', filtro.periodoVigencia2] }] },
                { $and: [{ $gte: ['$hasta', filtro.periodoVigencia1] }, { $lte: ['$hasta', filtro.periodoVigencia2] }] }
            ]
        });
    }

   const userId = Meteor.userId(); 

   const pipeline = [
       { $match: match }, 
       { $match: { cuentasTecnicas_definicion: { $exists: 1, $ne: [ ] }}}, 
       // { $unwind: "$movimientos" }, 
       // un riesgo con *más de un* movimiento es seleccionado si solo uno cumple el match; volvemos a aplicar para eliminar 
       // movimientos que no lo cumplan ... 
       // { $match: match }, 
       { $project: { 
           // creamos cada item *sin* un _id, pues un item se puede repetir al hacer unwind más adelante; 
           // el _id hace que, si el unwind crea más de 1 item, solo 1 permanezca, pues no puede haber más de 1 item con el mismo _id 
           // agregamos un _id a cada item al final 
           _id: 0, 
           entityId: '$_id', 
           subEntityId: "0", 
           numero: { $toString: '$numero'}, 
           moneda: { $arrayElemAt: [ "$cuentasTecnicas_definicion.moneda", 0 ] }, 
           compania: 1,  
           ramo: 1, 
           fechaEmision: 1, 
           cia: 1 
        }}, 
        
        { $lookup:
            {
            from: "monedas",                        // este es el foreign collection 
            let: { monedaId: "$moneda" },           // estos son los local fields; pueden ser definidos como variables  
            pipeline: [
                    { $match:
                        // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                        // $$ para referenciar variables en let; $ para referenciar fields en el foreign collection 
                        { $expr: { $eq: ["$$monedaId", "$_id" ] }}
                    }, 
                    { $project: { _id: 0, descripcion: 1, simbolo: 1, }}
                ],
                as: "monedas"
            }
        }, 

        { $lookup:
            {
            from: "companias",                        // este es el foreign collection 
            let: { companiaId: "$compania" },           // estos son los local fields; pueden ser definidos como variables  
            pipeline: [
                    { $match:
                        // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                        { $expr: { $eq: ["$$companiaId", "$_id" ] }}
                    }, 
                    { $project: { _id: 0, nombre: 1, abreviatura: 1, }}
                ],
                as: "companias"
            }
        }, 

        { $lookup:
            {
            from: "ramos",                        // este es el foreign collection 
            let: { ramoId: "$ramo" },           // estos son los local fields; pueden ser definidos como variables  
            pipeline: [
                    { $match:
                        // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                        { $expr: { $eq: ["$$ramoId", "$_id" ] }}
                    }, 
                    { $project: { _id: 0, descripcion: 1, abreviatura: 1, }}
                ],
                as: "ramos"
            }
        }, 

        { $unwind: "$monedas" }, 
        { $unwind: "$companias" }, 
        { $unwind: "$ramos" }, 

        // para leer los cúmulos asociados a los movimientos de facultativo 
        { $lookup:
            {
            // este es el foreign collection 
            from: "cumulos_registro",                        
            // (optional) estos son los local fields (from the aggregation); pueden ser definidos como variables  
            let: { entityId: "$entityId" },           
            pipeline: [
                    { $match:
                        { $expr:
                            { $and:
                                [
                                    { $eq: [ "$entityId",  "$$entityId" ] }, 
                                    { $and: cumulos_match }
                                ]
                            }
                        }
                    },
                    { $project: { 
                        _id: 0, 
                        entityId: 0, 
                        subEntityId: 0, 
                        ingreso: 0, 
                        ultAct: 0, 
                        usuario: 0, 
                        ultUsuario: 0, 
                        cia: 0
                    }}
                ],
                as: "cumulos"
            }
        },

        { $match: { cumulos: { $exists: true, $ne: [ ] }}},       // solo riesgos con cúmulos 
        { $unwind: "$cumulos" }, 

        // para leer el tipo de cúmulo que corresponde (terremoto, inundación, ... )
        { $lookup:
            {
            // este es el foreign collection 
            from: "cumulos",                        
            // (optional) estos son los local fields (from the aggregation); pueden ser definidos como variables  
            let: { tipoCumuloId: "$cumulos.tipoCumulo", zonaId: "$cumulos.zona" },           
            pipeline: [
                    { $match:
                        { $expr:
                            { $and:
                                [
                                    { $eq: [ "$_id",  "$$tipoCumuloId" ] },
                                ]
                            }
                        }
                    },
                    { $project: { 
                        _id: 0, 
                        descripcion: 1, 
                        abreviatura: 1, 
                        zonas: { $filter: { input: "$zonas", as: "zona", cond: { $eq: [ "$$zona._id", '$$zonaId' ] }}}
                    }}
                ],
                as: "tiposCumulo"
            }
        },
        { $unwind: '$tiposCumulo' },  
        { $unwind: '$tiposCumulo.zonas' },  
        { $project: { 'tiposCumulo.zonas._id': 0 }}, 

        { $addFields: { 
            user: userId, 
            'cumulos.montoCedido': { $sum: [ '$cumulos.cesionCuotaParte', '$cumulos.cesionExcedente', '$cumulos.cesionFacultativo' ] }
        } },
        { $merge: { into: "temp_consulta_cumulos", on: "_id", whenMatched: "replace", whenNotMatched: "insert" } }
   ]

    await Contratos.rawCollection().aggregate(pipeline).toArray(); 
}

async function leerContratosNoProp (filtro) { 

   const match = { $and: [] }; 

    match['$and'].push({ cia: filtro.cia }); 
   
   if (filtro.fechaEmision1) { 
       match['$and'].push({ fechaEmision: { $gte: filtro.fechaEmision1 } }); 
   }

   if (filtro.fechaEmision2) { 
       match['$and'].push({ fechaEmision: { $lte: filtro.fechaEmision2 } }); 
   }

    // ------------------------------------------------------------------------------------
    // ahora construimos el filtro pero para los cúmulos; recuérdese que la vigencia 
    // (desde, hasta) viene en cada cúmulo 
    const cumulos_match = [];

    cumulos_match.push({ $eq: ['$cia', filtro.cia] });

    if (filtro.vigenciaInicial1) {
        cumulos_match.push({ $gte: ['$desde', filtro.vigenciaInicial1] });
    }

    if (filtro.vigenciaInicial2) {
        cumulos_match.push({ $lte: ['$desde', filtro.vigenciaInicial2] });
    }

    if (filtro.vigenciaFinal1) {
        cumulos_match.push({ $gte: ['$hasta', filtro.vigenciaFinal1] });
    }

    if (filtro.vigenciaFinal2) {
        cumulos_match.push({ $lte: ['$hasta', filtro.vigenciaFinal2] });
    }

    // estas fechas deben siempre venir ambas (o ninguna) 
    // si el usuario indica un periodo de vigencia, seleccionamos items que se inician en el período *o* que terminan en el período 
    if (filtro.periodoVigencia1 && filtro.periodoVigencia2) {
        cumulos_match.push({
            '$or': [
                { $and: [{ $gte: ['$desde', filtro.periodoVigencia1] }, { $lte: ['$desde', filtro.periodoVigencia2] }] },
                { $and: [{ $gte: ['$hasta', filtro.periodoVigencia1] }, { $lte: ['$hasta', filtro.periodoVigencia2] }] }
            ]
        });
    }

   const userId = Meteor.userId(); 

   const pipeline = [
       { $match: match }, 
       { $match: { capas: { $exists: 1, $ne: [ ] }}}, 
       // { $unwind: "$movimientos" }, 
       // un riesgo con *más de un* movimiento es seleccionado si solo uno cumple el match; volvemos a aplicar para eliminar 
       // movimientos que no lo cumplan ... 
       // { $match: match }, 
       { $project: { 
           // creamos cada item *sin* un _id, pues un item se puede repetir al hacer unwind más adelante; 
           // el _id hace que, si el unwind crea más de 1 item, solo 1 permanezca, pues no puede haber más de 1 item con el mismo _id 
           // agregamos un _id a cada item al final 
           _id: 0, 
           entityId: '$_id', 
           subEntityId: "0", 
           numero: { $toString: '$numero'}, 
           moneda: { $arrayElemAt: [ "$capas.moneda", 0 ] }, 
           compania: 1,  
           ramo: 1, 
           fechaEmision: 1, 
           desde: 1, 
           hasta: 1, 
           cia: 1 
        }}, 
        
        { $lookup:
            {
            from: "monedas",                        // este es el foreign collection 
            let: { monedaId: "$moneda" },           // estos son los local fields; pueden ser definidos como variables  
            pipeline: [
                    { $match:
                        // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                        // $$ para referenciar variables en let; $ para referenciar fields en el foreign collection 
                        { $expr: { $eq: ["$$monedaId", "$_id" ] }}
                    }, 
                    { $project: { _id: 0, descripcion: 1, simbolo: 1, }}
                ],
                as: "monedas"
            }
        }, 

        { $lookup:
            {
            from: "companias",                        // este es el foreign collection 
            let: { companiaId: "$compania" },           // estos son los local fields; pueden ser definidos como variables  
            pipeline: [
                    { $match:
                        // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                        { $expr: { $eq: ["$$companiaId", "$_id" ] }}
                    }, 
                    { $project: { _id: 0, nombre: 1, abreviatura: 1, }}
                ],
                as: "companias"
            }
        }, 

        { $lookup:
            {
            from: "ramos",                        // este es el foreign collection 
            let: { ramoId: "$ramo" },           // estos son los local fields; pueden ser definidos como variables  
            pipeline: [
                    { $match:
                        // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                        { $expr: { $eq: ["$$ramoId", "$_id" ] }}
                    }, 
                    { $project: { _id: 0, descripcion: 1, abreviatura: 1, }}
                ],
                as: "ramos"
            }
        }, 

        { $unwind: "$monedas" }, 
        { $unwind: "$companias" }, 
        { $unwind: "$ramos" }, 

        // para leer los cúmulos asociados a los movimientos de facultativo 
        { $lookup:
            {
            // este es el foreign collection 
            from: "cumulos_registro",                        
            // (optional) estos son los local fields (from the aggregation); pueden ser definidos como variables  
            let: { entityId: "$entityId" },           
            pipeline: [
                    { $match:
                        { $expr:
                            { $and:
                            [
                                { $eq: [ "$entityId",  "$$entityId" ] }, 
                                { $and: cumulos_match }
                            ]
                            }
                        }
                    },
                    { $project: { 
                        _id: 0, 
                        entityId: 0, 
                        subEntityId: 0, 
                        ingreso: 0, 
                        ultAct: 0, 
                        usuario: 0, 
                        ultUsuario: 0, 
                        cia: 0
                    }}
                ],
                as: "cumulos"
            }
        },
        { $match: { cumulos: { $exists: true, $ne: [ ] }}},       // solo riesgos con cúmulos 
        { $unwind: "$cumulos" }, 

        // para leer el tipo de cúmulo que corresponde (terremoto, inundación, ... )
        { $lookup:
            {
            // este es el foreign collection 
            from: "cumulos",                        
            // (optional) estos son los local fields (from the aggregation); pueden ser definidos como variables  
            let: { tipoCumuloId: "$cumulos.tipoCumulo", zonaId: "$cumulos.zona" },           
            pipeline: [
                    { $match:
                        { $expr:
                            { $and:
                                [
                                    { $eq: [ "$_id",  "$$tipoCumuloId" ] },
                                ]
                            }
                        }
                    },
                    { $project: { 
                        _id: 0, 
                        descripcion: 1, 
                        abreviatura: 1, 
                        zonas: { $filter: { input: "$zonas", as: "zona", cond: { $eq: [ "$$zona._id", '$$zonaId' ] }}}
                    }}
                ],
                as: "tiposCumulo"
            }
        },
        { $unwind: '$tiposCumulo' },  
        { $unwind: '$tiposCumulo.zonas' },  
        { $project: { 'tiposCumulo.zonas._id': 0 }}, 

        { $addFields: { 
            user: userId, 
            'cumulos.montoCedido': { $sum: [ '$cumulos.cesionCuotaParte', '$cumulos.cesionExcedente', '$cumulos.cesionFacultativo' ] }
        } },
        { $merge: { into: "temp_consulta_cumulos", on: "_id", whenMatched: "replace", whenNotMatched: "insert" } }
   ]

    await Contratos.rawCollection().aggregate(pipeline).toArray(); 
}

function prepararFechasEnFiltro(filtro) { 

    const f = { ...filtro }; 
    
    f.fechaEmision1 = moment(f.fechaEmision1).isValid() ? moment(f.fechaEmision1).toDate() : null; 
    f.fechaEmision2 = moment(f.fechaEmision2).isValid() ? moment(f.fechaEmision2).toDate() : null; 
    f.vigenciaInicial1 = moment(f.vigenciaInicial1).isValid() ? moment(f.vigenciaInicial1).toDate() : null; 
    f.vigenciaInicial2 = moment(f.vigenciaInicial2).isValid() ? moment(f.vigenciaInicial2).toDate() : null; 
    f.vigenciaFinal1 = moment(f.vigenciaFinal1).isValid() ? moment(f.vigenciaFinal1).toDate() : null; 
    f.vigenciaFinal2 = moment(f.vigenciaFinal2).isValid() ? moment(f.vigenciaFinal2).toDate() : null; 
    f.periodoVigencia1 = moment(f.periodoVigencia1).isValid() ? moment(f.periodoVigencia1).toDate() : null; 
    f.periodoVigencia2 = moment(f.periodoVigencia2).isValid() ? moment(f.periodoVigencia2).toDate() : null; 

    // la fecha final del período debe ser el último momento del día, para que incluya cualquier fecha de ese día 
    f.fechaEmision2 = f.fechaEmision2 ? new Date(f.fechaEmision2.getFullYear(), f.fechaEmision2.getMonth(), f.fechaEmision2.getDate(), 23, 59, 59) : null; 
    f.vigenciaInicial2 = f.vigenciaInicial2 ? new Date(f.vigenciaInicial2.getFullYear(), f.vigenciaInicial2.getMonth(), f.vigenciaInicial2.getDate(), 23, 59, 59) : null; 
    f.vigenciaFinal2 = f.vigenciaFinal2 ? new Date(f.vigenciaFinal2.getFullYear(), f.vigenciaFinal2.getMonth(), f.vigenciaFinal2.getDate(), 23, 59, 59) : null; 
    f.periodoVigencia2 = f.periodoVigencia2 ? new Date(f.periodoVigencia2.getFullYear(), f.periodoVigencia2.getMonth(), f.periodoVigencia2.getDate(), 23, 59, 59) : null; 

    return f; 
}