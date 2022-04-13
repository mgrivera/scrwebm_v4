
import { Meteor } from 'meteor/meteor'

import angular from 'angular'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { ReconversionMonetaria_log } from '/imports/collections/otros/reconversionMonetaria_log'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebm").controller("Utilitarios_Reconversion_Controller", ['$scope', '$uibModal', function ($scope, $uibModal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
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
    // ------------------------------------------------------------------------------------------------

    const monedaDefault = Monedas.findOne({ defecto: true }); 

    if (!monedaDefault) { 

        let message = `Error: no hemos encontrado una moneda marcada como 'defecto'. <br /> 
                       Esta moneda debe existir pues será la moneda para la cual se efectuará la reconversión. <br /> <br /> 
                       Por favor abra la tabla Monedas y marque una como 'defecto'.
        `; 

        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'danger',
            msg: message
        });

        $scope.showProgress = false;
        return;
    }

    $scope.moneda = monedaDefault; 

    let reconversionItem_seleccionado = null; 

    $scope.reconversionMonetaria_ui_grid = {
        enableSorting: true,
        enableFiltering: false,
        showGridFooter: true, 
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                reconversionItem_seleccionado = {};
                
                if (row.isSelected) {
                    reconversionItem_seleccionado = row.entity;

                    DialogModal($uibModal, "<em>Reconversión monetaria</em>", reconversionItem_seleccionado.descripcion, false);
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

    $scope.reconversionMonetaria_ui_grid.columnDefs = [
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            cellFilter: 'dateFilter',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            type: 'date'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 500,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        }, 
        {
            name: 'cantidadDigitos',
            field: 'cantidadDigitos',
            displayName: 'Cant dígitos',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        }, 
        {
            name: 'user',
            field: 'user',
            displayName: 'Usuario',
            width: 80,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        }, 
    ]


    $scope.showProgress = true;

    $scope.parametros = {}; 
    $scope.submitted = false;

    $scope.forms = {};

    $scope.reconversionForm_submit = function () {

        $scope.submitted = true;
        $scope.alerts.length = 0;

        if (!monedaDefault) {

            let message = `Error: no hemos encontrado una moneda marcada como 'defecto'. <br /> 
                           Esta moneda debe existir pues será la moneda para la cual se efectuará la reconversión. <br /><br /> 
                           Por favor abra la tabla Monedas y marque una como 'defecto'.
            `; 

            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });

            return;
        }

        if (!$scope.parametros.cantidadDigitos) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Ud. debe indicar los valores requeridos para el la ejecución de la reconversión."
            });

            return;
        }

        $scope.showProgress = true; 

        if ($scope.forms.reconversionForm.$valid) {

            $scope.submitted = false;
            $scope.forms.reconversionForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            Meteor.call('reconversionMonetaria', monedaDefault, $scope.parametros, $scope.companiaSeleccionada, (err, result) => {

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
    
                    return;
                }
    
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                })
    
                reconversionSubscribe($scope, $scope.companiaSeleccionada); 
            })
        }
    }

    $scope.reconversionRemesasForm_submit = function () {

        $scope.submitted = true;
        $scope.alerts.length = 0;

        if (!monedaDefault) {

            let message = `Error: no hemos encontrado una moneda marcada como 'defecto'. <br /> 
                           Esta moneda debe existir pues será la moneda para la cual se efectuará la reconversión. <br /><br /> 
                           Por favor abra la tabla Monedas y marque una como 'defecto'.
            `; 

            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });

            return;
        }

        if (!$scope.parametros.cantidadDigitos) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Ud. debe indicar los valores requeridos para el la ejecución de la reconversión."
            });

            return;
        }

        $scope.showProgress = true; 

        if ($scope.forms.reconversionRemesasForm.$valid) {

            $scope.submitted = false;
            $scope.forms.reconversionRemesasForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            Meteor.call('reconversionMonetaria_Remesas', monedaDefault, $scope.parametros, $scope.companiaSeleccionada, (err, result) => {

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
    
                    return;
                }
    
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                })
    
                reconversionSubscribe($scope, $scope.companiaSeleccionada); 
            })
        }
    }

    reconversionSubscribe($scope, $scope.companiaSeleccionada); 
  }
])

function reconversionSubscribe($scope, companiaSeleccionada) { 

    Meteor.subscribe('reconversionMonetaria_log', () => {

        $scope.helpers({
            reconversionMonetaria_log: () => { return ReconversionMonetaria_log.find({ cia: companiaSeleccionada._id, }); },
        })

        $scope.reconversionMonetaria_ui_grid.data = []; 
        $scope.reconversionMonetaria_ui_grid.data = $scope.reconversionMonetaria_log; 

        $scope.showProgress = false;
        $scope.$apply();
    })
}
