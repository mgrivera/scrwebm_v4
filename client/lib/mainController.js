

import angular from 'angular'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Indoles } from '/imports/collections/catalogos/indoles'; 
import { Coberturas } from '/imports/collections/catalogos/coberturas'; 

import { userHasRole } from '/client/imports/generales/userHasRole'; 

// Este controller se carga con la página primera del programa; es decir, la que muestra el menú (navBar) principal
angular.module("scrwebM").controller("MainController", ['$rootScope', '$scope', '$modal', '$location', 
function ($rootScope, $scope, $modal, $location) {

    // este código jQuery permite que los 'subMenu' se muestren con un click en el Bootstrap navBar
    (function($){
        $(document).ready(function(){
            $('ul.dropdown-menu [data-toggle=dropdown]').on('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                $(this).parent().siblings().removeClass('open');
                $(this).parent().toggleClass('open');
            });
        });
    })(jQuery);

    // $location lee el url de la página que se muestra; nótese que $location lee 'true' y no true, por eso
    // usamos true con comillas
    // si la página trae el parámetro vieneDeAfuera, es que es abierta en un tab diferente desde el proceso principal; 
    // por ejmplo: desde las cuotas se abre la página de remesas, en un tab diferente. En esos casos, no queremos mostrar 
    // el navBar principal de navegación del programa ... 
    let queryParams = $location.search();
    $scope.vieneDeAfuera = queryParams && queryParams.vieneDeAfuera && queryParams.vieneDeAfuera === 'true';

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // ---------------------------------------------------------------------------------------------------------------------
    $scope.mostrarHelp = () => {
        // cada vez que el usuario cambia a un state, grabamos su nombre en $rootScope (más abajo) ...
        if ($rootScope.currentStateName)
            ClientGlobal_Methods.mostrarHelp($rootScope.currentStateName);
    };

    // para mantener en $rootScope el current state name. Nótese que lo usamos en bancos, contab, etc., para mostrar el help
    // cuando el usuario hace un click en ?. Este ? está en un state muy arriba en contab, bancos, etc.
    $rootScope.$on('$stateChangeSuccess',
        function(event, toState, toParams, fromState, fromParams) {
            $rootScope.currentStateName = toState.name;
    });
    // ---------------------------------------------------------------------------------------------------------------------


    // para saber si hay un usuario authenticado
    $scope.helpers({
      userAuthenticated: () => { return Meteor.userId(); },

      userHasRole_catalogos: () => { return userHasRole('catalogos'); },
      userHasRole_riesgos: () => { return userHasRole('riesgos'); },
      userHasRole_riesgos_consulta: () => { return userHasRole('riesgos_consulta'); },
      userHasRole_contratos: () => { return userHasRole('contratos'); },
      userHasRole_contratos_consulta: () => { return userHasRole('contratos_consulta'); },
      userHasRole_notasdbcr: () => { return userHasRole('notasdbcr'); },
      userHasRole_notasdbcr_consulta: () => { return userHasRole('notasdbcr_consulta'); },
      userHasRole_siniestros: () => { return userHasRole('siniestros'); },
      userHasRole_siniestros_consulta: () => { return userHasRole('siniestros_consulta'); },
      userHasRole_remesas: () => { return userHasRole('remesas'); },
      userHasRole_remesas_consulta: () => { return userHasRole('remesas_consulta'); },
      userHasRole_cobranzas: () => { return userHasRole('cobranzas'); },
      userHasRole_cierre: () => { return userHasRole('cierre'); },
      userHasRole_consultas: () => { return userHasRole('consultas'); },
      userHasRole_utilitarios: () => { return userHasRole('utilitarios'); },
      userHasRole_admin: () => { return userHasRole('admin'); },
    })

    // esta funcion es llamada desde la página principal (home - index.html) para saber si el usuario tiene roles en particular
    // y mostrar las opciones del menú en relación a estos roles; nótese que para 'admin', se muestran todas las opciones del menú
    function userHasRole(rol) {

        // mostramos todas las opciones al usuario (cuyo mail es) 'admin@admin.com'
        // debugger;
        if (Meteor.user() &&
            Meteor.user().emails &&
            Meteor.user().emails.length > 0 &&
            _.some(Meteor.user().emails, function (email) { return email.address == "admin@admin.com"; })) {
                return true;
        }


        // mostramos todas las opciones a usuarios en el rol 'admin'
        let roles = Meteor.user() && Meteor.user().roles ? Meteor.user().roles : [];

        if (_.find(roles, function (r) { return r === "admin"; })) { 
            return true;
        }

        if (!rol) { 
            return false;
        }
            
        var found = _.find(roles, function (r) { return r === rol; });
        if (found) { 
            return true;
        }
        else { 
            return false;
        }
    }

    // nótese como ahora los catálogos se cargan siempre en forma automática, pues el publisheer tiene su 'name' en nulls
    // cargarCatalogos();

    function leerCompaniaSeleccionada() {

        // ------------------------------------------------------------------------------------------------
        // leemos la compañía seleccionada
        var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        if (companiaSeleccionada) { 
            var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
        }
            

        $scope.companiaSeleccionada = {};

        if (companiaSeleccionadaDoc) { 
            $scope.companiaSeleccionada = companiaSeleccionadaDoc;
        }
        else { 
            $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
        }
        // ------------------------------------------------------------------------------------------------
    }

    leerCompaniaSeleccionada();

    $scope.publicarCatalogos = function() {
        // debugger;
        // recorremos cada catálogo y lo publicamos en csv; la idea es que el usuario lo guarde en algún directorio
        // el el disco duro local, para obtener reportes desde LibreOffice ...

        var empresasUsuarias = EmpresasUsuarias.find().fetch();
        var tiposContrato = TiposContrato.find().fetch();
        var monedas = Monedas.find().fetch();
        var companias = Companias.find().fetch();
        var bancos = Bancos.find().fetch();
        var asegurados = Asegurados.find().fetch();
        var indoles = Indoles.find().fetch();
        var ramos = Ramos.find().fetch();
        var coberturas = Coberturas.find().fetch();
        var suscriptores = Suscriptores.find().fetch();

        var empresasUsuarias_CSV = Papa.unparse(empresasUsuarias, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });
        var tiposContrato_CSV = Papa.unparse(tiposContrato, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });
        var monedas_CSV = Papa.unparse(monedas, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });
        var companias_CSV = Papa.unparse(companias, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });
        var bancos_CSV = Papa.unparse(bancos, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });
        var asegurados_CSV = Papa.unparse(asegurados, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });
        var indoles_CSV = Papa.unparse(indoles, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });
        var ramos_CSV = Papa.unparse(ramos, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });
        var coberturas_CSV = Papa.unparse(coberturas, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });
        var suscriptores_CSV = Papa.unparse(suscriptores, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });

        var files = [];

        files.push({ fileContent: empresasUsuarias_CSV, fileName: 'empresasUsuarias.csv' });
        files.push({ fileContent: tiposContrato_CSV, fileName: 'tiposContrato.csv' });
        files.push({ fileContent: monedas_CSV, fileName: 'monedas.csv' });
        files.push({ fileContent: companias_CSV, fileName: 'companias.csv' });
        files.push({ fileContent: bancos_CSV, fileName: 'bancos.csv' });
        files.push({ fileContent: asegurados_CSV, fileName: 'asegurados.csv' });
        files.push({ fileContent: indoles_CSV, fileName: 'indoles.csv' });
        files.push({ fileContent: ramos_CSV, fileName: 'ramos.csv' });
        files.push({ fileContent: coberturas_CSV, fileName: 'coberturas.csv' });
        files.push({ fileContent: suscriptores_CSV, fileName: 'suscriptores.csv' });

        var mensajeAlUsuario = "<ol>" +
            "<li>Grabe estos archivos en el directorio del programa; normalmente: <b><em>c:/scrwebm_LO</em></b></li>" +
            "<li>sub directorio: <b><em>/catalogos</em></b></li>" +
            "<li>al grabar, <em>mantenga</em> el nombre de cada archivo (tal como aparece en la lista)</li>" +
            "<li><em>reemplace</em> los archivos anteriores, del mismo nombre, que puedan existir</li>" +
            "</ol>"

        // abrimos un modal y pasamos el array de files; desde allí, permitimos guardar (download) cada
        // file al pc local ...

        var modalInstance = $modal.open({
            templateUrl: 'client/generales/downloadFilesModal.ng.html',
            controller: 'DownloadFilesController',
            size: 'lg',
            resolve: {
                files: function () {
                    return files;
                },
                mensaje: function() {
                    return mensajeAlUsuario;
                }
            }
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    };


    function dataToCSVUnparseError(error) {
        debugger;
        var errorMessage = "Error: ha ocurrido un error al intentar convertir algún catálogo a formato 'csv'.<br /><br />" +
                           "Type: " + error.type + ", code: " + error.code + "<br />" +
                           "Message: " + error.message + "<br />" + "Row: " + error.row;

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'danger',
            msg: errorMessage
        });

    };
}
]);
