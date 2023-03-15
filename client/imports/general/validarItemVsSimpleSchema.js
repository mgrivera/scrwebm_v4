
// esta función recibe un item y un schema (simpl_schema) 
// el objetivo es validar el item contra su schema
function validarItemVsSimpleSchema(item, simpleSchema) { 

    const isValid = simpleSchema.namedContext().validate(item);
    const errores = []; 

    if (!isValid) {
        simpleSchema.namedContext().validationErrors().forEach(function (error) {

            let message = ""; 

            if (error.name.toLowerCase().includes("password")) { 
                // la idea es no enviar el valor de un item tipo password 
                message = `El valor indicado para el campo <b><em>${error.name}</em></b> no es adecuado; error de tipo '${error.type}'.`
            } else { 
                message = `El valor: <b><em>'${error.value}'</em></b> no es adecuado para el campo: <b><em>${error.name}</em></b>; error de tipo: <b><em>'${error.type}'</em></b>.`
            }
            
            errores.push(message);
        });
    }

    let message = ""; 

    if (errores && errores.length) {
        message = "Existen errores de validación en los datos que deben ser corregidos antes de intentar grabar el registro:<br /><br /><ul>" +
            errores.reduce(function (previous, current) {

                if (previous == "")
                    // first value
                    return `<li>${current}</li>`;
                else
                    return previous + `<li>${current}</li>`;
            }, ""); 

        message += "</ul>"; 

        return { 
            error: true, 
            message: message
        }
    }

    return { 
        error: false
    }
}

export default validarItemVsSimpleSchema; 