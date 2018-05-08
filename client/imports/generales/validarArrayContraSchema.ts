

export function validarArrayContraSchema(array, mongoCollection, erroresArray) { 

    // recibimos un array con el contenido de algún mongo collection y lo validamos contra el schema que hemos definido para el collection

    if (array && Array.isArray(array)) { 
        array.forEach(function (c) {
            if (c.docState && c.docState != 3) {

                let isValid = mongoCollection.simpleSchema().namedContext().validate(c);

                if (!isValid) { 
                    mongoCollection.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        erroresArray.push("El valor '" + error.value + "' no es adecuado para el campo '" + 
                                          mongoCollection.simpleSchema().label(error.name) + 
                                          "'; error de tipo '" + error.type + "'.");
                    })
                }   
            }
        })
    }
}


export function validarItemContraSchema(item, mongoCollection, erroresArray) { 

    // recibimos un item con el contenido de algún mongo collection y lo validamos contra el schema que hemos definido para el collection

    if (item && item.docState) { 
        if (item.docState != 3) {
            let isValid = mongoCollection.simpleSchema().namedContext().validate(item);
        
            if (!isValid) {
                mongoCollection.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    erroresArray.push("El valor '" + error.value + "' no es adecuado para el campo '" + 
                                      mongoCollection.simpleSchema().label(error.name) + 
                                      "'; error de tipo '" + error.type + "'.");
                })
            }
        }
    }
}

