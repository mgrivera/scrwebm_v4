
import lodash from 'lodash'; 

import { ProtegerEntidades } from '../imports/generales/protegerEntidades'; 
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

angular.module("scrwebM").controller("RemesaController",
['$scope', '$state', '$stateParams', '$meteor', '$modal', 'uiGridConstants', 'uiGridGroupingConstants', 'uiGridConstants',
  function ($scope, $state, $stateParams, $meteor, $modal, uiGridConstants, uiGridGroupingConstants, uiGridConstants) {

    $scope.showProgress = false;

    $scope.origen = $stateParams.origen;
    $scope.id = $stateParams.id;
    $scope.pageNumber = $stateParams.pageNumber;
    // nótese que el boolean value viene, en realidad, como un string ...
    $scope.vieneDeAfuera = ($stateParams.vieneDeAfuera && $stateParams.vieneDeAfuera == "true");    // ej: cuando se abre desde la lista de cuotas ...

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
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
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
        // si existe una moneda 'por defecto', la asignamos
        let monedaDefault = Monedas.findOne({ defecto: true });

        $scope.remesa = {};
        $scope.remesa = {
            _id: new Mongo.ObjectID()._str,
            numero: 0,
            moneda: monedaDefault ? monedaDefault._id : null, 
            instrumentoPago: {}, 
            ingreso: new Date(),
            usuario: Meteor.userId(),
            cia: $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : null,
            docState: 1
        };

        // inicialmente, mostramos el state 'generales'
        $state.go("remesa.generales");
    }

    // -------------------------------------------------------------------------------------------
    // leemos los catálogos que necesitamos en el $scope
    $scope.helpers({
        companias: () => { return Companias.find({}, { sort: { simbolo: 1 }}); },
        monedas: () => { return Monedas.find({}, { sort: { simbolo: 1 }}); },
        bancos: () => { return Bancos.find({}, { sort: { abreviatura: 1 }}); },
        cuentasBancarias: () => {
            // las cuenas bancarias se registran para la cia seleccionada
            return CuentasBancarias.find({ cia: $scope.companiaSeleccionada._id });
        },
    })

    // creamos un array para mostrar la lista de cuentas bancarias al usuario ...
    $scope.listaCuentasBancarias = [];

    $scope.cuentasBancarias.map((x) => {

        let simboloMoneda = null;
        let abreviaturaBanco = null;

        if (Monedas.findOne(x.moneda)) {
            simboloMoneda = Monedas.findOne(x.moneda).simbolo;
        }

        if (Bancos.findOne(x.banco)) {
            abreviaturaBanco = Bancos.findOne(x.banco).abreviatura;
        }

        let cuentaBancaria = {
            _id: x._id,
            descripcion: `${abreviaturaBanco} ${simboloMoneda} ${x.tipo} ${x.numero}`,
        }

        $scope.listaCuentasBancarias.push(cuentaBancaria)
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
            let asientoContableModificado = lodash.some($scope.remesa.asientoContable, (p) => { return p.docState; }); 

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
            let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

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
                function (resolve) {
                    $state.go('remesasLista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
                },
                function (err) {
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
                function (resolve) {
                    inicializarItem();
                },
                function (err) {
                    return true;
                });

            return;
        }
        else {
            inicializarItem();
        }
    }

    $scope.setIsEdited = function (fieldName) {

        if (fieldName === 'compania') {
            // asignamos el mi/su dependiendo del tipo de la compañía 
            if ($scope.remesa.compania) {
                let compania = Companias.findOne($scope.remesa.compania);
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
                let cuentaBancaria = CuentasBancarias.findOne($scope.remesa.instrumentoPago.cuentaBancaria);
                if (cuentaBancaria) {
                    $scope.remesa.instrumentoPago.banco = cuentaBancaria.banco;
                }
            }
        }

        if (fieldName === 'banco') {
            // cuando el usuario indica el banco, asignamos la 1ra. de sus cuentas bancarias 
            if ($scope.remesa.instrumentoPago.banco) { 
                let cuentaBancaria = CuentasBancarias.findOne({ banco: $scope.remesa.instrumentoPago.banco }); 

                $scope.remesa.instrumentoPago.cuentaBancaria = null; 
                if (cuentaBancaria) { 
                    $scope.remesa.instrumentoPago.cuentaBancaria = cuentaBancaria._id; 
                }
            }
        }

        if (fieldName === 'fechaRemesa') {
            if ($scope.remesa.fecha) {
                $scope.remesa.instrumentoPago.fecha = $scope.remesa.fecha;

                // ejecutamos un method en el server para leer el factor de cambio asignado a la remesa más reciente ... 
                $scope.showProgress = true;

                Meteor.call('remesas.leerFactorCambioRemesaReciente', $scope.remesa.fecha, (err, result) => {

                    if (err) {
                        let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

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
                        let errorMessage = result.message;

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
                })
            }
        }

        if (!$scope.remesa.docState) {
            $scope.remesa.docState = 2;
        } 
    }


    $scope.exportarCuadreRemesaMicrosoftExcel = () => {
    let modalInstance = $modal.open({
        templateUrl: 'client/remesas/exportarExcelModal/remesaCuadreExportarExcel_Modal.html',
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
        function (resolve) {
            return true;
        },
        function (cancel) {
            return true;
        })
    }


    $scope.construirAsientoContable = () => {
        let modalInstance = $modal.open({
            templateUrl: 'client/remesas/exportarTexto/exportarArchivoTexto_Modal.html',
            controller: 'RemesaExportarArchivoTexto_Modal_Controller',
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
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    }


    // ---------------------------------------------------------------------------
    // grid para mostrar el 'cuadre' de la remesa
    // ---------------------------------------------------------------------------
    let cuadrePartidaSeleccionada = {};
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

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                cuadrePartidaSeleccionada = {};

                if (row.isSelected)
                    cuadrePartidaSeleccionada = row.entity;
                else
                    return;
            });

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

    function inicializarItem() {
        
        $scope.showProgress = true;

        if ($scope.id == "0") {
            // el id viene en '0' cuando el usuario hace un click en Nuevo ...
            $scope.nuevo(); 

            // suscibimos a las cuentas contables para mostrar el catálogo (ddl) en el cuadre ... 
            Meteor.subscribe('cuentasContablesSoloDetalles', () => { 

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

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
        else {
            if ($scope.vieneDeAfuera) { 
                // cuando la página se abre en un nuevo window, los catálogos, etc., no están en minimongo y hay que 
                // cargarlos; en este caso, la remesa tampoco existe y debe ser cargada con un subscribe ...    
                Remesas_SubscriptionHandle = null;

                // con la remesa leemos y cargamos también las compañías, para que existan en minimongo .. 

                Remesas_SubscriptionHandle = 
                Meteor.subscribe('remesas.vieneDeAfuera', $scope.id, () => { 

                    $scope.helpers({
                        remesa: () => {
                            return Remesas.findOne($scope.id);
                        },
                    })

                    // ------------------------------------------------------------------------------------------------
                    // leemos la compañía seleccionada
                    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
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
        
                    Meteor.subscribe('cuotas', JSON.stringify({ 'pagos.remesaID': { $in: [$scope.id] }}), () => {
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
                        Meteor.subscribe('cuentasContablesSoloDetalles', () => { 
        
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
                            let protegeEntidad = new ProtegerEntidades([ $scope.remesa ], $scope.companiaSeleccionada._id); 
                            protegeEntidad.proteger_periodoCerrado(); 
        
                            $scope.cuadreRemesas_ui_grid.data = $scope.remesaCuadreSimpleArray;
        
                            $scope.showProgress = false;
                            $scope.$apply();
                        })
                    })
                })
            } else { 
                // la página se abre en forma normal, desde el filtro/lista; la remesa existe en minimongo ... 
                $scope.helpers({
                    remesa: () => {
                        return Remesas.findOne($scope.id);
                    },
                })
    
                Meteor.subscribe('cuotas', JSON.stringify({ 'pagos.remesaID': { $in: [$scope.id] }}), () => {
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
                    Meteor.subscribe('cuentasContablesSoloDetalles', () => { 
    
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
                        let protegeEntidad = new ProtegerEntidades([ $scope.remesa ], $scope.companiaSeleccionada._id); 
                        protegeEntidad.proteger_periodoCerrado(); 
    
                        $scope.cuadreRemesas_ui_grid.data = $scope.remesaCuadreSimpleArray;
    
                        $scope.showProgress = false;
                        $scope.$apply();
                    })
                })
            }
        }

        // inicialmente, mostramos el state 'generales'
        $scope.currentStateName = "Generales";
        $state.go('remesa.generales');
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

            let razonProteccion = $scope.remesa.protegida.razon ? $scope.remesa.protegida.razon : "Razón invalida - Por favor revise."; 
        
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

        Meteor.call('remesas.revertir', $scope.remesa._id, (err, result)  => {
        
            if (err) {
                let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

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

    $scope.obtenerCuadreRemesa = remesaID => {
        if ($scope.remesa.docState && $scope.origen == 'edicion') {
            let promise = DialogModal($modal,
                                    "<em>Remesas</em>",
                                    "Aparentemente, la remesa ha recibido cambios; por favor " +
                                    "guarde los cambios antes de intentar ejecutar esta función.",
                                    false);
            return;
        }

        if (!$scope.remesa.fechaCerrada) {
            let promise = DialogModal($modal,
                                    "<em>Remesas</em>",
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
            let promise = DialogModal($modal,
                                    "<em>Remesas</em>",
                                    `Esta remesa <b>ya contiene</b> un <em>cuadre</em> registrado. Seguramente,
                                        el mismo fue construido usando esta misma función.<br /><br />
                                        Si Ud. continúa, el mismo será eliminado y un nuevo <em>cuadre</em>
                                        será construido y registrado en su lugar.<br /><br />
                                        Desea continuar y registrar un nuevo <em>cuadre</em> para la remesa?`,
                                    true);

            promise.then(
                function (resolve) {
                    obtenerCuadreRemesa($scope.remesa._id);
                    mostrarCuadreRemesa(); 
                },
                function (err) { return true; }
                );

            return;
        }
        else {
            obtenerCuadreRemesa($scope.remesa._id);
            mostrarCuadreRemesa(); 
        }
    }


    function obtenerCuadreRemesa(remesaID) {

        let modalInstance = $modal.open({
            templateUrl: 'client/remesas/obtenerCuadreRemesaModal/obtenerCuadreRemesa_Modal.html',
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
            function (resolve) {
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
                        let simpleArray = [];
                        $scope.remesa.cuadre.forEach(item => {
                            item.partidas.forEach(p => {
                                let partida = { numeroTransaccion: item.transaccion.numero,
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
                            function (resolve) {
                                $scope.goToState('cuadre'); 
                            },
                            function (err) { 
                                $scope.goToState('cuadre'); 
                            }
                        )
            })
        },
        function (cancel) {
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
            let simpleArray = [];
            $scope.remesa.cuadre.forEach(item => {
                item.partidas.forEach(p => {
                    let partida = { numeroTransaccion: item.transaccion.numero,
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

      // -------------------------------------------------------
      // pager - en 'detalles' (pagos) de la remesa
      $scope.currentPage = 1;
      $scope.pageSize = 10;
  }
])
