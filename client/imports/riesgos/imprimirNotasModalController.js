

import moment from 'moment';

import { Companias } from '/imports/collections/catalogos/companias'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { CollectionFS_templates } from '/imports/collectionFS/Files_CollectionFS_templates'; 

export default angular.module("scrwebm.riesgos.riesgo.imprimirNotasCobertura", []).
controller('ImprimirNotasRiesgosModalController',
['$scope', '$modalInstance', '$modal', 'riesgo', 'tiposMovimiento',
function ($scope, $modalInstance, $modal, riesgo, tiposMovimiento) {
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        // $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (companiaSeleccionada)
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc)
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    else
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    // ------------------------------------------------------------------------------------------------

    $scope.tiposMovimiento = tiposMovimiento;

    var movimientoSeleccionado = {};
    $scope.reaseguradoresLista = [];

    $scope.movimientos_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: false,
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
                movimientoSeleccionado = {};

                if (row.isSelected) {
                    movimientoSeleccionado = row.entity;

                    // agregamos los reaseguradores del movimiento a la lista de reaseguradores en el $scope,
                    // para que el usuario pueda seleccionar un reasegurador en particular

                    $scope.reaseguradoresLista = [];

                    _.filter(movimientoSeleccionado.companias, function(x) { return !x.nosotros; }).forEach(function(r) {
                        var reasegurador = { _id: r.compania, nombre: Companias.findOne(r.compania).abreviatura };
                        $scope.reaseguradoresLista.push(reasegurador);
                    });
                }
                else
                    return;
            });
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },

        getRowIdentity: function (row) {
            return row._id;
        }
    };

    $scope.movimientos_ui_grid.columnDefs = [
          {
              name: 'numero',
              field: 'numero',
              displayName: '#',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              width: 40,
              enableColumnMenu: false,
              enableCellEdit: false,
              type: 'number'
          },
          {
              name: 'tipo',
              field: 'tipo',
              displayName: 'Tipo',
              width: 180,
              cellFilter: 'mapDropdown:row.grid.appScope.tiposMovimiento:"tipo":"descripcion"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              type: 'string'
          }
    ];

    $scope.submitted = false;
    $scope.parametros = {};

    $scope.parametros.fecha = "Caracas, " + moment().format("D") + " de " + moment().format("MMMM") + " de " + moment().format("YYYY");

    // para mostrar los links que permiten al usuario hacer el download de las notas
    $scope.downLoadWordDocument_cedente = false;
    $scope.selectedFile_cedente = {};
    $scope.downLoadLink_cedente = "";

    $scope.downLoadWordDocument_reaseguradores = false;
    $scope.selectedFile_reaseguradores = {};
    $scope.downLoadLink_reaseguradores = "";

    $scope.downLoadWordDocument_interna = false;
    $scope.selectedFile_interna = {};
    $scope.downLoadLink_interna = "";

    $scope.obtenerDocumentoWord = function (file) {

        if (!movimientoSeleccionado || _.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Construcción de notas de cobertura</em>",
                        "Ud. debe seleccionar un movimiento en la lista.",
                        false).then();
            return;
        };

        if (!$scope.parametros.fecha || _.isEmpty($scope.parametros.fecha)) {
            DialogModal($modal, "<em>Riesgos - Construcción de notas de cobertura</em>",
                        `Ud. debe indicar la fecha que se mostrará en el documento.<br />
                         Ejemplo: Caracas, 25 de Abril del 2.015.
                        `,
                        false).then();
            return;
        };

        $scope.alerts.length = 0;
        $scope.showProgress = true;

        // nota para el cedente
        if (file.metadata.tipo === "TMP-FAC-NOTA-CED") {
            Meteor.call('riesgos.obtenerNotasImpresas.cedente',
                         file._id,
                         riesgo._id,
                         movimientoSeleccionado._id,
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

                    $scope.selectedFile_cedente = file;
                    $scope.downLoadLink_cedente = result;
                    $scope.downLoadWordDocument_cedente = true;

                    $scope.showProgress = false;
                    $scope.$apply();
            });
        };

        // nota de cobertura Interna
        if (file.metadata.tipo === "TMP-FAC-NOTA-INT") {
            Meteor.call('riesgos.obtenerNotasImpresas.interna',
                         file._id,
                         riesgo._id,
                         movimientoSeleccionado._id,
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

                $scope.selectedFile_interna = file;
                $scope.downLoadLink_interna = result;
                $scope.downLoadWordDocument_interna = true;

                $scope.showProgress = false;
                $scope.$apply();
            });
        }

        // nota de cobertura de reaseguradores
        if (file.metadata.tipo === "TMP-FAC-NOTA-REA") {
            Meteor.call('riesgos.obtenerNotasImpresas.reaseguradores',
                         file._id,
                         riesgo._id,
                         movimientoSeleccionado._id,
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

                $scope.selectedFile_reaseguradores = file;
                $scope.downLoadLink_reaseguradores = result;
                $scope.downLoadWordDocument_reaseguradores = true;

                $scope.showProgress = false;
                $scope.$apply();
            });
        };
    };

    $scope.movimientos_ui_grid.data = riesgo.movimientos;

    $scope.helpers({
        template_files: () => {
            return CollectionFS_templates.find({
                // regresamos solo archivos cuyo tipo comienza así ...
                'metadata.tipo': { $regex: /^TMP-FAC-NOTA/ },
            });
        },
    });


    // leemos las plantillas que corresponden a notas de cobertura impresas (cuyo tipo es: TMP-FAC-NOTA-CED, TMP-FAC-NOTA-REA, ...)
    $scope.showProgress = true;

    $scope.subscribe("collectionFS_files", () => { return ['TMP-FAC-NOTA']; }, {
        onReady: function () {

        //   $scope.plantillas_ui_grid.data = [];
        //   $scope.plantillas_ui_grid.data = $scope.collectionFS_files;

          $scope.showProgress = false;
          $scope.$apply();
        },
        onStop: function (error) {
          $scope.showProgress = false;
          $scope.$apply();
      }
  });
  // --------------------------------------------------------------------------------------------------------------------

}
]);
