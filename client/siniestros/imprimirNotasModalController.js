
import { Meteor } from 'meteor/meteor'

import angular from 'angular';

import numeral from 'numeral';
import moment from 'moment';
import lodash from 'lodash';

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebm").controller('ImprimirNotasModalController', ['$scope', '$uibModalInstance', '$uibModal', 'siniestro',
function ($scope, $uibModalInstance, $uibModal, siniestro) {

    $scope.siniestro = siniestro;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        $uibModalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    }

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
    }

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
    ]

    let registroLiquidacionesSeleccionado = {};

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
    }

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
    ]

    $scope.reservas_ui_grid.data = [];
    $scope.liquidaciones_ui_grid.data = [];

    if (lodash.isArray($scope.siniestro.reservas)) {
        $scope.reservas_ui_grid.data = $scope.siniestro.reservas;
    }

    if (lodash.isArray($scope.siniestro.liquidaciones)) {
        $scope.liquidaciones_ui_grid.data = $scope.siniestro.liquidaciones;
    }

    $scope.tipoPlantillaWord = null; 

    $scope.obtenerDocumentoWord = function (file) {

        if ((!registroReservaSeleccionado || lodash.isEmpty(registroReservaSeleccionado)) &&
            (!registroLiquidacionesSeleccionado || lodash.isEmpty(registroLiquidacionesSeleccionado))) {
            DialogModal($uibModal, "<em>Siniestros - Construcción de notas de siniestro</em>",
                        "Ud. debe seleccionar un registro de reservas o de liquidaciones, para construir su nota de siniestro.",
                        false).then();
            return;
        }

        if ((registroReservaSeleccionado && !lodash.isEmpty(registroReservaSeleccionado)) &&
            (registroLiquidacionesSeleccionado && !lodash.isEmpty(registroLiquidacionesSeleccionado))) {
            DialogModal($uibModal, "<em>Siniestros - Construcción de notas de siniestro</em>",
                        "Ud. debe seleccionar un registro de reservas o uno de liquidaciones, pero no ambos en forma simultanea.",
                        false).then();
            return;
        }

        if (!$scope.parametros.fecha || lodash.isEmpty($scope.parametros.fecha)) {
            DialogModal($uibModal, "<em>Siniestros - Construcción de notas de siniestro</em>",
                        `Ud. debe indicar la fecha que se mostrará en el documento.<br /> Ejemplo: Caracas, 25 de Abril del 2.015.`,
                        false).then();
            return;
        }

        if (!$scope.tipoPlantillaWord) {
            DialogModal($uibModal, "<em>Siniestros - Construcción de notas de siniestro</em>",
                        `Ud. debe indicar el <em>tipo</em> de plantilla que será usada para construir el documento.<br /><br />
                         Los tipos de plantilla que pueden ser usados para obtener las notas de siniestro son: 
                         <em>Reservas</em>, <em>Liquidaciones</em>. <br /><br />
                         De acuerdo a cual plantilla y su tipo que Ud. indique, será construído el documento Word
                         que resulta de este proceso.  
                        `,
                        false).then();
            return;
        }

        $scope.alerts.length = 0;
        $scope.showProgress = true;

        // nota de reservas
        if ($scope.tipoPlantillaWord === 'reserva') {
            Meteor.call('siniestros.obtenerNotasReserva',
                         "/siniestros/notas", 
                         file.name,
                         siniestro._id,
                         registroReservaSeleccionado._id,
                         $scope.parametros.fecha, (err, result) => {

                if (err) {
                    const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                if (result.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: result.message });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                // agregamos un link para que el usuario pueda hacer un download del documento (desde Dropbox)
                const downloadLink = document.createElement('a');
                downloadLink.setAttribute('href', result.sharedLink);
                downloadLink.setAttribute('download', "nota de reserva de siniestro");
                downloadLink.innerText = 'Download: ' + "nota de reserva de siniestro";
                downloadLink.target = '_blank'

                const listItem = document.createElement('li');
                listItem.appendChild(downloadLink);
                document.getElementById('results').appendChild(listItem);

                $scope.tipoPlantillaWord = null;

                $scope.showProgress = false;
                $scope.$apply();
            })
        }

        // nota de liquidacion
        if ($scope.tipoPlantillaWord === 'liquidacion') {
            Meteor.call('siniestros.obtenerNotasLiquidacion',
                         "/siniestros/notas", 
                         file.name,
                         siniestro._id,
                         registroLiquidacionesSeleccionado._id,
                         $scope.parametros.fecha, 
                         (err, result) => {

                if (err) {
                    const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                if (result.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: result.message });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                // agregamos un link para que el usuario pueda hacer un download del documento (desde Dropbox)
                const downloadLink = document.createElement('a');
                downloadLink.setAttribute('href', result.sharedLink);
                downloadLink.setAttribute('download', "nota de liquidación de siniestro");
                downloadLink.innerText = 'Download: ' + "nota de liquidación de siniestro";
                downloadLink.target = '_blank'

                const listItem = document.createElement('li');
                listItem.appendChild(downloadLink);
                document.getElementById('results').appendChild(listItem);

                $scope.tipoPlantillaWord = null;

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
    }

    // leemos las plantillas que corresponden a notas de cobertura impresas (cuyo tipo es: TMP-FAC-NOTA-CED, TMP-FAC-NOTA-REA, ...)
    $scope.showProgress = true;

    // ejecutamos un método que lee y regresa desde dropbox las plantillas para notas de cobertura 
    Meteor.call('plantillas.obtenerListaArchivosDesdeDirectorio', "/siniestros/notas", (err, result) => {

        if (err) {
            const errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({ type: 'danger', msg: errorMessage });

            $scope.showProgress = false;
            $scope.$apply();

            return;
        }

        if (result.error) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: result.message
            });

            $scope.showProgress = false;
            $scope.$apply();

            return;
        }

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'info',
            msg: result.message,
        });

        $scope.template_files = result && result.files && Array.isArray(result.files) ? result.files : [{ name: "indefinido", type: "indefinido" }];

        $scope.showProgress = false;
        $scope.$apply();
    })

}])