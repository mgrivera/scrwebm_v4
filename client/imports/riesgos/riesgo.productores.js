
import { Mongo } from 'meteor/mongo';

import angular from 'angular';
import lodash from 'lodash'; 

import { DialogModal } from '../generales/angularGenericModal'; 
import { determinarSiExistenCuotasConCobrosAplicados } from '../generales/determinarSiExistenCuotasCobradas'; 

export default angular.module("scrwebm.riesgos.productores", []).controller("RiesgoProductores_Controller",
['$scope', '$uibModal', 'uiGridConstants', 
  function ($scope, $uibModal, uiGridConstants) {

    $scope.showProgress = true; 

    let movimientoSeleccionado = {}; 
    
    if ($scope.movimientoSeleccionado) { 
        // NOTA: $scope.movimientoSeleccionado fue definido en $parentScope ... 
        movimientoSeleccionado = $scope.movimientoSeleccionado; 
    }

    $scope.numeroMovimientoSeleccionado = function() {
        return (movimientoSeleccionado && !lodash.isEmpty(movimientoSeleccionado)) ? movimientoSeleccionado.numero : -1;
    }

    // -------------------------------------------------------------------------
    // grid de productores
    // -------------------------------------------------------------------------
    let productorSeleccionado = {};

    $scope.productores_ui_grid = {
        enableSorting: false,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                productorSeleccionado = {};

                if (row.isSelected) { 
                    productorSeleccionado = row.entity;
                }
                else { 
                    return;
                } 
            })

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!$scope.riesgo.docState) { 
                        $scope.riesgo.docState = 2;
                    }  
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

    $scope.productores_ui_grid.columnDefs = [
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compania',
            width: 180,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: lodash.sortBy($scope.companias, function(item) { return item.nombre; }),
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"nombre"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 40,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: lodash.sortBy($scope.monedas, function(item) { return item.simbolo; }),
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'corretaje',
            field: 'corretaje',
            displayName: 'Corretaje',
            cellFilter: 'currencyFilterAndNull',
            width: 140,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'porcentaje',
            field: 'porcentaje',
            displayName: '%',
            cellFilter: 'currencyFilterAndNull',
            width: 50,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            cellFilter: 'currencyFilterAndNull',
            width: 140,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        }
    ]


    $scope.agregarProductor = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos - Productores</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar agregar un productor al mismo.",
                                false).then();

            return;
        }

        var productor = {
            _id: new Mongo.ObjectID()._str,
            moneda: $scope.riesgo.moneda
        };

        if (!movimientoSeleccionado.productores) { 
            movimientoSeleccionado.productores = [];
        }
            
        movimientoSeleccionado.productores.push(productor);
        $scope.productores_ui_grid.data = movimientoSeleccionado.productores;

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }    
    }

    $scope.eliminarProductor = function () {
        // cada vez que el usuario selecciona un row, lo guardamos ...
        if (movimientoSeleccionado && movimientoSeleccionado.productores && productorSeleccionado) {
            lodash.remove(movimientoSeleccionado.productores, function (productor) { return productor._id === productorSeleccionado._id; });

            if (!$scope.riesgo.docState) {
                $scope.riesgo.docState = 2;
            }
        }
    }

    $scope.refrescarGridProductores = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        $scope.productores_ui_grid.columnDefs[0].editDropdownOptionsArray = lodash.sortBy($scope.companias, function(item) { return item.nombre; });
        $scope.productores_ui_grid.columnDefs[1].editDropdownOptionsArray = lodash.sortBy($scope.monedas, function(item) { return item.simbolo; });
    }

    $scope.productoresDeterminarCorretaje = function() {
        // determinamos el corretaje sumarizando, en las primas, las primas netas ...

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos - Productores</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if (!movimientoSeleccionado.productores || movimientoSeleccionado.productores.length == 0) {
            DialogModal($uibModal, "<em>Riesgos - Productores</em>",
                                "Aparentemente, Ud. no ha agregado un productor a la lista.<br />" +
                                "Agregue un productor a la lista antes de intentar determinar el corretaje.",
                                false).then();

            return;
        }


        if (!movimientoSeleccionado.primas || movimientoSeleccionado.primas.length == 0) {
            DialogModal($uibModal, "<em>Riesgos - Productores</em>",
                                "Aparentemente, no se han determinado los registros de prima para el movimiento seleccionado.<br />" +
                                "Para determinar el monto de corretaje del movimiento seleccionado, las primas (netas) " +
                                "de sus compañías han debido ser determinadas antes.",
                                false).then();

            return;
        }

        var corretaje = lodash.sumBy(movimientoSeleccionado.primas, 'primaNeta');

        // notese como asignamos el corretaje determinado a todos los productores (pueden ser varios!)
        movimientoSeleccionado.productores.map(function(productor) { productor.corretaje = corretaje; return productor; });
    }

    $scope.productoresCalcular = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            return;
        }


        if (!movimientoSeleccionado.productores || movimientoSeleccionado.productores.length == 0) {
            return;
        }


        movimientoSeleccionado.productores.forEach(function(p) {
            if (lodash.isFinite(p.corretaje) || lodash.isFinite(p.porcentaje))
                p.monto = p.corretaje * p.porcentaje / 100;
        })

        if (!$scope.riesgo.docState) {
            $scope.riesgo.docState = 2;
        }
    }

    $scope.determinarYRegistrarCuotasProductor = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de cuotas</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if (!movimientoSeleccionado.productores || !movimientoSeleccionado.productores.length) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de cuotas</em>",
                                "El movimiento seleccionado no tiene productores registrados; debe tenerlos.<br />" +
                                "Las cuotas se construyen en base a los registros de productores del movimiento. " +
                                "El movimiento debe tener registros de productores registrados.",
                                false).then();

            return;
        }

        if (!productorSeleccionado || lodash.isEmpty(productorSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de cuotas</em>",
                                "Ud. no ha seleccionado un productor para calcular y registrar sus cuotas.<br />" +
                                "Por favor seleccione el productor para el cual desea registrar cuotas.",
                                false).then();

            return;
        }

        if (!productorSeleccionado.monto) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de cuotas</em>",
                                "No se ha indicado un monto de comisión para el productor.<br />" +
                                "Ud. debe indicar un monto de comisión para el productor antes de intentar calcular y registrar sus cuotas.",
                                false).then();

            return;
        }

        // ------------------------------------------------------------------------------------------------------------------------
        // determinamos si las cuotas han recibido cobros; de ser así, impedimos editarlas ... 
        // leemos solo las cuotas que corresponden al 'sub' entity; por ejemplo, solo al movimiento, capa, cuenta, etc., que el 
        // usuario está tratando en ese momento ...  
        // ------------------------------------------------------------------------------------------------------------------------
        const cuotasProductor = lodash.filter($scope.cuotas, (c) => { 
            return c.compania === productorSeleccionado.compania && c.source.subEntityID === movimientoSeleccionado._id; }
        )

        const existenCuotasConCobrosAplicados = determinarSiExistenCuotasConCobrosAplicados(cuotasProductor); 
        if (existenCuotasConCobrosAplicados.existenCobrosAplicados) { 
            DialogModal($uibModal, "<em>Cuotas - Existen cobros/pagos asociados</em>", existenCuotasConCobrosAplicados.message, false).then(); 
            return;
        }

        var cantidadCuotasMovimientoSeleccionado = lodash($scope.cuotas).filter(function (c) { 
            return c.compania === productorSeleccionado.compania && c.source.subEntityID === movimientoSeleccionado._id; })
            .size();

        if (cantidadCuotasMovimientoSeleccionado) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de cuotas</em>",
                                "Ya existen cuotas registradas para el movimiento y productor seleccionados.<br />" +
                                "Si Ud. continúa y ejecuta esta función, las cuotas que corresponden al movimiento y productor seleccionados <em>serán eliminadas</em> antes de " +
                                "construirlas y agregarlas nuevamente.<br /><br />" +
                                "Aún así, desea continuar y eliminar (sustituir) las cuotas que ahora existen?",
                true).then(
                function () {
                    construirCuotasProductor();
                    return;
                },
                function () {
                    return;
                });
            return;
        }

        construirCuotasProductor();
    }

    function construirCuotasProductor() {
        $uibModal.open({
            templateUrl: 'client/generales/construirCuotas.html',
            controller: 'Riesgos_ConstruirCuotasProductorController',
            size: 'md',
            resolve: {
                riesgo: function () {
                    return $scope.riesgo;
                },
                movimiento: function () {
                    return movimientoSeleccionado;
                },
                productor: function () {
                    return productorSeleccionado;
                },
                cuotas: function () {
                    return $scope.cuotas;
                }
            }
        }).result.then(
            function () {
                return true;
            },
            function () {
                return true;
            });
    }

    $scope.productores_ui_grid.data = [];

    if (movimientoSeleccionado.productores) { 
        $scope.productores_ui_grid.data = movimientoSeleccionado.productores;
    }

    $scope.showProgress = false;

}])