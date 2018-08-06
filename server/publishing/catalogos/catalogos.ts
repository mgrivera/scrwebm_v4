

import { CuentasContables } from 'imports/collections/catalogos/cuentasContables'; 
import { CuentasContablesAsociadas } from 'imports/collections/catalogos/cuentasContablesAsociadas';
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { CuentasBancarias } from 'imports/collections/catalogos/cuentasBancarias'; 
import { Bancos } from 'imports/collections/catalogos/bancos'; 
import { Asegurados } from 'imports/collections/catalogos/asegurados'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 
import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias';
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 
import { TiposContrato } from 'imports/collections/catalogos/tiposContrato'; 
import { ContratosParametros } from 'imports/collections/catalogos/contratosParametros'; 
import { TiposFacultativo } from 'imports/collections/catalogos/tiposFacultativo'; 
import { TiposSiniestro } from 'imports/collections/catalogos/tiposSiniestro'; 
import { Suscriptores } from 'imports/collections/catalogos/suscriptores'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 
import { Coberturas } from 'imports/collections/catalogos/coberturas'; 
import { TiposObjetoAsegurado } from 'imports/collections/catalogos/tiposObjetoAsegurado'; 
import { CausasSiniestro } from 'imports/collections/catalogos/causasSiniestro'; 

Meteor.publish("empresasUsuarias", function () {
    return EmpresasUsuarias.find({});
})

Meteor.publish("companiaSeleccionada", function () {
    return CompaniaSeleccionada.find({ userID: this.userId });
})

Meteor.publish(null, function () {
    // nótese como la idea es regresar aquí todos los catálogos ...
    // nota: como el nombre de método es null, los collections se regresan a
    // cada client en forma automática ...

    return [
             EmpresasUsuarias.find({}),
             TiposContrato.find({}),
             TiposFacultativo.find({}),
             TiposSiniestro.find({}),
             Monedas.find({}),
             Companias.find({}),
             Bancos.find({}),
             CuentasBancarias.find({}),
             CausasSiniestro.find({}),
             Asegurados.find({}),
             Indoles.find({}),
             Ramos.find({}),
             Coberturas.find({}),
             Suscriptores.find({}),
             CompaniaSeleccionada.find({ userID: this.userId }),
             Meteor.roles.find(), 
             TiposObjetoAsegurado.find(), 
    ];
})

Meteor.publish("tiposContrato", function () {
    return TiposContrato.find({});
})

Meteor.publish("tiposFacultativo", function () {
    return TiposFacultativo.find({});
})

Meteor.publish("tiposSiniestro", function () {
    return TiposSiniestro.find({});
})

Meteor.publish("monedas", function () {
    return Monedas.find({});
})

Meteor.publish("companias", function () {
    return Companias.find({});
})

Meteor.publish("bancos", function () {
    return Bancos.find({});
})

Meteor.publish("causasSiniestro", function () {
    return CausasSiniestro.find({});
})

Meteor.publish("asegurados", function () {
    return Asegurados.find({});
})

Meteor.publish("indoles", function () {
    return Indoles.find({});
})

Meteor.publish("ramos", function () {
    return Ramos.find({});
})

Meteor.publish("coberturas", function () {
    return Coberturas.find({});
})

Meteor.publish("suscriptores", function () {
    return Suscriptores.find({});
})

Meteor.publish("contratosParametros", function () {
    // nota: en esta tabla solo debe haber un (1) registro (o ninguno) ...
    return ContratosParametros.find({});
})

Meteor.publish("cuentasContables", function () {
    // regresamos solo las cuentas que corresponden a la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

    if (!companiaSeleccionada) {
        return [];
    }   

    return CuentasContables.find({ cia: companiaSeleccionada.companiaID });
})

Meteor.publish("cuentasContablesSoloDetalles", function () {
    // regresamos solo las cuentas que corresponden a la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

    if (!companiaSeleccionada) {
        return [];
    }

    return CuentasContables.find({ cia: companiaSeleccionada.companiaID, totDet: "D", }, 
                                 { fields: { cuenta: 1, descripcion: 1, totDet: 1, cia: 1, }});
})

Meteor.publish("cuentasContablesAsociadas", function () {
    // regresamos solo las cuentas que corresponden a la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

    if (!companiaSeleccionada) {
        return [];
    }

    return CuentasContablesAsociadas.find({ cia: companiaSeleccionada.companiaID });
})
