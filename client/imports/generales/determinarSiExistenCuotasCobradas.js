
export const determinarSiExistenCuotasConCobrosAplicados = function(cuotas) { 

    if (!cuotas || !Array.isArray(cuotas)) { 
        return { 
            existenCobrosAplicados: false, 
            message: '', 
        }
    }

    let existenCobrosAplicados = false; 

    for (const cuota of cuotas) { 
        const pagosArray = cuota.pagos ? cuota.pagos : []; 
        if (pagosArray.length) { 
            existenCobrosAplicados = true; 
            break; 
        }
    }

    if (existenCobrosAplicados) { 
        const message = `Las cuotas que Ud. intenta construir <em>ya existen</em>.<br /><br />
                   Aunque, normalmente, Ud. puede reconstruir cuotas que existen en forma previa, 
                   en este caso alguna (s) de las cuotas ha recibido pagos.<br /><br />
                   Si es necesario reconstruir estas cuotas, Ud. debe antes <b>revertir la (las) remesa que corresponda</b>, 
                   para eliminar la cobranza asociada a estas cuotas. Solo entonces las cuotas podrán ser editadas.`

        return { 
            existenCobrosAplicados: true, 
            message: message, 
        }
    } else { 
        return { 
            existenCobrosAplicados: false, 
            message: '', 
        }
    }
}      