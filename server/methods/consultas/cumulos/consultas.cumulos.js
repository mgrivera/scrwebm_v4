
import { Meteor } from 'meteor/meteor'; 

import { check } from 'meteor/check';
import { Match } from 'meteor/check'

import moment from 'moment'; 
 
import { Cumulos_Registro } from '/imports/collections/principales/cumulos_registro';
import { Cumulos } from '/imports/collections/catalogos/cumulos'; 
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
        const origen = filtro.origen; 

        const todo = !origen;
        const fac = origen === "fac"; 
        const cont = origen === "cont"; 
        const prop = origen === "prop"; 
        const noProp = origen === "noProp"; 

        await leerCumulos(filtro);

        // antes de regresar, agregamos la zona a cada registro. Esto no es fácil hacerlo en el aggregate, por eso decidimos hacerlo aquí 
        // para obtener la zona, debemos leer el registro de cúmulo y luego filtrar la zona en el array de zonas 

        // Nota: probablemente, esto se puede hacer desde el aggregate, tan solo no pude resolverlo en el momento y, la verdad, no tenía mucho tiempo 
        const cumulos_temp = Temp_consulta_cumulos.find({ user: this.userId }).fetch();

        cumulos_temp.forEach(cumulo => {
            const tipoCumulo = Cumulos.findOne(cumulo.tipoCumulo); 

            if (tipoCumulo) { 
                const zonas = tipoCumulo.zonas; 
                const zona = zonas.find(x => x._id === cumulo.zona); 

                if (zona) { 
                    Temp_consulta_cumulos.update({ _id: cumulo._id }, { $set: { zonas: zona }});
                }
            }
        })

        // if (fac || todo) { 
            
        // }

        // if (prop || cont || todo) { 
        //     await leerContratosProp(filtro); 
        // }

        // if (noProp|| cont || todo) { 
        //     await leerContratosNoProp(filtro); 
        // }
        
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

