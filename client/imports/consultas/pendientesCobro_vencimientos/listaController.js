
import { Meteor } from 'meteor/meteor';
import angular from 'angular';

import moment from 'moment';
import lodash from 'lodash'; 
import Papa from 'papaparse';

import { Consulta_MontosPendientesCobro_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesCobro_Vencimientos'; 
// import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

import './list.html';

import PendientesCobro_vencimientos_Report from './reportes/opcionesReportModal';
import Emails from './emailsCobranzaController';

export default angular.module("scrwebm.consultas.pendientesCobro_vencimientos.lista", [ PendientesCobro_vencimientos_Report.name, Emails.name ])
                      .controller("ConsultasMontosPendientesCobroVencimientos_Lista_Controller", ['$scope', '$state', '$timeout', '$modal', 'uiGridConstants',
function ($scope, $state, $timeout, $modal, uiGridConstants) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      }

      $scope.helpers({
          montosPendientes: () => {
              return Consulta_MontosPendientesCobro_Vencimientos.find({ user: Meteor.userId() });
          },
      })

      $scope.alerts.length = 0;
      $scope.alerts.push({
          type: 'info',
          msg: $scope.montosPendientes.length.toString() + " registros seleccionados ..."
      })

      $scope.regresar = function () {
          $state.go('pendientesCobro_vencimientos_consulta_filter');
      }

      $scope.exportarDatosConsulta = () => {

          $scope.showProgress = true;

          // construimos un array con los datos que deben ser exportados como 'csv'; luego, usamos una
          // funcionalidad que ya habíamos agregado al programa, para construir el 'csv' y exportar a un
          // archivo en disco ...

          const montosPendientes = [];

          Consulta_MontosPendientesCobro_Vencimientos.find({ user: Meteor.userId() }).forEach(monto => {

              const montoPendiente = {};

              montoPendiente.moneda = monto.monedaSimbolo;
              montoPendiente.compania = monto.companiaAbreviatura;
              montoPendiente.suscriptor = monto.suscriptorAbreviatura;
              montoPendiente.asegurado = monto.aseguradoAbreviatura;

              montoPendiente.origen = monto.origen;
              montoPendiente.numero = monto.numero.toString() + "/" + monto.cantidad.toString();
              montoPendiente.fecha = moment(monto.fecha).format("YYYY-MM-DD");
              montoPendiente.fechaVencimiento = moment(monto.fechaVencimiento).format("YYYY-MM-DD");
              montoPendiente.diasPendientes = monto.diasPendientes;
              montoPendiente.diasVencidos = monto.diasVencidos;

              montoPendiente.montoCuota = monto.montoCuota;
              montoPendiente.montoPorPagar = monto.montoPorPagar;
              montoPendiente.saldo1 = monto.saldo1;

              montoPendiente.montoCobrado = monto.montoCobrado;
              montoPendiente.montoPagado = monto.montoPagado;
              montoPendiente.saldo2 = monto.saldo2;

              montosPendientes.push(montoPendiente);
          });

          const config = {
              quotes: true,
              quoteChar: "'",
              delimiter: "\t",
              enconding: 'UTF-8',
              header: true
          };

          const montosPendientes_CSV = Papa.unparse(montosPendientes, config);

          const files = [];

          files.push({ fileContent: montosPendientes_CSV, fileName: 'montosPorCobrar_Pendientes_consulta.csv' });

          var mensajeAlUsuario = "<ol>" +
              "<li>Para grabar el archivo en el disco duro local, haga un <em>click</em> sobre el mismo</b></li>" +
              "<li>De inmediato, se abrirá un diálogo que le permitirá grabar el archivo en el directorio que Ud. indique.</li>" +
              "</ol>"

            // para mostrar al usuario un diálogo y permitir guardar el archivo (file) al disco duro ...
            Global_Methods.PermitirUsuarioDownloadFiles($modal, files, mensajeAlUsuario);

            $scope.showProgress = false;
      }

    //   const dataToCSVUnparseError = (error) => {

    //       const type = error.type ? error.type : "<indef>";
    //       const code = error.code ? error.code : "<indef>";
    //       const message = error.message ? error.message : "<indef>";
    //       const row = error.row ? error.row : "<indef>";

    //       const errorMessage = `Se ha obtenido un error al intentar exportar los datos a un archivo. El mensaje del error obtenido es:
    //       Error al intentar crear el archivo: <em>${message}</em>; del tipo: ${type}; cuyo código es: ${code}; en la linea: ${row}.
    //                           Por favor intente corregir esta situación, y luego intente ejecutar esta función nuevamente.`;

    //       DialogModal($modal, "<em>Consultas</em>", errorMessage, false).then();
    //       return;
    //   }

    $scope.reporteOpcionesModal = function () {

        $modal.open({
            templateUrl: 'client/imports/consultas/pendientesCobro_vencimientos/reportes/opcionesReportModal.html',
            controller: 'Consultas_montosPendientesCobro_vencimientos_opcionesReportController',
            size: 'md',
            resolve: {
                companiaSeleccionada: function () {
                    return $scope.companiaSeleccionada
                },
            }
        }).result.then(
            function () {
                return true;
            },
            function () {
                return true;
        })
    }

    // -----------------------------------------------------------------
    // ui-grid
    // -----------------------------------------------------------------
    let items_ui_grid_gridApi = null;

    $scope.items_ui_grid = {

        enableSorting: true,
        enableFiltering: true,
        showColumnFooter: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {
            items_ui_grid_gridApi = gridApi;
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }, 
    }

    $scope.items_ui_grid.columnDefs = [
        {
            name: 'monedaSimbolo',
            field: 'monedaSimbolo',
            displayName: 'Mon',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'companiaAbreviatura',
            field: 'companiaAbreviatura',
            displayName: 'Compañía',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'suscriptorAbreviatura',
            field: 'suscriptorAbreviatura',
            displayName: 'Suscriptor',
            width: 80,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'origen',
            field: 'origen',
            displayName: 'Origen',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            width: 40,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'cantidad',
            field: 'cantidad',
            displayName: 'De',
            width: 40,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'fechaEmision',
            field: 'fechaEmision',
            displayName: 'F emis',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'fechaVencimiento',
            field: 'fechaVencimiento',
            displayName: 'F venc',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'diasPendientes',
            field: 'diasPendientes',
            displayName: 'días pend',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'diasVencidos',
            field: 'diasVencidos',
            displayName: 'días venc',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'tipoEmail',
            field: 'tipoEmail',
            displayName: 'tipo email',
            width: 80,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'cantEmailsEnviadosAntes',
            field: 'cantEmailsEnviadosAntes',
            displayName: 'emails env',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'number'
        },
        {
            name: 'montoCuota',
            field: 'montoCuota',
            displayName: 'Monto cuota',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
        {
            name: 'montoPorPagar',
            field: 'montoPorPagar',
            displayName: 'Por pagar',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
        {
            name: 'saldo1',
            field: 'saldo1',
            displayName: 'Saldo',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
        {
            name: 'montoCobrado',
            field: 'montoCobrado',
            displayName: 'Cobrado',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
        {
            name: 'montoPagado',
            field: 'montoPagado',
            displayName: 'Pagado',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
        {
            name: 'saldo2',
            field: 'saldo2',
            displayName: 'Saldo',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
        },
    ]

    $scope.items_ui_grid.data = [];
    $scope.items_ui_grid.data = $scope.montosPendientes;

    // esta funcion es llamada desde la página principal (home - index.html) para saber si el usuario tiene roles en particular
    // y mostrar las opciones del menú en relación a estos roles; nótese que para 'admin', se muestran todas las opciones del menú
    // function userHasRole(rol) {

    //     // mostramos todas las opciones al usuario (cuyo mail es) 'admin@admin.com'
    //     if (Meteor.user() &&
    //         Meteor.user().emails &&
    //         Meteor.user().emails.length > 0 &&
    //         lodash.some(Meteor.user().emails, function (email) { return email.address == "admin@admin.com"; })) {
    //             return true;
    //         }


    //     // mostramos todas las opciones a usuarios en el rol 'admin'
    //     const roles = Meteor.user() && Meteor.user().roles ? Meteor.user().roles : [];

    //     if (lodash.find(roles, function (r) { return r === "admin"; }))
    //         return true;

    //     if (!rol)
    //         return false;

    //     var found = _.find(roles, function (r) { return r === rol; });
    //     if (found)
    //         return true;
    //     else
    //         return false;
    // }

    $scope.abrirGenerarEmailsModal = false; 

    $scope.toogle_abrirGenerarEmailsModal = () => {
        $scope.abrirGenerarEmailsModal = !$scope.abrirGenerarEmailsModal; 
        
        // cuando esta función es ejecutada al cerrar el modal (react), venimos dese código 'no-angular' y angular, probablemente, 
        // no se da cuenta que el toogle se actualizó. Con el $timeout, angular siempre vuelve a ejecutar sus ciclos y 
        // se percata de los cambios hechos por el código no-angular. Normalemnte, este $timeout es una forma muy saudable 
        // de resolver este tipo de situaciones en angularjs ... 
        // Nota: nótese que el $timeout que viene no usa ni un callback ni un delay (ej: $timeout(callback(x, y), 2000)), pues 
        // no necesitamos ni un delay ni un callback; solo el efecto que tiene $timeout sobre angular ... 
        $timeout();
    }

    $scope.emailsCobranzaAbrirModal = () => {

        // Nota: déjamos de usar este código y ahora abrimos un modal mucho más simple que éste, desde el cual permitimos al 
        // usuario generar Emails para cobrar los montos pendientes 

        $modal.open({
            templateUrl: 'client/imports/consultas/pendientesCobro_vencimientos/emailsCobranzaModal.html',
            controller: 'Consulta_MontosPorCobrar_Vencimientos_EmailsCobranza_Controller',
            size: 'lg',
            resolve: {
                cuotasSeleccionadas: function () {
                    // pasamos solo los rows que han sido seleccionados por el usuario en la lista ...
                    return items_ui_grid_gridApi.selection.getSelectedRows();
                },
            }
        }).result.then(
            function () {
                // return true;
            },
            function () {
                // return true;
            });
    }

    // ---------------------------------------------------------------------------------------------------------
    // el link que permite obtener los e-mails de cobranza, debe ser mostrado solo a usuarios con este rol ...
    $scope.userHasRole = (rol) => {
        // mostramos todas las opciones al usuario (cuyo mail es) 'admin@admin.com'
        // debugger;
        if (Meteor.user() &&
            Meteor.user().emails &&
            Meteor.user().emails.length > 0 &&
            lodash.some(Meteor.user().emails, function (email) { return email.address == "admin@admin.com"; })) {
                return true;
            }


        // mostramos todas las opciones a usuarios en el rol 'admin'
        const roles = Meteor.user() && Meteor.user().roles ? Meteor.user().roles : [];

        if (lodash.find(roles, function (r) { return r === "admin"; }))
            return true;

        if (!rol)
            return false;

        var found = lodash.find(roles, function (r) { return r === rol; });
        if (found)
            return true;
        else
            return false;
    }
}])