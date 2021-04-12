
import angular from 'angular';
import lodash from 'lodash'; 

import { Companias } from '/imports/collections/catalogos/companias'; 
import './registrarPersonas.html'; 

export default angular.module("scrwebm.generales.registrarPersonasAEntidad", [])
                      .controller('RegistrarPersonasController', ['$scope', '$modalInstance', 'companias',
function ($scope, $modalInstance, companias) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss({ companias: companias, entityUpdated: entityUpdated });
    };

    // para usarlas en el filtro de compañías en el grid ...
    $scope.companiasLista = Companias.find().fetch();

    // leemos las personas registradas para las compañías en el movimiento
    // la idea es que el usuario pueda seleccionarlas en una lista ...

    var personasRegistradas = leerPersonasRegistradasParaCompanias(companias);

    // --------------------------------------------------------------------------------------
    // ui-grid de Compañías y sus personas (para seleccionar la persona y asignar a la
    // compañía del movimiento)
    // --------------------------------------------------------------------------------------
    let personaSeleccionada = {};
    let entityUpdated = false;

    $scope.personasRegistradas_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
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
                personaSeleccionada = {};

                if (row.isSelected) {
                    // TODO: buscar la compañía en el array de compañías del movimiento y
                    // asignar la persona (título y nombre)
                    personaSeleccionada = row.entity;

                    // buscamos la compañía en la 2da. lista y actualizamos su título y nombre
                    const companiaSeleccionada = companias.find(c => c.compania === personaSeleccionada.compania);

                    if (companiaSeleccionada) {
                        companiaSeleccionada.titulo = personaSeleccionada.titulo;
                        companiaSeleccionada.nombre = personaSeleccionada.nombre;

                        entityUpdated = true;
                    }
                }
                else
                    return;
            });
        }
    }

    $scope.personasRegistradas_ui_grid.columnDefs = [
          {
              name: 'compania',
              field: 'compania',
              displayName: 'Compañía',
              width: 100,
              cellFilter: 'mapDropdown:row.grid.appScope.companiasLista:"_id":"abreviatura"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              type: 'string'
          },
          {
              name: 'titulo',
              field: 'titulo',
              displayName: 'Título',
              width: 80,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              type: 'string'
          },
          {
              name: 'nombre',
              field: 'nombre',
              displayName: 'Nombre',
              width: 180,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              type: 'string'
          },
    ]

    // --------------------------------------------------------------------------------------
    // ui-grid de personas para las compañías del movimiento seleccionado
    // --------------------------------------------------------------------------------------
    $scope.personas_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {
            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    entityUpdated = true;
            });
        }
    }

    $scope.personas_ui_grid.columnDefs = [
          {
              name: 'compania',
              field: 'compania',
              displayName: 'Compañía',
              width: 100,
              cellFilter: 'mapDropdown:row.grid.appScope.companiasLista:"_id":"abreviatura"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              type: 'string'
          },
          {
              name: 'titulo',
              field: 'titulo',
              displayName: 'Título',
              width: 80,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'string'
          },
          {
              name: 'nombre',
              field: 'nombre',
              displayName: 'Nombre',
              width: 180,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              type: 'string'
          },
          {
              name: 'delButton',
              displayName: '',
              cellTemplate: '<span ng-click="grid.appScope.eliminarPersona(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              cellClass: 'ui-grid-centerCell',
              enableCellEdit: false,
              enableSorting: false,
              width: 25
          }
    ]

    $scope.eliminarPersona = function(item) {
        lodash.remove(companias, function(x) { return x == item; });

        entityUpdated = true;
    };

    $scope.personasRegistradas_ui_grid.data = personasRegistradas;
    $scope.personas_ui_grid.data = companias;
}])

function leerPersonasRegistradasParaCompanias(companias) {
    // recuérdese que el catálogo de compañías (y todos) siempre están completos en el cliente

    var personasRegistradas = [];

    companias.forEach(function(c) {
        // leemos la compañía en el catálogo de compañías y grabamos sus personas en el array
        var compania = Companias.findOne({ _id: c.compania });

        if (compania && compania.personas) {
            compania.personas.forEach(function(p) {
                personasRegistradas.push({
                    compania: compania._id,
                    titulo: p.titulo,
                    nombre: p.nombre
                });
            });
        }
    });

    return personasRegistradas;
}