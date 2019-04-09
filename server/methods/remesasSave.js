


import lodash from 'lodash'; 
import { Remesas } from '/imports/collections/principales/remesas';  

Meteor.methods(
{
    remesasSave: function (item) {

        // el usuario puede editar las partidas del asiento (de la remesa). Eliminamos algunas 'marcadas' para ello ... 
        if (item.asientoContable) { 
            lodash.remove(item.asientoContable, (p) => { return p.docState === 3; }); 
        }

        if (item.asientoContable) { 
            item.asientoContable.forEach((p) => { delete p.docState; }); 
        }

        if (item.docState && item.docState == 1) {
            delete item.docState;

            // si el número viene en '0', asignamos un número consecutivo al remesa
            // TODO: encontrar una mejor forma de actualizar el consecutivo ...
            if (!item.numero) {
                var numeroAnterior = Remesas.findOne({ cia: item.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior || !numeroAnterior.numero) { 
                    item.numero = 1;
                }
                else { 
                    item.numero = numeroAnterior.numero + 1;
                }
            }

            Remesas.insert(item);
        }

        if (item.docState && item.docState == 2) {

            var item2 = _.clone(item, true);

            delete item2.docState;
            delete item2._id;

            item2.ultAct = new Date();
            item2.ultUsuario = Meteor.user().emails[0].address; 

            // si el número viene en '0', asignamos un número consecutivo al remesa
            if (!item2.numero) {
                var numeroAnterior = Remesas.findOne({ cia: item.cia }, { fields: { numero: 1 }, sort: { numero: -1 } });
                if (!numeroAnterior.numero) { 
                    item2.numero = 1;
                }
                else { 
                    item2.numero = numeroAnterior.numero + 1;
                }  
            }

            if (!item2.fechaCerrada) { 
                Remesas.update({ _id: item._id }, { $set: item2 });
            } else { 
                // si la remesa está cerrada, solo podemos modificar su asiento contable 
                Remesas.update({ _id: item._id }, { $set: { asientoContable: item2.asientoContable }});
            }
            
        }

        if (item.docState && item.docState == 3) {
            Remesas.remove({ _id: item._id });
        }

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})
