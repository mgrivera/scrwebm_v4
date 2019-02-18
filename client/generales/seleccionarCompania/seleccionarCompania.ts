

import * as angular from 'angular'; 
import * as lodash from 'lodash';

import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from 'client/imports/generales/angularGenericModal'; 

// importamos el module generales, pues está en  imports ... 
import scrwebmGenerales from 'client/imports/generales/generalesAngularModule'; 

angular.module(scrwebmGenerales.name).controller("SeleccionarCompaniaController", ['$scope', '$modal',
    function ($scope, $modal) {

        $scope.showProgress = false;

        // ui-bootstrap alerts ...
        $scope.alerts = [];

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        let companiaSeleccionada: any = {};

        $scope.seleccionarCompania_ui_grid = {
            enableSorting: false,
            showColumnFooter: false,
            enableRowSelection: true,
            enableRowHeaderSelection: true,
            multiSelect: false,
            enableSelectAll: false,
            selectionRowHeaderWidth: 35,
            rowHeight: 25,
            onRegisterApi: function (gridApi) {

                // guardamos el row que el usuario seleccione
                gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                    //debugger;
                    companiaSeleccionada = {};

                    if (row.isSelected)
                        companiaSeleccionada = row.entity;
                    else
                        return;
                });
            }
        };

        $scope.seleccionarCompania_ui_grid.columnDefs = [
            {
                name: 'nombre',
                field: 'nombre',
                displayName: 'Compañía',
                width: 300,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: false,
                type: 'string'
            }
        ];

        // las empresasUsuarias y compañía seleccionada ya están en miniMongo ...
        $scope.helpers({
            empresasUsuarias: () => {
                return EmpresasUsuarias.find({}, { sort: { nombre: 1 } });
            },
        });

        $scope.seleccionarCompania_ui_grid.data = $scope.empresasUsuarias;

        let ciaSeleccionadaAntes = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

        if (ciaSeleccionadaAntes && ciaSeleccionadaAntes.companiaID) {
            // el usuario ya tenía una compañía seleccionada; lo indicamos ...
            $scope.empresasUsuarias.forEach(function (compania, index) {
                if (compania._id == ciaSeleccionadaAntes.companiaID) {
                    //$scope.gridOptions.selectRow(2, true);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: "La compañía <b><em>" + compania.nombre + "</em></b> está ahora seleccionada."
                    });
                }
            });
        };


        $scope.seleccionarCompania = function () {
            if (!companiaSeleccionada || lodash.isEmpty(companiaSeleccionada)) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Ud. debe seleccionar una compañía en la lista.<br />" +
                        "Aparentemente, Ud. no ha seleccionado aún una compañía en la lista."
                });
            }
            else {

                // eliminamos cualquier cia seleccionada que pueda tener ahora el usuario
                // debería ser una sola; sin embargo, por si acaso, intentamos eliminar más de una .. 
                var companiasAhoraSeleccionadas = CompaniaSeleccionada.find({ userID: Meteor.userId() }).fetch();    
                companiasAhoraSeleccionadas.forEach(function (item) {
                    CompaniaSeleccionada.remove(item._id);
                });

                if (!companiaSeleccionada.companiaNosotros) { 

                    let message = `Error: <em>la empresa usuaria</em> que Ud. ha seleccionado, no tiene asociada una compañía 
                                   como 'compañía nosotros'.<br /> 
                                   Debe tener una, pues esa es la compañía que en el catálogo de compañías representa a nuestra compañía. <br /><br />
                                   Ud. debe abrir el catálogo de empresas usuarias, y seleccionar la compañía que representa a 'nosotros', para la 
                                   empresa usuaria que Ud. ha seleccionado. 
                    `; 
                    message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: message
                    });
                }

                // con la empresa usuaria seleccionada siempre va la compañía que, en el catálogo de compañías, la representa 
                CompaniaSeleccionada.insert({ 
                    userID: Meteor.userId(), 
                    companiaID: companiaSeleccionada._id, 
                    companiaNosotros: companiaSeleccionada.companiaNosotros 
                });

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: "Ok, la compañía <b><em>" + companiaSeleccionada.nombre + "</em></b> ha sido seleccionada."
                });

                DialogModal($modal,
                    "<em>Selección de compañías</em>",
                    "Ok, la compañía <b><em>" + companiaSeleccionada.nombre + "</em></b> ha sido seleccionada.",
                    false).then();
            }
        }
    }
]);
