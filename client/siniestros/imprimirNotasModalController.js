

import numeral from 'numeral';
import moment from 'moment';
import lodash from 'lodash';

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebM").controller('ImprimirNotasModalController',
['$scope', '$modalInstance', '$modal', 'siniestro',
function ($scope, $modalInstance, $modal, siniestro) {

    $scope.siniestro = siniestro;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

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

    $scope.parametros = {};
    $scope.parametros.fecha = `Caracas, ${moment().format("D")} de ${moment().format("MMMM")} de ${numeral(parseInt(moment().format("YYYY"))).format('0,0')}`;

    var registroReservaSeleccionado = {};

    $scope.reservas_ui_grid = {
      enableSorting: false,
      showColumnFooter: false,
      enableRowSelection: true,
      enableRowHeaderSelection: false,
      multiSelect: false,
      enableSelectAll: false,
      selectionRowHeaderWidth: 0,
      rowHeight: 25,
      onRegisterApi: function (gridApi) {

          // guardamos el row que el usuario seleccione
          gridApi.selection.on.rowSelectionChanged($scope, function (row) {
              //debugger;
              registroReservaSeleccionado = {};

              if (row.isSelected) {
                  registroReservaSeleccionado = row.entity;
              }
              else
                  return;
          })
      },
      // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
      rowIdentity: function (row) {
          return row._id;
      },

      getRowIdentity: function (row) {
          return row._id;
      }
    };

    $scope.reservas_ui_grid.columnDefs = [
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: '40',
            enableColumnMenu: false,
            type: 'number'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: '50',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Moneda',
            width: '60',
            cellFilter: 'monedaSimboloFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '80',
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            width: '120',
            cellFilter: 'currencyFilter',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableColumnMenu: false,
            type: 'number'
        }
    ];


    var registroLiquidacionesSeleccionado = {};

    $scope.liquidaciones_ui_grid = {
      enableSorting: false,
      showColumnFooter: false,
      enableRowSelection: true,
      enableRowHeaderSelection: false,
      multiSelect: false,
      enableSelectAll: false,
      selectionRowHeaderWidth: 0,
      rowHeight: 25,
      onRegisterApi: function (gridApi) {

          // guardamos el row que el usuario seleccione
          gridApi.selection.on.rowSelectionChanged($scope, function (row) {
              //debugger;
              registroLiquidacionesSeleccionado = {};

              if (row.isSelected) {
                  registroLiquidacionesSeleccionado = row.entity;
              }
              else
                  return;
          })
      },
      // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
      rowIdentity: function (row) {
          return row._id;
      },

      getRowIdentity: function (row) {
          return row._id;
      }
    };

    $scope.liquidaciones_ui_grid.columnDefs = [
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: '40',
            enableColumnMenu: false,
            type: 'number'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Moneda',
            width: '60',
            cellFilter: 'monedaSimboloFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '80',
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'definitivo',
            field: 'definitivo',
            displayName: 'Definitivo',
            width: '80',
            cellFilter: 'boolFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'indemnizado',
            field: 'indemnizado',
            displayName: 'Total',
            width: '120',
            cellFilter: 'currencyFilter',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableColumnMenu: false,
            type: 'number'
        }
    ];


    $scope.reservas_ui_grid.data = [];
    $scope.liquidaciones_ui_grid.data = [];

    if (lodash.isArray($scope.siniestro.reservas)) {
        $scope.reservas_ui_grid.data = $scope.siniestro.reservas;
    }

    if (lodash.isArray($scope.siniestro.liquidaciones)) {
        $scope.liquidaciones_ui_grid.data = $scope.siniestro.liquidaciones;
    }


    // para mostrar los links que permiten al usuario hacer el download de las notas
    $scope.downLoadWordDocument_reservas = false;
    $scope.selectedFile_reservas = {};
    $scope.downLoadLink_reservas = "";

    $scope.downLoadWordDocument_liquidaciones = false;
    $scope.selectedFile_liquidaciones = {};
    $scope.downLoadLink_liquidaciones = "";

    $scope.obtenerDocumentoWord = function (file) {

        if ((!registroReservaSeleccionado || lodash.isEmpty(registroReservaSeleccionado)) &&
            (!registroLiquidacionesSeleccionado || lodash.isEmpty(registroLiquidacionesSeleccionado))) {
            DialogModal($modal, "<em>Siniestros - Construcción de notas de siniestro</em>",
                        "Ud. debe seleccionar un registro de reservas o de liquidaciones, para construir su nota de siniestro.",
                        false).then();
            return;
        }

        if ((registroReservaSeleccionado && !lodash.isEmpty(registroReservaSeleccionado)) &&
            (registroLiquidacionesSeleccionado && !lodash.isEmpty(registroLiquidacionesSeleccionado))) {
            DialogModal($modal, "<em>Siniestros - Construcción de notas de siniestro</em>",
                        "Ud. debe seleccionar un registro de reservas o uno de liquidaciones, pero no ambos en forma simultanea.",
                        false).then();
            return;
        }

        if (!$scope.parametros.fecha || _.isEmpty($scope.parametros.fecha)) {
            DialogModal($modal, "<em>Siniestros - Construcción de notas de siniestro</em>",
                        `Ud. debe indicar la fecha que se mostrará en el documento.<br /> Ejemplo: Caracas, 25 de Abril del 2.015.`,
                        false).then();
            return;
        };

        $scope.alerts.length = 0;
        $scope.showProgress = true;

        // nota de reservas
        if (file.metadata.tipo === "TMP-SNTR-NOTA-RES") {
            Meteor.call('siniestros.obtenerNotasReserva',
                         file._id,
                         siniestro._id,
                         registroReservaSeleccionado._id,
                         $scope.parametros.fecha, (err, result) => {

                     if (err) {
                         let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                         $scope.alerts.length = 0;
                         $scope.alerts.push({ type: 'danger', msg: errorMessage });

                         $scope.showProgress = false;
                         $scope.$apply();

                         return;
                     }

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: `Ok, el documento ha sido construido en forma exitosa.<br />
                              Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                    });

                    $scope.selectedFile_reservas = file;
                    $scope.downLoadLink_reservas = result;
                    $scope.downLoadWordDocument_reservas = true;

                    $scope.showProgress = false;
                    $scope.$apply();
            })
        }


        // nota de liquidacion
        if (file.metadata.tipo === "TMP-SNTR-NOTA-LIQ") {
            Meteor.call('siniestros.obtenerNotasLiquidacion',
                         file._id,
                         siniestro._id,
                         registroLiquidacionesSeleccionado._id,
                         $scope.parametros.fecha, (err, result) => {

                     if (err) {
                         let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                         $scope.alerts.length = 0;
                         $scope.alerts.push({ type: 'danger', msg: errorMessage });

                         $scope.showProgress = false;
                         $scope.$apply();

                         return;
                     }

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: `Ok, el documento ha sido construido en forma exitosa.<br />
                              Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                    });

                    $scope.selectedFile_liquidaciones = file;
                    $scope.downLoadLink_liquidaciones = result;
                    $scope.downLoadWordDocument_liquidaciones = true;

                    $scope.showProgress = false;
                    $scope.$apply();
            })
        }
    }

    $scope.helpers({
        template_files: () => {
            return CollectionFS_templates.find({
                // regresamos solo archivos cuyo tipo comienza así (TMP-SNTR-NOTA) ...
                'metadata.tipo': { $regex: /^TMP-SNTR-NOTA/ },
            });
        },
    });


    // leemos las plantillas que corresponden a notas de cobertura impresas (cuyo tipo es: TMP-FAC-NOTA-CED, TMP-FAC-NOTA-REA, ...)
    $scope.showProgress = true;

    $scope.subscribe("collectionFS_files", () => { return ['TMP-SNTR-NOTA']; }, {
        onReady: function () {
          $scope.showProgress = false;
          $scope.$apply();
        },
        onStop: function (error) {
          $scope.showProgress = false;
          $scope.$apply();
      }
  });

}
]);
