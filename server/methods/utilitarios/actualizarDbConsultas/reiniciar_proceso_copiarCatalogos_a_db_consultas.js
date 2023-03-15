
import { Meteor } from 'meteor/meteor';

import { Monedas } from '/imports/collections/catalogos/monedas';
import { Companias } from '/imports/collections/catalogos/companias';
import { Ramos } from '/imports/collections/catalogos/ramos';
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato';
import { Suscriptores } from '/imports/collections/catalogos/suscriptores';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';

Meteor.methods(
    {
        // este proceso elimina el valor que pueda tener el field fechaCopiadaSql en las tablas de tipo Catálogos, para que vuelvan a ser 
        // copiadas con la próxima copia 
        reiniciar_proceso_copiarCatalogos_a_db_consultas: async function () {

            Monedas.update({}, { $set: { fechaCopiadaSql: null } }, { multi: true });
            Companias.update({}, { $set: { fechaCopiadaSql: null } }, { multi: true });
            Ramos.update({}, { $set: { fechaCopiadaSql: null } }, { multi: true });
            TiposContrato.update({}, { $set: { fechaCopiadaSql: null } }, { multi: true });
            Suscriptores.update({}, { $set: { fechaCopiadaSql: null } }, { multi: true });
            EmpresasUsuarias.update({}, { $set: { fechaCopiadaSql: null } }, { multi: true });

            const message = `Ok, las tablas de tipo <em>Catálogos</em> han sido modificadas, para que sean copiadas <b>nuevamente</b> con la próxima 
                            ejecución del proceso de <em>copia a la base de datos de consultas</em>. 
                           `; 

            return {
                error: false,
                message
            }
        }
    })