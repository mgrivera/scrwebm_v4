

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { CuentasContables } from '/imports/collections/catalogos/cuentasContables';
import { CuentasContablesAsociadas } from '/imports/collections/catalogos/cuentasContablesAsociadas';
import { Monedas } from '/imports/collections/catalogos/monedas';
import { Companias } from '/imports/collections/catalogos/companias';  

import lodash from 'lodash'; 

angular.module("scrwebM").controller("CuentasContablesAsociadas_Controller", ['$scope', '$stateParams', '$modal',
  function ($scope, $stateParams, $modal) {

    $scope.showProgress = false;

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
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1, abreviatura: 1, } });
    }


    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) {
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }
    else {
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    $scope.helpers({
        monedas: () => {
                return Monedas.find({}, { sort: { simbolo: 1, }});
            },
        companias: () => { 
            return Companias.find({}, { sort: { abreviatura: 1, }});
        }
    })

    $scope.tiposCuentaContable = [ 
        { tipo: 10, descripcion: "Transitoria", }, 
        { tipo: 30, descripcion: "Primas por cobrar", }, 
        { tipo: 50, descripcion: "Primas por pagar", }, 
        { tipo: 60, descripcion: "Siniestros por cobrar", }, 
        { tipo: 70, descripcion: "Siniestros por pagar", }, 
        { tipo: 90, descripcion: "Corretaje", }, 
        { tipo: 100, descripcion: "Diferencia en la remesa", }, 
    ]

    $scope.origenes = [ 
        { origen: "fac", descripcion: "Facultativo", }, 
        { origen: "sinFac", descripcion: "Siniestros (fac)", }, 
        { origen: "cuenta", descripcion: "Contratos prop", }, 
        { origen: "capa", descripcion: "Contratos no prop", }, 
    ]

    $scope.cuentasContablesAsociadas_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true, 
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {
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

    $scope.cuentasContablesAsociadas_ui_grid.columnDefs = [
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
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo de cuenta',
            width: 120,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposCuentaContable,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposCuentaContable:"tipo":"descripcion"',

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Moneda',
            width: 80,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'abreviatura',
            editDropdownOptionsArray: $scope.companias,
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"abreviatura"',

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'origen',
            field: 'origen',
            displayName: 'Origen',
            width: 120,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'origen',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.origenes,
            cellFilter: 'mapDropdown:row.grid.appScope.origenes:"origen":"descripcion"',

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
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]

    $scope.showProgress = true;
    let cuentasContablesAsociadas_subscriptionHandle = {};

    // ---------------------------------------------------------
    // subscriptions ...
    cuentasContablesAsociadas_subscriptionHandle =
    Meteor.subscribe('cuentasContablesAsociadas', () => {

    Meteor.subscribe('cuentasContablesSoloDetalles', () => { 

        $scope.helpers({
            cuentasContablesAsociadas: () => {
                return CuentasContablesAsociadas.find({ cia: companiaSeleccionadaDoc._id }, { sort: { cuentaContable: 1 } });
            },
            cuentasContables: () => {
                return CuentasContables.find({ cia: companiaSeleccionadaDoc._id, totDet: "D",  }, { sort: { cuenta: 1 } });
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

        $scope.cuentasContablesAsociadas_ui_grid.columnDefs[5].editDropdownOptionsArray = $scope.cuentasContablesLista; 
        $scope.cuentasContablesAsociadas_ui_grid.data = $scope.cuentasContablesAsociadas;

        $scope.showProgress = false;
        $scope.$apply();
    })
    })
    // ---------------------------------------------------------

    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.cuentasContablesAsociadas, (x) => { return x._id === item._id; });
        }
        else if (item.docState && item.docState === 3) {
            // permitimos hacer un 'undelete' de un item que antes se había eliminado en la lista (antes de grabar) ...
            delete item.docState;
        }
        else {
            item.docState = 3;
        }
    }

    $scope.nuevo = function () {
        $scope.cuentasContablesAsociadas.push({
            _id: new Mongo.ObjectID()._str,
            cia: companiaSeleccionadaDoc._id,
            docState: 1
        });
    }


    $scope.save = function () {
        $scope.showProgress = true;

        var editedItems = lodash.filter($scope.cuentasContablesAsociadas, function (item) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar en el servidor
        var isValid = false;
        var errores = [];

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = CuentasContablesAsociadas.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                CuentasContablesAsociadas.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + CuentasContablesAsociadas.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
                    });
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
            });

            $scope.showProgress = false;
            return;
        }

        // eliminamos la conexión entre angular y meteor
        $scope.cuentasContablesAsociadas_ui_grid.data = [];
        $scope.cuentasContablesAsociadas = [];

        Meteor.call('cuentasContablesAsociadas.save', editedItems, (err, result) => {

        if (err) {
            let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

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

        $scope.helpers({
            cuentasContablesAsociadas: () => {
                return CuentasContablesAsociadas.find({ cia: companiaSeleccionadaDoc._id }, { sort: { cuentaContable: 1 } });
            },
        })

        $scope.cuentasContablesAsociadas_ui_grid.data = $scope.cuentasContablesAsociadas;

        $scope.showProgress = false;
        $scope.$apply();
        })
    }
}
]);
