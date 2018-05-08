

import moment from 'moment';
import Papa from 'papaparse';

import { Consulta_MontosPendientesCobro_Vencimientos } from '/imports/collections/consultas/consultas_MontosPendientesCobro_Vencimientos'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller("ConsultasMontosPendientesCobroVencimientos_Lista_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

      $scope.showProgress = false;

      let parametrosReporte = JSON.parse($stateParams.parametrosReporte);
      let companiaSeleccionada = JSON.parse($stateParams.companiaSeleccionada);

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

          let montosPendientes = [];

          Consulta_MontosPendientesCobro_Vencimientos.find({ user: Meteor.userId() }).forEach(monto => {

              let montoPendiente = {};

              montoPendiente.moneda = monto.monedaSimbolo;
              montoPendiente.compania = monto.companiaAbreviatura;
              montoPendiente.suscriptor = monto.suscriptorAbreviatura;
              montoPendiente.asegurado = monto.aseguradoAbreviatura;

              montoPendiente.origen = monto.origen;
              montoPendiente.numero = monto.numero.toString() + "/" + monto.cantidad.toString();
              montoPendiente.fecha = moment(monto.fecha).format("YYYY-MM-DD");
              montoPendiente.fechaVencimiento = moment(monto.fechaVencimiento).format("YYYY-MM-DD");;
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

          let montosPendientes_CSV = Papa.unparse(montosPendientes, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });

          let files = [];

          files.push({ fileContent: montosPendientes_CSV, fileName: 'montosPorCobrar_Pendientes_consulta.csv' });

          var mensajeAlUsuario = "<ol>" +
              "<li>Para grabar el archivo en el disco duro local, haga un <em>click</em> sobre el mismo</b></li>" +
              "<li>De inmediato, se abrirá un diálogo que le permitirá grabar el archivo en el directorio que Ud. indique.</li>" +
              "</ol>"

            // para mostrar al usuario un diálogo y permitir guardar el archivo (file) al disco duro ...
            Global_Methods.PermitirUsuarioDownloadFiles($modal, files, mensajeAlUsuario);

            $scope.showProgress = false;
      }

      let dataToCSVUnparseError = (error, file) => {

          let type = error.type ? error.type : "<indef>";
          let code = error.code ? error.code : "<indef>";
          let message = error.message ? error.message : "<indef>";
          let row = error.row ? error.row : "<indef>";

          let errorMessage = `Se ha obtenido un error al intentar exportar los datos a un archivo. El mensaje del error obtenido es:
          Error al intentar crear el archivo: <em>${message}</em>; del tipo: ${type}; cuyo código es: ${code}; en la linea: ${row}.
                              Por favor intente corregir esta situación, y luego intente ejecutar esta función nuevamente.`;

          DialogModal($modal, "<em>Consultas</em>", errorMessage, false).then();
          return;
      }

    $scope.reporteOpcionesModal = function () {

        var modalInstance = $modal.open({
            templateUrl: 'client/consultas/pendientesCobro_vencimientos/reportes/opcionesReportModal.html',
            controller: 'Consultas_montosPendientesCobro_vencimientos_opcionesReportController',
            size: 'md',
            resolve: {
                companiaSeleccionada: function () {
                    return $scope.companiaSeleccionada
                },
            }
        }).result.then(
            function (resolve) {
                return true;
            },
            function (cancel) {
                return true;
        })
    }

    // -----------------------------------------------------------------
    // ui-grid
    // -----------------------------------------------------------------
    let selectedItem = {};
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
            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                selectedItem = {};

                if (row.isSelected) {
                    selectedItem = row.entity;
                }
                else { 
                return;
                }
            })
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
    function userHasRole(rol) {

        // mostramos todas las opciones al usuario (cuyo mail es) 'admin@admin.com'
        // debugger;
        if (Meteor.user() &&
            Meteor.user().emails &&
            Meteor.user().emails.length > 0 &&
            _.some(Meteor.user().emails, function (email) { return email.address == "admin@admin.com"; })) {
                return true;
            };


        // mostramos todas las opciones a usuarios en el rol 'admin'
        let roles = Meteor.user() && Meteor.user().roles ? Meteor.user().roles : [];

        if (_.find(roles, function (r) { return r === "admin"; }))
            return true;

        if (!rol)
            return false;

        var found = _.find(roles, function (r) { return r === rol; });
        if (found)
            return true;
        else
            return false;
    }

    $scope.emailsCobranzaAbrirModal = () => {

        var modalInstance = $modal.open({
            templateUrl: 'client/consultas/pendientesCobro_vencimientos/emailsCobranzaModal.html',
            controller: 'Consulta_MontosPorCobrar_Vencimientos_EmailsCobranza_Controller',
            size: 'lg',
            resolve: {
                cuotasSeleccionadas: function () {
                    // pasamos solo los rows que han sido seleccionados por el usuario en la lista ...
                    return items_ui_grid_gridApi.selection.getSelectedRows();;
                },
            }
        }).result.then(
            function (resolve) {
                // return true;
            },
            function (cancel) {
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
            _.some(Meteor.user().emails, function (email) { return email.address == "admin@admin.com"; })) {
                return true;
            };


        // mostramos todas las opciones a usuarios en el rol 'admin'
        let roles = Meteor.user() && Meteor.user().roles ? Meteor.user().roles : [];

        if (_.find(roles, function (r) { return r === "admin"; }))
            return true;

        if (!rol)
            return false;

        var found = _.find(roles, function (r) { return r === rol; });
        if (found)
            return true;
        else
            return false;
    }
  }
]);