async function leerCumulos (filtro) { 

    const match = { '$and': [] };

    match['$and'].push({ cia: filtro.cia });

    if (filtro.vigenciaInicial1) {
        match['$and'].push({ desde: { $gte: filtro.vigenciaInicial1 }});
    }

    if (filtro.vigenciaInicial2) {
        match['$and'].push({ desde: { $lte: filtro.vigenciaInicial2 } });
    }

    if (filtro.vigenciaFinal1) {
        match['$and'].push({ hasta: { $gte: filtro.vigenciaFinal1 } });
    }

    if (filtro.vigenciaFinal2) {
        match['$and'].push({ hasta: { $lte: filtro.vigenciaFinal2 } });
    }

    if (filtro.cumulosAl1) {
        match['$and'].push({ cumulosAl: { $gte: filtro.cumulosAl1 } });
    }

    if (filtro.cumulosAl2) {
        match['$and'].push({ cumulosAl: { $lte: filtro.cumulosAl2 } });
    }

    if (filtro.tipoCumulo) {
        match['$and'].push({ 'tipoCumulo': filtro.tipoCumulo });
    }

    if (filtro.origen) {
        match['$and'].push({ 'origen': filtro.origen });
    }

    if (filtro.moneda) {
        match['$and'].push({ 'moneda': filtro.moneda });
    }

    const userId = Meteor.userId();

    console.log("match: ", JSON.stringify(match)) 

    const pipeline = [
        { $match: match }, 
        { $project: { _id: 0 } }, 

        // los contratos no tiene un valor para el asegurado; nos aseguramos que venga un asegurado cuando no hay uno 
        {
            $addFields: {
                asegurado: { $ifNull: ["$asegurado", ""] }
            }
        },

        {
            $lookup:
            {
                from: "monedas",                        // este es el foreign collection 
                let: { moneda: "$moneda" },           // estos son los local fields; pueden ser definidos como variables  
                pipeline: [
                    {
                        $match:
                            // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                            // $$ para referenciar variables en let; $ para referenciar fields en el foreign collection 
                            { $expr: { $eq: ["$$moneda", "$_id"] } }
                    },
                    { $project: { _id: 0, descripcion: 1, simbolo: 1, } }
                ],
                as: "monedas"
            }
        },

        {
            $lookup:
            {
                from: "companias",                        // este es el foreign collection 
                let: { compania: "$compania" },           // estos son los local fields; pueden ser definidos como variables  
                pipeline: [
                    {
                        $match:
                            // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                            { $expr: { $eq: ["$$compania", "$_id"] } }
                    },
                    { $project: { _id: 0, nombre: 1, abreviatura: 1, } }
                ],
                as: "companias"
            }
        },

        {
            $lookup:
            {
                from: "companias",                        // este es el foreign collection 
                let: { compania: "$cedenteOriginal" },           // estos son los local fields; pueden ser definidos como variables  
                pipeline: [
                    {
                        $match:
                            // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                            { $expr: { $eq: ["$$compania", "$_id"] } }
                    },
                    { $project: { _id: 0, nombre: 1, abreviatura: 1, } }
                ],
                as: "cedentesOriginales"
            }
        },

        {
            $lookup:
            {
                from: "ramos",                        // este es el foreign collection 
                let: { ramo: "$ramo" },           // estos son los local fields; pueden ser definidos como variables  
                pipeline: [
                    {
                        $match:
                            // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                            { $expr: { $eq: ["$$ramo", "$_id"] } }
                    },
                    { $project: { _id: 0, descripcion: 1, abreviatura: 1, } }
                ],
                as: "ramos"
            }
        },

        {
            $lookup:
            {
                from: "cumulos",                        // este es el foreign collection 
                let: { tipoCumulo: "$tipoCumulo" },           // estos son los local fields; pueden ser definidos como variables  
                pipeline: [
                    {
                        $match:
                            // aquí podemos poner varios expressions; $$ permite usar fields definidos en let 
                            { $expr: { $eq: ["$$tipoCumulo", "$_id"] } }
                    },
                    { $project: { _id: 0, descripcion: 1, abreviatura: 1 } }
                ],
                as: "cumulos"
            }
        },

        // {
        //     $lookup:
        //     {
        //         from: "asegurados",                        // este es el foreign collection 
        //         let: { asegurado: "$asegurado" },           // estos son los local fields; pueden ser definidos como variables  
        //         pipeline: [
        //             {
        //                 $match:
        //                 {
        //                     $expr:
        //                     {
        //                         $or:
        //                             [
        //                                 { $eq: ["$$asegurado", "$_id"] },
        //                                 { $eq: ["$$asegurado", ""] }        // cuando no hay un asegurado, agregamos { asegurado: "" }
        //                             ]
        //                     }
        //                 }
        //             },
        //             { $project: { _id: 0, nombre: 1, abreviatura: 1, } }
        //         ],
        //         as: "asegurados"
        //     }
        // },

        {
            $lookup: {
                from: "asegurados",
                localField: "asegurado",    // field in the orders collection
                foreignField: "_id",        // field in the items collection
                as: "asegurados"
            }
        }, 

        










        // {
        //     '$addFields': {
        //         'vitamins': { '$ifNull': [ '$vitamins', [] ] }
        //     }
        // }













        // los contratos no tiene un valor para el asegurado; nos aseguramos que venga un asegurado cuando no hay uno 
        // {
        //     $set: {
        //         asegurados: { $cond: { if: { 'asegurados': { $exists: true, $size: 0 } }}, then: [{}], else: '$asegurados' }
        //     }
        // },

        { $unwind: "$monedas" }, 
        { $unwind: "$companias" },
        { $unwind: "$ramos" },
        { $unwind: "$cedentesOriginales" },
        { $unwind: "$cumulos" }, 

        // { $unwind: "$asegurados" },

        {
            $unwind:
            {
                path: "$asegurados",
                // includeArrayIndex: <string>,
                preserveNullAndEmptyArrays: true
            }
        },

        // cómo los contratos no tienen un asegurado, el lookup anterior no agrega los datos del asegurado. 
        // agregamos el field pero como un empty object 
        {
            $addFields: {
                asegurados: { $ifNull: ["$asegurados", {}] }
            }
        },


        // // para leer los cúmulos asociados a los movimientos de facultativo 
        // {   $lookup: {
        //         // este es el foreign collection 
        //         from: "cumulos_registro",                        
        //         // (optional) estos son los local fields (from the aggregation); pueden ser definidos como variables  
        //         let: { entityId: "$entityId", subEntityId: "$subEntityId" },           
        //         pipeline: [
        //                     { 
        //                         $match: { $expr:
        //                             {   $and:
        //                                 [
        //                                     { $eq: [ "$entityId",  "$$entityId" ] },
        //                                     { $eq: [ "$subEntityId", "$$subEntityId" ] }, 
        //                                     { $and: cumulos_match }
        //                                 ]
        //                             }
        //                     }
        //                 },
        //                 { $project: { 
        //                     _id: 0, 
        //                     entityId: 0, 
        //                     subEntityId: 0, 
        //                     ingreso: 0, 
        //                     ultAct: 0, 
        //                     usuario: 0, 
        //                     ultUsuario: 0, 
        //                     cia: 0
        //                 }}
        //             ],
        //         as: "cumulos"
        //     }
        // },
        // { $match: { cumulos: { $exists: true, $ne: [] }}},       // solo riesgos con cúmulos 
        // { $unwind: "$cumulos" }, 

        // // para leer el tipo de cúmulo que corresponde (terremoto, inundación, ... )
        // { $lookup:
        //     {
        //     // este es el foreign collection 
        //     from: "cumulos",                        
        //     // (optional) estos son los local fields (from the aggregation); pueden ser definidos como variables  
        //     let: { tipoCumuloId: "$cumulos.tipoCumulo", zonaId: "$cumulos.zona" },           
        //     pipeline: [
        //             { $match:
        //                 { $expr:
        //                     { $and:
        //                         [
        //                             { $eq: [ "$_id",  "$$tipoCumuloId" ] },
        //                         ]
        //                     }
        //                 }
        //             },
        //             { $project: { 
        //                 _id: 0, 
        //                 descripcion: 1, 
        //                 abreviatura: 1, 
        //                 zonas: { $filter: { input: "$zonas", as: "zona", cond: { $eq: [ "$$zona._id", '$$zonaId' ] }}}
        //             }}
        //         ],
        //         as: "tiposCumulo"
        //     }
        // },
        // { $unwind: '$tiposCumulo' },  
        // { $unwind: '$tiposCumulo.zonas' },  
        // { $project: { 'tiposCumulo.zonas._id': 0 }}, 

        { $addFields: { 
            user: userId
            // 'cumulos.montoCedido': { $sum: [ '$cumulos.cesionCuotaParte', '$cumulos.cesionExcedente', '$cumulos.cesionFacultativo' ] }
        } },
        { $merge: { into: "temp_consulta_cumulos", on: [ "_id" ], whenMatched: "replace", whenNotMatched: "insert" } }
   ]

    await Cumulos_Registro.rawCollection().aggregate(pipeline).toArray(); 
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
            // 'cumulos.montoCedido': { $sum: [ '$cumulos.cesionCuotaParte', '$cumulos.cesionExcedente', '$cumulos.cesionFacultativo' ] }
        } },
        { $merge: { into: "temp_consulta_cumulos", on: "_id", whenMatched: "replace", whenNotMatched: "insert" } }
   ]

    await Contratos.rawCollection().aggregate(pipeline).toArray(); 
}

