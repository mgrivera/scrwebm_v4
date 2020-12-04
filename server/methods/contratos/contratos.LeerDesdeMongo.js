
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 

import lodash from 'lodash'; 
import numeral from 'numeral';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';

import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Contratos } from '/imports/collections/principales/contratos'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Cumulos_Registro } from '/imports/collections/principales/cumulos_registro'; 
import { Temp_Consulta_Contratos } from '/imports/collections/consultas/tempConsultaContratos'; 

Meteor.methods(
{
    'contratos.leerDesdeMongo': function (filtro, ciaSeleccionadaID) {

        const filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaSeleccionadaID: { type: String, optional: false, },
        }).validate({ filtro2, ciaSeleccionadaID, });

        const where = {};

        if (filtro2._id)
            where._id = filtro2._id;

        if (filtro2.numero1)
            if (filtro2.numero2)
                where.numero = { $gte: filtro2.numero1, $lte: filtro2.numero2 };
            else
                where.numero = filtro2.numero1;

        if (filtro2.codigo) {
            var search = new RegExp(filtro2.codigo, 'i');
            where.codigo = search;
        }

        if (filtro2.referencia) {
            const search = new RegExp(filtro2.referencia, 'i');
            where.referencia = search;
        }

        // nótese como los 'dates' vienen como strings y deben ser convertidos ...
        if (filtro2.desde1 && moment(filtro2.desde1).isValid())
            if (filtro2.desde2 && moment(filtro2.desde2).isValid())
                where.desde = { $gte: moment(filtro2.desde1).toDate(), $lte: moment(filtro2.desde2).toDate() };
            else
                where.desde = moment(filtro2.desde1).toDate();

        if (filtro2.hasta1 && moment(filtro2.hasta1).isValid())
            if (filtro2.hasta2 && moment(filtro2.hasta2).isValid())
                where.hasta = { $gte: moment(filtro2.hasta1).toDate(), $lte: moment(filtro2.hasta2).toDate() };
            else
                where.hasta = moment(filtro2.hasta1).toDate();

        if (filtro2.compania && filtro2.compania.length) {
            const array = lodash.clone(filtro2.compania);
            where.compania = { $in: array };
        }

        if (filtro2.cedenteOriginal && filtro2.cedenteOriginal.length) {
            const array = lodash.clone(filtro2.cedenteOriginal);
            where.cedenteOriginal = { $in: array };
        }

        if (filtro2.tipo && filtro2.tipo.length) {
            const array = lodash.clone(filtro2.tipo);
            where.tipo = { $in: array };
        }

        if (filtro2.ramo && filtro2.ramo.length) {
            const array = lodash.clone(filtro2.ramo);
            where.ramo = { $in: array };
        }

        if (filtro2.suscriptor && filtro2.suscriptor.length) {
            const array = lodash.clone(filtro2.suscriptor);
            where.suscriptor = { $in: array };
        }

        if (filtro2.descripcion) {
            const search = new RegExp(filtro2.descripcion, 'i');
            where.descripcion = search;
        }

        // -------------------------------------------------------------------------------------------------------------
        // ahora el usuario puede indicar un pedazo del nombre de: moneda, asegurado, ramo, compañía 
        // buscamos en el catálogo y preparamo un array con _ids 
        if (filtro2.moneda_text) {
            // escapamos $ pues tiene un significado especial en regExp; como en: db.products.find({ sku: { $regex: /789$/ }}) ...
            const expr = `${filtro2.moneda_text}`.replace('$', '\\$');
            const search = { $or: [{ descripcion: { $regex: expr, $options: "i" } }, { simbolo: { $regex: expr, $options: "i" } }] };

            const items = Monedas.find(search, { fields: { _id: 1 } }).fetch();
            const array = [];
            items.forEach(x => array.push(x._id));

            // normalmemnte, el contrato tiene capas (noProp) o cuentas (definiciones de ...) (prop) 
            where.$or = [{ 'capas.moneda': { $in: array } }, 
                         { 'cuentasTecnicas_definicion.moneda': { $in: array } }
                        ]; 
        }

        if (filtro2.compania_text) {
            // escapamos $ pues tiene un significado especial en regExp; como en: db.products.find({ sku: { $regex: /789$/ }}) ...
            const expr = `${filtro2.compania_text}`;
            const search = { $or: [{ nombre: { $regex: expr, $options: "i" } }, { abreviatura: { $regex: expr, $options: "i" } }] };

            const items = Companias.find(search, { fields: { _id: 1 } }).fetch();
            const array = [];
            items.forEach(x => array.push(x._id));
            where.cedenteOriginal = { $in: array };
        }

        if (filtro2.ramo_text) {
            // escapamos $ pues tiene un significado especial en regExp; como en: db.products.find({ sku: { $regex: /789$/ }}) ...
            const expr = `${filtro2.ramo_text}`;
            const search = { $or: [{ descripcion: { $regex: expr, $options: "i" } }, { abreviatura: { $regex: expr, $options: "i" } }] };

            const items = Ramos.find(search, { fields: { _id: 1 } }).fetch();
            const array = [];
            items.forEach(x => array.push(x._id));
            where.ramo = { $in: array };
        }

        if (filtro2.tipo_text) {
            // escapamos $ pues tiene un significado especial en regExp; como en: db.products.find({ sku: { $regex: /789$/ }}) ...
            const expr = `${filtro2.tipo_text}`;
            const search = { $or: [{ descripcion: { $regex: expr, $options: "i" } }, { abreviatura: { $regex: expr, $options: "i" } }] };

            const items = TiposContrato.find(search, { fields: { _id: 1 } }).fetch();
            const array = [];
            items.forEach(x => array.push(x._id));
            where.tipo = { $in: array };
        }


        // -------------------------------------------------------------------------------------------------------------
        // para saber si un contrato es prop o noProp, simplemente buscamos si tienen o no items en cada (respectivo) array 
        if (filtro2.propNoProp && filtro2.propNoProp != "todos") {
            switch (filtro2.propNoProp) {
                case "prop": {
                    where.cuentasTecnicas_definicion = { $exists: true, $ne: [] }; 
                    break;
                }
                case "noProp": {
                    where.capas = { $exists: true, $ne: [] }; 
                    break;
                }
            }
        }

        where.cia = ciaSeleccionadaID;

        // eliminamos los items que el usuario pueda haber registrado antes ...
        Temp_Consulta_Contratos.remove({ user: this.userId });

        const contratos = Contratos.find(where).fetch();

        if (contratos.length == 0) {
            return "Cero registros han sido leídos desde la base de datos";
        }

        const companias = Companias.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        const suscriptores = Suscriptores.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        const tipos = TiposContrato.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();
        const ramos = Ramos.find({}, { fields: { _id: 1, abreviatura: 1, }}).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 30 veces; si hay menos de 20 registros, reportamos siempre ...
        const numberOfItems = contratos.length;
        const reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('contratos_leerContratos_reportProgress',
                            { myuserId: this.userId, app: 'contratos', process: 'leerContratos' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        contratos.forEach((item) => {

            const suscriptor = lodash.some(suscriptores, (x) => { return x._id === item.suscriptor; }) ?
                             lodash.find(suscriptores, (x) => { return x._id === item.suscriptor; }).abreviatura :
                             'Indefinido';

            const tipo = lodash.some(tipos, (x) => { return x._id === item.tipo; }) ?
                         lodash.find(tipos, (x) => { return x._id === item.tipo; }).abreviatura :
                         'Indefinido';

            const compania = lodash.some(companias, (x) => { return x._id === item.compania; }) ?
                           lodash.find(companias, (x) => { return x._id === item.compania; }).abreviatura :
                           'Indefinido';

            const ramo = lodash.some(ramos, (x) => { return x._id === item.ramo; }) ?
                       lodash.find(ramos, (x) => { return x._id === item.ramo; }).abreviatura :
                       'Indefinido';

            const contrato = {};

            contrato._id = new Mongo.ObjectID()._str;

            contrato.id = item._id,
            contrato.numero = item.numero;
            contrato.codigo = item.codigo;
            contrato.referencia = item.referencia;
            contrato.desde = item.desde;
            contrato.hasta = item.hasta;
            contrato.compania = compania;
            contrato.suscriptor = suscriptor;
            contrato.tipo = tipo;
            contrato.ramo = ramo;
            contrato.descripcion = item.descripcion;

            contrato.cia = item.cia;
            contrato.user = Meteor.userId();

            Temp_Consulta_Contratos.insert(contrato);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contratos_leerContratos_reportProgress',
                                    { myuserId: this.userId, app: 'contratos', process: 'leerContratos' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contratos_leerContratos_reportProgress',
                                        { myuserId: this.userId, app: 'contratos', process: 'leerContratos' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        if (filtro2.registroCumulos && filtro2.registroCumulos != "todos") { 

            // para cada riesgo, leemos a ver si tiene o un cúmulo registrado 
            const array = Temp_Consulta_Contratos.find({ user: Meteor.userId() }).fetch(); 

            array.forEach((itemConsulta) => { 

                const existe = Cumulos_Registro.findOne({ entityId: itemConsulta.id }); 

                switch (filtro2.registroCumulos) { 
                    case "con": { 
                        if (!existe) { 
                            Temp_Consulta_Contratos.remove({ _id: itemConsulta._id }); 
                        }
                        break; 
                    }
                    case "sin": { 
                        if (existe) { 
                            Temp_Consulta_Contratos.remove({ _id: itemConsulta._id }); 
                        }
                        break; 
                    }
                }
            }) 
        }

        return "Ok, los contratos que cumplen el criterio indicado, han sido leídos desde la base de datos.";
    }
})