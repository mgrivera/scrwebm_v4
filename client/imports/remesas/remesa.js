/* eslint-disable require-atomic-updates */
import angular from 'angular';
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';
import lodash from 'lodash'; 

import { ProtegerEntidades } from '/client/imports/generales/protegerEntidades'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { Remesas } from '/imports/collections/principales/remesas';  
import { CuentasContables } from '/imports/collections/catalogos/cuentasContables';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { Cuotas } from '/imports/collections/principales/cuotas'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

// import '/client/imports/remesas/remesa.generales.html'; 
// import '/client/imports/remesas/remesa.detalle.html'; 
// import '/client/imports/remesas/remesa.cuadre.html'; 

import RemesasRemesaCuadreExportarExcel from './exportarExcelModal/remesaCuadreExportarExcel_Modal_Controller'; 
// import './exportarExcelModal/remesaCuadreExportarExcel_Modal.html'; 

import RemesasRemesaObtenerCuadreRemesa from './obtenerCuadreRemesaModal/obtenerCuadreRemesa_Modal'; 
// import './obtenerCuadreRemesaModal/obtenerCuadreRemesa_Modal.html';

// import './asientoContable/asientoContable_Modal.html';
import RemesaCuadreAsientoContable from './asientoContable/asientoContable'; 

