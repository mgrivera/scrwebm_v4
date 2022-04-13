
import angular from 'angular';
import { Mongo } from 'meteor/mongo';

import { Companias } from '/imports/collections/catalogos/companias'; 
import './registrarPersonas.html'; 

export default angular.module("scrwebm.generales.registrarPersonasAEntidad", [])
                      .controller('RegistrarPersonasController', ['$scope', '$uibModalInstance', 'companias', 'personas',
function ($scope, $uibModalInstance, companias, personas) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $uibModalInstance.close({ personas: personasRegistradasEnLaEntidad });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    // para usarlas en el filtro de compañías en el grid ...
    $scope.companiasLista = Companias.find().fetch();

    // leemos las personas registradas para las compañías en el movimiento
    // la idea es que el usuario pueda seleccionarlas en una lista ...
    const personasRegistradasEnLasCompanias = leerCompaniasYSusPersonas(companias);
    const personasRegistradasEnLaEntidad = leerPersonasAsociadasALaEntidad(personas);

    // --------------------------------------------------------------------------------------
    // ui-grid de Compañías y sus personas (para seleccionar la persona y asignar a la
    // compañía del movimiento)
    // --------------------------------------------------------------------------------------
    let personaSeleccionada = {};

    $scope.personasRegistradasEnLasCompanias_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                personaSeleccionada = {};

                if (row.isSelected) {
                    // TODO: buscar la compañía en el array de compañías del movimiento y
                    // asignar la persona (título y nombre)
                    personaSeleccionada = row.entity;

                    // buscamos la compañía y persona en la 2da lista; si existe, la actualizamos; si no, la agregamos
                    const personaEnLaEntidad = personasRegistradasEnLaEntidad.find(p => {
                        return (p.compania === personaSeleccionada.companiaId && p.persona === personaSeleccionada.personaId) });

                    if (!personaEnLaEntidad) {

                        const persona = { 
                            docState: 1, 
                            _id: new Mongo.ObjectID()._str,
                            compania: personaSeleccionada.companiaId, 
                            persona: personaSeleccionada.personaId, 
                            titulo: personaSeleccionada.titulo,
                            nombre: personaSeleccionada.nombre
                        }

                        personasRegistradasEnLaEntidad.push(persona);
                    } else { 
                        personaEnLaEntidad.docState = 2;
                        personaEnLaEntidad.titulo = personaSeleccionada.titulo;
                        personaEnLaEntidad.nombre = personaSeleccionada.nombre;
                    }
                }
                else
                    return;
            });
        }, 
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row (y es único) ...
        rowIdentity: function (row) {
            return row.personaId;     // cada persona tiene un id en el array de personas que preparamos justo para este grid 
        },
        getRowIdentity: function (row) {
            return row.personaId;
        }
    }

    $scope.personasRegistradasEnLasCompanias_ui_grid.columnDefs = [
        {
            name: 'companiaId',
            field: 'companiaId',
            displayName: 'Compañía',
            width: 100,
            cellFilter: 'mapDropdown:row.grid.appScope.companiasLista:"_id":"abreviatura"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'titulo',
            field: 'titulo',
            displayName: 'Título',
            width: 60,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableSorting: true,
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'nombre',
            field: 'nombre',
            displayName: 'Nombre',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableSorting: true,
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'cargo',
            field: 'cargo',
            displayName: 'Cargo',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableSorting: true,
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'departamento',
            field: 'departamento',
            displayName: 'Departamento',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'email',
            field: 'email',
            displayName: 'Email',
            width: 180,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        }
    ]

    // --------------------------------------------------------------------------------------
    // ui-grid de personas para las compañías del movimiento seleccionado
    // --------------------------------------------------------------------------------------
    $scope.personasRegistradasEnLaEntidad_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function () {
        }, 
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row (y es único) ...
        rowIdentity: function (row) {
            return row.persona;     // en la entidad, 'persona' es el id de cada persona en el array de personas 
        },
        getRowIdentity: function (row) {
            return row.persona;
        }
    }

    $scope.personasRegistradasEnLaEntidad_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
                '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: false,
            enableFiltering: false,
            width: 25
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,
            cellFilter: 'mapDropdown:row.grid.appScope.companiasLista:"_id":"abreviatura"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableSorting: true,
            enableColumnMenu: false,
            type: 'string'
        },
        {
            name: 'titulo',
            field: 'titulo',
            displayName: 'Título',
            width: 60,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'nombre',
            field: 'nombre',
            displayName: 'Nombre',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.eliminarPersona(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            width: 25
        }
    ]

    $scope.eliminarPersona = function(item) {
        const persona = personasRegistradasEnLaEntidad.find(x => x === item);      // esto siempre debe ocurrir 

        if (persona) { 
            persona.docState = 3; 
        }
    };

    $scope.personasRegistradasEnLasCompanias_ui_grid.data = personasRegistradasEnLasCompanias;
    $scope.personasRegistradasEnLaEntidad_ui_grid.data = personasRegistradasEnLaEntidad;
}])

function leerCompaniasYSusPersonas(companias) {
    // recuérdese que el catálogo de compañías (y todos) siempre están completos en el cliente

    var personasRegistradas = [];

    companias.forEach(function(c) {
        // leemos la compañía en el catálogo de compañías y grabamos sus personas en el array
        const compania = Companias.findOne({ _id: c });

        if (compania && compania.personas) {
            compania.personas.forEach(function(p) {
                personasRegistradas.push({
                    companiaId: c,
                    personaId: p._id, 
                    titulo: p.titulo,
                    nombre: p.nombre, 
                    cargo: p.cargo ? p.cargo : '', 
                    departamento: p.departamento ? p.departamento : '', 
                    email: p.email ? p.email : ''
                });
            });
        }
    });

    return personasRegistradas;
}

const leerPersonasAsociadasALaEntidad = (personas) => { 

    // leemos las personas que se han agregado a las compañías que usa la entidad (riesgo, contrato, siniestro) 
    // esta función recibe un array de compañías (sus ids) y lee las personas que se han definido para las mismas 
    // la idea es que el usuario pueda seleccionar de esta lista de personas las que quiere asociar a la entidad 
    const personasEnLaEntidad = []; 

    personas.forEach(p => personasEnLaEntidad.push(p)); 

    return personasEnLaEntidad;
}