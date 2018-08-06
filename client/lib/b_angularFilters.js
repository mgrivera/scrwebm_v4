
import numeral from 'numeral';
import moment from 'moment';
import lodash from 'lodash';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 
import { TiposSiniestro } from '/imports/collections/catalogos/tiposSiniestro'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Coberturas } from '/imports/collections/catalogos/coberturas'; 
import { CausasSiniestro } from '/imports/collections/catalogos/causasSiniestro'; 

// ---------------------------------------------------------------------------------------
// ui-grid: para formatear fields numéricos y dates
// ---------------------------------------------------------------------------------------
angular.module("scrwebM").filter('currencyFilter', function () {
    return function (value) {
        return numeral(value).format('0,0.00');
    };
});

angular.module("scrwebM").filter('number8decimals', function () {
    return function (value) {
        if (lodash.isFinite(value))
            return numeral(value).format('0.00000000');
        else
            return "";
    };
});

angular.module("scrwebM").filter('number6decimals', function () {
    return function (value) {
        if (value)
            return numeral(value).format('0.000000');
        else
            return "";
    };
});

angular.module("scrwebM").filter('currencyFilterAndNull', function () {
    return function (value) {
        if (lodash.isFinite(value))
            return numeral(value).format('0,0.00');
        else
            return "";
    };
});

angular.module("scrwebM").filter('dateFilter', function () {
    return function (value) {
        if (value)
            return moment(value).format('DD-MM-YY');
        else
            return "";
    };
});

angular.module("scrwebM").filter('dateFilterFullMonthAndYear', function () {
    return function (value) {
        if (value)
            return moment(value).format('DD-MMM-YYYY');
        else
            return "";
    };
});

angular.module("scrwebM").filter('dateTimeFilter', function () {
    return function (value) {
        if (value)
            return moment(value).format('DD-MM-YY h:m a');
        else
            return "";
    };
});

angular.module("scrwebM").filter('boolFilter', function () {
    return function (value) {
        return value ? "Ok" : "";
    };
});

angular.module("scrwebM").filter('tipoContratoFilter', function () {
    return function (tipoContratoID) {
        var tipoContrato = TiposContrato.find(tipoContratoID);
        return !nombreTipoContrato || lodash.isEmpty(nombreTipoContrato) ? "Indefinido" : tipoContrato.descripcion;
    };
});

angular.module("scrwebM").filter('tipoSiniestroFilter', function () {
    return function (tipoSiniestroID) {
        var tipoSiniestro = TiposSiniestro.findOne(tipoSiniestroID);
        return !tipoSiniestro ? "Indefinido" : tipoSiniestro.abreviatura;
    };
});

var tiposCompania = [{ descripcion: 'Ajustadores', tipo: 'AJUST' },
                     { descripcion: 'Corredores de seguro', tipo: 'CORR' },
                     { descripcion: 'Productores', tipo: 'PROD' },
                     { descripcion: 'Corredores de reaseguro', tipo: 'CORRR' },
                     { descripcion: 'Reaseguradores', tipo: 'REA' },
                     { descripcion: 'Compañías de seguro', tipo: 'SEG' }];

angular.module("scrwebM").filter('tipoCompaniaFilter', function () {
    return function (tipoCompania) {

        var found = lodash.find(tiposCompania, function (t) { return t.tipo == tipoCompania; });

        return found ? found.descripcion : "Indefinido";
    };
});

angular.module("scrwebM").filter('tipoCompania2Filter', function () {
    // la diferencia con el anterior es que aquí recibimos una compañía, la buscamos; buscamos su tipo y lo regresamos
    return function (companiaID) {

        var compania = Companias.findOne(companiaID);

        if (!compania)
            return " ";

        if (compania.nosotros)
            return " ";

        var found = lodash.find(tiposCompania, function (t) { return t.tipo == compania.tipo; });

        return found ? found.descripcion : "Indefinido";
    };
});

angular.module("scrwebM").filter('empresaUsuariaSeleccionadaFilter', function () {
    return function (companiaID) {
        var compania = EmpresasUsuarias.findOne(companiaID, { fields: { nombre: 1 } });
        return !compania || lodash.isEmpty(compania) ? "Indefinido" : compania.nombre;
    };
});

angular.module("scrwebM").filter('companiaAbreviaturaFilter', function () {
    return function (companiaID) {
        var compania = Companias.findOne(companiaID, { fields: { abreviatura: 1 } });
        return !compania || lodash.isEmpty(compania) ? "Indefinido" : compania.abreviatura;
    };
});

angular.module("scrwebM").filter('ramoAbreviaturaFilter', function () {
    return function (ramoID) {
        var ramo = Ramos.findOne(ramoID, { fields: { abreviatura: 1 } });
        return !ramo || lodash.isEmpty(ramo) ? "Indefinido" : ramo.abreviatura;
    };
});

angular.module("scrwebM").filter('coberturaAbreviaturaFilter', function () {
    return function (coberturaID) {
        var cobertura = Coberturas.findOne(coberturaID, { fields: { abreviatura: 1 } });
        return !cobertura || lodash.isEmpty(cobertura) ? "Indefinido" : cobertura.abreviatura;
    };
});

