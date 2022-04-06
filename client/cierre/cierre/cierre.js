
import { Meteor } from 'meteor/meteor'

import angular from 'angular'; 
import lodash from 'lodash'; 
import moment from 'moment'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Cierre } from '/imports/collections/cierre/cierre'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

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
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {};

    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
    // ------------------------------------------------------------------------------------------------

    let itemSeleccionado = {};

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
            width: 120,
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
            width: 120,
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

        const periodoACerrar = itemSeleccionado; 

        if (!periodoACerrar || lodash.isEmpty(periodoACerrar)) {
            DialogModal($modal,
                `<em>scrwebm - cierre de un período</em>`,
                `Aparentemente, Ud. no ha seleccionado un período a cerrar.`, 
                false).then();
            return;
        }

        const periodo = Cierre.findOne({ $or: [ {desde: { $lt: periodoACerrar.dede }}, { hasta: { $lt: periodoACerrar.hasta }} ], 
                                         cia: companiaSeleccionadaID, cerradoFlag: false }); 

        if (periodo) {

            const message = `Aparentemente, Ud. no ha seleccionado el período <em>más reciente</em> en la lista.<br />
                             Probablemente, el período a cerrar que Ud. ha seleccionado no es el más reciente. <br />
                             Por favor seleccione el período más reciente en la lista. 
                            `;  

            DialogModal($modal, `<em>scrwebm - cierre de un período</em>`, message, false).then();
            return;
        }

        if (!periodoACerrar.desde || !periodoACerrar.hasta) {
            DialogModal($modal, `<em>scrwebm - cierre de un período</em>`,
                "Aparentemente, el período que Ud. ha seleccionado no está completo Por favor revise.",
                false).then();
            return;
        }

        const message = `Período a cerrar: desde <b>${moment(periodoACerrar.desde).format("DD-MMM-YYYY")}</b> hasta 
                         <b>${moment(periodoACerrar.hasta).format("DD-MMM-YYYY")}</b>.<br /><br />
                         Desea continuar con este proceso y cerrar el período?`; 

        DialogModal($modal, `<em>scrwebm - cierre de un período</em>`, message, true).then(
            function () { cerrarPeriodo2(periodoACerrar); },
            function () { return; });
    }

    let subscriptionHandle = {};

    function cerrarPeriodo2(periodoACerrar) { 

        $scope.alerts.length = 0;
        $scope.showProgress = true;

        // para medir y mostrar el progreso de la tarea ...
        $scope.processProgress.current = 0;
        $scope.processProgress.max = 0;
        $scope.processProgress.progress = 0;
        $scope.processProgress.message = "";

        Meteor.call('cierre.cerrarPeriodo', periodoACerrar, (err, result)  => {
        
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

                // inicialmente, la suscripción regresará solo los registros abiertos 
                $scope.helpers({ 
                    cierres: () => { 
                        return Cierre.find({ cia: companiaSeleccionadaID, cerradoFlag: false }, { sort: { desde: 1, }});
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

    const companiaSeleccionadaID = companiaSeleccionadaDoc && companiaSeleccionadaDoc._id ? companiaSeleccionadaDoc._id : "-999"; 

    // 'cierres' regresará los registros de cierre que están abiertos ... pueden ser: ninguno, uno o varios ... 
    subscriptionHandle = 
    Meteor.subscribe('cierres', companiaSeleccionadaID, () => { 

        $scope.helpers({ 
            cierres: () => { 
                return Cierre.find({ cia: companiaSeleccionadaID, cerradoFlag: false }, { sort: { desde: 1, }});
            }
        })

        const message = `Seleccione el período a cerrar en la lista y haga un click en <b><em>Cerrar período seleccionado</em></b><br />
                        Si el período a cerrar no está en la lista, debe agregarlo y regresar luego para cerrarlo.<br />
                        También puede ser que el período fue ya cerrado. Un período cerrado puede ser abierto y cerrado nuevamente.<br /><br />
                        <b>Nota:</b> para agregar períodos de cierre, o abrir períodos ya cerrados, 
                        Ud. debe usar la opción: <em>Cierre / Períodos de cierre</em>.  
                        `; 

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'info',
            msg: message, 
        });

        $scope.cierre_ui_grid.data = $scope.cierres; 

        $scope.showProgress = false;
        $scope.$apply(); 
    })

    // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription
    $scope.$on('$destroy', function() {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }
    })
  }
])