
import { Mongo } from 'meteor/mongo';

import moment from 'moment';
import lodash from 'lodash';
import angular from 'angular';

import { Monedas } from '/imports/collections/catalogos/monedas'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '../methods/_methods/_methods'; 

angular.module("scrwebm").controller("Contrato_Cuentas_Definiciones_Controller", ['$scope', '$uibModal', 'uiGridConstants', '$q', '$interval', 
function ($scope, $uibModal, uiGridConstants, $q, $interval) {

    $scope.showProgress = false;

    $scope.contrato = $scope.$parent.$parent.contrato; 
    $scope.companiaSeleccionada = $scope.$parent.$parent.companiaSeleccionada; 

    // --------------------------------------------------------------------------------------
    // ui-grid de Cuentas
    // --------------------------------------------------------------------------------------
    let definicionCuentaTecnicaSeleccionada = {};
    $scope.definicionCuentaTecnicaSeleccionada_Info = {};       // para mostrar la cuenta seleccionada en las páginas (html)

    $scope.cuentasTecnicas_definiciones_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            $scope.cuentasTecnicas_definiciones_gridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                definicionCuentaTecnicaSeleccionada = {};

                $scope.definicionCuentaTecnicaSeleccionada_Info = {};
                $scope.cuentasCuotas_ui_grid.data = [];

                if (row.isSelected) {
                    definicionCuentaTecnicaSeleccionada = row.entity;

                    $scope.definicionCuentaTecnicaSeleccionada_Info.numero = definicionCuentaTecnicaSeleccionada.numero;
                    $scope.definicionCuentaTecnicaSeleccionada_Info.desde = moment(definicionCuentaTecnicaSeleccionada.desde).format("DD-MM-YYYY");
                    $scope.definicionCuentaTecnicaSeleccionada_Info.moneda = Monedas.findOne(definicionCuentaTecnicaSeleccionada.moneda).simbolo;

                    // para poder acceder al período seleccionado por el usuario desde otros states 
                    $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada_Info = $scope.definicionCuentaTecnicaSeleccionada_Info; 
                    $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada = definicionCuentaTecnicaSeleccionada;  

                    // intentamos refrescar el ui-grid de cuotas para la definción seleccionada ...
                    if ($scope.cuotas) {
                        $scope.cuentasCuotas_ui_grid.data = lodash.filter($scope.cuotas, function (c) {
                            return c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id;
                        });
                    }
                }
                else { 
                    return;
                }
            })

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!$scope.$parent.$parent.contrato.docState) { 
                        // al menos por ahora, las definiciones (períodos) son un array en el contrato. Puede ser que 
                        // en un futuro las separemos en una sola tabla, sin embargo, por ahora no es así. Debemos marcar 
                        // el contrato para que Grabar lo modifique y registre las modificaciones que el usuario 
                        // pueda haber hecho en los períodos ... 
                        $scope.$parent.$parent.contrato.docState = 2;
                        $scope.$parent.$parent.dataHasBeenEdited = true; 
                    }
                }    
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        // nótese que usamos 'id', y no '_id', pues estos registros vienen de sql con un id único
        // (y nosotros no agregamos un _id mongo) ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.cuentasTecnicas_definiciones_ui_grid.columnDefs = [
        {
            name: 'numero',
            field: 'numero',
            displayName: 'Período',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 60,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
            cellFilter: 'dateFilter',
            width: 90,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'hasta',
            field: 'hasta',
            displayName: 'Hasta',
            cellFilter: 'dateFilter',
            width: 90,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 50,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'fechaVencimiento',
            field: 'fechaVencimiento',
            displayName: 'F vencimiento',
            cellFilter: 'dateFilter',
            width: 90,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'fechaRecepcion',
            field: 'fechaRecepcion',
            displayName: 'F recepción',
            cellFilter: 'dateFilter',
            width: 90,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
    ]


    // nótese que este interval se ejecuta una sola vez ... 
    $interval( () => { 
        // intentamos recuperar alguna definición que se ha seleccionado si el usuario ha visitado este state antes ... 
        if ($scope.$parent.$parent.definicionCuentaTecnicaSeleccionada_Info) { 
            $scope.definicionCuentaTecnicaSeleccionada_Info = $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada_Info;
        }

        if ($scope.$parent.$parent.definicionCuentaTecnicaSeleccionada) { 
            definicionCuentaTecnicaSeleccionada = $scope.$parent.$parent.definicionCuentaTecnicaSeleccionada;
            // intentamos seleccionar la definición en el ui-grid, tal como lo hubiera hecho el usuario haciendo un click 
            // en el row para seleccionarlo 
            // por alguna razón, al regresar luego de Grabar la instrucción que selecciona el row no se ejecuta correctamente
            $scope.cuentasTecnicas_definiciones_gridApi.core.refresh();  
            $scope.cuentasTecnicas_definiciones_gridApi.selection.selectRow(definicionCuentaTecnicaSeleccionada);
        }
    }, 500, 1);


    $scope.agregarCuenta = function () {

        if (!$scope.contrato.cuentasTecnicas_definicion) { 
            $scope.contrato.cuentasTecnicas_definicion = [];
        }

        const monedaDefault = Monedas.findOne({ defecto: true });
            
        var cuentaMayorNumero = lodash.maxBy($scope.contrato.cuentasTecnicas_definicion, (cuenta) => { return cuenta.numero; });
        var cuenta = {
            _id: new Mongo.ObjectID()._str, 
            numero: 0, 
            desde: new Date(), 
            moneda: monedaDefault ? monedaDefault._id : null, 
        };

        if (!lodash.isObject(cuentaMayorNumero)) {
            cuenta.numero = 1;
        } else {
            cuenta.numero = cuentaMayorNumero.numero + 1;
            cuenta.desde = cuentaMayorNumero.desde;
            cuenta.moneda = cuentaMayorNumero.moneda;
        }

        $scope.contrato.cuentasTecnicas_definicion.push(cuenta);
        $scope.cuentasTecnicas_definiciones_ui_grid.data = $scope.contrato.cuentasTecnicas_definicion;

        if (!$scope.$parent.$parent.contrato.docState) { 
            // al menos por ahora, las definiciones (períodos) son un array en el contrato. Puede ser que 
            // en un futuro las separemos en una sola tabla, sin embargo, por ahora no es así. Debemos marcar 
            // el contrato para que Grabar lo modifique y registre las modificaciones que el usuario 
            // pueda haber hecho en los períodos ... 
            $scope.$parent.$parent.contrato.docState = 2;
            $scope.$parent.$parent.dataHasBeenEdited = true; 
        }
    }

    $scope.eliminarCuenta = function () {

        if (definicionCuentaTecnicaSeleccionada && !lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            lodash.remove($scope.contrato.cuentasTecnicas_definicion, (c) => { return c._id === definicionCuentaTecnicaSeleccionada._id; });
            $scope.cuentasTecnicas_definiciones_ui_grid.data = $scope.contrato.cuentasTecnicas_definicion;

            if (!$scope.$parent.$parent.contrato.docState) { 
                // al menos por ahora, las definiciones (períodos) son un array en el contrato. Puede ser que 
                // en un futuro las separemos en una sola tabla, sin embargo, por ahora no es así. Debemos marcar 
                // el contrato para que Grabar lo modifique y registre las modificaciones que el usuario 
                // pueda haber hecho en los períodos ... 
                $scope.$parent.$parent.contrato.docState = 2;
                $scope.$parent.$parent.dataHasBeenEdited = true; 
            }
        }
    }

    $scope.generarCuentas_definiciones = function () {
        // pasamos el ui-grid para que se haga el binding para ésta cuando el usuario cierra el modal ...
        Contratos_Methods.construirDefinicionCuentas($scope, $scope.contrato, $scope.monedas, $scope.cuentasTecnicas_definiciones_ui_grid, $uibModal, $scope.$parent.$parent);
    }

    $scope.generarCuotasCuentaTecnica = () => {

        // debe haber una definicion seleccionada
        if (!definicionCuentaTecnicaSeleccionada || lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            DialogModal($uibModal,
                        "<em>Contratos - Proporcionales - Registro de cuotas de cuentas técnicas</em>",
                        `Error: Ud. debe seleccionar una <em>definición de cuenta técnica</em> en la lista.
                            `,
                        false);
            return;
        }

        if ($scope.dataHasBeenEdited) { 
            DialogModal($uibModal,
                "<em>Contratos - Proporcionales - Registro de cuotas de cuentas técnicas</em>",
                `Se han efectuado cambios en el registro. Por favor grabe los cambios antes de intentar ejecutar esta función.
                `,
                false);
            return;
        }

        const definicionID = definicionCuentaTecnicaSeleccionada._id;

        // si no hay saldos de cuentas técnicas ni de complementarios (ent cart de primas, etc.), notificamos al usuario 
        let existenSaldos = {}; 
        existenSaldos = $scope.contratosProp_cuentas_saldos.find(x => x.definicionID === definicionID); 
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_comAdic_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_entCartPr_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_entCartSn_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_retCartPr_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_retCartSn_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_partBeneficios_montosFinales.find(x => x.definicionID === definicionID); }

        if (!existenSaldos) {
            DialogModal($uibModal,
                        "<em>Contratos - Proporcionales - Registro de cuotas de cuentas técnicas</em>",
                        `Error: aparentemente, la <em>definición de cuenta técnica</em> seleccionada no tiene
                        saldos de cuentas técnicas, ni tampoco de complementarios registrados.<br /><br />
                        Para calcular las cuotas de una <em>definición de cuenta técnica</em>, ésta debe tener
                        saldos de cuentas técnicas o de complementarios y registrados.
                        `, false);
            return;
        }

        // TODO: determinar si las cuotas ya existen. De ser así, informar y pedir confirmación ...
        const existenCuotasParaLaDefinicionSeleccionada = $scope.cuotas.find(c => c.source.subEntityID === definicionID);

        if (existenCuotasParaLaDefinicionSeleccionada) {
            DialogModal($uibModal,
                        `<em>Contratos</em> - Registro de cuotas para la definición seleccionada`,
                         `Ya existen <em>cuotas registradas</em> para la
                         <em>definición de cuenta técnica</em> seleccionada.<br /><br />
                         Si Ud. continúa, éstas serán eliminadas y unas nuevas serán calculadas y
                         registradas en su lugar.<br /><br />
                         Desea continuar y sustituir las cuotas registradas para la definición seleccionada?`,
                        true).then(
                function () {
                    generarCuotasCuentaTecnica2();
                },
                function () {
                    DialogModal($uibModal, "<em>Contratos</em> - Cuentas técnicas - Generación de cuotas",
                                        "Ok, el proceso ha sido cancelado.", true).then();
                });
            return;
        }
        else
            generarCuotasCuentaTecnica2();
        }


    function generarCuotasCuentaTecnica2() {

        // pasamos al modal todos los arrays que contienen las: 1) cuentas; 2) complementarios (6) 
        const definicionID = definicionCuentaTecnicaSeleccionada._id; 

        const cuentas_saldos = $scope.contratosProp_cuentas_saldos.filter(x => x.definicionID === definicionID); 
        const comAdic_montosFinales = $scope.contratosProp_comAdic_montosFinales.filter(x => x.definicionID === definicionID);
        const entCartPr_montosFinales = $scope.contratosProp_entCartPr_montosFinales.filter(x => x.definicionID === definicionID);
        const entCartSn_montosFinales = $scope.contratosProp_entCartSn_montosFinales.filter(x => x.definicionID === definicionID);
        const retCartPr_montosFinales = $scope.contratosProp_retCartPr_montosFinales.filter(x => x.definicionID === definicionID);
        const retCartSn_montosFinales = $scope.contratosProp_retCartSn_montosFinales.filter(x => x.definicionID === definicionID);
        const partBeneficios_montosFinales = $scope.contratosProp_partBeneficios_montosFinales.filter(x => x.definicionID === definicionID); 


        $uibModal.open({
               templateUrl: 'client/contratos/methods/generarCuotasCuentasTecnicas/cuentasGenerarCuotas.html',
               controller: 'CuentasGenerarCuotasController',
               size: 'md',
               resolve: {
                    contrato: function () {
                        return $scope.contrato;
                    },
                    definicionCuentaTecnicaSeleccionada: function () {
                        return definicionCuentaTecnicaSeleccionada;
                    },
                    cuotas: function () {
                        return $scope.cuotas;
                    },
                    definicionCuentaTecnicaSeleccionada_Info: function () {
                        return $scope.definicionCuentaTecnicaSeleccionada_Info;
                    }, 
                    cuentas_saldos: function() { return cuentas_saldos; },  
                    comAdic_montosFinales: function() { return comAdic_montosFinales; },  
                    entCartPr_montosFinales: function() { return entCartPr_montosFinales; },    
                    entCartSn_montosFinales: function() { return entCartSn_montosFinales; },   
                    retCartPr_montosFinales: function() { return retCartPr_montosFinales; },    
                    retCartSn_montosFinales: function() { return retCartSn_montosFinales; },   
                    partBeneficios_montosFinales: function() { return partBeneficios_montosFinales; }
               }
           }).result.then(
               function () {
                   return true;
               },
               function () {
                   // refrescamos el ui-grid para que se muestren las cuotas registradas
                   $scope.cuentasCuotas_ui_grid.data = []

                   if ($scope.cuotas) {
                       $scope.cuentasCuotas_ui_grid.data = lodash.filter($scope.cuotas, function (c) {
                           return c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id;
                       });
                   }

                   // solo si el usuario actualizó el array de cuotas para la definición, ponemos el flag en true 
                   if ($scope.cuotas && Array.isArray($scope.cuotas)) {
                       const arrayCuotasDefinicion = $scope.cuotas.filter((c) =>
                            {  
                                return (c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id && 
                                        c.docState); 
                            });

                        if (arrayCuotasDefinicion && Array.isArray(arrayCuotasDefinicion) && arrayCuotasDefinicion.length) { 
                            // pueda haber hecho en los períodos ... 
                            $scope.$parent.$parent.dataHasBeenEdited = true; 
                        }
                    }

                   return true;
               })
    }

    // ---------------------------------------------------------------------
    // ui-grid: cuotas para la definición (de cuenta técnica) seleccionada
    // ----------------------------------------------------------------------
    var definicionCuentaCuotaSeleccionada = {};

    $scope.cuentasCuotas_ui_grid = {
        enableSorting: true,
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
            $scope.cuentasCuotasGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                definicionCuentaCuotaSeleccionada = {};
                if (row.isSelected) { 
                    definicionCuentaCuotaSeleccionada = row.entity;
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

                        // al menos por ahora, las definiciones (períodos) son un array en el contrato. Puede ser que 
                        // en un futuro las separemos en una sola tabla, sin embargo, por ahora no es así. Debemos marcar 
                        // el contrato para que Grabar lo modifique y registre las modificaciones que el usuario 
                        // pueda haber hecho en los períodos ... 
                        $scope.$parent.$parent.contrato.docState = 2;
                        $scope.$parent.$parent.dataHasBeenEdited = true; 
                    }
                }
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        // nótese que usamos 'id', y no '_id', pues estos registros vienen de sql con un id único
        // (y nosotros no agregamos un _id mongo) ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.cuentasCuotas_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
                '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: maroon; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'source',
            field: 'source',
            displayName: 'Origen',
            width: 70,
            cellFilter: 'origenCuota_Filter',            // ej: fac-1-1 (riesgo 1, movimiento 1)
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
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
            enableSorting: true,
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
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            headerCellClass: 'ui-centerCell-leftCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            enableCellEdit: true,
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
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'cantidad',
            field: 'cantidad',
            displayName: 'Cantidad',
            width: 45,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
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
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'montoOriginal',
            field: 'montoOriginal',
            displayName: 'Monto original',
            cellFilter: 'currencyFilter',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'factor',
            field: 'factor',
            displayName: 'Factor',
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
            cellFilter: 'currencyFilter',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: true,
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
        }
    ]


    $scope.agregarCuentaCuota = function () {

        if (!definicionCuentaTecnicaSeleccionada || lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            DialogModal($uibModal, "<em>Contratos - Cuotas</em>",
                `Ud. debe seleccionar una <em>definición de cuenta técnica</em>
                <b>antes</b> de intentar ejecutar esta función.`,
                false).then();
            return;
        }

        if (!Array.isArray($scope.cuotas)) { 
            $scope.cuotas = [];
        }
            
        var cuota = {};

        cuota._id = new Mongo.ObjectID()._str;

        cuota.source = {};

        cuota.source.entityID = $scope.contrato._id;
        cuota.source.subEntityID = definicionCuentaTecnicaSeleccionada._id;
        cuota.source.origen = "cuenta";
        cuota.source.numero = $scope.contrato.numero.toString() + "-" + definicionCuentaTecnicaSeleccionada.numero.toString();

        //cuota.moneda = $scope.contrato.moneda;

        cuota.moneda = definicionCuentaTecnicaSeleccionada.moneda;
        cuota.cia = $scope.contrato.cia;
        cuota.docState = 1;

        $scope.cuotas.push(cuota);

        $scope.cuentasCuotas_ui_grid.data = lodash.filter($scope.cuotas, function (c) { return c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id; });

        // al menos por ahora, las definiciones (períodos) son un array en el contrato. Puede ser que 
        // en un futuro las separemos en una sola tabla, sin embargo, por ahora no es así. Debemos marcar 
        // el contrato para que Grabar lo modifique y registre las modificaciones que el usuario 
        // pueda haber hecho en los períodos ... 
        $scope.$parent.$parent.contrato.docState = 2;
        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    $scope.eliminarCuentaCuota = function () {

        if (!definicionCuentaTecnicaSeleccionada || lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            DialogModal($uibModal,
                        "<em>Contratos - Cuotas</em>",
                        `Ud. debe seleccionar la capa a la cual corresponde la cuota que desea eliminar.`,
                        false).then();
            return;
        }

        if (!definicionCuentaCuotaSeleccionada || lodash.isEmpty(definicionCuentaCuotaSeleccionada)) {
            DialogModal($uibModal,
                        `<em>Contratos - Cuotas</em>", "Ud. debe seleccionar la cuota que desea eliminar.`,
                        false, true).then();
            return;
        }

        lodash.remove($scope.cuotas, function (cuota) { return cuota._id === definicionCuentaCuotaSeleccionada._id; });

        $scope.cuentasCuotas_ui_grid.data = lodash.filter($scope.cuotas, function (c) { return c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id; });

        // al menos por ahora, las definiciones (períodos) son un array en el contrato. Puede ser que 
        // en un futuro las separemos en una sola tabla, sin embargo, por ahora no es así. Debemos marcar 
        // el contrato para que Grabar lo modifique y registre las modificaciones que el usuario 
        // pueda haber hecho en los períodos ... 
        $scope.$parent.$parent.contrato.docState = 2;
        $scope.$parent.$parent.dataHasBeenEdited = true; 
    }

    if ($scope.contrato && $scope.contrato.cuentasTecnicas_definicion) { 
        $scope.cuentasTecnicas_definiciones_ui_grid.data = $scope.contrato.cuentasTecnicas_definicion;
    }

}])