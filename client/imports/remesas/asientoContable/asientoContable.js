
import angular from 'angular'; 

import lodash from 'lodash'; 
import moment from 'moment'; 
import saveAs from 'save-as'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Remesas } from '/imports/collections/principales/remesas';  
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

// import "./opcionesObtenerAsiento_Modal.html"; 
import RemesaCuadreAsientoObtenerOpciones from "./opcionesObtenerAsiento_Modal_Controller"; 

export default angular.module("scrwebm.remesas.remesa.cuadre.asientoContable", [ RemesaCuadreAsientoObtenerOpciones.name ])
            .controller('RemesaCuadreAsientoContable_Modal_Controller',
['$scope', '$modalInstance', '$modal', 'remesa', 'tiposCuentaContable', 'cuentasContablesLista', 'cuentasContables', 'ciaSeleccionada', 'uiGridConstants',
function ($scope, $modalInstance, $modal, remesa, tiposCuentaContable, cuentasContablesLista, cuentasContables, ciaSeleccionada, uiGridConstants) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.helpers({
        companias: () => { return Companias.find({}, { sort: { simbolo: 1 }}); },
        monedas: () => { return Monedas.find({}, { sort: { simbolo: 1 }}); },
    })

    $scope.tiposCuentaContable = tiposCuentaContable; 
    $scope.cuentasContablesLista = cuentasContablesLista; 

    $scope.obtenerAsientoContable = () => {
        $modal.open({
            templateUrl: 'client/html/remesas/asientoContable/opcionesObtenerAsiento_Modal.html',
            controller: 'RemesaCuadreAsientoContable_Opciones_Modal_Controller',
            size: 'md',
            resolve: {
            },
        }).result.then(
            function (resolve) {

                Meteor.call('remesas.obtenerAsientoContable', remesa._id, ciaSeleccionada, resolve, (err, result) => {
            
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
        
                    Meteor.subscribe('remesas', JSON.stringify({ '_id': remesa._id }), () => { 
        
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'info',
                            msg: result
                        });
        
                        // intentamos leer nuevamente la remesa, para que el usuario pueda ver el asiento que se construyó 
                        // para ella ... 
                        let remesaActualizada = Remesas.findOne({ numero: remesa.numero }); 
                        if (remesaActualizada) { 
                            remesa.asientoContable = remesaActualizada.asientoContable; 
                        }
            
                        $scope.asientoContableRemesa_ui_grid.data = remesa.asientoContable; 
            
                        $scope.showProgress = false;
                        $scope.$apply();
                    })
                })
        },
        function (cancel) {
            // el usuario cerro el modal sin produjo el cuadre ...
            return true;
        })           
    }

    $scope.asientoContableRemesa_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth:035,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
                    }

                    if (!remesa.docState) { 
                        remesa.docState = 2;
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

    $scope.asientoContableRemesa_ui_grid.columnDefs = [
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
                name: 'numero',
                field: 'numero',
                displayName: '##',
                width: 60,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                pinnedLeft: true,
                type: 'number'
            },
            {
                name: 'moneda',
                field: 'moneda',
                displayName: 'Moneda',
                width: 80,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableColumnMenu: false,
                enableCellEdit: true,

                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownIdLabel: '_id',
                editDropdownValueLabel: 'simbolo',
                editDropdownOptionsArray: $scope.monedas,
                cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',

                enableSorting: true,
                pinnedLeft: true,
                type: 'string'
            },
            {
                name: 'tipo',
                field: 'tipo',
                displayName: 'Tipo',
                width: 80,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,

                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownIdLabel: 'tipo',
                editDropdownValueLabel: 'abreviatura',
                editDropdownOptionsArray: $scope.tiposCuentaContable,
                cellFilter: 'mapDropdown:row.grid.appScope.tiposCuentaContable:"tipo":"abreviatura"',

                enableSorting: true,
                pinnedLeft: true,
                type: 'string'
            },
            {
                name: 'codigo',
                field: 'codigo',
                displayName: 'Cuenta contable',
                width: 120,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,

                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownIdLabel: 'cuenta',
                editDropdownValueLabel: 'descripcion',
                editDropdownOptionsArray: $scope.cuentasContablesLista,
                cellFilter: 'mapDropdown:row.grid.appScope.cuentasContablesLista:"cuenta":"descripcion"',

                enableSorting: true,
                pinnedLeft: true,
                type: 'string'
            },
            {
                name: 'compania',
                field: 'compania',
                displayName: 'Compañía',
                width: 100,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,

                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownIdLabel: '_id',
                editDropdownValueLabel: 'abreviatura',
                editDropdownOptionsArray: $scope.companias,
                cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"abreviatura"',

                enableSorting: true,
                pinnedLeft: true,
                type: 'string'
            },
            {
                name: 'descripcion',
                field: 'descripcion',
                displayName: 'Descripcion',
                width: 200,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
            {
                name: 'referencia',
                field: 'referencia',
                displayName: 'Referencia',
                width: 120,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
            {
                name: 'monto',
                field: 'monto',
                displayName: 'Monto',
                width: 120,
                cellFilter: 'currencyFilter',
                headerCellClass: 'ui-grid-rightCell',
                cellClass: 'ui-grid-rightCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,

                aggregationType: uiGridConstants.aggregationTypes.sum,
                aggregationHideLabel: true,
                footerCellFilter: 'currencyFilter',
                footerCellClass: 'ui-grid-rightCell',

                type: 'number'
            },
            {
                name: 'delButton',
                displayName: '',
                cellClass: 'ui-grid-centerCell',
                cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableSorting: false,
                width: 25
            }
    ];

    $scope.deleteItem = function (item) {
        item.docState = 3;

        if (!remesa.docState) { 
            remesa.docState = 2;
        }   
    }

    $scope.nuevo = function () {
        remesa.asientoContable.push({
            _id: new Mongo.ObjectID()._str,
            moneda: Monedas.findOne(remesa.moneda).simbolo, 
            docState: 1
        });

        if (!remesa.docState) { 
            remesa.docState = 2;
        }   
    }

    $scope.reordenarPorMonto = function() { 

        // hay montos positivos y negativos; la idea es ordenarlos todos en forma descendente; ej: 
        // 1000, 500, 350, 1, -1000, -500, -350, -1 
        // para hacerlo, agregamos dos valores y luego ordenamos por éstos ... 
        for (let partida of remesa.asientoContable) { 
            partida.orden = partida.monto >= 0 ? 1 : 0;         // al ordenar por aquí, quedaran primero los positivos luego los negativos 
            partida.monto2 = partida.monto >= 0 ? partida.monto : Math.abs(partida.monto);  // para ordenar en forma 'desc' por monto2 
        }

        let orderedArray = lodash.orderBy(remesa.asientoContable, ['orden', 'monto2'], ['desc', 'desc']);

        let numero = 0; 

        remesa.asientoContable = []; 
        for (let partida of orderedArray) { 
            if (!partida.docState) { partida.docState = 2; } 

            numero += 10; 
            partida.numero = numero; 

            delete partida.orden; 
            delete partida.monto2; 

            remesa.asientoContable.push(partida); 
        }

        $scope.asientoContableRemesa_ui_grid.data = remesa.asientoContable; 

        if (!remesa.docState) { 
            remesa.docState = 2;
        }   
    }

    $scope.reordenarPorNumero = function() { 
        let orderedArray = lodash.orderBy(remesa.asientoContable, ['numero'], ['asc']);

        let numero = 0; 

        remesa.asientoContable = []; 
        for (let partida of orderedArray) { 
            if (!partida.docState) { partida.docState = 2; } 

            numero += 10; 
            partida.numero = numero; 

            remesa.asientoContable.push(partida); 
        }

        $scope.asientoContableRemesa_ui_grid.data = remesa.asientoContable; 

        if (!remesa.docState) { 
            remesa.docState = 2;
        }   
    }

    $scope.DownloadToDisk = () => {
        // permitimos grabar el asiento contable, como un json, a un archivo en la máquina. Luego, este archivo podrá
        // ser importado como un asiento nuevo ...
        let message = ""; 
        try {
            // construye y regresa un objeto como el que usa contabm, para que luego pueda ser leído allí 
            let asientoContable_contabm = construirAsientoContableContab(remesa, cuentasContables); 

            var blob = new Blob([JSON.stringify(asientoContable_contabm)], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "asiento contable");
        }
        catch(err) {
            message = err.message ? err.message : err.toString();
        }
        finally {
            if (message) {
                DialogModal($modal, "<em>Asientos contables - Exportar asientos contables</em>",
                                    "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                    message,
                                    false).then();
            }
        }
    }

    if (!remesa.asientoContable) { 
        remesa.asientoContable = []; 
    }

    $scope.asientoContableRemesa_ui_grid.data = remesa.asientoContable; 
}
])

