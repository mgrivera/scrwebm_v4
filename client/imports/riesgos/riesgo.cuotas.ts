
import * as angular from 'angular';
import * as lodash from 'lodash'; 
import * as moment from 'moment';

import { DialogModal } from '../generales/angularGenericModal'; 

// mostrarPagosEnCuotas es una función; MostrarPagosAplicados es un angular module que contiene un controller ... 
import { MostrarPagosEnCuotas, MostrarPagosAplicados } from '../generales/mostrarPagosAplicadosACuotaController'; 

export default angular.module("scrwebm.riesgos.cuotas", [ MostrarPagosAplicados.name ]).controller("RiesgoCuotas_Controller",
['$scope', '$stateParams', '$modal', 'uiGridConstants', 
  function ($scope, $stateParams, $modal, uiGridConstants) {

    $scope.showProgress = true; 

    let movimientoSeleccionado = {} as any; 
    
    if ($scope.movimientoSeleccionado) { 
        // NOTA: $scope.movimientoSeleccionado fue definido en $parentScope ... 
        movimientoSeleccionado = $scope.movimientoSeleccionado; 
    }

    $scope.numeroMovimientoSeleccionado = function() {
        return (movimientoSeleccionado && !lodash.isEmpty(movimientoSeleccionado)) ? movimientoSeleccionado.numero : -1;
    }

    // ---------------------------------------------------------------------
    // ui-grid: cuotas
    // ----------------------------------------------------------------------
    let cuotaSeleccionada = {};

    $scope.cuotas_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            $scope.cuotasGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                cuotaSeleccionada = {};

                if (row.isSelected) { 
                    cuotaSeleccionada = row.entity;
                }   
                else { 
                    return;
                }    
            })

            // marcamos el item como 'editado', cuando el usuario modifica un valor en el grid ...
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                if (newValue != oldValue) {
                    // las cuotas se graban seperadamente; solo las cuotas 'marcadas' son enviadas al servidor y grabadas
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
                    }
                        
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

    $scope.cuotas_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
                 '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'source',
            field: 'source',
            displayName: 'Origen',
            width: 60,
            cellFilter: 'origenCuota_Filter',            // ej: fac-1-1 (riesgo 1, movimiento 1)
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: $scope.companias,
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"abreviatura"',
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
            name: 'numero',
            field: 'numero',
            displayName: '#',
            width: 40,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'cantidad',
            field: 'cantidad',
            displayName: 'Cant',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'fechaEmision',
            field: 'fechaEmision',
            displayName: 'F emisión',
            cellFilter: 'dateFilter',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            cellFilter: 'dateFilter',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'diasVencimiento',
            field: 'diasVencimiento',
            displayName: 'Dias venc',
            width: 75,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'fechaVencimiento',
            field: 'fechaVencimiento',
            displayName: 'F venc',
            cellFilter: 'dateFilter',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'montoOriginal',
            field: 'montoOriginal',
            displayName: 'Monto original',
            cellFilter: 'currencyFilterAndNull',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'factor',
            field: 'factor',
            displayName: 'Factor',
            //cellFilter: '6DecimalsFilter',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            cellFilter: 'currencyFilterAndNull',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell'
        },
        {
            name: 'tienePagos',
            field: '_id',
            displayName: 'Pagos',
            cellFilter: 'cuotaTienePagos_Filter:this',            // nótese como pasamos el 'scope' del row al (angular) filter ...
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: 'esCompleto',
            field: '_id',
            displayName: 'Comp',
            cellFilter: 'cuotaTienePagoCompleto_Filter:this',            // nótese como pasamos el 'scope' del row al (angular) filter ...
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: '',
            field: '_id',
            displayName: '',
            cellTemplate: '<button class="btn btn-sm btn-link" type="button" ng-click="grid.appScope.mostrarPagosEnCuota(this.row.entity)">ver</button>',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        }, 
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.eliminarCuota(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]

    $scope.cuotas_nuevo = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Cuotas</em>",
                "Ud. debe seleccionar un movimiento <em>antes</em> de intentar ejecutar esta función.",
                false).then();
            return;
        }

        if (!lodash.isArray($scope.cuotas)) { 
            $scope.cuotas = [];
        }
            
        let cuota = {} as any;

        cuota._id = new Mongo.ObjectID()._str;

        cuota.source = {};

        cuota.source.entityID = $scope.riesgo._id;
        cuota.source.subEntityID = movimientoSeleccionado._id;
        cuota.source.origen = "fac";
        cuota.source.numero = $scope.riesgo.numero.toString() + "-" + movimientoSeleccionado.numero.toString();

        cuota.moneda = $scope.riesgo.moneda;

        cuota.cia = $scope.riesgo.cia;
        cuota.docState = 1;

        $scope.cuotas.push(cuota);

        $scope.cuotas_ui_grid.data = $scope.cuotas;

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }
    }

    $scope.eliminarCuota = function (cuota) {

        if (cuota.docState === 1) { 
            lodash.remove($scope.cuotas, (c: any) => { return c._id === cuota._id; }); 
        } else { 
            cuota.docState = 3;
        }

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }
    }

    $scope.cuotas_copiarUnaCuota = function () {

        if (!cuotaSeleccionada || lodash.isEmpty(cuotaSeleccionada)) {
            DialogModal($modal, "<em>Riesgos - Cuotas - Copiar una cuota</em>",
                `Ud. debe seleccionar una cuota <em>antes</em> de intentar ejecutar esta función.<br />
                 Seleccione la cuota que desea copiar. 
                `,
                false).then();
            return;
        }

        if (!lodash.isArray($scope.cuotas)) { 
            DialogModal($modal, "<em>Riesgos - Cuotas - Copiar una cuota</em>",
                `Error inesperado: no se han encontrado cuotas asociadas al riesgo.<br /> 
                 Para copiar una cuota en otra, deben existir cuotas; al menos una cuota debe existir en la lista.
                `,
                false).then();
            return;
        }
            
        let cuota: any = lodash.cloneDeep(cuotaSeleccionada);

        cuota._id = new Mongo.ObjectID()._str;
        cuota.docState = 1; 

        $scope.cuotas.push(cuota);

        $scope.cuotas_ui_grid.data = $scope.cuotas;

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }
    }

    $scope.cuotas_calcular = function() { 

        if (!cuotaSeleccionada || lodash.isEmpty(cuotaSeleccionada)) {
            DialogModal($modal, "<em>Riesgos - Cuotas - Calcular</em>",
                `Ud. debe seleccionar una cuota <em>antes</em> de intentar ejecutar esta función.<br />
                 Seleccione la cuota que desea calcular. 
                `,
                false).then();
            return;
        }

        let c: any = cuotaSeleccionada; 

        if (!c.fechaEmision) { 
            c.fechaEmision = new Date(); 
        }

        if (!c.fechaVencimiento && c.fecha && (c.diasVencimiento || c.diasVencimiento == 0)) { 
            c.fechaVencimiento = moment(c.fecha).add(c.diasVencimiento, 'days').toDate();
        }

        if (!c.fecha && c.fechaVencimiento && (c.diasVencimiento || c.diasVencimiento == 0)) { 
            c.fecha = moment(c.fechaVencimiento).subtract(c.diasVencimiento, 'days').toDate();
        }

        if ((!c.diasVencimiento && c.diasVencimiento != 0) && c.fechaVencimiento && c.fecha) { 
            var startDate = moment(c.fecha);
            var endDate = moment(c.fechaVencimiento);

            c.diasVencimiento = endDate.diff(startDate, 'days');
        }

        if (!c.monto && c.montoOriginal && c.factor) { 
            c.monto = c.montoOriginal * c.factor;
            lodash.round(c.monto, 2); 
        }

        if (!c.montoOriginal && c.monto && c.factor) { 
            c.montoOriginal = c.monto / c.factor;
            lodash.round(c.montoOriginal, 2); 
        }

        if (!c.factor && c.monto && c.montoOriginal) { 
            c.factor = c.monto / c.montoOriginal;
            lodash.round(c.factor, 3);
        }
    }

    $scope.cuotas_refrescarGrid = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        var companiasParaListaUIGrid = lodash.chain($scope.companias).
                                    filter(function(c) { return (c.nosotros || c.tipo == 'REA' || c.tipo == "CORRR") ? true : false; }).
                                    sortBy(function(item) { return item.nombre; }).
                                    value();

        $scope.cuotas_ui_grid.columnDefs[2].editDropdownOptionsArray = companiasParaListaUIGrid;
        $scope.cuotas_ui_grid.columnDefs[3].editDropdownOptionsArray = lodash.sortBy($scope.monedas, function(item) { return item.simbolo; });
    }

    $scope.gridCuotas_SeleccionarPorMoneda = function(monedaSeleccionada) {

        if (!$scope.cuotas || lodash.isEmpty($scope.cuotas)) { 
            return;
        }
            

        if (monedaSeleccionada) { 
            $scope.cuotas_ui_grid.data = lodash.filter($scope.cuotas, function(item) { return item.moneda === monedaSeleccionada; });
        }
        else { 
            $scope.cuotas_ui_grid.data = $scope.cuotas;
        }
    }


    $scope.mostrarPagosEnCuota = function (cuota) {
        // mostramos los pagos aplicados a la cuota, en un modal ...

        // es una función que está en client/generales y que es llamada desde varios 'registros' (ui-grids) de cuotas 
        // (fac, contratos, sntros, etc.)
        MostrarPagosEnCuotas($modal, cuota, $stateParams.origen);
    }

    $scope.cuotas_ui_grid.data = [];

    if ($scope.cuotas) { 
        $scope.cuotas_ui_grid.data = $scope.cuotas;
    }

    $scope.showProgress = false;
}])