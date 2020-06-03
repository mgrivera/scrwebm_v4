
import { Meteor } from 'meteor/meteor'; 
import moment from 'moment'; 

import SimpleSchema from 'simpl-schema';

import { CierreRegistro } from '/imports/collections/cierre/registroCierre'; 
import { Cierre } from '/imports/collections/cierre/cierre'; 
import { Temp_consulta_cierreRegistro } from '/imports/collections/consultas/temp_consulta_cierreRegistro'; 
import { Temp_Consulta_NotasDebitoCredito } from '/imports/collections/consultas/tempConsultaNotasDebitoCredito'; 
import { Temp_Consulta_Riesgos } from '/imports/collections/consultas/tempConsultaRiesgos'; 
import { Temp_Consulta_Contratos } from '/imports/collections/consultas/tempConsultaContratos'; 

Meteor.methods({
   getCollectionCount: function (collectionName, filtro = "") {

       // agregamos este método para contar la cantidad de registros que contiene un collection;
       // Nota Importante: no usamos 'tmeasday:publish-counts' pues indica en su documentación que
       // puede ser muy ineficiente si el dataset contiene muchos registros; además, este package
       // es reactive, lo cual agregar un cierto costo a su ejecución ...

       // nota: solo a veces usamos filtro ... 

       new SimpleSchema({
           collectionName: { type: String }
         }).validate({ collectionName });

        switch (collectionName) {
            case 'Temp_Consulta_Riesgos': { 
                return Temp_Consulta_Riesgos.find({ user: this.userId }).count();
            }
            case 'Temp_Consulta_Contratos': { 
                return Temp_Consulta_Contratos.find({ user: this.userId }).count();
            } 
            case 'CierreRegistro': { 
                const filtro2 = agregarPeriodoAlFiltro(filtro); 
                return CierreRegistro.find(filtro2).count();
            } 
            case 'Cierre': { 
                return Cierre.find(filtro).count();
            } 
            case 'Temp_consulta_cierreRegistro': { 
                return Temp_consulta_cierreRegistro.find({ user: this.userId }).count();
            }
            case 'temp_consulta_notasDebitoCredito': { 
                return Temp_Consulta_NotasDebitoCredito.find({ user: this.userId }).count();
            }
            default: { 
                return -9999;
            }
        }
   }
})

function agregarPeriodoAlFiltro(filtro) { 
    // con las fechas que crean el criterio del período en el filtro, hacemos algo especial 
    let { fecha1, fecha2 } = filtro; 

    fecha1 = moment(fecha1).isValid() ? moment(fecha1).toDate() : null; 
    fecha2 = moment(fecha2).isValid() ? moment(fecha2).toDate() : null; 

    // la fecha final del período debe ser el último momento del día, para que incluya cualquier fecha de ese día 
    fecha2 = fecha2 ? new Date(fecha2.getFullYear(), fecha2.getMonth(), fecha2.getDate(), 23, 59, 59) : null; 

    const fecha = {}; 

    if (fecha1) { 
        if (fecha2) {
            // las fechas vienen como strings ... 
            fecha.$gte = fecha1;
            fecha.$lte = fecha2;
        }
        else { 
            fecha.$eq = fecha1;
        }
    }

    const filtro2 = { ...filtro, fecha }; 

    delete filtro2.fecha1; 
    delete filtro2.fecha2; 

    return filtro2; 
}