function construirAsientoContableContab(remesa, cuentasContables) { 

    let compania = Companias.findOne(remesa.compania); 
    let empresaUsuaria = EmpresasUsuarias.findOne(remesa.cia); 
    let moneda = Monedas.findOne(remesa.moneda); 

    let asientoContable = remesa.asientoContable; 

    let asientoContableContab = { 
        _id: new Mongo.ObjectID()._str,
        
        descripcion: `Asiento contable generado en forma automática por scrwebm. Remesa: ${remesa.numero.toString()} ${moment(remesa.fecha).format("DD-MMM-YYYY")} ${compania ? compania.abreviatura : ""} ${empresaUsuaria ? empresaUsuaria.abreviatura : ""}.`,
        moneda: null,
        monedaOriginal: null,
        monedaSimbolo: moneda ? moneda.simbolo : null, 
        monedaOriginalSimbolo: moneda ? moneda.simbolo : null, 
        convertirFlag: true,
        factorDeCambio: 1,
        provieneDe: 'scrwebm',
        provieneDe_id: remesa._id,
        asientoTipoCierreAnualFlag: false,
        partidas: [], 
    }

    asientoContable.forEach((p) => { 

        // aunque el asiento en scrwebm contiene el código de la cuenta, debemos pasar la 'cuenta editada' al exportar, pues así es 
        // como lo espera contabm ... 
        let cuentaContable = lodash.find(cuentasContables, (x) => { return x.cuenta === p.codigo; }); 

        let partida = { 
            _id: p._id,
            partida: p.numero,
            cuentaContableID: null,
            cuentaContable: cuentaContable && cuentaContable.cuenta ? cuentaContable.cuenta : "Indefinida", 
            descripcion: p.descripcion,
            referencia: p.referencia,
            debe: p.monto >= 0 ? p.monto : 0,
            haber: p.monto < 0 ? Math.abs(p.monto) : 0, 
        }

        asientoContableContab.partidas.push(partida); 
    })

    return asientoContableContab; 
}



