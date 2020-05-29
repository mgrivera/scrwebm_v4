
import { Meteor } from 'meteor/meteor'
import { Cierre } from '/imports/collections/cierre/cierre'; 

// esta función recibe una entidad (ej: remesa), lee el último período cerrado y protege la entidad si corresponde a ese 
// período. Para protegerla, agrega una propiedad que luego podemos validar: si existe, impedimos cambiarla .... 
async function protegerEntidades (entidades, ciaSeleccionadaId) { 

    // nos aseguramos que el último período cerrado este en minimongo 
    await subscribe_ultimoPeriodoCerrado(ciaSeleccionadaId); 
    
    // leemos el último cierre efectuado para la compañía; nota: siempre está en el client, pues publicamos con null ... 
    const ultimoCierre = Cierre.findOne({ cia: ciaSeleccionadaId, cerradoFlag: true }, { sort: { hasta: -1, }}); 

    if (!ultimoCierre) { 
        return; 
    }

    const cierreDate = new Date(ultimoCierre.hasta.toDateString());

    for (const entidad of entidades) { 
        // eliminamos la parte 'time' a ambas fechas para poder comparar 
        const entidadDate = new Date(entidad.fecha.toDateString());
        
        // la fecha debe ser *posterior* al período de cierre 
        if (entidadDate > cierreDate) { 
            continue; 
        }

        // protegemos la entidad, pues corresponde a un período cerrado ... NOTESE como agregamos una propiedad a la entidad 
        // la idea es que al validar con SimpleSchema, si esta propiedad existe (protegida) se regresa simpre un error 
        // de validación que impide que el usuario la cambie 
        entidad.protegida = { protegida: true, razon: "Corresponde a un período cerrado." }; 
    } 
}

const subscribe_ultimoPeriodoCerrado = (ciaSeleccionadaId) => { 
    return new Promise((resolve) => { 
        Meteor.subscribe("utimoPeriodoCerrado", ciaSeleccionadaId, () => { resolve() })
    })
}

export default protegerEntidades; 