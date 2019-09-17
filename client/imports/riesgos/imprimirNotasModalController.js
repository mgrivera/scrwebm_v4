

import moment from 'moment';
import lodash from 'lodash'; 

import { Companias } from '/imports/collections/catalogos/companias'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

export default angular.module("scrwebm.riesgos.riesgo.imprimirNotasCobertura", []).
controller('ImprimirNotasRiesgosModalController',
['$scope', '$modalInstance', '$modal', 'riesgo', 'tiposMovimiento',
function ($scope, $modalInstance, $modal, riesgo, tiposMovimiento) {
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        // $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = null; 

    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
        
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

                    lodash.filter(movimientoSeleccionado.companias, function(x) { return !x.nosotros; }).forEach(function(r) {
                        var reasegurador = { _id: r.compania, nombre: Companias.findOne(r.compania).abreviatura };
                        $scope.reaseguradoresLista.push(reasegurador);
                    });

                    const d = movimientoSeleccionado.fechaEmision; 

                    $scope.parametros.fecha = `Caracas, ${moment(d).format("D")} de ${moment(d).format("MMMM")} de ${moment(d).format("YYYY")}`;
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
          }, 
          {
            name: 'fechaEmision',
            field: 'fechaEmision',
            displayName: 'F emisión',
            cellFilter: 'dateFilter',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
    ]

    $scope.submitted = false;
    $scope.parametros = {};

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

    $scope.tipoPlantillaWord = null; 

    $scope.obtenerDocumentoWord = function (file) {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Construcción de notas de cobertura</em>",
                        "Ud. debe seleccionar un movimiento en la lista.",
                        false).then();
            return;
        }

        if (!$scope.parametros.fecha || lodash.isEmpty($scope.parametros.fecha)) {
            DialogModal($modal, "<em>Riesgos - Construcción de notas de cobertura</em>",
                        `Ud. debe indicar la fecha que se mostrará en el documento.<br />
                         Ejemplo: Caracas, 25 de Abril del 2.015.
                        `,
                        false).then();
            return;
        }

        if (!$scope.tipoPlantillaWord) {
            DialogModal($modal, "<em>Riesgos - Construcción de notas de cobertura</em>",
                        `Ud. debe indicar el <em>tipo</em> de plantilla que será usada para construir el documento.<br /><br />
                         Los tipos de plantilla que pueden ser usados para obtener las notas de cobertura son: 
                         <em>Cedentes</em>, <em>Reaseguradores</em>, <em>Interna</em>. <br /><br />
                         De acuerdo a cual plantilla y su tipo que Ud. indique, será construído el documento Word
                         que resulta de este proceso.  
                        `,
                        false).then();
            return;
        }

        $scope.alerts.length = 0;
        $scope.showProgress = true;

        // nota para el cedente
        if ($scope.tipoPlantillaWord === 'cedentes') {
            Meteor.call('riesgos.obtenerNotasImpresas.cedente',
                         "/facultativo/notasCobertura", file.name,
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

                if (result.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: result.message, });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message,
                });

                $scope.tipoPlantillaWord = null;

                $scope.showProgress = false;
                $scope.$apply();
            })
        }

        // nota de cobertura Interna
        if ($scope.tipoPlantillaWord === 'interna') {
            Meteor.call('riesgos.obtenerNotasImpresas.interna',
                        "/facultativo/notasCobertura", file.name,
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

                if (result.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: result.message });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return; 
                }
        
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message,
                });

                $scope.tipoPlantillaWord = null;

                $scope.showProgress = false;
                $scope.$apply();
            })
        }

        // nota de cobertura de reaseguradores
        if ($scope.tipoPlantillaWord === 'reaseguradores') {
            Meteor.call('riesgos.obtenerNotasImpresas.reaseguradores',
                        "/facultativo/notasCobertura", file.name,
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

                if (result.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: result.message });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message,
                });

                $scope.tipoPlantillaWord = null;

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
    }

    $scope.movimientos_ui_grid.data = riesgo.movimientos;

    // leemos las plantillas que corresponden a notas de cobertura impresas (cuyo tipo es: TMP-FAC-NOTA-CED, TMP-FAC-NOTA-REA, ...)
    $scope.showProgress = true;

    // ejecutamos un método que lee y regresa desde dropbox las plantillas para notas de cobertura 
    Meteor.call('plantillas.obtenerListaArchivosDesdeDirectorio', "/facultativo/notasCobertura", (err, result) => {

        if (err) {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

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
                msg:  result.message
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

        $scope.template_files = result && result.files && Array.isArray(result.files) ? result.files : [ { name: "indefinido", type: "indefinido"} ]; 

        $scope.showProgress = false;
        $scope.$apply();
    })
}])
