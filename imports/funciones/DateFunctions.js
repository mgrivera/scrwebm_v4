
// ===================================================================================
// convertimos desde '2020-03-25' a un date 
// ===================================================================================
function convertFromStringToDate(stringDate) { 

    const dateArray = stringDate.split('-'); 

    if (!Array.isArray(dateArray) || !(dateArray.length === 3)) { 
        return { 
            error: true, 
            message: `El valor debe ser una fecha de esta forma: '2019-03-22'. El valor recibido, en cambio, es: ${stringDate}`
        }
    }

    let ano = 0; 
    let mes = 0; 
    let dia = 0; 

    try {
        ano = dateArray[0];
        mes = dateArray[1];
        dia = dateArray[2];
    } catch { 
        return {
            error: true,
            message: `El valor debe ser una fecha de esta forma: '2019-03-22'. El valor recibido, en cambio, es: ${stringDate}`
        }
    }

    if (!parseInt(ano) || !parseInt(mes) || !parseInt(dia)) {
        return {
            error: true,
            message: `El valor debe ser una fecha de esta forma: '2019-03-22'. El valor recibido, en cambio, es: ${stringDate}`
        }
    }

    ano = parseInt(ano); 
    mes = parseInt(mes) - 1; 
    dia = parseInt(dia); 

    let date = null; 

    try { 
        date = new Date(ano, mes, dia); 
    } catch(err) {
        return {
            error: true,
            message: `El valor debe ser una fecha de esta forma: '2019-03-22'. El valor recibido, en cambio, es: ${stringDate}`
        }
    }

    return {
        error: false,
        date
    }
}

export { convertFromStringToDate };