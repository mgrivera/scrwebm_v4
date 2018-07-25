

import { Cierre } from '../../../imports/collections/cierre/cierre'; 

export class ProtegerEntidades { 

    // esta clase recibe un array de entidades, riesgos, cuotas, remesas, etc., y las protege. En este caso, la razón de la 
    // protección es impedir alterar entidades que corresponden a procesos cerrados. 

    constructor(private entidades: any[], private ciaSeleccionada_id: string) { 
        // nótese que la clase "no sabe" cuales entidades recibe; pueden ser remesas, cuotas, registros de cierre, etc. 
        // las entidades siempre tendrán una fecha y podrán recibir una propiedad 'protegida', que es un object: 
        // { protegida, razon } 

    }

    public proteger_periodoCerrado() { 
        
        // leemos el último cierre efectuado para la compañía; nota: siempre está en el client, pues publicamos con null ... 
        let ultimoCierre = Cierre.findOne({ cia: this.ciaSeleccionada_id }); 
    
        if (!ultimoCierre) { 
            return; 
        }

        let cierreDate = new Date(ultimoCierre.hasta.toDateString());

        for (let entidad of this.entidades) { 
            // eliminamos la parte 'time' a ambas fechas para poder comparar 
            let entidadDate = new Date(entidad.fecha.toDateString());
            
            // la fecha debe ser *posterior* al período de cierre 
            if (entidadDate > cierreDate) { 
                continue; 
            }

            // protegemos la entidad, pues corresponde a un período cerrado ... 
            entidad.protegida = { protegida: true, razon: "Corresponde a un período cerrado." }; 
        } 
    }
}