angular.module("scrwebM").filter('aseguradoAbreviaturaFilter', function () {
    return function (aseguradoID) {
        var asegurado = Asegurados.findOne(aseguradoID, { fields: { abreviatura: 1 } });

        // si el asegurado no es encontrado, regresamos el id; en algunos casos, allí viene información como
        // 'codigo - referencia' ...
        return !asegurado || lodash.isEmpty(asegurado) ? aseguradoID : asegurado.abreviatura;
    };
});

angular.module("scrwebM").filter('tipoContratoAbreviaturaFilter', function () {
    return function (tipoContratoID) {
        var tipoContrato = TiposContrato.findOne(tipoContratoID);
        return !tipoContrato || lodash.isEmpty(tipoContrato) ? "Indefinido" : tipoContrato.abreviatura;
    };
});

angular.module("scrwebM").filter('suscriptorAbreviaturaFilter', function () {
    return id => {
        let suscriptor = Suscriptores.findOne(id);
        return !suscriptor || lodash.isEmpty(suscriptor) ? "Indef" : suscriptor.abreviatura;
    };
});

angular.module("scrwebM").filter('monedaSimboloFilter', function () {
    return function (monedaID) {
        var moneda = Monedas.findOne(monedaID);
        return !moneda || lodash.isEmpty(moneda) ? "Indefinido" : moneda.simbolo;
    };
});

angular.module("scrwebM").filter('causaSiniestroAbreviaturaFilter', function () {
    return function (causaID) {
        var causa = CausasSiniestro.findOne(causaID, { fields: { abreviatura: 1 } });
        return !causa || lodash.isEmpty(causa) ? "Indefinido" : causa.abreviatura;
    };
});

angular.module("scrwebM").filter('userNameOrEmailFilter', function () {
    return function (userID) {
        if (!userID)
            return "";

        var user = Meteor.users.findOne(userID);
        var userName = 'indefinido';
        if (user)
            if (user.userName)
                userName = user.userName;
            else
                if (lodash.isArray(user.emails) && user.emails.length && user.emails[0].address)
                    userName = user.emails[0].address;

        return userName;
    };
});

// ---------------------------------------------------------------------------------------
// para mostrar información de pagos para las cuotas de contratos, fac, sntros, etc.
// ---------------------------------------------------------------------------------------

angular.module("scrwebM").filter('origenCuota_Filter', function () {
    return function (value) {
        //debugger;
        var source = value;
        return source && source.origen && source.numero ? source.origen + "-" + source.numero : "(???)";
    };
});

angular.module("scrwebM").filter('cuotaTienePagos_Filter', function () {
    return function (value, scope) {
        //debugger;
        var row = scope.row.entity;
        var cantPagos = row.pagos ? row.pagos.length : 0;

        return cantPagos ? cantPagos.toString() : "";
    };
});

angular.module("scrwebM").filter('cuotaTienePagoCompleto_Filter', function () {
    return function (value, scope) {
        //debugger;
        var row = scope.row.entity;

        if (!row.pagos || !row.pagos.length)
            // la cuota no tiene pagos; regresamos false (sin un pago completo)
            return "";

        var completo = lodash.some(row.pagos, function (pago) { return pago.completo; });

        return completo ? "Si" : "";
    };
});

// ---------------------------------------------------------------------------------------
// para mostrar 'unsafe' strings (with embedded html) in ui-bootstrap alerts ....
// ---------------------------------------------------------------------------------------
angular.module("scrwebM").filter('unsafe',
['$sce',
function ($sce) {
    return function (value) {
        if (!value) { return ''; }
        return $sce.trustAsHtml(value);
    };
}
]);


// -----------------------------------------------------------------------------------------------------------
// nota: lo que sigue es para lograr implementar el comportamiento del dropdownlist en el ui-grid ...
// -----------------------------------------------------------------------------------------------------------

angular.module("scrwebM").filter('mapDropdown',
['uiGridFactory',
function (uiGridFactory) {
    return uiGridFactory.getMapDrowdownFilter()
}]);

angular.module("scrwebM").factory('uiGridFactory',
['$http', '$rootScope',
function ($http, $rootScope) {

    var factory = {};

    /* It returns a dropdown filter to help you show editDropdownValueLabel
     *
     * Parameters:
     *
     * - input: selected input value, it always comes when you select a dropdown value
     * - map: Dictionary containing the catalog info. For example:
     *    $scope.languageCatalog = [ {'id': 'EN', 'description': 'English'}, {'id': 'ES', 'description': 'Español'} ]
     * - idLabel: ID label. For this example: 'id'.
     * - valueLabel: Value label. For this example: 'description'.
     *
     * 1) Configure cellFilter this way at the ui-grid colDef:
     *
     * { field: 'languageId', name: 'Language'), editableCellTemplate: 'ui-grid/dropdownEditor',
     *   editDropdownIdLabel: 'id', editDropdownValueLabel: 'description',
     *   editDropdownOptionsArray: $scope.languageCatalog,
     *   cellFilter: 'mapDropdown:row:row.grid.appScope.languageCatalog:"id":"description":languageCatalog' },
     *
     * 2) Append this snippet to the controller:
     *
     * .filter('mapDropdown', function(uiGridFactory) {
     *    return uiGridFactory.getMapDrowdownFilter()
     * });
     *
     */
    factory.getMapDrowdownFilter = function () {
        return function (input, map, idLabel, valueLabel) {
            if (map != null) {
                for (var i = 0; i < map.length; i++) {
                    if (map[i][idLabel] === input) {
                        return map[i][valueLabel];
                    }
                }
            }
            return "";
        };
    };

    return factory;
}]);
