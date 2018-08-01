

import * as angular from 'angular';

import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos';  
import { Cumulos } from 'imports/collections/catalogos/cumulos'; 
import { TiposObjetoAsegurado } from 'imports/collections/catalogos/tiposObjetoAsegurado'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 

// TODO: ésto es solo mientras agregamos el collection de registro de cúmulos 
import { Asegurados } from 'imports/collections/catalogos/asegurados'; 

import { mensajeErrorDesdeMethod_preparar } from 'client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebM").controller('RegistroCumulos_Controller',
['$scope', '$modalInstance', 'uiGridConstants', 'infoCumulos', 'origen', 'companiaSeleccionada', 
  function ($scope, $modalInstance, uiGridConstants, infoCumulos, origen, companiaSeleccionada) {
    
    $scope.alerts = [];
    $scope.showProgress = true;

    $scope.origen = origen;             // edición o consulta 
    $scope.companiaSeleccionada = companiaSeleccionada; 

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function (infoRamo) {
        $modalInstance.close(infoRamo);
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.zonas = []; 

    $scope.setIsEdited = function(value) { 

        if (value === "cumulo") { 

            let zonas = []; 
            $scope.cumulo.zona = null; 

            if ($scope.cumulo.tipoCumulo) { 
                let cumuloSeleccionado = $scope.cumulos.find(x => x._id === $scope.cumulo.tipoCumulo); 
                if (cumuloSeleccionado) { 
                    zonas = cumuloSeleccionado.zonas; 
                }
            }

            $scope.zonas = zonas; 
        }

        if (!$scope.cumulo.docState) { 
            $scope.cumulo.docState = 2; 
        }
    }

    // ---------------------------------------------------------------------
    // ui-grid: reaseguradores
    // ----------------------------------------------------------------------
    let reaseguradorSeleccionado = {};

    $scope.reaseguradores_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        showGridFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            $scope.cuotasGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                reaseguradorSeleccionado = {};

                if (row.isSelected) { 
                    reaseguradorSeleccionado = row.entity;
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

    $scope.reaseguradores_ui_grid.columnDefs = [
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
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 200,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: $scope.companias,
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"nombre"',

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'ordenPorc',
            field: 'ordenPorc',
            displayName: 'Orden(%)',
            cellFilter: 'number6decimals',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'number6decimals',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
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

    $scope.reaseguradores_ui_grid.data = [];

    Meteor.subscribe('registroCumulos_catalogos', () => {

        $scope.helpers({
            monedas: () => { 
                return Monedas.find();  
            }, 
            companias: () => { 
                return Companias.find();  
            }, 
            ramos: () => { 
                return Ramos.find();  
            }, 
            cumulos: () => { 
                return Cumulos.find();   
            }, 
            tiposObjetoAsegurado: () => {  
                return TiposObjetoAsegurado.find();    
            }, 
            indoles: () => { 
                return Indoles.find();  
            },  
        })
        
        Meteor.subscribe('cumulos.registro', () => {

            // TODO: por ahora, vamos a traer el catálogo de asegurados; luego, debe ser el collection de 
            // registro de cúmulos 

            $scope.helpers({
                cumulo: () => { 
                    return infoCumulos;             // si no encontramos un cúmulo registrado, usamos los valores pasados al controller 
                }, 
            })
            
            $scope.alerts.length = 0;

            $scope.reaseguradores_ui_grid.columnDefs[1].editDropdownOptionsArray = $scope.companias; 

            if (infoCumulos.reaseguradores) { 
                $scope.reaseguradores_ui_grid.data = infoCumulos.reaseguradores; 
            }
    
            $scope.showProgress = false;
            $scope.$apply(); 
        })
    })
}])