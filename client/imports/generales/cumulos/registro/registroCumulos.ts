

import * as angular from 'angular';
import * as lodash from 'lodash'; 
import * as moment from 'moment'; 

import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos';  
import { Cumulos } from 'imports/collections/catalogos/cumulos'; 
import { TiposObjetoAsegurado } from 'imports/collections/catalogos/tiposObjetoAsegurado'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 
import { Cumulos_Registro } from 'imports/collections/principales/cumulos_registro'; 

import { mensajeErrorDesdeMethod_preparar } from 'client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { DialogModal } from 'client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller('RegistroCumulos_Controller',
['$scope', '$modal', '$modalInstance', 'uiGridConstants', 'infoCumulos', 'origen', 'companiaSeleccionada', 
  function ($scope, $modal, $modalInstance, uiGridConstants, infoCumulos, origen, companiaSeleccionada) {
    
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

        if (value === "tipoCumulo") { 
            // cada vez que el usuario cambia el tipo de cúmulo, establecemos la lista para el ddl de zonas ... 

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
        
        let filter = { 
            'source.entityID': infoCumulos.source.entityID, 
            'source.subEntityID': infoCumulos.source.subEntityID, 
        }

        Meteor.subscribe('cumulos.registro', filter, () => {

            // si el item no existe, asumimos que es nuevo y usamos los datos que se pasen a esta función para inicializarlo
            let existe =  Cumulos_Registro.find(filter).count(); 

            if (!existe) { 
                if ($scope.origen === 'edicion') { 
                    $scope.helpers({
                        cumulo: () => { 
                            return infoCumulos;             // si no encontramos un cúmulo registrado, usamos los valores pasados al controller 
                        }, 
                    })
    
                    $scope.cumulo.docState = 1;             // el registro es nuevo; no existe pues no fue encontrado ... 
    
                    let message = "*** Registro de un <b>nuevo</b> cúmulo - Complete la información y haga un <em>click</em> en grabar. ***"
    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'warning',
                        msg: message
                    });
                } else { 
                    // el usuario está consultando; simplemente indicamos que no existe un registro de cúmulos para el contrato ... 
                    let message = "*** No se ha registrado un (registro de) cúmulo para el contrato o riesgo que Ud. está ahora consultando. ***"
    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'warning',
                        msg: message
                    });
                }
            } else { 
                $scope.helpers({
                    cumulo: () => { 
                        return Cumulos_Registro.findOne(filter); // el registro existe, lo mostramos ...  
                    }, 
                })

                let message = ""; 
                if ($scope.origen === 'edicion') {  
                    message = `*** Cúmulo registrado el ${moment($scope.cumulo.ingreso).format("DD-MMM-YYYY")} - Ud. puede hacer modificaciones y 
                               luego un <em>click</em> en Grabar. ***`; 
                } else { 
                    message = `*** Cúmulo registrado el ${moment($scope.cumulo.ingreso).format("DD-MMM-YYYY")} ***`; 
                }
                

                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'warning',
                    msg: message
                });
            }

            $scope.reaseguradores_ui_grid.columnDefs[1].editDropdownOptionsArray = $scope.companias.filter(x => x.tipo === "REA"); 

            if ($scope.cumulo && $scope.cumulo.reaseguradores) { 
                $scope.reaseguradores_ui_grid.data = $scope.cumulo.reaseguradores; 
            }
    
            $scope.showProgress = false;
            $scope.$apply(); 
        })
    })


    $scope.grabar = function () {

        // lo primero que hacemos es intentar validar el item ...
        if (!$scope.cumulo || !$scope.cumulo.docState) {
            DialogModal($modal, "<em>Cúmulos - Registro</em>",
                                "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                false).then();
            return;
        }

        $scope.showProgress = true;

        if ($scope.cumulo.docState === 1) { 
            // el usuario y fecha de registro es inicializado al grabar; cuando el registro es modificado, 
            // la fecha y usuario se registran en el método que graba ... 
            $scope.cumulo.ingreso = new Date(); 
            $scope.cumulo.usuario = Meteor.userId(); 
        }
        
        // nótese como validamos antes de intentar guardar en el servidor
        let isValid = false;
        let errores = [];
            
        if ($scope.cumulo.docState != 3) {
            isValid = Cumulos_Registro.simpleSchema().namedContext().validate($scope.cumulo);

            if (!isValid) {
                Cumulos_Registro.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Cumulos_Registro.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'." as never);
                })
            }
        }

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

        let item = lodash.cloneDeep($scope.cumulo); 
        $scope.showProgress = true; 

        Meteor.call('cumulos_registro.save', item, (err, result) => {

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
                'source.entityID': item.source.entityID, 
                'source.subEntityID': item.source.subEntityID, 
            }

            Meteor.subscribe('cumulos.registro', filter, () => {

                $scope.helpers({
                    cumulo: () => { 
                        return Cumulos_Registro.findOne(filter); 
                    }, 
                })
                
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                });
    
                if ($scope.cumulo.reaseguradores) { 
                    $scope.reaseguradores_ui_grid.data = $scope.cumulo.reaseguradores; 
                }
        
                $scope.showProgress = false;
                $scope.$apply(); 
            })
        })
    }
}])