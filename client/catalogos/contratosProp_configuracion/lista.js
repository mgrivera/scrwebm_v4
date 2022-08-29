
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

import angular from 'angular'; 
import lodash from 'lodash'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { userHasRole } from '/client/imports/generales/userHasRole';

import { ContratosProp_Configuracion_ListaCodigos } from '/imports/collections/catalogos/ContratosProp_Configuracion'; 
import { ContProp_tablaConf } from '/client/lib/forerunnerDB'; 

angular.module("scrwebm")
       .controller("ContratosProp_Configuracion_Lista_Controller", ['$scope', '$state', '$uibModal', 
function ($scope, $state, $uibModal) {

    // para permitir editar la tabla en base a los roles asignados al usuario 
    $scope.catalogosEditar = userHasRole('catalogos') ||
                             userHasRole('catalogos_contratos') ? true : false;
    
    $scope.showProgress = true;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // leemos la compañía seleccionada
    const companiaSeleccionada = $scope.$parent.companiaSeleccionada;

    // limpiamos la tabla en frDB que nos permite pasar los registros entre states 
    ContProp_tablaConf.remove({ tipo: 'reg conf', user: Meteor.userId(), }); 

    // ejecutamos un método que lea los códigos de contrato que se han registrado y los regrese en una lista ...
    Meteor.call('contratosProporcionales.configuracion.leerCodigosContrato', companiaSeleccionada._id, (err, result)  => {

        if (err) {
            const errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

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
        } else {
            const codigosContato_list = JSON.parse(result);

            // ahora que tenemos la lista, la asociamos a la columna en el ui-grid, para que la muestre
            // como lista en el ddl ...
            $scope.codigosContrato_ui_grid.columnDefs[1].editDropdownOptionsArray = lodash.sortBy(codigosContato_list, ["codigo"]);

            $scope.showProgress = false;
            $scope.$apply();
            return;
        }
    })

    let itemSeleccionado = {};

    $scope.codigosContrato_ui_grid = {
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

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado = {};

                if (row.isSelected)
                    itemSeleccionado = row.entity;
                else
                    return;
            });
            // marcamos el item como actualizado cuando el usuario edita un valor
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
        },
    }

    $scope.codigosContrato_ui_grid.columnDefs = [
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
            name: 'codigo',
            field: 'codigo',
            displayName: 'Código de contrato',
            width: 250,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'codigo',
            editDropdownValueLabel: 'codigo',
            editDropdownOptionsArray: [],
            // no necesitamos un cellFilter pues el id y descripción son el mismo en esta lista
            // cellFilter: 'mapDropdown:row.grid.appScope.monedas:"codigo":"codigo"',
            enableColumnMenu: false,
            enableCellEdit: true,
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

    $scope.deleteItem = function (item) {
        item.docState = 3;
    };

    $scope.nuevo = function () {
        $scope.contratosProp_configuracion_listaCodigos.push({
            _id: new Mongo.ObjectID()._str,
            cia: companiaSeleccionada._id,
            docState: 1
        });
    };

    let subscriptionHandle = null; 

    $scope.save = function () {
            $scope.showProgress = true;

            const editedItems = lodash.filter($scope.contratosProp_configuracion_listaCodigos,
                                    function (item) { return item.docState; });

            // nótese como validamos cada item antes de intentar guardar (en el servidor)
            let isValid = false;
            const errores = [];

            editedItems.forEach((item) => {
                if (item.docState != 3) {
                    isValid = ContratosProp_Configuracion_ListaCodigos.simpleSchema().namedContext().validate(item);

                    if (!isValid) {
                        ContratosProp_Configuracion_ListaCodigos.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                            errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + ContratosProp_Configuracion_ListaCodigos.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                        });
                    }
                }
            });

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

            Meteor.call('contratosProp_configuracion_listaCodigos_Save', editedItems, function (error, result) {

                if (error) {

                    const errorMessage = mensajeErrorDesdeMethod_preparar(error);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
                // se queda el '*' para registros nuevos en el ui-grid ...
                $scope.contratosProp_configuracion_listaCodigos = [];
                $scope.codigosContrato_ui_grid.data = [];
                itemSeleccionado = {};

                $scope.showProgress = true;

                // si se efectuó un subscription al collection antes, la detenemos ...
                if (subscriptionHandle && subscriptionHandle.stop) {
                    subscriptionHandle.stop();
                }

                subscriptionHandle = 
                Meteor.subscribe('contratosProp.configuracion.listaCodigos', companiaSeleccionada._id, () => {

                    $scope.helpers({
                        contratosProp_configuracion_listaCodigos: () => {
                            return ContratosProp_Configuracion_ListaCodigos.find({ cia: companiaSeleccionada._id });
                        },
                    });

                    $scope.codigosContrato_ui_grid.data = $scope.contratosProp_configuracion_listaCodigos;

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: result
                    });

                    $scope.showProgress = false;
                    $scope.$apply();
                })
            })
    }

    $scope.showProgress = true;

    // si se efectuó un subscription al collection antes, la detenemos ...
    if (subscriptionHandle && subscriptionHandle.stop) {
        subscriptionHandle.stop();
    }

    subscriptionHandle = 
    Meteor.subscribe('contratosProp.configuracion.listaCodigos', companiaSeleccionada._id, () => {

        $scope.helpers({
            contratosProp_configuracion_listaCodigos: () => {
                return ContratosProp_Configuracion_ListaCodigos
                            .find({ cia: companiaSeleccionada._id }, { sort: { codigo: 1, }});
            },
        });

        $scope.codigosContrato_ui_grid.data = $scope.contratosProp_configuracion_listaCodigos;

        $scope.showProgress = false;
        $scope.$apply();
    })

    $scope.leerTablaConfiguracionContrato = () => {
        if (!itemSeleccionado || lodash.isEmpty(itemSeleccionado)) {
            DialogModal($uibModal,
                    "<em>Contratos - Configuración de contratos proporcionales</em>",
                    `Ud. debe seleccionar un código de contrato en la lista.`,
                    false);
            return;
        }

        if (itemSeleccionado.docState) {
            
            const message = `Aparentemente, el registro ha recibido modificaciones que no se han guardado aún.<br />
            Ud. debe guardar los cambios efectuados en la lista antes de continuar con esta función.
            `; 

            DialogModal($uibModal, "<em>Contratos - Configuración de contratos proporcionales</em>", message, false);
            return;
        }

        $state.go("catalogos.contrProp_configuracion.contratosListaProp_configuracion_tabla",
                { codigoContrato: itemSeleccionado.codigo });
    }

    $scope.$on('$destroy', function () {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }
    })
}])