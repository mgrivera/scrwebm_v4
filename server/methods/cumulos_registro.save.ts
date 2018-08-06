

import * as moment from 'moment';
import * as lodash from 'lodash'; 

import { Cumulos_Registro } from 'imports/collections/principales/cumulos_registro';  

Meteor.methods(
{
    'cumulos_registro.save': function (item) {

        if (item.docState && item.docState == 1) {
            delete item.docState;
            Cumulos_Registro.insert(item);
        }

        if (item.docState && item.docState == 2) {

            var item2 = lodash.cloneDeep(item);

            delete item2.docState;
            delete item2._id;

            item2.ultAct = new Date();
            item2.ultUsuario = this.userId;

            Cumulos_Registro.update({ _id: item._id }, { $set: item2 });
        }

        if (item.docState && item.docState == 3) {
            Cumulos_Registro.remove({ _id: item._id });
        }

        return { 
            error: false, 
            message: 'Ok, los datos han sido actualizados en la base de datos.', 
        }
    }
})