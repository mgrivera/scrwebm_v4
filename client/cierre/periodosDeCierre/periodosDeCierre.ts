

import * as numeral from 'numeral';
import * as lodash from 'lodash';
import * as moment from 'moment'; 
import * as angular from 'angular';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 

import { Cierre, Cierre_schema } from 'imports/collections/cierre/cierre'; 
import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '../../imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebm").controller("Cierre.periodosDeCierre.Controller",
['$stateParams', '$scope', '$meteor', '$modal', function ($stateParams, $scope, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {} as any; 

    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
    // ------------------------------------------------------------------------------------------------

    $scope.$parent.tituloState = "Cierre - Períodos cerrados"; 

    let list_ui_grid_api = null;
    let itemSeleccionado = {};

    $scope.list_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableFiltering: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

        list_ui_grid_api = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado = {};
                if (row.isSelected) {
                    itemSeleccionado = row.entity;
                }
            }), 
            
            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
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

    $scope.list_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
            width: '100',
            enableFiltering: false,
            enableCellEdit: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'hasta',
            field: 'hasta',
            displayName: 'Hasta',
            width: '100',
            enableFiltering: false,
            enableCellEdit: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'cerradoFlag',
            field: 'cerradoFlag',
            displayName: 'Cerrado?',
            width: '100',
            enableCellEdit: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter', 
            enableColumnMenu: false,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'fechaEjecucion',
            field: 'fechaEjecucion',
            displayName: 'Fecha',
            width: '120',
            enableFiltering: false,
            enableCellEdit: false,
            cellFilter: 'dateTimeFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
    ]


    $scope.nuevo = function() { 

        let today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0); 

        // leemos el cierre más reciente para construir el nuevo registro; nótese que los registros son siempre agregados en orden  ... 
        let ultimoCierre = $scope.cierre.find(x => x.cia = companiaSeleccionadaDoc._id); 
        let item = {}; 

        if (!ultimoCierre) { 
            // no hay períodos en la lista. Nota: ésto debería ocurrir solo la primera vez que se efectúa un cierre ... 
            item = { 
                _id: new Mongo.ObjectID()._str,
                desde: today, 
                hasta: today, 
                fechaEjecucion: today, 
                cerradoFlag: false, 
    
                usuarios: [], 
                
                cia: companiaSeleccionadaDoc._id, 
                docState: 1, 
            }; 
        } else { 
            // siempre construimos el registro en base al último cierre ejecutado ... 

            // obtenemos la cantidad de días del período anterior, para determinar la fecha final de este período 
            let primerDiaMesProximo = moment(ultimoCierre.hasta).add(1, "days").toDate();
            let ultimoDiaMesProximo = moment(moment(primerDiaMesProximo).add(1, "month").toDate()).subtract(1, "days").toDate();

            item = { 
                _id: new Mongo.ObjectID()._str,
                desde: primerDiaMesProximo, 
                hasta: ultimoDiaMesProximo,
                fechaEjecucion: today, 
                cerradoFlag: false, 
    
                usuarios: [], 
                
                cia: companiaSeleccionadaDoc._id, 
                docState: 1, 
            }; 
        }
        

        // agregamos arriba en el array (unshift es igual que push pero agrega arriba en el array)
        // al hacer ésto, los items siempre estarán ordenados, por fecha y en forma descendente, en el array
        $scope.cierre.unshift(item);       
        $scope.list_ui_grid.data = $scope.cierre; 

        itemSeleccionado = {};

        // debemos permitir que el usuario indique desde y hasta solo para el 1er. registro. 
        // Posteriormente, el usuario solo podrá editar hasta y desde será siempre calculado ...
        if ($scope.cierre.length === 1) { 
            // nota: usamos cellEditableCondition para permitir/negar la edición de este cell, solo para el 1er. row ... 
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'warning',
                msg: `<b>1er. cierre a ser efectuado:</b> Ud. debe indicar las fechas (desde/hasta) que corresponden al período a cerrar ... `
            });
        } 
    }



    $scope.list_ui_grid.data = [];

    let recordCount = 0;
    let limit = 0;

    function leerPrimerosRegistrosDesdeServidor(cantidadRecs) {
        // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
        limit = cantidadRecs;
        let filtro = { cia: companiaSeleccionadaDoc._id }; 

        Meteor.call('getCollectionCount', 'Cierre', filtro, (err, result) => {

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
            };

            // el método regresa la cantidad de items en el collection (siempre para el usuario)
            recordCount = result;
            $scope.leerRegistrosDesdeServer(limit);
        })
    }

    $scope.showProgress = true;
    leerPrimerosRegistrosDesdeServidor(50);


    let subscriptionHandle: any = null;
    $scope.leerRegistrosDesdeServer = function (limit) {
        // la idea es 'paginar' los registros que se suscriben, de 50 en 50
        // el usuario puede indicar 'mas', para leer 50 más; o todos, para leer todos los registros ...
        $scope.showProgress = true;

        // lamentablemente, tenemos que hacer un stop al subscription cada vez que hacemos una nueva,
        // pues el handle para cada una es diferente; si no vamos deteniendo cada una, las anteriores
        // permanecen pues solo detenemos la última al destruir el stop (cuando el usaurio sale de
        // la página). Los documents de subscriptions anteriores permanecen en minimongo y el reactivity
        // de los subscriptions también ...
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }

        $scope.list_ui_grid.data = [];
        $scope.cierre = [];

        let filtro = { cia: companiaSeleccionadaDoc._id }; 

        subscriptionHandle =
        Meteor.subscribe( 'cierre.leerPeriodosDeCierre', filtro, limit, {
            onError: function( error ) {
                // if the subscribe terminates with an error
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: error.message
                });
    
                $scope.showProgress = false;
                $scope.$apply();
            },
            onReady: function() {

                $scope.helpers({
                    cierre: () => {
                        return Cierre.find({ cia: companiaSeleccionadaDoc._id }, { sort: { desde: -1, }});
                    }
                });
    
                $scope.list_ui_grid.data = $scope.cierre;
    
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `${numeral($scope.cierre.length).format('0,0')} registros (de ${numeral(recordCount).format('0,0')}) han sido seleccionados ...`
                });
    
                $scope.showProgress = false;
                $scope.$apply();
            }
        })
    }

    $scope.leerMasRegistros = function () {
        limit += 50;    // la próxima vez, se leerán 50 más ...
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }

    $scope.leerTodosLosRegistros = function () {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }


    // -------------------------------------------------------------------------
    // Grabar las modificaciones hechas al registro
    // -------------------------------------------------------------------------
    $scope.grabar = function () {

        let hayEdiciones = $scope.cierre.find(x => x.docState); 

        if (!hayEdiciones) {
            DialogModal($modal, "<em>Cierre - Períodos cerrados</em>",
                                `Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.`,
                                false).then();
            return;
        }

        grabar2();
    }


    function grabar2() {
        $scope.showProgress = true;

        // obtenemos un clone de los datos a guardar ...
        let editedItems = $scope.cierre.filter(x => x.docState);

        // nótese como validamos cada item antes de intentar guardar en el servidor
        let isValid = false;
        let errores = [];

        editedItems.forEach((item) => { 
            isValid = Cierre_schema.namedContext().validate(item);

            if (!isValid) {
                Cierre_schema.namedContext().validationErrors().forEach((error) => {
                    if (error.type === "custom") { 
                        // cuando pasamos errores del tipo custom es porque el error no corresponde a un field en particular, sino a 
                        // todo el registro. En un caso tal, mostramos solo el nombre (name), pues allí ponemos la descripción del error 
                        errores.push(`${error.name}` as never);
                    } else { 
                        errores.push(`El valor '${error.value}' no es adecuado para el campo '${Cierre_schema.label(error.name)}'; error de tipo '${error.type}'.` as never);
                    }
                });
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

        $scope.list_ui_grid.data = [];
        $scope.cierre = [];

        Meteor.call('cierre.periodosCierre.save', editedItems, (err, result) => {

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
            });

            // refrescamos el helper 
            $scope.helpers({
                cierre: () => {
                    return Cierre.find({ cia: companiaSeleccionadaDoc._id }, { sort: { desde: -1, }});
                }
            });

            $scope.list_ui_grid.data = $scope.cierre;

            $scope.showProgress = false;
            $scope.$apply();
        })
    }

    $scope.mostrarEjecucion = function() { 

        if (!itemSeleccionado || lodash.isEmpty(itemSeleccionado)) { 
            DialogModal($modal, "<em>Cierre - Períodos cerrados</em>",
                                `Ud. debe seleccionar un reigstro en la lista.<br /> 
                                Solo entonces, podrá consultar su <em>historia de ejecuciones</em> mediante esta función.`,
                                false).then();
            return;
        }

        let modalInstance = $modal.open({
            templateUrl: 'client/cierre/periodosDeCierre/mostrarEjecucionesCierre_Modal.html',
            controller: 'Cierre_RegistrosCierre_MostrarEjecuciones_Modal_Controller',
            size: 'lg',
            resolve: {
                periodoCierre: () => {
                    return itemSeleccionado;
                },
                companiaSeleccionada: () => {
                    return companiaSeleccionadaDoc;
                },
            },
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    }

     // ------------------------------------------------------------------------------------------------
     // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
     // para limpiar los items en minimongo ...
     $scope.$on('$destroy', function() {
         if (subscriptionHandle && subscriptionHandle.stop) {
             subscriptionHandle.stop();
         };
     })
}
])