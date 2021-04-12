
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check'; 
import { Match } from 'meteor/check'

Meteor.methods(
    {
        'consultas.montosPendientesCobroVencimientos.generarEmailsCobranza': async function (selectedPlantillas, selectedItems) {

            check(selectedPlantillas, [Match.Any]);
            check(selectedItems, [Match.Any]);

            await waitSomeTime(); 

            if (!selectedPlantillas.length) {
                const message = `Ud. debe seleccionar, desde la lista de plantillas, la que desea usar para construir los Emails. <br /> 
                                Recuerde que el texto y la forma que mostrarán los correos, se construyen en base a la plantilla 
                                que Ud. seleccione.`;

                return {
                    error: true,
                    message
                }
            }

            if (!selectedItems.length) {
                const message = `Ud. debe seleccionar al menos un elemento en la lista, antes de intentar construir los Emails. <br /> 
                                Recuerde que los correos serán construidos y enviados solo para los elementos que Ud. seleccione en la lista.`;

                return {
                    error: true,
                    message
                }
            }

            const message = `Ok, Ud. seleccionó <b>${selectedItems.length}</b> elementos en la lista. <br />
                          Esta función ha construido y enviado Emails para notificar el estado de estos montos 
                          pendientes a las compañías que corresponden.`;

            return {
                error: false,
                message
            }
        }
    })

    function waitSomeTime() {
        return new Promise((resolve) => { 
            setTimeout(() => { resolve() }, 3000); 
        })
    }