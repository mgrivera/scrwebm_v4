

import lodash from 'lodash'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller('RegistroDocumentosController',
['$scope', '$modalInstance', '$modal', 'entidad', 'documentos', 'tiposDocumentoLista',
function ($scope, $modalInstance, $modal, entidad, documentos, tiposDocumentoLista) {

    $scope.documentos = documentos;
    $scope.tiposDocumento = tiposDocumentoLista;


    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    // --------------------------------------------------------------------------------------
    // ui-grid de Documentos
    // --------------------------------------------------------------------------------------
    var documentoSeleccionado = {};

    $scope.documentos_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                documentoSeleccionado = {};

                if (row.isSelected)
                    documentoSeleccionado = row.entity;
                else
                    return;
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!entidad.docState) { 
                        entidad.docState = 2;
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

    $scope.documentos_ui_grid.columnDefs = [
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: 180,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposDocumento,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposDocumento:"tipo":"descripcion"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'string'
        },
          {
              name: 'numero',
              field: 'numero',
              displayName: 'Número',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              width: 200,
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'string'
          }
    ]


    $scope.agregarDocumento = function () {

        if (!lodash.isArray($scope.documentos)) { 
            $scope.documentos = [];
        }
            
        var documento = {};

        documento._id = new Mongo.ObjectID()._str;
        $scope.documentos.push(documento);

        $scope.documentos_ui_grid.data = $scope.documentos;

        if (!entidad.docState) { 
            entidad.docState = 2;
        }   
    }


    $scope.eliminarDocumento = function () {

        if (documentoSeleccionado && !lodash.isEmpty(documentoSeleccionado)) {
            lodash.remove(documentos, function (doc) { return doc._id === documentoSeleccionado._id; });

            if (!entidad.docState) { 
                entidad.docState = 2;
            }
        }
        else {
            DialogModal($modal, "<em>Registro de documentos</em>",
                        "Ud. debe seleccionar un documento antes de intentar eliminarlo.",
                        false).then();
            return;
        }
    }

    if (lodash.isArray($scope.documentos)) { 
        $scope.documentos_ui_grid.data = $scope.documentos;
    }
}
])
