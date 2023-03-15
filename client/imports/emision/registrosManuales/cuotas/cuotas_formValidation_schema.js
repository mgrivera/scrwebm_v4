
import SimpleSchema from 'simpl-schema';

const cuotas_formValidation_schema = new SimpleSchema({
    cantidadCuotas: { type: SimpleSchema.Integer, label: 'Cantidad de cuotas', optional: false },   
    fecha1raCuota: { type: Date, label: 'Fecha de la 1ra cuota', optional: false }, 
    diasVencimiento: { type: SimpleSchema.Integer, label: 'Cantidad de días de vencimiento de las cuotas', optional: false },   
    cantidadDias: { type: SimpleSchema.Integer, label: 'Cantidad de días entre cuotas', optional: true },   
    cantidadMeses: { type: SimpleSchema.Integer, label: 'Cantidad de meses entre cuotas', optional: true }
})

// ============================================================================================================
// agregamos una función para agregar validaciones al registro (no por valor sino para el item como un todo)
// para agregar una validación para todo el schema y no para un field en particular 
cuotas_formValidation_schema.addDocValidator(obj => {
    // Must return an array, potentially empty, of objects with `name` and `type` string properties and optional `value` property.
    const { cantidadCuotas, cantidadDias, cantidadMeses } = { ...obj }; 

    if (!cantidadCuotas) { 
        // solo efectuamos esta validación cuando viene un valor para cantidad de cuotas 
        return []; 
    }

    if (cantidadCuotas === 1 && !cantidadDias && !cantidadMeses) {
        return [];
    }

    if (cantidadCuotas > 1 && cantidadDias && !cantidadMeses) {
        return [];
    }

    if (cantidadCuotas > 1 && !cantidadDias && cantidadMeses) {
        return [];
    }

    if (cantidadDias && cantidadMeses) {
        return [
            {
                name: 'cantidad días/meses',                 // nombre del field que contiene el error 
                // normalmente, el type es de la forma: 'DIAS-MESES-ERROR'; pero aquí lo usaremos para mostrar un mensaje (aunque corto!)
                type: 'Indique un valor para el campo "cant de días" o "cant de meses", pero no para ambos.',    // tipo que queremos asignar al error  
                value: cantidadDias                // valor del field que produjo el error 
            }
        ];
    }

    return [
        { 
            name: 'cantidad de cuotas',                 // nombre del field que contiene el error 
            // normalmente, el type es de la forma: 'DIAS-MESES-ERROR'; pero aquí lo usaremos para mostrar un mensaje (aunque corto!)
            type: 'Indique "cant de días/meses" (solo uno de ellos), cuando "cant cuotas" es mayor que 1.',    // tipo que queremos asignar al error  
            value: cantidadCuotas                // valor del field que produjo el error 
        }
    ];
})

export { cuotas_formValidation_schema }; 