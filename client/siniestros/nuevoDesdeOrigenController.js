

import lodash from 'lodash';

import { Riesgos } from '/imports/collections/principales/riesgos';  
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller('NuevoSiniestroDesdeOrigenController',
['$scope', '$modalInstance', '$modal', '$meteor', 'cia',
function ($scope, $modalInstance, $modal, $meteor, cia) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Siniestros - Registrar un nuevo siniestro</em>",
                                "Ud. debe seleccionar un movimiento en la lista.<br /><br />" +
                                "El movimiento que Ud. seleccione en la lista, será el que <em>dará cobertura</em> al " +
                                " siniestro que intenta registrar",
                               false).then();
            return;
        };

        // agregamos las  compañías del movimiento al siniestro
        // nótese que el riesgo de existir en minimongo pues hicimos antes un subscription para tenerlo en el client
        var riesgo = Riesgos.findOne(movimientoSeleccionado.idRiesgo);
        var riesgoMovimiento = lodash.find(riesgo.movimientos, function(x) { return x._id === movimientoSeleccionado.idMovimiento; });

        if (riesgoMovimiento && riesgoMovimiento.companias && riesgoMovimiento.companias.length) {
            movimientoSeleccionado.companias = [];

            riesgoMovimiento.companias.forEach(function(c) {

                var compania = {
                    _id: new Mongo.ObjectID()._str,
                    compania: c.compania,
                    nosotros: c.nosotros,
                    ordenPorc: c.ordenPorc
                };

                if (c.persona && !lodash.isEmpty(c.persona))
                    compania.persona = c.persona;

                movimientoSeleccionado.companias.push(compania);
            });
        };

        movimientoSeleccionado.fechaOcurrencia = $scope.filtro.fechaOcurrencia;

        $modalInstance.close(movimientoSeleccionado);
    };

    $scope.cancel = function (cancel) {
        if (cancel === 'cancel')
            $modalInstance.dismiss("Cancel");
        else
            $modalInstance.dismiss();
    };

    $scope.companias = $scope.$meteorCollection(Companias, false);
    $scope.monedas = $scope.$meteorCollection(Monedas, false);
    $scope.ramos = $scope.$meteorCollection(Ramos, false);
    $scope.asegurados = $scope.$meteorCollection(Asegurados, false);
    $scope.suscriptores = $scope.$meteorCollection(Suscriptores, false);

    $scope.tiposMovimiento = [
        { tipo: 'OR', descripcion: 'Original' },
        { tipo: 'AS', descripcion: 'Aumento de Suma Asegurada' },
        { tipo: 'DS', descripcion: 'Disminución de Suma Asegurada' },
        { tipo: 'COAD', descripcion: 'Cobro Adicional de Prima' },
        { tipo: 'DP', descripcion: 'Devolucion de Prima' },
        { tipo: 'EC', descripcion: 'Extensión de Cobertura' },
        { tipo: 'CR', descripcion: 'Cambio de Reasegurador' },
        { tipo: 'SE', descripcion: 'Sin Efecto' },
        { tipo: 'AN', descripcion: 'Anulación' },
        { tipo: 'AE', descripcion: 'Anulación de Endoso' },
        { tipo: 'CAPA', descripcion: 'Cambio de Participación' },
        { tipo: 'PRAJ', descripcion: 'Prima de Ajuste' },
        { tipo: 'AJPR', descripcion: 'Ajuste de Prima' },
        { tipo: 'FRPR', descripcion: 'Fraccionamiento de Prima' },
        { tipo: 'DE', descripcion: 'Endoso declarativo' },
        { tipo: 'IncCob', descripcion: 'Inclusión de Cobertura' }
    ];

    var movimientoSeleccionado = {};

    $scope.entidadesOriginales_ui_grid = {
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

    $scope.entidadesOriginales_ui_grid.columnDefs = [
        {
            name: 'numeroRiesgo',
            field: 'numeroRiesgo',
            displayName: 'Riesgo',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 60,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'number'
        },
        {
            name: 'numeroMovimiento',
            field: 'numeroMovimiento',
            displayName: 'Movimiento',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 80,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'number'
        },
        {
            name: 'estado',
            field: 'estado',
            displayName: 'Estado',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 80,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 80,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'date'
        },
        {
            name: 'hasta',
            field: 'hasta',
            displayName: 'Hasta',
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 80,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'date'
        },
          {
              name: 'tipo',
              field: 'tipo',
              displayName: 'Tipo',
              width: 100,
              cellFilter: 'mapDropdown:row.grid.appScope.tiposMovimiento:"tipo":"descripcion"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              type: 'string'
          },
          {
              name: 'suscriptor',
              field: 'suscriptor',
              displayName: 'Susc',
              width: 80,
              cellFilter: 'mapDropdown:row.grid.appScope.suscriptores:"_id":"abreviatura"',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'string'
          },
          {
              name: 'moneda',
              field: 'moneda',
              displayName: 'Moneda',
              width: 80,
              cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'string'
          },
          {
              name: 'compania',
              field: 'compania',
              displayName: 'Compañía',
              width: 100,
              cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"abreviatura"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'string'
          },
          {
              name: 'ramo',
              field: 'ramo',
              displayName: 'Ramo',
              width: 100,
              cellFilter: 'mapDropdown:row.grid.appScope.ramos:"_id":"abreviatura"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'string'
          },
          {
              name: 'asegurado',
              field: 'asegurado',
              displayName: 'Asegurado',
              width: 100,
              cellFilter: 'mapDropdown:row.grid.appScope.asegurados:"_id":"abreviatura"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'string'
          }
    ];


    $scope.submitted = false;
    $scope.filtro = {};

    $scope.submitDatosSiniestroForm = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if ($scope.datosSiniestroForm.$valid) {
            $scope.submitted = false;
            // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
            $scope.datosSiniestroForm.$setPristine();

            // seleccionamos los riegos que cumplan el criterio de selección inidcado (compañía, moneda, ocurrencia y cia)
            var filtro = { siniestrosNuevo: {} };

            if ($scope.filtro.fechaOcurrencia)
                filtro.siniestrosNuevo.fechaOcurrencia = $scope.filtro.fechaOcurrencia;

            if ($scope.filtro.companias && $scope.filtro.companias.length)
                // la compañía viene en un array, pues viene desde una lista (select)
                filtro.siniestrosNuevo.compania = $scope.filtro.companias[0];

            if ($scope.filtro.asegurados && $scope.filtro.asegurados.length)
                // la compañía viene en un array, pues viene desde una lista (select)
                filtro.siniestrosNuevo.asegurado = $scope.filtro.asegurados[0];

            if ($scope.filtro.suscriptores && $scope.filtro.suscriptores.length)
                // la compañía viene en un array, pues viene desde una lista (select)
                filtro.siniestrosNuevo.suscriptor = $scope.filtro.suscriptores[0];

            if ($scope.filtro.monedas && $scope.filtro.monedas.length)
                // la compañía viene en un array, pues viene desde una lista (select)
                filtro.siniestrosNuevo.moneda = $scope.filtro.monedas[0];

            filtro.siniestrosNuevo.cia = cia;

            $scope.showProgress = true;

            // si se efectuó un subscription al collection antes, la detenemos ...
            if (Riesgos_SubscriptionHandle)
                Riesgos_SubscriptionHandle.stop();

            Riesgos_SubscriptionHandle = null;

            $meteor.subscribe('riesgos', JSON.stringify(filtro)).then(function (subscriptionHandle) {

                    Riesgos_SubscriptionHandle = subscriptionHandle;

                    $scope.movimientosRiesgo = [];

                    if (Riesgos.find().count() == 0) {
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'warning',
                            msg: "0 registros seleccionados. Por favor revise el criterio de selección indicado e " +
                                 "indique uno diferente.<br />" +
                                 "No se encontraron riesgos para el criterio de selección indicado."
                        });

                        $scope.entidadesOriginales_ui_grid.data = [];
                        $scope.entidadesOriginales_ui_grid.data = $scope.movimientosRiesgo;

                        $scope.showProgress = false;
                        return;
                    };

                    let riesgos = Riesgos.find({}, { sort: { numero: true }}).fetch();

                    riesgos.forEach(function(riesgo) {
                        riesgo.movimientos.forEach(function(movimiento) {
                            // solo mostramos los movimientos que cubren la fecha de ocurrencia ...
                            if (movimiento.desde && movimiento.desde <= $scope.filtro.fechaOcurrencia &&
                                movimiento.hasta && movimiento.hasta >= $scope.filtro.fechaOcurrencia) {

                                // si el usuario indica una moneda en el filtro, consideramos que el riesgo la cumple si
                                // alguna de sus coberturas, en el movimiento tratado, corresponde a esa moneda
                                var cumpleMoneda = true;

                                if (filtro.siniestrosNuevo.moneda)
                                    if (!movimiento.coberturas || !movimiento.coberturas.length)
                                        cumpleMoneda = false;
                                    else
                                        cumpleMoneda = lodash.some(movimiento.coberturas, function(c) {
                                            return c.moneda === filtro.siniestrosNuevo.moneda; });

                                if (cumpleMoneda) {
                                    var movimientoRiesgo = {
                                        _id: new Mongo.ObjectID()._str,
                                        idRiesgo: riesgo._id,
                                        idMovimiento: movimiento._id,
                                        numeroRiesgo: riesgo.numero,
                                        numeroMovimiento: movimiento.numero,
                                        estado: riesgo.estado,
                                        tipo: movimiento.tipo,
                                        desde: movimiento.desde,
                                        hasta: movimiento.hasta,
                                        moneda: (movimiento.coberturas &&
                                                movimiento.coberturas.length) ?
                                                movimiento.coberturas[0].moneda : 0,
                                        compania: riesgo.compania,
                                        suscriptor: riesgo.suscriptor,
                                        ramo: riesgo.ramo,
                                        asegurado: riesgo.asegurado
                                    };

                                    $scope.movimientosRiesgo.push(movimientoRiesgo);
                                };
                            };
                        });
                    });

                    $scope.alerts.length = 0;

                    if (!$scope.movimientosRiesgo.length)
                        $scope.alerts.push({
                            type: 'warning',
                            msg: "0 registros seleccionados. Por favor revise el criterio de selección indicado e " +
                                 "indique uno diferente.<br />" +
                                 "No se encontraron riesgos para el criterio de selección indicado."
                        });
                    else
                        $scope.alerts.push({
                            type: 'info',
                            msg: $scope.movimientosRiesgo.length.toString() + " movimientos (de riesgos) seleccionados.<br />" +
                                 "Seleccione un movimiento de la lista y haga un click en Ok"
                        });

                    $scope.entidadesOriginales_ui_grid.data = [];
                    $scope.entidadesOriginales_ui_grid.data = $scope.movimientosRiesgo;

                    $scope.showProgress = false;
                });
        };
    };
}
]);