export default angular.module("scrwebm.remesas.remesa", 
                      [ 
                        RemesasRemesaCuadreExportarExcel.name, 
                        RemesasRemesaObtenerCuadreRemesa.name, 
                        RemesaCuadreAsientoContable.name, 
                      ])
                      .controller("RemesaController", ['$scope', '$state', '$stateParams', '$modal', 'uiGridGroupingConstants',
  function ($scope, $state, $stateParams, $modal, uiGridGroupingConstants) {

    $scope.showProgress = false;
    $scope.uiSelectLoading = false;         // para mostrar spinner cuando se ejecuta el search en el (bootstrap) ui-select 

    $scope.origen = $stateParams.origen;
    $scope.id = $stateParams.id;
    $scope.pageNumber = $stateParams.pageNumber;

    // ej: cuando se abre desde la lista de cuotas ...
    // nótese que el boolean value viene, en realidad, como un string ...
    $scope.vieneDeAfuera = ($stateParams.vieneDeAfuera && $stateParams.vieneDeAfuera == "true");    

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.miSu_List = ['MI', 'SU'];

    $scope.tiposInstrumentoPago_List = [
        { tipo: 'CH', descripcion: 'Cheque' },
        { tipo: 'DP', descripcion: 'Depósito' },
        { tipo: 'TR', descripcion: 'Transferencia' }, 
    ];

    $scope.tiposCuentaContable = [ 
        { tipo: 10, descripcion: "remesa", abreviatura: "remesa", }, 
        { tipo: 100, descripcion: "cobro prima - fac", abreviatura: "cob pr fac", }, 
        { tipo: 200, descripcion: "primas por pagar - fac", abreviatura: "pr x pag fac", }, 
        { tipo: 300, descripcion: "corretaje - fac", abreviatura: "corr fac", }, 
        { tipo: 400, descripcion: "pago primas - fac", abreviatura: "pag pr fac", }, 
        { tipo: 600, descripcion: "cobro sin - fac", abreviatura: "cob sin fac", }, 
        { tipo: 700, descripcion: "sin por pagar - fac", abreviatura: "sin x pag fac", }, 
        { tipo: 800, descripcion: "pago sin al ced - fac", abreviatura: "pag sin ced fac", }, 
        { tipo: 900, descripcion: "cobro prima - cont", abreviatura: "cob pr cont", }, 
        { tipo: 1000, descripcion: "primas por pagar - cont", abreviatura: "pr x pag cont", }, 
        { tipo: 1100, descripcion: "corretaje - cont", abreviatura: "corr cont", }, 
        { tipo: 1200, descripcion: "pago primas - cont", abreviatura: "pag pr cont", }, 
        { tipo: 5000, descripcion: "diferencia remesa", abreviatura: "dif rem", }, 
    ]; 

    $scope.windowClose = () => {
        window.close();
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = null;

    if (companiaSeleccionada) {
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) {
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }
    else {
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    $scope.currentStateName = "";

    $scope.goToState = function (state) {
        // para abrir alguno de los 'children' states ...
        // nótese como determinamos el nombre del 'current' state, pues lo mostramos como nombre de la opción en el navBar
        switch (state) {
            case "generales":
                $scope.currentStateName = "Generales";
                break;
            case "detalle":
                $scope.currentStateName = "Detalle";
                break;
            case "cuadre":
                $scope.currentStateName = "Cuadre";
                break;
        }

        $state.go("remesa." + state);
    }

    $scope.nuevo = function () {
        $scope.remesa = {};
        const today = new Date(); 

        $scope.remesa = {
            _id: new Mongo.ObjectID()._str,
            numero: 0,
            fecha: new Date(today.getFullYear(), today.getMonth(), today.getDate()), 
            instrumentoPago: {}, 
            ingreso: new Date(),
            usuario: Meteor.user().emails[0].address,
            cia: $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : null,
            docState: 1
        };

        $scope.alerts.length = 0;

        $scope.setIsEdited('fechaRemesa');      // para buscar y asignar el factor de cambio que corresponde a hoy 
    }

    $scope.nuevo0 = function () {
        // desde inicializarItem() se ejecuta nuevo(); la idea es hacer lo mismo para un Nuevo desde la lista o el filtro, o 
        // un Nuevo desde la remesa ... 
        $scope.id = "0"; 
        inicializarItem(); 
    }

    // -------------------------------------------------------------------------------------------
    // leemos los catálogos que necesitamos en el $scope
    $scope.helpers({
        companias: () => [],
        monedas: () => [],
        bancos: () => [],
        cuentasBancarias: () => [],
        listaCuentasBancarias: () => []
    })

    // ---------------------------------------------------------------
    // Grabar()
    // ---------------------------------------------------------------
    $scope.grabar = function () {

        // antes que nada, revisamos que haya algo que grabar
        if (!$scope.remesa.docState) {
            DialogModal($modal, "<em>Remesas</em>", "Aparentemente, <em>no se han efectuado cambios</em> en el registro. " +
                                "No hay nada que grabar.", false).then();
            return;
        }

        if ($scope.remesa.fechaCerrada) {
            // si la remesa está cerrada, solo permitimos modificar su asiento contable 
            const asientoContableModificado = lodash.some($scope.remesa.asientoContable, (p) => { return p.docState; }); 

            if (asientoContableModificado && $scope.remesa.docState != 3) { 
                DialogModal($modal, "<em>Remesas</em>",
                                    "La remesa está cerrada - lo único que se puede modificar es su asiento contable.<br />" +
                                    "Nota: solo cambios efectuados al asiento contable serán grabados.",
                                    false).then(
                                        () => { 
                                            grabar2(); 
                                        });
            } else { 
                DialogModal($modal, "<em>Remesas</em>",
                                    "La remesa está cerrada.<br />" +
                                    "Una remesa cerrada no puede ser modificada.<br /><br />" +
                                    "Ud. puede, sin embargo, <em>revertir</em> la remesa para eliminar sus pagos; " +
                                    "luego modificar la remesa y aplicar sus cobros/pagos nuevamente.",
                                    false).then();

                return;
            }
        } else { 
            grabar2(); 
        }
    }

    function grabar2() { 

        $scope.showProgress = true;
        
        // nótese como validamos antes de intentar guardar en el servidor
        var isValid = false;
        var errores = [];

        var item = {};

        item = $scope.remesa;

        if (item.docState != 3) {
            isValid = Remesas.simpleSchema().namedContext().validate(item);

            if (!isValid) {
                Remesas.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name +
                                "'; error de tipo '" + error.type + ".");
                });
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
            });

            $scope.showProgress = false;
            return;
        }

        Meteor.call('remesasSave', item, (err, result)  => {
            
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

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result
            });

            // cuando el usuario agrega un nuevo item, y viene desde un filtro, el item no estará en la lista (a menos que cumpla con el 'criterio'
            // de selección ???). Por eso, hacemos un subscription solo del nuevo item. Como no destruimos el 'handle' del subscription anterior
            // (que creó la lista), el nuevo item se agregará a la lista ....

            if (item.docState == 1) {
                var filtro = { _id: item._id };

                Meteor.subscribe('remesas', JSON.stringify(filtro), () => {
                    $scope.remesa = {};

                    $scope.helpers({
                        remesa: () => {
                            return Remesas.findOne(item._id);
                        },
                    })
                    
                    $scope.showProgress = false;
                    $scope.$apply();
                })
            }
            else {
                $scope.remesa = {};

                $scope.helpers({
                    remesa: () => {
                        return Remesas.findOne(item._id);
                    },
                })

                $scope.showProgress = false;
                $scope.$apply();
            }
        })
    }

    $scope.regresarALista = function () {

        if ($scope.remesa.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Remesas</em>",
                                    "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                    true);

            promise.then(
                function () {
                    $state.go('remesasLista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
                },
                function () {
                    return true;
                });

            return;
        }
        else {
            $state.go('remesasLista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
        }
    }


    $scope.eliminar = function () {
        if ($scope.remesa.docState && $scope.remesa.docState == 1) {
            if ($scope.remesa.docState) {
                DialogModal($modal,
                            "<em>Remesas</em>",
                            "El registro es nuevo; para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                            false).then();
                return;
            }
        }

        // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
        $scope.remesa.docState = 3;
    }

    $scope.refresh = function () {

        if ($scope.remesa.docState) {
            var promise = DialogModal($modal,
                                    "<em>Remesas</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa y refresca el registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios?",
                                    true);

            promise.then(
                function () {
                    inicializarItem();
                },
                function () {
                    return true;
                });

            return;
        }
        else {
            inicializarItem();
        }
    }

    $scope.setIsEdited = async function (fieldName) {

        if (fieldName === 'compania') {
            // asignamos el mi/su dependiendo del tipo de la compañía 
            if ($scope.remesa.compania) {
                const compania = Companias.findOne($scope.remesa.compania);
                if (compania) {
                    switch (compania.tipo) { 
                        case 'SEG': 
                            $scope.remesa.miSu = "SU"; 
                            break; 
                        case 'REA': 
                            $scope.remesa.miSu = "MI"; 
                            break; 
                    }
                }
            }
        }

        if (fieldName === 'cuentaBancaria') {
            // asignamos el banco, cada vez que el usuario cambia la cuenta bancaria
            if ($scope.remesa.instrumentoPago.cuentaBancaria) {
                const cuentaBancaria = CuentasBancarias.findOne($scope.remesa.instrumentoPago.cuentaBancaria);
                if (cuentaBancaria) {
                    $scope.remesa.instrumentoPago.banco = cuentaBancaria.banco;
                }
            }
        }

        if (fieldName === 'banco') {
            // cuando el usuario indica el banco, asignamos la 1ra. de sus cuentas bancarias 
            if ($scope.remesa.instrumentoPago.banco) { 

                const banco = $scope.remesa.instrumentoPago.banco; 

                // leemos las cuentas bancarias que corresponden al banco 
                Meteor.subscribe("leer.cuentasBancarias.banco", banco, () => { 

                    $scope.helpers({
                        cuentasBancarias: () => CuentasBancarias.find({ banco: banco }, { sort: { numero: 1 }})
                    })

                    // preparamos una lista especial para mostrar las cuentas bancarias en el ddl 
                    const listaCuentasBancarias = prepararListaCuentasBancarias($scope.cuentasBancarias); 

                    $scope.helpers({
                        listaCuentasBancarias: () => listaCuentasBancarias
                    })

                    if (listaCuentasBancarias.length) { 
                        // intentamos asignar la 1ra de las cuentas del banco al input de cuentas bancarias 
                        $scope.remesa.instrumentoPago.cuentaBancaria = listaCuentasBancarias[0]._id; 
                    }

                    $scope.showProgress = false;
                    $scope.$apply();
                })
            }
        }

        if (fieldName === 'fechaRemesa') {
            if ($scope.remesa.fecha) {
                $scope.remesa.instrumentoPago.fecha = $scope.remesa.fecha;

                // ejecutamos un method en el server para leer el factor de cambio asignado a la remesa más reciente ... 
                $scope.showProgress = true;

                let result = null; 

                try { 
                    result = await method_remesa_leerFactorCambioRemesaReciente($scope.remesa.fecha); 

                    if (result.error) { 
                        const errorMessage = result.message;

                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'warning',
                            msg: errorMessage
                        });

                        $scope.showProgress = false;
                        $scope.$apply();

                        return;
                    }

                    // encontramos una remesa grabada antes a ésta; usamos su factor de cambio como  un default para ésta ... 
                    $scope.remesa.factorCambio = result.factorCambio; 

                    $scope.showProgress = false;
                    $scope.$apply();

                } catch(err) { 

                    const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });

                    $scope.showProgress = false;
                    $scope.$apply();
                }
            }
        }

        if (!$scope.remesa.docState) {
            $scope.remesa.docState = 2;
        } 
    }


    $scope.exportarCuadreRemesaMicrosoftExcel = () => {
    $modal.open({
        templateUrl: 'client/html/remesas/exportarExcelModal/remesaCuadreExportarExcel_Modal.html',
        controller: 'RemesaCuadreExportarExcel_Modal_Controller',
        size: 'md',
        resolve: {
            remesa: () => {
                return $scope.remesa;
            },
            ciaSeleccionada: () => {
                return $scope.companiaSeleccionada;
            },
        },
    }).result.then(
        function () {
            return true;
        },
        function () {
            return true;
        })
    }

    $scope.remesaCuadreAsientoContable = () => {
        $modal.open({
            templateUrl: 'client/html/remesas/asientoContable/asientoContable_Modal.html',
            controller: 'RemesaCuadreAsientoContable_Modal_Controller',
            size: 'lg',
            resolve: {
                remesa: () => {
                    return $scope.remesa;
                },
                tiposCuentaContable: () => { 
                    return $scope.tiposCuentaContable;  
                }, 
                cuentasContablesLista: () => { 
                    return $scope.cuentasContablesLista; 
                },
                cuentasContables: () => { 
                    return $scope.cuentasContables; 
                }, 
                ciaSeleccionada: () => {
                    return $scope.companiaSeleccionada;
                },
            },
        }).result.then(
              function () {
                  return true;
              },
              function () {
                  return true;
              });
    }


    // ---------------------------------------------------------------------------
    // grid para mostrar el 'cuadre' de la remesa
    // ---------------------------------------------------------------------------
    let cuadreRemesas_ui_grid_gridApi = null;

    $scope.cuadreRemesas_ui_grid = {
        enableSorting: false,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: true,
        selectionRowHeaderWidth: 0,
    //   rowHeight: 25,

        enableFiltering: false,
        treeRowHeaderAlwaysVisible: false,

        onRegisterApi: function( gridApi ) {
            cuadreRemesas_ui_grid_gridApi = gridApi;

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    if (!$scope.remesa.docState)
                        $scope.remesa.docState = 2;
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

    $scope.cuadreRemesas_ui_grid.columnDefs = [
        {
            name: 'descripcionTransaccion',
            // field: 'numeroTransaccion',
            displayName: 'Transacción',
            grouping: { groupPriority: 0 },
            sort: { priority: 0, direction: 'asc' },
            width: '180',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string',
            cellTemplate: '<div><div ng-if="!col.grouping || col.grouping.groupPriority === undefined || col.grouping.groupPriority === null || ( row.groupHeader && col.grouping.groupPriority === row.treeLevel )" class="ui-grid-cell-contents" title="TOOLTIP">{{COL_FIELD CUSTOM_FILTERS}}</div></div>'
        },
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 50,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'tipo',
            field: 'tipo',
            // displayName: 'Tipo',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            width: 100,
            enableColumnMenu: false,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposCuentaContable,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposCuentaContable:"tipo":"descripcion"',

            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'codigo',
            field: 'codigo',
            displayName: 'Cuenta',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            width: 140,
            enableColumnMenu: false,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'cuenta',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.cuentasContablesLista,
            cellFilter: 'mapDropdown:row.grid.appScope.cuentasContablesLista:"cuenta":"descripcion"',

            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            width: 100,
            enableColumnMenu: false,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'abreviatura',
            editDropdownOptionsArray: $scope.companias,
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"abreviatura"',

            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            width: 200,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'referencia',
            field: 'referencia',
            // displayName: 'Referencia',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            width: 100,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 50,
            enableColumnMenu: false,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',

            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'monto',
            field: 'monto',
            // displayName: 'Monto',
            cellFilter: 'currencyFilter',     // standard filter; si usamos nuestro currencyFilter se obtiene un error al intentar el aggregate
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            width: 100,
            enableColumnMenu: false,
            enableCellEdit: true,

            // estas lineas permitem obtener un total para el grupo, por ejemplo para uno de los cobros o pagos de prima, etc. 
            treeAggregationType: uiGridGroupingConstants.aggregation.SUM,
            customTreeAggregationFinalizerFn: function( aggregation ) {
                    aggregation.rendered = aggregation.value;
                }, 

            type: 'number',
        },
    ]

    // -------------------------------------------------------------------------
    // para inicializar el item (en el $scope) cuando el usuario abre la página
    // -------------------------------------------------------------------------
    $scope.remesaCuadreSimpleArray = [];

    async function inicializarItem() {
        
        $scope.showProgress = true;

        if ($scope.id == "0") {
            // el id viene en '0' cuando el usuario hace un click en Nuevo ...
            await $scope.nuevo(); 

            // suscibimos a las cuentas contables para mostrar el catálogo (ddl) en el cuadre ... 
            await subscribe_cuentasContablesSoloDetalles(); 

            $scope.helpers({
                cuentasContables: () => {
                    return CuentasContables.find({ cia: companiaSeleccionadaDoc._id }, { sort: { cuenta: 1 } });
                },
            })

            // preparamos una lista de cuentas, que permita mostrar en el ddl en el ui-grid, 'cuenta-desc' en vez de 
            // solo descripción 
            $scope.cuentasContablesLista = $scope.cuentasContables.map((c) => { 
                return { 
                    cuenta: c.cuenta, 
                    descripcion: `${c.cuenta} - ${c.descripcion}`
                }
            })

            $scope.cuadreRemesas_ui_grid.columnDefs[3].editDropdownOptionsArray = $scope.cuentasContablesLista; 

            // inicialmente, mostramos el state 'generales'
            $state.go('remesa.generales').then(() => { 

                const inputFecha = document.getElementById("fecha"); 
                if (inputFecha) { 
                    inputFecha.focus(); 
                }

                $scope.currentStateName = "Generales";

                $scope.showProgress = false;
                // $scope.$apply();
            });
        }
        else {
            if ($scope.vieneDeAfuera) { 
                // cuando la página se abre en un nuevo window, los catálogos, etc., no están en minimongo y hay que 
                // cargarlos; en este caso, la remesa tampoco existe y debe ser cargada con un subscribe ...    

                // con la remesa leemos y cargamos también las compañías, para que existan en minimongo .. 
                Meteor.subscribe('remesas.vieneDeAfuera', $scope.id, () => { 

                    $scope.helpers({
                        remesa: () => {
                            return Remesas.findOne($scope.id);
                        },
                    })

                    // ------------------------------------------------------------------------------------------------
                    // leemos la compañía seleccionada
                    const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
                    let companiaSeleccionadaDoc = null;

                    if (companiaSeleccionada) {
                        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
                    }

                    $scope.companiaSeleccionada = {};

                    if (companiaSeleccionadaDoc) {
                        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
                    }
                    else {
                        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
                    }
                    // ------------------------------------------------------------------------------------------------
        
                    Meteor.subscribe('cuotas', JSON.stringify({ 'pagos.remesaID': { $in: [$scope.id] }}), async () => {
                        // recorremos las cuotas y extraemos los pagos que corresponden justo a la remesa; recuérdese que una cuota puede tener,
                        // en su array de pagos, pagos que corresopan a varias remesas diferentes ...
                        var cuotas = Cuotas.find().fetch();
        
                        var pagos = [];
        
                        cuotas.forEach(function (cuota) {
                            var pagosCuotas = lodash.filter(cuota.pagos, function (p) { return p.remesaID === $scope.id; });
        
                            var pago = {};
        
                            pagosCuotas.forEach(function (p) {
        
                                pago = {};
        
                                pago.cuota = cuota;
        
                                pago.moneda = p.moneda;
                                pago.fecha = p.fecha;
                                pago.monto = p.monto;
                                pago.completo = p.completo;
        
                                pagos.push(pago);
                            });
        
                            $scope.pagosRemesa = pagos;
                        })
        
                        // suscibimos a las cuentas contables para mostrar el catálogo (ddl) en el cuadre ... 
                        await subscribe_cuentasContablesSoloDetalles(); 
        
                        $scope.helpers({
                            cuentasContables: () => {
                                return CuentasContables.find({ cia: companiaSeleccionadaDoc._id }, { sort: { cuenta: 1 } });
                            },
                        })
    
                        // preparamos una lista de cuentas, que permita mostrar en el ddl en el ui-grid, 'cuenta-desc' en vez de 
                        // solo descripción 
                        $scope.cuentasContablesLista = $scope.cuentasContables.map((c) => { 
                            return { 
                                cuenta: c.cuenta, 
                                descripcion: `${c.cuenta} - ${c.descripcion}`
                            }
                        })
    
                        $scope.cuadreRemesas_ui_grid.columnDefs[3].editDropdownOptionsArray = $scope.cuentasContablesLista; 
    
                        mostrarCuadreRemesa(); 
    
                        // protegemos la entidad si corresponde a un período cerrado ... 
                        const protegeEntidad = new ProtegerEntidades([ $scope.remesa ], $scope.companiaSeleccionada._id); 
                        protegeEntidad.proteger_periodoCerrado(); 
    
                        $scope.cuadreRemesas_ui_grid.data = $scope.remesaCuadreSimpleArray;
    
                        // ------------------------------------------------------------------------------------------------------------
                        // finalmente, suscribimos a los datos 'iniciales' necesarios para mostrar la remesa; comúnmente, son los 
                        // catálogos, como: compañía, moneda, banco, cuenta bancaria ... 
                        Meteor.subscribe('remesa.loadInitialData', $scope.remesa.compania, 
                                                                    $scope.remesa.moneda, 
                                                                    $scope.remesa.instrumentoPago.banco, 
                                                                    $scope.remesa.instrumentoPago.cuentaBancaria, 
                            () => { 

                                $scope.helpers({
                                    companias: () => Companias.find(),
                                    monedas: () => Monedas.find(),
                                    bancos: () => Bancos.find(),
                                    cuentasBancarias: () => CuentasBancarias.find()
                                })

                                // preparamos una lista especial para mostrar las cuentas bancarias en el ddl 
                                const listaCuentasBancarias = prepararListaCuentasBancarias($scope.cuentasBancarias); 

                                $scope.helpers({
                                    listaCuentasBancarias: () => listaCuentasBancarias
                                })

                                // inicialmente, mostramos el state 'generales'
                                $state.go('remesa.generales').then(() => { 

                                    const inputFecha = document.getElementById("fecha"); 
                                    if (inputFecha) { 
                                        inputFecha.focus(); 
                                    }

                                    $scope.currentStateName = "Generales";

                                    $scope.showProgress = false;
                                    // $scope.$apply();
                                });
                            }
                        )
                    })
                })
            } else { 
                // la página se abre en forma normal, desde el filtro/lista; la remesa existe en minimongo ... 
                $scope.helpers({
                    remesa: () => {
                        return Remesas.findOne($scope.id);
                    },
                })
    
                Meteor.subscribe('cuotas', JSON.stringify({ 'pagos.remesaID': { $in: [$scope.id] }}), async () => {
                    // recorremos las cuotas y extraemos los pagos que corresponden justo a la remesa; recuérdese que una cuota puede tener,
                    // en su array de pagos, pagos que corresopan a varias remesas diferentes ...
                    var cuotas = Cuotas.find().fetch();
    
                    var pagos = [];
    
                    cuotas.forEach(function (cuota) {
                        var pagosCuotas = lodash.filter(cuota.pagos, function (p) { return p.remesaID === $scope.id; });
    
                        var pago = {};
    
                        pagosCuotas.forEach(function (p) {
    
                            pago = {};
    
                            pago.cuota = cuota;
    
                            pago.moneda = p.moneda;
                            pago.fecha = p.fecha;
                            pago.monto = p.monto;
                            pago.completo = p.completo;
    
                            pagos.push(pago);
                        });
    
                        $scope.pagosRemesa = pagos;
                    })
    
                    // suscibimos a las cuentas contables para mostrar el catálogo (ddl) en el cuadre ... 
                    await subscribe_cuentasContablesSoloDetalles(); 
    
                    $scope.helpers({
                        cuentasContables: () => {
                            return CuentasContables.find({ cia: companiaSeleccionadaDoc._id }, { sort: { cuenta: 1 } });
                        },
                    })

                    // preparamos una lista de cuentas, que permita mostrar en el ddl en el ui-grid, 'cuenta-desc' en vez de 
                    // solo descripción 
                    $scope.cuentasContablesLista = $scope.cuentasContables.map((c) => { 
                        return { 
                            cuenta: c.cuenta, 
                            descripcion: `${c.cuenta} - ${c.descripcion}`
                        }
                    })

                    $scope.cuadreRemesas_ui_grid.columnDefs[3].editDropdownOptionsArray = $scope.cuentasContablesLista; 

                    mostrarCuadreRemesa(); 

                    // protegemos la entidad si corresponde a un período cerrado ... 
                    const protegeEntidad = new ProtegerEntidades([ $scope.remesa ], $scope.companiaSeleccionada._id); 
                    protegeEntidad.proteger_periodoCerrado(); 

                    $scope.cuadreRemesas_ui_grid.data = $scope.remesaCuadreSimpleArray;

                    // ------------------------------------------------------------------------------------------------------------
                    // finalmente, suscribimos a los datos 'iniciales' necesarios para mostrar la remesa; comúnmente, son los 
                    // catálogos, como: compañía, moneda, banco, cuenta bancaria ... 
                    Meteor.subscribe('remesa.loadInitialData', $scope.remesa.compania, 
                                                                $scope.remesa.moneda, 
                                                                $scope.remesa.instrumentoPago.banco, 
                                                                $scope.remesa.instrumentoPago.cuentaBancaria, 
                        () => { 

                            $scope.helpers({
                                companias: () => Companias.find(),
                                monedas: () => Monedas.find(),
                                bancos: () => Bancos.find(),
                                cuentasBancarias: () => CuentasBancarias.find()
                            })

                            // preparamos una lista especial para mostrar las cuentas bancarias en el ddl 
                            const listaCuentasBancarias = prepararListaCuentasBancarias($scope.cuentasBancarias); 

                            $scope.helpers({
                                listaCuentasBancarias: () => listaCuentasBancarias
                            })

                            // inicialmente, mostramos el state 'generales'
                            $state.go('remesa.generales').then(() => { 

                                const inputFecha = document.getElementById("fecha"); 
                                if (inputFecha) { 
                                    inputFecha.focus(); 
                                }

                                $scope.currentStateName = "Generales";

                                $scope.showProgress = false;
                                // $scope.$apply();
                            });
                        }
                    )
                })
            }
        }
    }

    inicializarItem();

    $scope.revertir = function () {
        // para permitir al usuario revertir la remesa ...
        if ($scope.remesa.docState) {

            DialogModal($modal, "<em>Remesas</em>",
                                "Aparentemente, el registro ha recibido modificaciones.<br />." +
                                "Ud. debe guardar los cambios antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if ($scope.remesa.protegida && $scope.remesa.protegida.protegida) {

            const razonProteccion = $scope.remesa.protegida.razon ? $scope.remesa.protegida.razon : "Razón invalida - Por favor revise."; 
        
            DialogModal($modal, "<em>Remesas</em>",
                                `La remesa está <em><b>protegida</b></em>. No puede ser alterada.<br />
                                La razón de la protección es: <em>${razonProteccion}</em>`,
                                false).then();

            return;
        }

        DialogModal($modal, "<em>Remesas</em>",
                            "Esta operación <em>revertirá la remesa</em>; es decir, eliminará cada cobro/pago asociado a la remesa y dejará la remesa en estado <b><em>'abierta'</em></b><br /><br />." +
                            "Desea continuar con este proceso y revertir los cobros/pagos aplicados con esta remesa?",
                            true).then(
                            function () {
                                revertirRemesa();
                            },
                            function () {
                                return;
                            })

    }

    function revertirRemesa() {
        $scope.showProgress = true;

        Meteor.call('remesas.revertir', $scope.remesa._id, (err)  => {
        
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

            $scope.pagosRemesa = [];

            $scope.remesaCuadreSimpleArray = [];
            $scope.cuadreRemesas_ui_grid.data = [];

            DialogModal($modal, "<em>Remesas</em>",
                                `Ok, la remesa ha sido <em>revertida</em>; su estado ahora es
                                <b><em>'abierta'</em></b><br /><br />.`,
                                false).then();

            $scope.showProgress = false;
            $scope.$apply();
        })
    }

    $scope.obtenerCuadreRemesa = () => {
        if ($scope.remesa.docState && $scope.origen == 'edicion') {
            DialogModal($modal, "<em>Remesas</em>",
                                "Aparentemente, la remesa ha recibido cambios; por favor " +
                                "guarde los cambios antes de intentar ejecutar esta función.",
                                false);
            return;
        }

        if (!$scope.remesa.fechaCerrada) {
            DialogModal($modal, "<em>Remesas</em>",
                                `Aparentemente, a la remesa no se le han asociado cobros/pagos aún, y su estado no
                                es <em>cerrada</em>.<br /><br />
                                Por esa razón, Ud. no debe intentar obtener un <em>cuadre</em> para la misma.<br /><br />
                                Ud. debe ejecutar la opción <em>Cobranzas/Cobranza</em> para asociar cuotas de
                                pago/cobro a la remesa.<br /><br />
                                Luego, puede regresar a esta opción y obtener el <em>cuadre</em> para la remesa.`,
                                false);
            return;
        }


        if ($scope.remesa.cuadre && $scope.remesa.cuadre.length) {
            DialogModal($modal, "<em>Remesas</em>",
                                `Esta remesa <b>ya contiene</b> un <em>cuadre</em> registrado. Seguramente,
                                el mismo fue construido usando esta misma función.<br /><br />
                                Si Ud. continúa, el mismo será eliminado y un nuevo <em>cuadre</em>
                                será construido y registrado en su lugar.<br /><br />
                                Desea continuar y registrar un nuevo <em>cuadre</em> para la remesa?`,
                                true).then(
                function () {
                    obtenerCuadreRemesa($scope.remesa._id);
                    mostrarCuadreRemesa(); 
                },
                function () { return true; }
                );

            return;
        }
        else {
            obtenerCuadreRemesa($scope.remesa._id);
            mostrarCuadreRemesa(); 
        }
    }


    function obtenerCuadreRemesa(remesaID) {

        $modal.open({
            templateUrl: 'client/html/remesas/obtenerCuadreRemesaModal/obtenerCuadreRemesa_Modal.html',
            controller: 'RemesaCuadreObtener_Modal_Controller',
            size: 'md',
            resolve: {
                remesaID: () => {
                    return remesaID;
                },
                ciaSeleccionada: () => {
                    return $scope.companiaSeleccionada;
                },
            },
        }).result.then(
            function () {
                // el cuadre se construyó y registró en el servidor. No debe estar en el cliente ahora. Por eso, hacemos un subscribe 
                // de la remesa ... 
                Meteor.subscribe('remesas', JSON.stringify({ '_id': remesaID }), () => { 

                    $scope.alerts.length = 0;

                    // refrescamos el helper 
                    $scope.helpers({
                        remesa: () => {
                            return Remesas.findOne(remesaID);
                        },
                    })

                    // cuando el usuario produce el cuadre, cerramos el modal y regresamos a hacer un
                    // binding en el ui-grid ...
                    $scope.remesaCuadreSimpleArray = [];
                    $scope.cuadreRemesas_ui_grid.data = $scope.remesaCuadreSimpleArray;

                    // convertimos el cuadre de la remesa a un arreglo simple (ahora tiene una jerarquía, cada
                    // transacción tiene varias partidas) ...
                    // la idea es pasar a ui-grid un arreglo simple (y no de objetos con objetos), para que lo
                    // muestre en forma jararquica. probablemente, en un futuro, ui-grid podrá manejar el arreglo
                    // con un graph más complejo
                    if (lodash.isArray($scope.remesa.cuadre)) {
                        const simpleArray = [];
                        $scope.remesa.cuadre.forEach(item => {
                            item.partidas.forEach(p => {
                                const partida = { numeroTransaccion: item.transaccion.numero,
                                    descripcionTransaccion: `${item.transaccion.numero} - ${item.transaccion.descripcion}`,
                                    numero: p.numero,
                                    tipo: p.tipo,
                                    codigo: p.codigo,
                                    compania: p.compania,
                                    descripcion: p.descripcion,
                                    referencia: p.referencia,
                                    moneda: p.moneda,
                                    monto: p.monto
                                };
                                simpleArray.push(partida);
                            });
                        })

                        if (lodash.isArray(simpleArray)) {
                            $scope.remesaCuadreSimpleArray = simpleArray;
                            $scope.cuadreRemesas_ui_grid.data = $scope.remesaCuadreSimpleArray;
                        }
                    }
    
                    $scope.showProgress = false;
                    $scope.$apply();

                    // intentamos refrescar el ui-grid ... 
                    cuadreRemesas_ui_grid_gridApi.core.refresh();

                    // como no supimos como refrescar el ui-grid luego que ha creado el cuadre, lo único que logramos hacer fue 
                    // refrescar el state, pero iendo a uno y luego regresando. No es la forma más elegante, pero seguro funciona, 
                    // hasta que logremos agregar el código adecuado que refresque el ui-grid sin cambiar el state ... 
                    $scope.goToState('detalle'); 
                    DialogModal($modal,
                        "<em>Remesas</em>",
                        `Ok, el <em>cuadre de la remesa</em> ha sido construido.<br /><br />
                        `, false).then(
                            function () {
                                $scope.goToState('cuadre'); 
                            },
                            function () { 
                                $scope.goToState('cuadre'); 
                            }
                        )
            })
        },
        function () {
            // el usuario cerro el modal sin produjo el cuadre ...
            return true;
        })
    }

    function mostrarCuadreRemesa() { 
        // convertimos el cuadre de la remesa a un arreglo simple (ahora tiene una jerarquía, cada
        // cada transacción tiene varias partidas) ...
        // la idea es pasar a ui-grid un arreglo simple (y no de objetos con objetos), para que lo muestre en forma
        // jararquica. probablemente, en un futuro, ui-grid podrá manejar el arreglo con un graph más complejo
        if (lodash.isArray($scope.remesa.cuadre)) {
            const simpleArray = [];
            $scope.remesa.cuadre.forEach(item => {
                item.partidas.forEach(p => {
                    const partida = { numeroTransaccion: item.transaccion.numero,
                                    descripcionTransaccion: `${item.transaccion.numero} - ${item.transaccion.descripcion}`,
                                    numero: p.numero,
                                    tipo: p.tipo,
                                    codigo: p.codigo,
                                    compania: p.compania,
                                    descripcion: p.descripcion,
                                    referencia: p.referencia,
                                    moneda: p.moneda,
                                    monto: p.monto
                                };
                    simpleArray.push(partida);
                })
            })

            if (lodash.isArray(simpleArray)) {
                $scope.remesaCuadreSimpleArray = simpleArray;
            }
        }
    }

    $scope.importarRemesa = function() {
        // permitimos al usuario leer, en un nuevo asiento contable, alguno que se haya exportado a un text file ...
        const inputFile = angular.element("#fileInput");
        if (inputFile) { 
            inputFile.click();        // simulamos un click al input (file)
        }
    }

    $scope.uploadFile = function (files) {

        const userSelectedFile = files[0];

        if (!userSelectedFile) {

            const message = `Aparentemente, Ud. no ha seleccionado un archivo.<br />
                             Por favor seleccione un archivo que corresponda a un movimiento bancario 
                             <em>exportado desde contabm / bancos</em> antes.`; 

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });

            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) { 
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }
                
            return;
        }

        var reader = new FileReader();

        reader.onload = function(e) {
            try {
                var content = e.target.result;
                const remesa = JSON.parse(content);

                // el movimiento bancario en contabm tiene muchos más tipos; si no es alguno de estos tres, no inicializamos 
                switch (remesa.tipo) { 
                    case 'CH': 
                        $scope.remesa.instrumentoPago.tipo = "CH"; 
                        break; 
                    case 'DP': 
                        $scope.remesa.instrumentoPago.tipo = "DP"; 
                        break; 
                    case 'TR': 
                        $scope.remesa.instrumentoPago.tipo = "TR"; 
                        break; 
                }

                $scope.remesa.fecha = new Date(remesa.fecha); 
                $scope.remesa.instrumentoPago.fecha = new Date(remesa.fecha); 

                if (remesa.monto >= 0) { 
                    $scope.remesa.miSu = "MI"; 
                } else { 
                    $scope.remesa.miSu = "SU"; 
                }

                $scope.remesa.instrumentoPago.numero = remesa.transaccion; 
                $scope.remesa.observaciones = remesa.concepto; 

                $scope.remesa.instrumentoPago.monto = Math.abs(remesa.monto); 

                // el factor de cambio puede o no venir; en contabm lo tomamos del asiento asociado al movimiento bancario, pero 
                // éste no siempre existe 
                if (remesa.factorCambio) { 
                    $scope.remesa.factorCambio = remesa.factorCambio; 
                }

                const message = `Ok, los datos básicos de la remesa han sido importados desde el archivo de texto 
                                 que Ud. ha seleccionado.`; 

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: message
                });

                // con el método leemos la compañía (por su abreviatura) y la cuenta bancaria (por su número); 
                // junto con la cuenta bancaria traemos la moneda y el banco 

                // la compañía puede no venir, pues hay movimientos bancarios sin ella ... 
                const compania = remesa.compania && remesa.compania.abreviatura ? remesa.compania.abreviatura : ""; 

                Meteor.call('leerInfoAutos.importarRemesas', remesa.cuentaBancaria, compania, (err, result)  => {
            
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

                    if (result.compania && result.compania._id) { 
                        $scope.remesa.compania = result.compania._id; 
                    }

                    if (result.cuentaBancaria) { 
                        $scope.remesa.instrumentoPago.cuentaBancaria = result.cuentaBancaria._id; 
                        $scope.remesa.moneda = result.cuentaBancaria.moneda; 
                        $scope.remesa.instrumentoPago.banco = result.cuentaBancaria.banco; 
                    }

                    const inputFile = angular.element("#fileInput");
                    if (inputFile && inputFile[0] && inputFile[0].value) {
                        // para que el input type file "limpie" el file indicado por el usuario
                        inputFile[0].value = null;
                    }
        
                    if (result.error) { 
                        $scope.alerts.push({
                            type: 'danger',
                            msg: result.message
                        });
                    }

                    $scope.showProgress = false;
                    $scope.$apply();
                })
            }

            catch(err) {
                const message = err.message ? err.message : err.toString();

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: message
                });

                $scope.showProgress = false;
                $scope.$apply();
            }
        }

        $scope.showProgress = true; 
        reader.readAsText(userSelectedFile);
    }

    // para hacer el search de las compañías desde el server 
    $scope.searchCompanias = (search) => {

        $scope.uiSelectLoading = true; 

        Meteor.subscribe("search.companias", search, () => { 

            $scope.helpers({
                companias: () => Companias.find({ nombre: new RegExp(search, 'i') }, { sort: { nombre: 1 }})
            })

            $scope.uiSelectLoading = false;
            $scope.$apply();
        })
    }

    // para hacer el search de las monedas desde el server 
    $scope.searchMonedas = (search) => {

        $scope.uiSelectLoading = true; 

        Meteor.subscribe("search.monedas", search, () => { 

            $scope.helpers({
                monedas: () => Monedas.find({ descripcion: new RegExp(search, 'i') }, { sort: { descripcion: 1 }})
            })

            $scope.uiSelectLoading = false;
            $scope.$apply();
        })
    }

    // para hacer el search de las monedas desde el server 
    $scope.searchBancos = (search) => {

        $scope.uiSelectLoading = true; 

        Meteor.subscribe("search.bancos", search, () => { 

            $scope.helpers({
                bancos: () => Bancos.find({ nombre: new RegExp(search, 'i') }, { sort: { nombre: 1 }})
            })

            $scope.uiSelectLoading = false;
            $scope.$apply();
        })
    }

      // -------------------------------------------------------
      // pager - en 'detalles' (pagos) de la remesa
      $scope.currentPage = 1;
      $scope.pageSize = 10;
  }
])