function prepararFechasEnFiltro(filtro) { 

    const f = { ...filtro }; 
    
    f.vigenciaInicial1 = moment(f.vigenciaInicial1).isValid() ? moment(f.vigenciaInicial1).toDate() : null; 
    f.vigenciaInicial2 = moment(f.vigenciaInicial2).isValid() ? moment(f.vigenciaInicial2).toDate() : null; 
    f.vigenciaFinal1 = moment(f.vigenciaFinal1).isValid() ? moment(f.vigenciaFinal1).toDate() : null; 
    f.vigenciaFinal2 = moment(f.vigenciaFinal2).isValid() ? moment(f.vigenciaFinal2).toDate() : null; 
    f.cumulosAl1 = moment(f.cumulosAl1).isValid() ? moment(f.cumulosAl1).toDate() : null; 
    f.cumulosAl2 = moment(f.cumulosAl2).isValid() ? moment(f.cumulosAl2).toDate() : null; 

    // la fecha final del período debe ser el último momento del día, para que incluya cualquier fecha de ese día 
    f.vigenciaInicial2 = f.vigenciaInicial2 ? new Date(f.vigenciaInicial2.getFullYear(), f.vigenciaInicial2.getMonth(), f.vigenciaInicial2.getDate(), 23, 59, 59) : null; 
    f.vigenciaFinal2 = f.vigenciaFinal2 ? new Date(f.vigenciaFinal2.getFullYear(), f.vigenciaFinal2.getMonth(), f.vigenciaFinal2.getDate(), 23, 59, 59) : null; 
    f.cumulosAl2 = f.cumulosAl2 ? new Date(f.cumulosAl2.getFullYear(), f.cumulosAl2.getMonth(), f.cumulosAl2.getDate(), 23, 59, 59) : null; 

    return f; 
}