
import { Meteor } from 'meteor/meteor'
import angular from 'angular'; 
import lodash from 'lodash'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { mostrarHelp } from '../imports/generales/mostrarHelp'; 

// Este controller se carga con la página primera del programa; es decir, la que muestra el menú (navBar) principal
angular.module("scrwebm")
       .controller("MainController", ['$rootScope', '$scope', '$location', 
function ($rootScope, $scope, $location) {

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
    const queryParams = $location.search();
    $scope.vieneDeAfuera = queryParams && queryParams.vieneDeAfuera && queryParams.vieneDeAfuera === 'true';

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ---------------------------------------------------------------------------------------------------------------------
    $scope.mostrarHelp = () => {
        // cada vez que el usuario cambia a un state, grabamos su nombre en $rootScope (más abajo) ...
        if ($rootScope.currentStateName) { 
            mostrarHelp($rootScope.currentStateName);
        } 
    }

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
        userHasRole_cierre_cierre: () => { return userHasRole('cierre.cierre'); },
        userHasRole_cierre_registro: () => { return userHasRole('cierre.registro'); },
        userHasRole_cierre_consulta: () => { return userHasRole('cierre.consulta'); },
        userHasRole_consultas: () => { return userHasRole('consultas'); },
        userHasRole_utilitarios: () => { return userHasRole('utilitarios'); },
        userHasRole_admin: () => { return userHasRole('admin'); },
    })

    // esta funcion es llamada desde la página principal (home - index.html) para saber si el usuario tiene roles en particular
    // y mostrar las opciones del menú en relación a estos roles; nótese que para 'admin', se muestran todas las opciones del menú
    function userHasRole(rol) {

        // mostramos todas las opciones al usuario (cuyo mail es) 'admin@admin.com'
        if (Meteor.user() &&
            Meteor.user().emails &&
            Meteor.user().emails.length > 0 &&
            lodash.some(Meteor.user().emails, function (email) { return email.address == "admin@admin.com"; })) {
                return true;
        }


        // mostramos todas las opciones a usuarios en el rol 'admin'
        const roles = Meteor.user() && Meteor.user().roles ? Meteor.user().roles : [];

        if (lodash.find(roles, function (r) { return r === "admin"; })) { 
            return true;
        }

        if (!rol) { 
            return false;
        }
            
        var found = lodash.find(roles, function (r) { return r === rol; });
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
}])