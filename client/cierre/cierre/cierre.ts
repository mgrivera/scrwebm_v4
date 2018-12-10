

import * as angular from 'angular'; 
import * as lodash from 'lodash'; 
import * as moment from 'moment'; 

import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Cierre } from 'imports/collections/cierre/cierre'; 
import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '../../imports/generales/angularGenericModal'; 

angular.module("scrwebm").controller("Cierre.Cierre.Controller", ['$scope', '$modal', function ($scope, $modal) {

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    }

    $scope.$parent.tituloState = "Cierre - Proceso de Cierre"; 

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'cierre_procesoCierre' });
    EventDDP.addListener('cierre_procesoCierre_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // -------------------------------------------------------------------------------------------------------

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


    let cierre_ui_grid_api = null;
    let itemSeleccionado = {} as any;

    $scope.cierre_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: false,
        enableFiltering: false,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            cierre_ui_grid_api = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado = {};
                if (row.isSelected) {
                    itemSeleccionado = row.entity;
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

    $scope.cierre_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
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
            // nota: este cell es editable por el usuario solo para el 1er. row; cuando hay otros rows (más de 1), el cell 
            // no es editable ... (nótese que el $scope es el scope del cell y no nuestro $scope)
            cellEditableCondition: $scope => Array.isArray($scope.col.grid.rows) && $scope.col.grid.rows.length === 1, 
            cellFilter: 'dateFilterFullMonthAndYear',
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
            cellFilter: 'dateFilterFullMonthAndYear',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
    ]

    // aplicamos el filtro indicado por el usuario y abrimos la lista
    $scope.cerrarPeriodo = function () {

        if (!itemSeleccionado || lodash.isEmpty(itemSeleccionado)) {
            DialogModal($modal,
                `<em>scrwebm - cierre de un período</em>`,
                `Aparentemente, Ud. no ha seleccionado un período a cerrar.`, 
                false).then();
            return;
        }

        if (itemSeleccionado.cerradoFlag) {
            DialogModal($modal,
                `<em>scrwebm - cierre de un período</em>`,
                `El período a cerrar que Ud. ha seleccionado debe estar abierto.<br />
                 Si Ud. desea cerrar un período que <b>ya fue cerrado antes</b>, debe ir a la opción <em>cierre/registros de cierre</em> y 
                 abrir el período. Una vez (re) abierto, Ud. puede regresar y cerrar <em>nuevamente</em> el período. 
                `, 
                false).then();
            return;
        }

        if (!itemSeleccionado.desde || !itemSeleccionado.hasta) {
            DialogModal($modal,
                `<em>scrwebm - cierre de un período</em>`,
                "Aparentemente, el período que Ud. ha seleccionado no está completo Por favor revise.",
                false).then();
            return;
        }

        DialogModal($modal,
            `<em>scrwebm - cierre de un período</em>`,
             `Período a cerrar: desde <b>${moment(itemSeleccionado.desde).format("DD-MMM-YYYY")}</b> hasta <b>${moment(itemSeleccionado.hasta).format("DD-MMM-YYYY")}</b>.<br /><br />
              Desea continuar con este proceso y cerrar el período?`,
            true).then(
            function () { cerrarPeriodo2(itemSeleccionado); },
            function () { return; });
    }

    let subscriptionHandle = {} as any;

    function cerrarPeriodo2(itemSeleccionado) { 

        $scope.alerts.length = 0;
        $scope.showProgress = true;

        // para medir y mostrar el progreso de la tarea ...
        $scope.processProgress.current = 0;
        $scope.processProgress.max = 0;
        $scope.processProgress.progress = 0;
        $scope.processProgress.message = "";

        Meteor.call('cierre.cerrarPeriodo', itemSeleccionado, (err, result)  => {
        
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


            if (result.validationError) { 
                // se encontraron errores de validación (simple-schema) en los parámetros pasados al method ... 

                // preparamos un string con los errores que vienen en el array 
                let erroresString = "Se han encontrado errores al intentar ejecutar el proceso:<br />"; 

                result.validationErrors.forEach((e) => { 
                    erroresString += `<br />El valor '${e.value}' no es adecuado para el campo '${e.name}'; error de tipo '${e.type}'.`; 
                })
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: erroresString
                });
    
                $scope.showProgress = false;
                $scope.$apply();

                return; 
            }

            if (result.error) { 
                // se encontraron errores, aunque no en la validación de parámetros, solo errores generales en la ejecución del method 
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message
                });
    
                $scope.showProgress = false;
                $scope.$apply();

                return; 
            }

            if (subscriptionHandle) { 
                subscriptionHandle.stop(); 
            }

            subscriptionHandle = 
            Meteor.subscribe('cierres', companiaSeleccionadaID, () => { 

                // inicialmente, la suscripción regresará solo los registros abiertos. Sin embargo, la idea es que al cerrar, 
                // quede en la lista el registro que ahora está cerrado ... 
                $scope.helpers({ 
                    cierres: () => { 
                        return Cierre.find({ cia: companiaSeleccionadaID }, { sort: { desde: -1, }}); 
                    }
                })

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                });

                $scope.cierre_ui_grid.data = $scope.cierres; 

                itemSeleccionado = {};          // para quitar la selección en la lista 

                $scope.showProgress = false;
                $scope.$apply(); 
            })
        })
    }

    $scope.showProgress = true; 

    let companiaSeleccionadaID = companiaSeleccionadaDoc && companiaSeleccionadaDoc._id ? companiaSeleccionadaDoc._id : "-999"; 

    // 'cierres' regresará los registros de cierre que están abiertos ... pueden ser: ninguno, uno o varios ... 
    subscriptionHandle = 
    Meteor.subscribe('cierres', companiaSeleccionadaID, () => { 

        $scope.helpers({ 
            cierres: () => { 
                return Cierre.find({ cia: companiaSeleccionadaID }, { sort: { desde: -1, }});
            }
        })

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'info',
            msg: `Seleccione un período a cerrar en la lista y haga un click en <b><em>Cerrar período seleccionado</em></b> 
                  - El período seleccionado debe estar abierto.<br />
                  O agregue un nuevo período y selecciónelo ...<br />
                  Nota: para agregar períodos de cierre, Ud. debe usar la opción <em>Cierre / Períodos de cierre</em>.  
            `
        });

        $scope.cierre_ui_grid.data = $scope.cierres; 

        $scope.showProgress = false;
        $scope.$apply(); 
    })
  }
])