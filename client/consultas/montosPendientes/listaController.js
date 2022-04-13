
import lodash from 'lodash';
import numeral from 'numeral';
import moment from 'moment';
import Papa from 'papaparse';

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

import { Consulta_MontosPendientes } from '/imports/collections/consultas/consulta_MontosPendientes'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { MostrarPagosEnCuotas } from '/client/imports/generales/mostrarPagosAplicadosACuotaController'; 

angular.module("scrwebm").controller("ConsultaMontosPendientesListaController",
['$scope', '$stateParams', '$state', '$meteor', '$uibModal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $uibModal, uiGridConstants) {

      $scope.showProgress = false;

      let parametrosReporte = JSON.parse($stateParams.parametrosReporte);
    
      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      }

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

      let companiaSeleccionadaDoc = null;

      if (companiaSeleccionada) {
          companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
      }

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc) {
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      }
      else {
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      }
      // ------------------------------------------------------------------------------------------------
      $scope.currentPage = 1;
      $scope.pageSize = 10;

      $scope.montosPendientes = Consulta_MontosPendientes.find({ user: Meteor.userId() }).fetch();

      $scope.alerts.length = 0;
      $scope.alerts.push({
          type: 'info',
          msg: Consulta_MontosPendientes.find().count().toString() + " registros seleccionados ..."
      })

      $scope.regresar = function () {
          $state.go('montosPendientesFiltro');
      }

      $scope.mostrarPagosEnCuota = function(monto) {
          // ejecutamos la función que muestra, en un modal, los pagos que pueda tener la cuota ...
        //   debugger;
          // el parámetro cuotaID es opcional en la función; lo pasamos aquí pues no tenemos la cuota como tal;
          // la función lee la cuota si recibe su _id en vez de la cuota como tal ...
          let cuota = null;
          MostrarPagosEnCuotas($uibModal, cuota, 'consulta', monto.cuota.cuotaID);
      }

      $scope.exportarDatosConsulta = () => {

          $scope.showProgress = true;

          // construimos un array con los datos que deben ser exportados como 'csv'; luego, usamos una
          // funcionalidad que ya habíamos agregado al programa, para construir el 'csv' y exportar a un
          // archivo en disco ...
          let montosPendientes = [];

          Consulta_MontosPendientes.find().forEach(monto => {

              let montoPendiente = {};

              montoPendiente.moneda = Monedas.findOne(monto.moneda).descripcion;
              montoPendiente.moneda2 = Monedas.findOne(monto.moneda).simbolo;

              montoPendiente.compania = Companias.findOne(monto.compania).nombre;
              montoPendiente.compania2 = Companias.findOne(monto.compania).abreviatura;

              montoPendiente.ramo = Ramos.findOne(monto.ramo) ? Ramos.findOne(monto.ramo).descripcion : "";
              montoPendiente.ramo2 = Ramos.findOne(monto.ramo) ? Ramos.findOne(monto.ramo).abreviatura : "";

              montoPendiente.asegurado = Asegurados.findOne(monto.asegurado) ? Asegurados.findOne(monto.asegurado).nombre : "";
              montoPendiente.asegurado2 = Asegurados.findOne(monto.asegurado) ? Asegurados.findOne(monto.asegurado).abreviatura : "";

              montoPendiente.suscriptor = Suscriptores.findOne(monto.suscriptor) ? Suscriptores.findOne(monto.suscriptor).nombre : "";
              montoPendiente.suscriptor2 = Suscriptores.findOne(monto.suscriptor) ? Suscriptores.findOne(monto.suscriptor).abreviatura : "";

              montoPendiente.cia = EmpresasUsuarias.findOne(monto.cia).nombre;
              montoPendiente.cia2 = EmpresasUsuarias.findOne(monto.cia).abreviatura;

              montoPendiente.origen = `${monto.source.origen}-${monto.source.numero}`;

              montoPendiente.cuota_numero = `${monto.cuota.numero}/${monto.cuota.cantidad}`;
              montoPendiente.cuota_fecha = moment(monto.cuota.fecha).format("YYYY-MM-DD");
              montoPendiente.cuota_fechaVencimiento = moment(monto.cuota.fechaVencimiento).format("YYYY-MM-DD");
              montoPendiente.cuota_monto = monto.cuota.monto;

              montoPendiente.pagosParciales_cantidad = 0;
              montoPendiente.pagosParciales_moneda = "";
              montoPendiente.pagosParciales_monto = 0;


              if (lodash.isArray(monto.pagos)) {

                  let pagosParciales_mismaMoneda = true;
                  let monedaAnterior = "";
                  let pagosParcialesMonto = 0;

                  monto.pagos.forEach(p => {
                      if (pagosParciales_mismaMoneda && (!monedaAnterior || p.moneda === monedaAnterior))
                            monedaAnterior = p.moneda;
                      else
                            pagosParciales_mismaMoneda = false;

                      montoPendiente.pagosParciales_cantidad++;
                      pagosParcialesMonto += p.monto;
                  });

                  if (pagosParciales_mismaMoneda) {
                      montoPendiente.pagosParciales_moneda = Monedas.findOne(monedaAnterior) ? Monedas.findOne(monedaAnterior).simbolo : "";
                      montoPendiente.pagosParciales_monto = pagosParcialesMonto;
                  };
              };

              montoPendiente.montoPendiente = monto.montoPendiente;

              montosPendientes.push(montoPendiente);
          });

          let montosPendientes_CSV = Papa.unparse(montosPendientes, { header: true, enconding: 'UTF-8', error: 'dataToCSVUnparseError' });

          let files = [];

          files.push({ fileContent: montosPendientes_CSV, fileName: 'montosPendientes_consulta.csv' });

          var mensajeAlUsuario = "<ol>" +
              "<li>Para grabar el archivo en el disco duro local, haga un <em>click</em> sobre el mismo</b></li>" +
              "<li>Grabe el archivo en el directorio del programa; normalmente: <b><em>c:/scrwebm_LO</em></b></li>" +
              "<li>sub directorio: <b><em>/consultas</em></b></li>" +
              "<li>al grabar, <em>mantenga</em> el nombre que se indica para el archivo (tal como aparece en la lista)</li>" +
              "<li><em>reemplace</em> el archivo anterior, del mismo nombre, que pueda existir</li>" +
              "</ol>"

            // para mostrar al usuario un diálogo y permitir guardar el archivo (file) al disco duro ...
            Global_Methods.PermitirUsuarioDownloadFiles($uibModal, files, mensajeAlUsuario);

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

          DialogModal($uibModal, "<em>Consultas</em>", errorMessage, false).then();
          return;
      }

    $scope.reporteOpcionesModal = function () {

        var modalInstance = $uibModal.open({
            templateUrl: 'client/consultas/montosPendientes/reportes/opcionesReportModal.html',
            controller: 'Consultas_montosPendientes_opcionesReportController',
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
          enableFiltering: false,
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
          }
      }

      $scope.items_ui_grid.columnDefs = [
         {
             name: 'moneda',
             field: 'moneda',
             displayName: 'Mon',
             width: 50,
             headerCellClass: 'ui-grid-centerCell',
             cellClass: 'ui-grid-centerCell',
             cellFilter: 'monedaSimboloFilter',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'compania',
             field: 'compania',
             displayName: 'Compañía',
             width: 100,
             headerCellClass: 'ui-grid-leftCell',
             cellClass: 'ui-grid-leftCell',
             cellFilter: 'companiaAbreviaturaFilter',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'ramo',
             field: 'ramo',
             displayName: 'Ramo',
             width: 100,
             headerCellClass: 'ui-grid-leftCell',
             cellClass: 'ui-grid-leftCell',
             cellFilter: 'ramoAbreviaturaFilter',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'getOrigen',
             field: 'getOrigen()',
             displayName: 'Origen',
             width: 90,
             headerCellClass: 'ui-grid-centerCell',
             cellClass: 'ui-grid-centerCell',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'asegurado',
             field: 'asegurado',
             displayName: 'Asegurado',
             width: 100,
             headerCellClass: 'ui-grid-leftCell',
             cellClass: 'ui-grid-leftCell',
             cellFilter: 'aseguradoAbreviaturaFilter',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'suscriptor',
             field: 'suscriptor',
             displayName: 'Susc',
             width: 80,
             headerCellClass: 'ui-grid-centerCell',
             cellClass: 'ui-grid-centerCell',
             cellFilter: 'suscriptorAbreviaturaFilter',
             enableColumnMenu: false,
             enableCellEdit: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'numero',
             field: 'getNumeroCuota()',
             displayName: '#',
             width: 50,
             headerCellClass: 'ui-grid-centerCell',
             cellClass: 'ui-grid-centerCell',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'cuota.fecha',
             field: 'cuota.fecha',
             displayName: 'Fecha',
             width: 80,
             headerCellClass: 'ui-grid-centerCell',
             cellClass: 'ui-grid-centerCell',
             cellFilter: 'dateFilter',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'cuota.fechaVencimiento',
             field: 'cuota.fechaVencimiento',
             displayName: 'F venc',
             width: 80,
             headerCellClass: 'ui-grid-centerCell',
             cellClass: 'ui-grid-centerCell',
             cellFilter: 'dateFilter',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'cuota.monto',
             field: 'cuota.monto',
             displayName: 'Monto',
             width: 120,
             headerCellClass: 'ui-grid-rightCell',
             cellClass: 'ui-grid-rightCell',
             cellFilter: 'currencyFilterAndNull',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'number',

             aggregationType: uiGridConstants.aggregationTypes.sum,
             aggregationHideLabel: true,
             footerCellFilter: 'currencyFilter',
             footerCellClass: 'ui-grid-rightCell',
         },
         {
             name: 'getCantidadPagosParciales',
             field: 'getCantidadPagosParciales()',
             displayName: 'Pagos',
             width: 60,
             headerCellClass: 'ui-grid-centerCell',
             cellClass: 'ui-grid-centerCell',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'string'
         },
         {
             name: 'montoPendiente',
             field: 'montoPendiente',
             displayName: 'Pendiente',
             width: 120,
             headerCellClass: 'ui-grid-rightCell',
             cellClass: 'ui-grid-rightCell',
             cellFilter: 'currencyFilterAndNull',
             enableColumnMenu: false,
             enableSorting: true,
             type: 'number',

             aggregationType: uiGridConstants.aggregationTypes.sum,
             aggregationHideLabel: true,
             footerCellFilter: 'currencyFilter',
             footerCellClass: 'ui-grid-rightCell',
         },
      ]

      // agregamos un par de funciones al array en el $scope para mostrarlas como valores en cell en el ui-grid
      $scope.montosPendientes.forEach((m) => { m.getOrigen = function() { return `${this.source.origen}-${this.source.numero.toString()}`; } });
      $scope.montosPendientes.forEach((m) => { m.getNumeroCuota = function() { return `${this.cuota.numero.toString()}/${this.cuota.cantidad.toString()}`; } });
      $scope.montosPendientes.forEach((m) => { m.getCantidadPagosParciales = function() { return this.cantidadPagosParciales ? this.cantidadPagosParciales.toString() : ""; } });

      $scope.items_ui_grid.data = [];
      $scope.items_ui_grid.data = $scope.montosPendientes;
  }
]);