function prepararListaCuentasBancarias (cuentasBancarias) { 

    // para agregar moneda y banco a la lista de cuentas bancarias; para que el usuario las identifique más fácilmente 
    const listaCuentasBancarias = []; 

    if (!cuentasBancarias || !Array.isArray(cuentasBancarias)) { 
        return []
    }

    cuentasBancarias.map((x) => {

        const moneda = Monedas.findOne(x.moneda);
        const banco = Bancos.findOne(x.banco);

        const cuentaBancaria = {
            _id: x._id,
            descripcion: `${banco && banco.abreviatura ? banco.abreviatura : 'Indefinido'} ${moneda && moneda.simbolo ? moneda.simbolo : 'Indefindo'} ${x.tipo} ${x.numero}`,
        }

        listaCuentasBancarias.push(cuentaBancaria)
    })

    return listaCuentasBancarias; 
}

const subscribe_cuentasContablesSoloDetalles = () => { 
    return new Promise((resolve) => { 
        Meteor.subscribe('cuentasContablesSoloDetalles', () => { resolve() })
    })
}

const method_remesa_leerFactorCambioRemesaReciente = (fecha) => { 
    return new Promise((resolve, reject) => { 

        Meteor.call('remesas.leerFactorCambioRemesaReciente', fecha, (err, result) => {

            if (err) { 
                reject(err); 
            }

            resolve(result); 
        }) 
    })
}