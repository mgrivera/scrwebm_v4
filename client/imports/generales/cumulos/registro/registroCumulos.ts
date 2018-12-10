

import * as angular from 'angular';
import * as lodash from 'lodash'; 

import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos';  
import { Cumulos } from 'imports/collections/catalogos/cumulos'; 
import { TiposObjetoAsegurado } from 'imports/collections/catalogos/tiposObjetoAsegurado'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 
import { Cumulos_Registro } from 'imports/collections/principales/cumulos_registro'; 

import { mensajeErrorDesdeMethod_preparar } from '../../mensajeDeErrorDesdeMethodPreparar'; 
import { DialogModal } from '../../angularGenericModal'; 

angular.module("scrwebm").controller('RegistroCumulos_Controller',
['$scope', '$modalInstance', 'uiGridConstants', 'infoCumulos', 'origen', 'companiaSeleccionada', '$modal', 
  function ($scope, $modalInstance, uiGridConstants, infoCumulos, origen, companiaSeleccionada, $modal) {
    
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

        if ($scope.cumulos.find(x => x.docState)) { 

            DialogModal($modal, "<em>Cúmulos - Se han hecho modificaciones que no se han grabado</em>",
                                `Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa
                                los cambios <b>no</b> serán grabados.`,
                true).then(
                    function () {
                        $modalInstance.dismiss("Cancel");
                    },
                    function () {
                        return true;
                    });
        } else { 
            $modalInstance.dismiss("Cancel");
        }
    }

    $scope.edicionesEfectuadas = function() { 
        if (!$scope.cumulos) { 
            return false; 
        }

        return $scope.cumulos.find(x => x.docState); 
    }

    $scope.zonas = []; 

    $scope.setIsEdited = function(value) { 

        if (value === "tipoCumulo") { 
            // cada vez que el usuario cambia el tipo de cúmulo, establecemos la lista para el ddl de zonas ... 

            let zonas = []; 
            $scope.cumulo.zona = null; 

            if ($scope.cumulo.tipoCumulo) { 
                let cumuloSeleccionado = $scope.tiposCumulo.find(x => x._id === $scope.cumulo.tipoCumulo); 
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
                    if (!$scope.cumulo.docState) { 
                        $scope.cumulo.docState = 2;
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
            cellTemplate: '<span ng-click="grid.appScope.eliminarReasgurador(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]

    $scope.eliminarReasgurador = (entity) => {

        // simplemente, eliminamos el item del array 
        lodash.remove($scope.cumulo.reaseguradores, (x: any) => { return x._id === entity._id; });
        
        if (!$scope.cumulo.docState) { 
            $scope.cumulo.docState = 2; 
        }
    }

    $scope.agregarReasegurador = function() { 

        if (!$scope.cumulo.reaseguradores) { 
            $scope.cumulo.reaseguradores = []; 
        }

        $scope.cumulo.reaseguradores.push({ 
            _id: new Mongo.ObjectID()._str,
        })

        if (!$scope.cumulo.docState) { 
            $scope.cumulo.docState = 2; 
        }
    }

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
            tiposCumulo: () => { 
                return Cumulos.find();   
            }, 
            tiposObjetoAsegurado: () => {  
                return TiposObjetoAsegurado.find();    
            }, 
            indoles: () => { 
                return Indoles.find();  
            },  
        })

        // establecemos el source en la lista de compañías en el grid de reaseguradores 
        $scope.reaseguradores_ui_grid.columnDefs[1].editDropdownOptionsArray = $scope.companias.filter(x => x.tipo === "REA"); 
        
        let filter = { 
            'source.entityID': infoCumulos.source.entityID, 
            'source.subEntityID': infoCumulos.source.subEntityID, 
        }

        Meteor.subscribe('cumulos.registro', filter, () => {

            // si el item no existe, asumimos que es nuevo y usamos los datos que se pasen a esta función para inicializarlo
            let existe =  Cumulos_Registro.find(filter).count(); 

            $scope.helpers({
                cumulos: () => { 
                    return Cumulos_Registro.find(filter); // el registro existe, lo mostramos ...  
                }, 
            })

            if (!existe) { 
                if ($scope.origen === 'edicion') { 
                    
                    let message = `*** No se ha registrado un cúmulo para el contrato o riesgo que Ud. está ahora consultando. ***<br /> 
                                   Haga un <em>click</em> en <em>Nuevo</em> para agregar un nuevo registro. 
                                  `
                    message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'warning',
                        msg: message
                    });
                } else { 
                    // el usuario está consultando; simplemente indicamos que no existe un registro de cúmulos para el contrato ... 
                    let message = "*** No se han registrado cúmulos para el contrato o riesgo que Ud. está ahora consultando. ***"
                    message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'warning',
                        msg: message
                    });
                }
            } else { 
                let message = `Ok, ${$scope.cumulos.length.toString()} registros de cúmulo existen para este riesgo o contrato ...`; 
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'warning',
                    msg: message
                });
            }

            $scope.lista_ui_grid.data = $scope.cumulos; 

            $scope.showProgress = false;
            $scope.$apply(); 
        })
    })


    $scope.grabar = function () {

        // lo primero que hacemos es intentar validar el item ...
        if (!$scope.cumulos || !$scope.cumulos.find(x => x.docState)) {
            DialogModal($modal, "<em>Cúmulos - Registro</em>",
                                "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                false).then();
            return;
        }

        $scope.showProgress = true;
        
        // nótese como validamos antes de intentar guardar en el servidor
        let isValid = false;
        let errores = [];
            
        var editedItems = $scope.cumulos.filter(x => x.docState);

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = Cumulos_Registro.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    Cumulos_Registro.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Cumulos_Registro.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'." as never);
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

        Meteor.call('cumulos_registro.save', editedItems, (err, result) => {

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

            if (result.error) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(result.error);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();
                return;
            }

            let filter = { 
                'source.entityID': infoCumulos.source.entityID, 
                'source.subEntityID': infoCumulos.source.subEntityID, 
            }

            $scope.lista_ui_grid.data = []; 

            Meteor.subscribe('cumulos.registro', filter, () => {

                $scope.helpers({
                    cumulos: () => { 
                        return Cumulos_Registro.find(filter); 
                    }, 
                })

                $scope.lista_ui_grid.data = $scope.cumulos; 
                
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                });
        
                $scope.showProgress = false;
                $scope.$apply(); 
            })
        })
    }


    // ---------------------------------------------------------------------
    // ui-grid: lista de cúmulos 
    // ----------------------------------------------------------------------
    let cumuloSeleccionado = {};

    // solo para saber si un cúmulo se ha seleccionado en la lista y mostrar un mensaje si no se ha hecho ... 
    $scope.cumuloSeleccionadoEnLaLista = function() { 

        if (!cumuloSeleccionado || lodash.isEmpty(cumuloSeleccionado)) { 
            return false; 
        }

        return true; 
    }

    $scope.lista_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        showGridFooter: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                cumuloSeleccionado = {};

                if (row.isSelected) { 
                    cumuloSeleccionado = row.entity;

                    // nótese como establecemos la lista para el ddl de zonas, siempre en base al tipo de cúmulo que se registró 
                    // para el item  
                    let zonas = []; 

                    $scope.cumulo = []; 
                    $scope.cumulo = cumuloSeleccionado; 

                    if ($scope.cumulo.tipoCumulo) { 
                        let tipoCumuloSeleccionado = $scope.tiposCumulo.find(x => x._id === $scope.cumulo.tipoCumulo); 
                        if (tipoCumuloSeleccionado) { 
                            zonas = tipoCumuloSeleccionado.zonas; 
                        }
                    }

                    $scope.zonas = zonas;

                    $scope.reaseguradores_ui_grid.data = []; 

                    if ($scope.cumulo && $scope.cumulo.reaseguradores) { 
                        $scope.reaseguradores_ui_grid.data = $scope.cumulo.reaseguradores; 
                    }
                }   
                else { 
                    return;
                }    
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

    $scope.lista_ui_grid.columnDefs = [
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
            name: 'source',
            field: 'source',
            displayName: 'Origen',
            width: 60,
            cellFilter: 'cumuloOrigenFilter',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'fecha_aPartirDesde',
            field: 'fecha_aPartirDesde',
            displayName: 'A partir desde',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'hasta',
            field: 'hasta',
            displayName: 'Hasta',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'proyeccion',
            field: 'proyeccion',
            displayName: 'Proyección',
            cellFilter: 'boolFilter',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'boolean'
        },
        {
            name: 'tipoCumulo',
            field: 'tipoCumulo',
            displayName: 'Tipo de cúmulo',
            width: 120,
            cellFilter: 'tipoCumuloFilter',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'valoresARiesgo',
            field: 'valoresARiesgo',
            displayName: 'Valores a riesgo',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell'
        },
        {
            name: 'sumaAsegurada',
            field: 'sumaAsegurada',
            displayName: 'Suma asegurada',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell'
        },
        {
            name: 'prima',
            field: 'prima',
            displayName: 'Prima',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell'
        },
        {
            name: 'nuestraOrdenPorc',
            field: 'nuestraOrdenPorc',
            displayName: '(%)',
            cellFilter: 'currencyFilterAndNull',
            width: 60,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number',
        },
        {
            name: 'sumaReasegurada',
            field: 'sumaReasegurada',
            displayName: 'Suma reasegurada',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell'
        },
        {
            name: 'primaBruta',
            field: 'primaBruta',
            displayName: 'PB',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number',

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell'
        },
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.eliminarCumuloEnLaLista(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]

    $scope.eliminarCumuloEnLaLista = (entity) => {

        // simplemente, eliminamos el item del array 1
        if (entity.docState && entity.docState === 1) { 
            lodash.remove($scope.cumulos, (x: any) => { return x._id === entity._id; });
        } else { 
            entity.docState = 3; 
        }
    }

    $scope.nuevoCumulo = function() { 

        // nótese como usamos los valores por defecto que son pasados desde el riesgo o contrato ... 
        let cumulo = {

            _id: new Mongo.ObjectID()._str,

            source : {
                entityID : infoCumulos.source.entityID,
                subEntityID : infoCumulos.source.subEntityID,
                origen : infoCumulos.source.origen,
                numero : infoCumulos.source.numero,
            },
            
            fecha_aPartirDesde: infoCumulos.desde, 
            desde: infoCumulos.desde, 
            hasta: infoCumulos.hasta, 
            proyeccion: false, 
            tipoCumulo: null, 
            zona: null, 
            moneda: infoCumulos.moneda,  
            cedente: infoCumulos.cedente, 
            indole: infoCumulos.indole ? infoCumulos.indole : null, 
            ramo: infoCumulos.ramo,  
            tipoObjetoAsegurado: infoCumulos.objetoAsegurado && infoCumulos.objetoAsegurado.tipo ? infoCumulos.objetoAsegurado.tipo : null,  

            valoresARiesgo: infoCumulos.valoresARiesgo, 
            sumaAsegurada: infoCumulos.sumaAsegurada,  
            prima: infoCumulos.prima,  
            nuestraOrdenPorc: infoCumulos.nuestraOrdenPorc,  
            sumaReasegurada: infoCumulos.sumaReasegurada, 
            primaBruta: infoCumulos.primaBruta,  

            reaseguradores: [], 

            ingreso: new Date(),  
            usuario: Meteor.userId(), 

            cia: infoCumulos.cia, 
            docState: 1,  
        }; 

        for (let reasegurador of infoCumulos.reaseguradores) { 
            let item = { 
                _id: new Mongo.ObjectID()._str,
                compania: reasegurador.compania, 
                ordenPorc: reasegurador.ordenPorc, 
            }

            cumulo.reaseguradores.push(item as never); 
        }

        $scope.cumulos.push(cumulo); 
    }

    $scope.lista_ui_grid.data = [];
}])
.filter('tipoCumuloFilter', function () {
    return function (tipoCumuloID) {
        var cumulo = Cumulos.findOne(tipoCumuloID);
        return cumulo ? cumulo.abreviatura : "Indefinido";
    };
})
.filter('cumuloOrigenFilter', function () {
    return function (source) {
        return `${source.origen}-${source.numero}`;
    };
})