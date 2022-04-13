
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'; 

import Papa from 'papaparse';
import saveAs from 'save-as'

import angular from 'angular'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import PersonasRegistro from './personasRegistroModal/angular.module'; 

import { Companias } from '/imports/collections/catalogos/companias'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

import './companias.html'; 

const exportToCsv_convertItems = (x) => {
    const compania = Object.assign({}, x); 

    delete compania._id;
    delete compania.personas;

    compania.nosotros = compania.nosotros ? 'si' : '';

    switch (compania.tipo) {
        case "SEG":
            compania.tipo = "Seguros"
            break;
        case "REA":
            compania.tipo = "Reasegurador"
            break;
        case "CORRR":
            compania.tipo = "Corredor de reaseguros"
            break;
        case "PROD":
            compania.tipo = "Productor"
            break;
        case "CORR":
            compania.tipo = "Corredor de seguros"
            break;
        case "AJUST":
            compania.tipo = "Ajustador"
            break;
        default:
            compania.tipo = "???"
    }

    return compania; 
};

export default angular.module("scrwebm.catalogos.companias", [ PersonasRegistro.name ])
                      .controller("CompaniasController", ['$scope', '$uibModal', '$timeout', 
function ($scope, $uibModal, $timeout) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.tiposCompania = [
                                { descripcion: 'Ajustador', tipo: 'AJUST' },
                                { descripcion: 'Corredor de seguros', tipo: 'CORR' },
                                { descripcion: 'Productor', tipo: 'PROD' },
                                { descripcion: 'Reasegurador', tipo: 'REA' },
                                { descripcion: 'Corredor de reaseguro', tipo: 'CORRR' },
                                { descripcion: 'Compañía de seguro', tipo: 'SEG' },
                            ];

    $scope.emailCobranzas = [
                                { descripcion: '', numero: null },
                                { descripcion: '1', numero: 1 },
                                { descripcion: '2', numero: 2 },
                                { descripcion: '3', numero: 3 },
                                { descripcion: '4', numero: 4 },
                                { descripcion: '5', numero: 5 }
                                ];

    // ------------------------------------------------------------------------------------------------------------------------
    // la siguiente variable es un toogle que permite al programa abrir un modal que permite al usuario registrar personas 
    // para la empresa  
    $scope.openPersonasModal = false;

    $scope.toogleOpenPersonasModal = function () {

        if (!$scope.companiaSeleccionada || Object.keys($scope.companiaSeleccionada).length === 0) {    // el object no debe ser empty   
            DialogModal($uibModal, "<em>Compañías - Personas</em>",
                `Aparentemente, no se ha seleccionado una compañía en la lista. <br />
                Ud. debe seleccionar una compañía en la lista antes de intentar consultar/editar sus personas.`,
                false).then();

            return;
        }

        $scope.openPersonasModal = !$scope.openPersonasModal;

        // si el usuario editó la lista de personas, marcamos para que el usuario pueda Grabar ... 
        if ($scope.companiaSeleccionada && $scope.companiaSeleccionada.personas && $scope.companiaSeleccionada.personas.length) {
            if ($scope.companiaSeleccionada.personas.some(x => x.docState)) {
                if (!$scope.companiaSeleccionada.docState) {
                    $scope.companiaSeleccionada.docState = 2;
                }
            }
        }
        
        // cuando esta función es ejecutada al cerrar el modal (react), venimos dese código 'no-angular' y angular, probablemente, 
        // no se da cuenta que el toogle se actualizó. Con el $timeout, angular siempre vuelve a ejecutar sus ciclos y 
        // se percata de los cambios hechos por el código no-angular. Normalemnte, este $timeout es una forma muy saudable 
        // de resolver este tipo de situaciones en angularjs ... 
        // Nota: nótese que el $timeout que viene no usa ni un callback ni un delay (ej: $timeout(callback(x, y), 2000)), pues 
        // no necesitamos ni un delay ni un callback; solo el efecto que tiene $timeout sobre angular ... 
        $timeout();
    }

    $scope.exportToCsv_Companias = () => {
        try {
            const companias = $scope.companias.slice();

            // eliminamos algunas propiedades que no queremos en el txt (csv) 
            const companias2 = companias.map(x => exportToCsv_convertItems(x));

            // papaparse: convertimos el array json a un string csv ...
            const config = {
                quotes: true,
                quoteChar: "'",
                delimiter: "\t",
                header: true
            };
            let csvString = Papa.unparse(companias2, config);

            // cambiamos los headers por textos más apropiados (pareciera que ésto no se puede hacer desde el config)
            csvString = csvString.replace("cuentaContable", "cuenta contable");

            var blob = new Blob([csvString], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "compañías");
        }
        catch (err) {
            const message = err.message ? err.message : err.toString();
            
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });
        }
    }

    $scope.exportToCsv_Personas = () => {
        try {
            const companias = $scope.companias.slice();

            const personas = []; 

            companias.forEach(c => { 
                if (c.personas && Array.isArray(c.personas)) { 
                    c.personas.forEach(p => { 
                        const persona = Object.assign({ compañía: c.nombre, compañíaAbrev: c.abreviatura }, p);
                        delete persona._id; 

                        personas.push(persona);
                    }); 
                }
            })

            // papaparse: convertimos el array json a un string csv ...
            const config = {
                quotes: true,
                quoteChar: "'",
                delimiter: "\t",
                header: true
            };
            let csvString = Papa.unparse(personas, config);

            // cambiamos los headers por textos más apropiados (pareciera que ésto no se puede hacer desde el config)
            csvString = csvString.replace("cuentaContable", "cuenta contable");

            var blob = new Blob([csvString], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "personas");
        }
        catch (err) {
            const message = err.message ? err.message : err.toString();

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });
        }
    }

    // -----------------------------------------------------------------
    // Grid de compañpias
    // -----------------------------------------------------------------
    let companias_ui_grid_gridApi = null; 
    $scope.companiaSeleccionada = {};

    $scope.companias_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,

        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,

        enableFiltering: true,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            companias_ui_grid_gridApi = gridApi; 

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                $scope.companiaSeleccionada = {};

                if (row.isSelected) {
                    $scope.companiaSeleccionada = row.entity;

                    // debe haber un array de personas 
                    if (!$scope.companiaSeleccionada.personas) { 
                        $scope.companiaSeleccionada.personas = []; 
                    }
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
    };

    $scope.companias_ui_grid.columnDefs = [
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
            enableFiltering: false, 
            width: 25
        },
        {
            name: 'nombre',
            field: 'nombre',
            displayName: 'Nombre',
            width: 230,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: 130,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposCompania:"tipo":"descripcion"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'nosotros',
            field: 'nosotros',
            displayName: 'Nosotros',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellTemplate:
                '<input type="checkbox" ng-model="row.entity[col.field]" ng-disabled="true" style="font: xx-small; " />',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: false,
            type: 'boolean'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteCompania(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false,
            width: 25
        }
    ];

    $scope.deleteCompania = (item) => {
        item.docState = 3;
    };

    $scope.nuevo = () => {
        const compania = {
            _id: new Mongo.ObjectID()._str,
            nosotros: false,
            docState: 1 };

        $scope.companias.push(compania);
        $scope.companiaSeleccionada = compania;
    };

    $scope.setIsEdited = (compania) => {
        if (!compania.docState)
            compania.docState = 2;
    };

    $scope.showProgress = true;

    // ---------------------------------------------------------
    Meteor.subscribe('companias', () => { 
    
        $scope.helpers({
            companias: () => {
                return Companias.find({}, { sort: { nombre: 1 } });
            },
        });

        $scope.companias_ui_grid.data = $scope.companias;
        $scope.showProgress = false;
    });

    $scope.save = () => {
        $scope.showProgress = true;

        const editedItems0 = $scope.companias.filter(x => x.docState);      // solo items que se han editado 
        const editedItems = [... editedItems0 ];                            // clone array 

        // nótese como validamos cada item antes de intentar guardar en el servidor
        let isValid = false;
        const errores = [];

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = Companias.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    Companias.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + ".");
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

        Meteor.call('companiasSave', editedItems, (err, result)  => {

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
                const errorMessage = result.message;

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
                msg: result.message
            });

            $scope.helpers({
                companias: () => {
                    return Companias.find({}, { sort: { nombre: 1 } });
                },
            });

            $scope.companias_ui_grid.data = [];
            $scope.companias_ui_grid.data = $scope.companias;

            companias_ui_grid_gridApi.selection.clearSelectedRows(); 
            $scope.companiaSeleccionada = null; 
            
            $scope.showProgress = false;
            $scope.$apply();
        })
    }
}])

// ---------------------------------------------------------------------------------------
// para regresar el nombre del tipo
// ---------------------------------------------------------------------------------------
angular.module("scrwebm.catalogos.companias").filter('tipoCompania', function () {
    return function (value) {

        if (!value) {
            return 'Indefinido';
        }

        let nombreTipo = '';

        switch (value) {
            case 'AJUST':
                nombreTipo = "Ajustador";
                break;
            case 'CORR':
                nombreTipo = "Corredor seg";
                break;
            case 'PROD':
                nombreTipo = "Productor";
                break;
            case 'REA':
                nombreTipo = "Reasegurador";
                break;
            case 'CORRR':
                nombreTipo = "Corredor reaseg";
                break;
            case 'SEG':
                nombreTipo = "Asegurador";
                break;
            default:
                nombreTipo = "Indefinido";
        }

        return nombreTipo;
    }
})