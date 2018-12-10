

import * as angular from 'angular'; 
import * as lodash from 'lodash'; 

import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Bancos } from 'imports/collections/catalogos/bancos'; 
import { CuentasBancarias } from 'imports/collections/catalogos/cuentasBancarias'; 

import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CuentasContables } from 'imports/collections/catalogos/cuentasContables';
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 

angular.module("scrwebm").controller("CuentasBancariasController",
 ['$scope', '$stateParams',
  function ($scope, $stateParams) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {} as any;

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

    $scope.tiposCuentasBancarias = [
                                        { descripcion: 'Corriente', tipo: 'CORR' },
                                        { descripcion: 'Ahorros', tipo: 'AHORRO' },
                                    ];

    $scope.helpers({
        monedas: () => {
            return Monedas.find({}, { sort: { simbolo: 1 }});
        },
        bancos: () => {
            return Bancos.find({}, { sort: { abreviatura: 1 }});
        },
        cuentasBancarias: () => {
            // las cuenas bancarias se registran para la cia seleccionada
            return CuentasBancarias.find({ cia: $scope.companiaSeleccionada._id });
        },
    })

    $scope.cuentasBancarias_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    if (!rowEntity.docState)
                        rowEntity.docState = 2;
            });
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.cuentasBancarias_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
                '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Moneda',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',

            width: 80,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'banco',
            field: 'banco',
            displayName: 'Banco',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'abreviatura',
            editDropdownOptionsArray: $scope.bancos,
            cellFilter: 'mapDropdown:row.grid.appScope.bancos:"_id":"abreviatura"',

            width: 80,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposCuentasBancarias,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposCuentasBancarias:"tipo":"descripcion"',

            width: 80,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'numero',
            field: 'numero',
            displayName: 'Número',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'descripcionPlantillas',
            field: 'descripcionPlantillas',
            displayName: 'Descripción para plantillas',
            width: 150,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cuentaContable',
            field: 'cuentaContable',
            displayName: 'Cuenta contable',
            width: 250,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'cuenta',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.cuentasContablesLista,
            cellFilter: 'mapDropdown:row.grid.appScope.cuentasContablesLista:"cuenta":"descripcion"',

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'suspendida',
            field: 'suspendida',
            displayName: 'Susp',
            width: 70,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]


    $scope.deleteItem = function (item) {
        item.docState = 3;
    }

    $scope.nuevo = function () {
        $scope.cuentasBancarias.push({
            _id: new Mongo.ObjectID()._str,
            cia: $scope.companiaSeleccionada._id,
            docState: 1
        });
    }

    $scope.save = function () {

        $scope.showProgress = true;

        var editedItems = lodash.filter($scope.cuentasBancarias, function (item) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar en el servidor
        var isValid = false;
        var errores = [];

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = CuentasBancarias.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    CuentasBancarias.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + CuentasBancarias.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'." as never);
                    })
                }
            }
        })

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                    errores.reduce(function (previous, current) {
                        if (previous == "")
                            // first value
                            return current;
                        else
                            return previous + "<br />" + current;
                    }, "")
            })

            $scope.showProgress = false;
            return;
        }

        // para 'refrescar' el helper y el grid cuando se ingresar (nuevos) items ....
        $scope.cuentasBancarias = [];
        $scope.cuentasBancarias_ui_grid.data = [];

        Meteor.call('cuentasBancariasSave', editedItems, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result
            });

            // para 'refrescar' el helper y el grid cuando se ingresar (nuevos) items ....
            $scope.helpers({
                cuentasBancarias: () => {
                    // las cuenas bancarias se registran para la cia seleccionada
                    return CuentasBancarias.find({ cia: $scope.companiaSeleccionada._id });
                },
            })

            $scope.cuentasBancarias_ui_grid.data = $scope.cuentasBancarias;

            $scope.showProgress = false;
            $scope.$apply();
        })
    }

    $scope.cuentasBancarias_ui_grid.data = $scope.cuentasBancarias;

    $scope.showProgress = true;

    // ---------------------------------------------------------
    // subscriptions ...
    Meteor.subscribe('cuentasContablesSoloDetalles', () => { 

        $scope.helpers({
            cuentasContables: () => {
                return CuentasContables.find({ cia: companiaSeleccionadaDoc._id }, { sort: { cuenta: 1 } });
            },
        })

        // preparamos una lista de cuentas, que permita mostrar en el ddl en el ui-grid, 'cuenta-desc' en vez de 
        // solo descripción 
        $scope.cuentasContablesLista = $scope.cuentasContables.map((c) => { 
            return { 
                cuenta: c.cuenta, 
                descripcion: `${c.cuenta} - ${c.descripcion}`
            }
        })

        $scope.cuentasBancarias_ui_grid.columnDefs[6].editDropdownOptionsArray = $scope.cuentasContablesLista; 

        $scope.showProgress = false;
        $scope.$apply();
    })
  }
])
