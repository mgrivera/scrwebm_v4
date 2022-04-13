
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import angular from 'angular';
import lodash from 'lodash';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { determinarSiExistenCuotasConCobrosAplicados } from '/client/imports/generales/determinarSiExistenCuotasCobradas'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { Siniestros } from '/imports/collections/principales/siniestros'; 
import { TiposSiniestro } from '/imports/collections/catalogos/tiposSiniestro'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { CausasSiniestro } from '/imports/collections/catalogos/causasSiniestro'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { MostrarPagosEnCuotas } from '/client/imports/generales/mostrarPagosAplicadosACuotaController'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { LeerCompaniaNosotros } from '/imports/generales/leerCompaniaNosotros';

angular.module("scrwebm").controller("SiniestroController",
['$scope', '$stateParams', '$state', '$uibModal', 'uiGridConstants',
function ($scope, $stateParams, $state, $uibModal, uiGridConstants) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = null;

    if (companiaContabSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaContabSeleccionada.companiaID, { fields: { nombre: 1 } });
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
            case "notas":
                $scope.currentStateName = "Notas";
                break;
            case "entidadDeOrigen":
                $scope.currentStateName = "Entidad de origen";
                break;
            case "companias":
                $scope.currentStateName = "Compañías";
                break;
            case "reservas":
                $scope.currentStateName = "Reservas";
                break;
            case "liquidaciones":
                $scope.currentStateName = "Liquidaciones";
                break;
            case "cuotas":
                $scope.currentStateName = "Cuotas";
                break;
        }

        $state.go("siniestro." + state);
    }

    $scope.origen = $stateParams.origen;
    $scope.id = $stateParams.id;
    $scope.pageNumber = $stateParams.pageNumber;

    // -------------------------------------------------------------------------------------------
    // leemos los catálogos en el $scope
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
        asegurados: () => {
            return Asegurados.find();
        },
        causasSiniestro: () => {
            return CausasSiniestro.find();
        },
        suscriptores: () => {
            return Suscriptores.find();
        },
        tiposSiniestro: () => {
            return TiposSiniestro.find();
        },
    })

    $scope.setIsEdited = function () {
        if ($scope.siniestro.docState) { 
            return;
        }
            
        $scope.siniestro.docState = 2;
    };

    $scope.regresarALista = function () {

        if ($scope.siniestro.docState && $scope.origen == 'edicion') {
            DialogModal($uibModal,
                                    "<em>Siniestros</em>",
                                    "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                    true).then(
                function () {
                    $state.go('siniestrosLista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
                },
                function () {
                    return true;
                });

            return;
        }
        else
            $state.go('siniestrosLista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
    };

    $scope.eliminar = function () {

        if ($scope.siniestro.docState && $scope.siniestro.docState == 1) {
            if ($scope.siniestro.docState) {
                DialogModal($uibModal,
                                        "<em>Siniestros</em>",
                                        "El registro es nuevo; para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                                        false).then(
                    function () {
                        return;
                    },
                    function () {
                        return;
                    });

                return;
            }
        }

        // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
        $scope.siniestro.docState = 3;
    };

    $scope.imprimir = () => {

        if (!$scope.siniestro || lodash.isEmpty($scope.siniestro)) {
            DialogModal($uibModal, "<em>Siniestros - Construcción de notas de siniestro</em>",
            "Aparentemente, el siniestro para el cual Ud. desea construir las notas, no ha sido completado y registrado aún.",
            false).then();
            return;
        }

        $uibModal.open({
            templateUrl: 'client/siniestros/imprimirNotasModal.html',
            controller: 'ImprimirNotasModalController',
            size: 'lg',
            resolve: {
                siniestro: function () {
                    return $scope.siniestro;
                }
            }
        }).result.then(
            function () {
                return true;
            },
            function () {
                return true;
            });
    }

    $scope.registroDocumentos = function() {

        $uibModal.open({
            templateUrl: 'client/generales/registroDocumentos.html',
            controller: 'RegistroDocumentosController',
            size: 'md',
            resolve: {
                entidad: function () {
                    return $scope.siniestro;
                },
                documentos: function () {
                    if (!Array.isArray($scope.siniestro.documentos))
                    $scope.siniestro.documentos = [];

                    return $scope.siniestro.documentos;
                },
                tiposDocumentoLista: function () {
                    return [ { tipo: 'SINCED', descripcion: 'Número siniestro cedente'} ];
                }
            }
        }).result.then(
            function () {
                return true;
            },
            function () {
                return true;
            });
    }

    $scope.registrarPersonasCompanias = function () {

        if (!$scope.siniestro || !$scope.siniestro.compania) {
            DialogModal($uibModal, "<em>Siniestros</em>",
                "Aparentemente, Ud. no ha seleccionado una compañía cedente para este siniestro.<br />" +
                "El siniestro debe tener una compañía cedente antes de intentar registrar sus personas.",
                false).then();

            return;
        }

        $uibModal.open({
            templateUrl: 'client/imports/generales/registrarPersonasAEntidad/registrarPersonas.html',
            controller: 'RegistrarPersonasController',
            size: 'lg',
            resolve: {
                companias: () => {
                    // pasamos un array con las compañías que se han definido para el riesgo (ced y reasegs)
                    const companias = [];
                    const siniestro = $scope.siniestro;

                    companias.push(siniestro.compania); 
                
                    if (Array.isArray(siniestro.companias)) {
                        siniestro.companias.forEach(c => {
                            if (!c.nosotros) {
                                if (!companias.some(x => x.compania === c.compania)) {
                                    companias.push(c.compania);
                                }
                            }
                        });
                    }

                    return companias;
                },
                personas: function () {
                    // pasamos un array con las personas (si hay) asociadas al siniestro 
                    const siniestro = $scope.siniestro;
                    return siniestro && siniestro.personas ? siniestro.personas : [];
                }
            }
        }).result.then(
            function (result) {
                // recuperamos las personas de compañías, según las indicó el usuario en el modal
                if (result.personas.some(x => x.docState)) {
                    // sustituimos las personas en el riesgo por las recibidas desde el modal 
                    $scope.siniestro.personas = [];
                    const personas = result.personas && Array.isArray(result.personas) ? result.personas : [];
                    personas.forEach(p => $scope.siniestro.personas.push(p));

                    if (!$scope.siniestro.docState) {
                        $scope.siniestro.docState = 2;
                    }
                }

                return true;
            },
            function () {
                return true;
            }
        )
    }

    // --------------------------------------------------------------------
    // grid de compañías
    // --------------------------------------------------------------------
    let companiaSeleccionada = {};

    $scope.companias_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: false,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                companiaSeleccionada = {};

                if (row.isSelected) {
                    companiaSeleccionada = row.entity;
                }
                else
                    return;
            });
            // marcamos el item como 'editado', cuando el usuario modifica un valor en el grid ...
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                if (newValue != oldValue)
                    if (!$scope.siniestro.docState)
                        $scope.siniestro.docState = 2;
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

    $scope.companias_ui_grid.columnDefs = [
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 180,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: lodash.chain($scope.companias).
                                        filter(function(c) { return (c.nosotros || c.tipo == 'REA' || c.tipo == "CORRR") ? true : false; }).
                                        sortBy(function(item) { return item.nombre; }).
                                        value(),
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"nombre"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'nosotros',
            field: 'nosotros',
            displayName: 'Nosotros',
            cellFilter: 'boolFilter',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'boolean'
        },
        {
            name: 'tipoCompania',
            field: 'compania',
            displayName: 'Tipo',
            cellFilter: 'tipoCompania2Filter',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: 'ordenPorc',
            field: 'ordenPorc',
            displayName: 'Orden',
            cellFilter: 'number6decimals',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
    ]

    $scope.agregarCompania = function () {

        if (!Array.isArray($scope.siniestro.companias))
            $scope.siniestro.companias = [];

        const compania = {
            _id: new Mongo.ObjectID()._str,
            nosotros: false
        };

        $scope.siniestro.companias.push(compania);

        if (!$scope.siniestro.docState)
            $scope.siniestro.docState = 2;

        $scope.companias_ui_grid.data = $scope.siniestro.companias;
    }

    $scope.eliminarCompania = function () {

        if (!companiaSeleccionada || lodash.isEmpty(companiaSeleccionada)) {
            DialogModal($uibModal, "<em>Siniestros - Eliminar compañías</em>",
                                "Ud. debe seleccionar en la lista, la compañía que desea eliminar.",
                                false).then();
            return;
        }

        lodash.remove($scope.siniestro.companias, function (c) { return c._id === companiaSeleccionada._id; });

        if (!$scope.siniestro.docState)
            $scope.siniestro.docState = 2;
    }

    $scope.refrescarGridCompanias = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        const companiasParaListaUIGrid = lodash.chain($scope.companias).
                                    filter(function(c) { return (c.nosotros || c.tipo == 'REA' || c.tipo == "CORRR") ? true : false; }).
                                    sortBy(function(item) { return item.nombre; }).
                                    value();

        $scope.companias_ui_grid.columnDefs[0].editDropdownOptionsArray = companiasParaListaUIGrid;
    }

    // --------------------------------------------------------------------
    // grid de reservas
    // --------------------------------------------------------------------
    $scope.tiposReserva = [
        { tipo: 'NOT', descripcion: 'Notificación' },
        { tipo: 'AUM', descripcion: 'Aumento' },
        { tipo: 'DIS', descripcion: 'Disminución' },
        { tipo: 'ANU', descripcion: 'Anulada' }
    ];

    $scope.reservas_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {
            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    if (!$scope.siniestro.docState)
                        $scope.siniestro.docState = 2;
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

    $scope.reservas_ui_grid.columnDefs = [
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 40,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: 120,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposReserva,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposReserva:"tipo":"descripcion"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 60,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: lodash.sortBy($scope.monedas, function(item) { return item.simbolo; }),
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'fechaEmision',
            field: 'fechaEmision',
            displayName: 'F emisión',
            cellFilter: 'dateFilter',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            cellFilter: 'dateFilter',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            cellFilter: 'currencyFilterAndNull',
            width: 140,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'comentarios',
            field: 'comentarios',
            displayName: 'Comentarios',
            width: 200,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'string'
        }, 
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.eliminarRegistroReservas(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]

    $scope.agregarRegistroReserva = function () {

        if (!Array.isArray($scope.siniestro.reservas)) {
            $scope.siniestro.reservas = [];
        }
            
        const ultimaReserva = $scope.siniestro.reservas[$scope.siniestro.reservas.length - 1];

        const reserva = {
            _id: new Mongo.ObjectID()._str,
            numero: ultimaReserva ? ultimaReserva.numero + 1 : 1,
            moneda: ultimaReserva ? ultimaReserva.moneda : $scope.siniestro.moneda,
            fechaEmision: new Date(),
            fecha: new Date(),
        };

        $scope.siniestro.reservas.push(reserva);

        if (!$scope.siniestro.docState) {
            $scope.siniestro.docState = 2;
        }

        $scope.reservas_ui_grid.data = $scope.siniestro.reservas;
    }

    $scope.eliminarRegistroReservas = function (entity) {
        lodash.remove($scope.siniestro.reservas, function (r) { return r._id === entity._id; });

        if (!$scope.siniestro.docState) {
            $scope.siniestro.docState = 2;
        }
    }

    // --------------------------------------------------------------------
    // grid de liquidaciones
    // --------------------------------------------------------------------
    let liquidacionSeleccionada = {};

    $scope.liquidaciones_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                liquidacionSeleccionada = {};

                if (row.isSelected) {
                    liquidacionSeleccionada = row.entity;
                }
                else
                    return;
            });
            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    if (!$scope.siniestro.docState)
                        $scope.siniestro.docState = 2;
            });
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    };

    $scope.liquidaciones_ui_grid.columnDefs = [
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 40,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 60,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: lodash.sortBy($scope.monedas, function(item) { return item.simbolo; }),
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'fechaEmision',
            field: 'fechaEmision',
            displayName: 'F emisión',
            cellFilter: 'dateFilter',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            cellFilter: 'dateFilter',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'indemnizado',
            field: 'indemnizado',
            displayName: 'Indemnizado',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'ajuste',
            field: 'ajuste',
            displayName: 'Ajuste',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'adicional',
            field: 'adicional',
            displayName: 'Adicional',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'otrosGastos',
            field: 'otrosGastos',
            displayName: 'Otros gastos',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'definitivo',
            field: 'definitivo',
            displayName: 'Definitivo',
            cellFilter: 'boolFilter',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'boolean'
        },
        {
            name: 'comentarios',
            field: 'comentarios',
            displayName: 'Comentarios',
            width: 200,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'string'
        }, 
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.eliminarRegistroLiquidaciones(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ];

    $scope.agregarRegistroLiquidaciones = function () {

        if (!Array.isArray($scope.siniestro.liquidaciones)) {
            $scope.siniestro.liquidaciones = [];
        }

        const ultimaLiquidacion = $scope.siniestro.liquidaciones[$scope.siniestro.liquidaciones.length - 1];

        const liquidacion = {
            _id: new Mongo.ObjectID()._str,
            numero: ultimaLiquidacion ? ultimaLiquidacion.numero + 1 : 1,
            moneda: ultimaLiquidacion ? ultimaLiquidacion.moneda : $scope.siniestro.moneda,
            fechaEmision: new Date(),
            fecha: new Date(),
        };

        $scope.siniestro.liquidaciones.push(liquidacion);

        if (!$scope.siniestro.docState) {
            $scope.siniestro.docState = 2;
        }

        $scope.liquidaciones_ui_grid.data = $scope.siniestro.liquidaciones;
    }

    $scope.eliminarRegistroLiquidaciones = function (entity) {
        lodash.remove($scope.siniestro.liquidaciones, function (l) { return l._id === entity._id; });

        if (!$scope.siniestro.docState) {
            $scope.siniestro.docState = 2;
        }
    }

    $scope.construirCuotasMovimiento = function() {
        if (!liquidacionSeleccionada || lodash.isEmpty(liquidacionSeleccionada)) {
            DialogModal($uibModal, "<em>Siniestros - Construcción de cuotas</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un registro de liquidación.<br />" +
                                "Debe seleccionar uno antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        // debe haber una compañía tipo 'nosotros'
        if (!$scope.siniestro.companias || !$scope.siniestro.companias.length) {
            DialogModal($uibModal, "<em>Siniestros - Construcción de cuotas</em>",
                                "Aparentemente, no hay compañías definidas en la lista de compañías.<br />" +
                                "Ud. debe registrar, en la lista de compañías, las compañías que participan " +
                                "en el siniestro.",
                                false).then();

            return;
        }

        const existeNosotros = lodash.some($scope.siniestro.companias, function(c) { return c.nosotros; });

        if (!existeNosotros) {
            DialogModal($uibModal, "<em>Siniestros - Construcción de cuotas</em>",
                                "No existe una compañía del tipo 'nosotros' en la lista de compañías.<br />" +
                                "Debe haber una compañía del tipo 'nosotros' que represente nuestra orden en el siniestro.",
                                false).then();

            return;
        }

        // ------------------------------------------------------------------------------------------------------------------------
        // determinamos si las cuotas han recibido cobros; de ser así, impedimos editarlas ... 
        // leemos solo las cuotas que corresponden al 'sub' entity; por ejemplo, solo al movimiento, capa, cuenta, etc., que el 
        // usuario está tratando en ese momento ...  
        let cuotasMovimientoSiniestro = []; 

        if ($scope.cuotas.length) { 
            cuotasMovimientoSiniestro = lodash.filter($scope.cuotas, (c) => { return c.source.subEntityID === liquidacionSeleccionada._id; });
        }
            
        const existenCuotasConCobrosAplicados = determinarSiExistenCuotasConCobrosAplicados(cuotasMovimientoSiniestro); 
        if (existenCuotasConCobrosAplicados.existenCobrosAplicados) { 
            DialogModal($uibModal, "<em>Cuotas - Existen cobros/pagos asociados</em>", existenCuotasConCobrosAplicados.message, false).then(); 
            return; 
        }
        // ------------------------------------------------------------------------------------------------------------------------

        const cantidadCuotasLiquidacionSeleccionada = lodash($scope.cuotas).filter(function (c) {
            return c.source.subEntityID === liquidacionSeleccionada._id;
        }).size();

        if (cantidadCuotasLiquidacionSeleccionada) {
            DialogModal($uibModal, "<em>Siniestros - Construcción de cuotas</em>",
                                "Ya existen cuotas registradas para la liquidación seleccionada.<br />" +
                                "Si Ud. continúa y ejecuta esta función, las cuotas que corresponden a la liquidación seleccionada <em>serán eliminadas</em> antes de " +
                                "construirlas y agregarlas nuevamente.<br /><br />" +
                                "Aún así, desea continuar y eliminar (sustituir) las cuotas que ahora existen?",
                true).then(
                function () {
                    construirCuotasLiquidacionSeleccionada();
                    return;
                },
                function () {
                    return;
                });
            return;
        }

        construirCuotasLiquidacionSeleccionada();
    }

    function construirCuotasLiquidacionSeleccionada() {
        $uibModal.open({
            templateUrl: 'client/generales/construirCuotas.html',
            controller: 'Siniestros_ConstruirCuotasController',
            size: 'md',
            resolve: {
                siniestro: function () {
                    return $scope.siniestro;
                },
                liquidacion: function () {
                    return liquidacionSeleccionada;
                },
                cuotas: function () {
                    if (!$scope.cuotas)
                        $scope.cuotas = [];

                    return $scope.cuotas;
                }
            }
        }).result.then(
            function () {
                return true;
            },
            function () {

                // en el controller que usa este modal se contruyen las cuotas; regresamos cuando en usuario hace click en Cancel para cerrar
                // el diálogo. Si existen cuotas en el $scope, las mostramos en el grid que corresponde ...
                if ($scope.cuotas)
                    $scope.cuotas_ui_grid.data = $scope.cuotas;

                return true;
            });
    }

    // ---------------------------------------------------------------------
    // ui-grid: cuotas
    // ----------------------------------------------------------------------

    $scope.cuotas_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            $scope.cuotasGridApi = gridApi;

            // marcamos el item como 'editado', cuando el usuario modifica un valor en el grid ...
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                if (newValue != oldValue) {
                    // las cuotas se graban seperadamente; solo las cuotas 'marcadas' son enviadas al servidor y grabadas
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
                    }
                        
                    if (!$scope.siniestro.docState) { 
                        $scope.siniestro.docState = 2;
                    }    
                }})
            }, 
            // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
            rowIdentity: function (row) {
                    return row._id;
            },
            getRowIdentity: function (row) {
                return row._id;
            }
    }

    $scope.cuotas_ui_grid.columnDefs = [
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
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'source',
            field: 'source',
            displayName: 'Origen',
            width: 60,
            cellFilter: 'origenCuota_Filter',            // ej: fac-1-1 (riesgo 1, movimiento 1)
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: $scope.companias,
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"abreviatura"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 40,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: lodash.sortBy($scope.monedas, function(item) { return item.simbolo; }),
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            width: 40,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'cantidad',
            field: 'cantidad',
            displayName: 'Cant',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'fechaEmision',
            field: 'fechaEmision',
            displayName: 'F emisión',
            cellFilter: 'dateFilter',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            cellFilter: 'dateFilter',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'diasVencimiento',
            field: 'diasVencimiento',
            displayName: 'Dias venc',
            width: 75,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'fechaVencimiento',
            field: 'fechaVencimiento',
            displayName: 'F venc',
            cellFilter: 'dateFilter',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'montoOriginal',
            field: 'montoOriginal',
            displayName: 'Monto original',
            cellFilter: 'currencyFilterAndNull',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'factor',
            field: 'factor',
            displayName: 'Factor',
            //cellFilter: '6DecimalsFilter',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            cellFilter: 'currencyFilterAndNull',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell'
        },
        {
            name: 'tienePagos',
            field: '_id',
            displayName: 'Pagos',
            cellFilter: 'cuotaTienePagos_Filter:this',            // nótese como pasamos el 'scope' del row al (angular) filter ...
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: 'esCompleto',
            field: '_id',
            displayName: 'Comp',
            cellFilter: 'cuotaTienePagoCompleto_Filter:this',            // nótese como pasamos el 'scope' del row al (angular) filter ...
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        },
        {
            name: '',
            field: '_id',
            displayName: '',
            cellTemplate: '<button class="btn btn-sm btn-link" type="button" ng-click="grid.appScope.mostrarPagosEnCuota(this.row.entity)">ver</button>',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        }, 
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.eliminarCuota(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]

    $scope.agregarCuota = function () {
        if (!liquidacionSeleccionada || lodash.isEmpty(liquidacionSeleccionada)) {
            DialogModal($uibModal, "<em>Siniestros - Cuotas</em>",
                "Ud. debe seleccionar un registro de liquidación <em>antes</em> de intentar ejecutar esta función.",
                false).then();
            return;
        }

        if (!Array.isArray($scope.cuotas))
            $scope.cuotas = [];

        const cuota = {};

        cuota._id = new Mongo.ObjectID()._str;

        cuota.source = {};

        cuota.source.entityID = $scope.siniestro._id;
        cuota.source.subEntityID = liquidacionSeleccionada._id;
        cuota.source.origen = "sinFac";
        cuota.source.numero = $scope.siniestro.numero.toString() + "-" + liquidacionSeleccionada.numero.toString();

        cuota.moneda = $scope.siniestro.moneda;

        cuota.cia = $scope.siniestro.cia;
        cuota.docState = 1;

        $scope.cuotas.push(cuota);

        $scope.cuotas_ui_grid.data = $scope.cuotas;

        if (!$scope.siniestro.docState)
            $scope.siniestro.docState = 2;
    }

    $scope.eliminarCuota = function (entity) {
        entity.docState = 3;

        if (!$scope.siniestro.docState) { 
            $scope.siniestro.docState = 2;
        }
    }

    $scope.refrescarGridCuotas = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        const companiasParaListaUIGrid = lodash.chain($scope.companias).
                                    filter(function(c) { return (c.nosotros || c.tipo == 'REA' || c.tipo == "CORRR") ? true : false; }).
                                    sortBy(function(item) { return item.nombre; }).
                                    value();

        $scope.cuotas_ui_grid.columnDefs[2].editDropdownOptionsArray = companiasParaListaUIGrid;
        $scope.cuotas_ui_grid.columnDefs[3].editDropdownOptionsArray = lodash.sortBy($scope.monedas, function(item) { return item.simbolo; });
    }

    $scope.gridCuotas_SeleccionarPorMoneda = function(monedaSeleccionada) {

        if (!$scope.cuotas || lodash.isEmpty($scope.cuotas))
            return;

        if (monedaSeleccionada)
                $scope.cuotas_ui_grid.data = lodash.filter($scope.cuotas, function(item) { return item.moneda === monedaSeleccionada; });
        else
                $scope.cuotas_ui_grid.data = $scope.cuotas;
    }

    $scope.mostrarPagosEnCuota = function (cuota) {
        // mostramos los pagos aplicados a la cuota, en un modal ...
        // es una función que está en client/generales y que es llamada desde varios
        // 'registros' de cuotas (fac, contratos, sntros, etc.)
        MostrarPagosEnCuotas($uibModal, cuota, $stateParams.origen);
    }

    $scope.nuevo0 = function () {

        if ($scope.siniestro.docState && $scope.origen == 'edicion') {
            DialogModal($uibModal,
                                    "<em>Siniestros</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa para agregar un nuevo registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                                    true).then(
                function () {
                    $scope.nuevo();
                },
                function () {
                    return true;
                });

            return;
        }
        else
            $scope.nuevo();
    }

    $scope.nuevo = function () {
        if ($scope.siniestro && $scope.siniestro.stop)
            $scope.siniestro.stop();      // detenemos la conexión con minimongo ...

        $scope.id = "0";                  // para que inicializar() agregue un nuevo registro
        $scope.siniestro = {};

        inicializarItem();

        $scope.currentStateName = "Generales";
        $state.go('siniestro.generales');
    }

    $scope.refresh0 = function () {
        if ($scope.siniestro.docState && $scope.origen == 'edicion') {
            DialogModal($uibModal,
                                    "<em>Siniestros</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                                    true).then(
                function () {
                    $scope.refresh();
                },
                function () {
                    return true;
                });

            return;
        }
        else
            $scope.refresh();
    }

    $scope.refresh = function () {

        if ($scope.siniestro && $scope.siniestro.stop)
            $scope.siniestro.stop();      // detenemos la conexión con minimongo ...

        $scope.siniestro = {};

        inicializarItem();

        $scope.currentStateName = "Generales";
        $state.go('siniestro.generales');
    }

    // -------------------------------------------------------------------------
    // Grabar las modificaciones hechas al siniestro
    // -------------------------------------------------------------------------
    $scope.grabar = function () {

        if (!$scope.siniestro.docState) {
            DialogModal($uibModal, "<em>Siniestros</em>",
                                "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                false).then();
            return;
        }

        $scope.showProgress = true;

        // cuando el usuario deja la referencia vacía, la determinamos al grabar; nótese que debemos agregar algo,
        // pues el campo es requerido
        if (!$scope.siniestro.referencia) {
            $scope.siniestro.referencia = '0';
        }

        // nótese como validamos antes de intentar guardar en el servidor
        const errores = [];

        let item = {};

        item = $scope.siniestro;

        // lo primero que hacemos es intentar validar el item ...
        if (item.docState != 3) {
            const isValid = Siniestros.simpleSchema().namedContext().validate(item);

            if (!isValid) {
                Siniestros.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Siniestros.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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
                            return current;
                        else
                            return previous + "<br />" + current;
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }

        // validamos que el usuario haya agregado una compañía 'nosotros'; además, que sea la que existe como tal ...
        if (item && item.companias && Array.isArray(item.companias) && item.companias.length) {

            // con la siguiente función, leemos la compañía 'nostros' para el usuario; nótese que depende de la empresa 
            // usuaria seleccionada (si hay más de una ...)
            let companiaNosotrosEnConfig = {};
            const result = LeerCompaniaNosotros(Meteor.userId());

            if (result.error) {
                const message = `<em>Siniestros - Error al intentar leer la compañía 'nosotros'</em><br /> ${result.message}`;

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas:<br /><br />" + message
                });

                $scope.showProgress = false;
                return;
            }

            companiaNosotrosEnConfig = result.companiaNosotros;

            let errorMessage = "";
            const companiaNosotros = item.companias.filter(c => { return c.nosotros; });

            if (companiaNosotros.length == 0) { 
                errorMessage = "Ud. debe incluir una compañía 'nosotros', para indicar nuestra participación en el siniestro.";
            }
            else if (companiaNosotros.length > 1) { 
                errorMessage = "Aparentemente, Ud. ha agregado más de una compañía del tipo 'nosotros' a la lista.";
            }
            else {
                if (companiaNosotrosEnConfig._id != companiaNosotros[0].compania) {
                    errorMessage = `La compañía del tipo <em>nosotros</em> que Ud. indique en la lista, debe ser <b>la misma</b> 
                                    que se asignado a la <em>empresa usuaria seleccionada</em>.<br />
                                    <b>Nota:</b> Ud. puede revisar el catálogo de <em>empresas usuarias</em>, para determinar cual es la 
                                    compañía <em>nosotros</em> que se ha asignado a cada una. `;
                }    
            }

            if (errorMessage) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                return;
            }
        }

        // ------------------------------------------------------------------------------------------
        // ahoa validamos las cuotas, las cuales son registradas en un collection diferente ...
        const editedItems = lodash($scope.cuotas).
                            filter(function (c) { return c.docState; }).
                            map(function (c) { delete c.$$hashKey; return c; }).
                            value();

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                const isValid = Cuotas.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    Cuotas.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Cuotas.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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

        Meteor.call('siniestrosSave', item, (err)  => {
            
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
             
            // guardamos, separadamente, las cuotas (solo las que el usuario ha editado) 
            const cuotasArray = lodash($scope.cuotas).
                                filter(function (c) { return c.docState; }).
                                value();

            $scope.cuotas = []; 
            $scope.cuotas_ui_grid.data = []; 


            Meteor.call('cuotasSave', cuotasArray, (err, result)  => {
            
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

                    let filtro = JSON.stringify({ _id: item._id });
                    Meteor.subscribe('siniestros', filtro, () => {
                        $scope.siniestro = {};
                        
                        // luego del subscribe, el nuevo item estará en minimongo
                        $scope.helpers({
                            siniestro: () => {
                                return Siniestros.findOne(item._id);
                            },
                        })
                        
                        $scope.id = $scope.siniestro._id;

                        filtro = JSON.stringify({ "source.entityID": $scope.id });
                        Meteor.subscribe('cuotas', filtro, () => {
                           
                            $scope.helpers({
                                cuotas: () => {
                                    return Cuotas.find({ "source.entityID": $scope.id });
                                },
                            })

                            if ($scope.cuotas) { 
                                $scope.cuotas_ui_grid.data = $scope.cuotas;
                            }
                                
                            $scope.showProgress = false;
                            $scope.$apply();
                        })
                    })
                }
                else {

                    $scope.siniestro = {};

                    $scope.helpers({
                        siniestro: () => {
                            return Siniestros.findOne(item._id);
                        },
                    })

                    $scope.id = $scope.siniestro._id;

                    // asociamos los ui-grids a sus datos en el $scope
                    //   $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;

                    const filtro = JSON.stringify({ "source.entityID": $scope.id });
                    Meteor.subscribe('cuotas', filtro, () => {

                        $scope.helpers({
                            cuotas: () => {
                                return Cuotas.find({ "source.entityID": $scope.id });
                            },
                        })

                        if ($scope.cuotas) { 
                            $scope.cuotas_ui_grid.data = $scope.cuotas;
                        }   
                            
                        $scope.showProgress = false;
                        $scope.$apply();
                    })
                }
            })
        })
    }

    // para abrir la entidad de origen (riesgo) en un nuevo window (popup)
    $scope.mostrarEntidadDeOrigen = function () {

        const entidadOrigenID = $scope.siniestro.source && $scope.siniestro.source.entityID ?
            $scope.siniestro.source.entityID :
            0;

        const url2 = $state.href('riesgo', { origen: 'consulta', id: entidadOrigenID, pageNumber: 0, vieneDeAfuera: true });
        window.open(url2, '_blank');
    }

    // -------------------------------------------------------------------------
    // para inicializar el item (en el $scope) cuando el usuario abre la página
    // -------------------------------------------------------------------------
    function inicializarItem() {
        if ($scope.id == "0") {

            // permitimos al usuario agregar el siniestro desde una 'entidad original' (por ahora solo riesgos)
            $uibModal.open({
                templateUrl: 'client/siniestros/nuevoDesdeOrigenModal.html',
                controller: 'NuevoSiniestroDesdeOrigenController',
                size: 'lg',
                resolve: {
                    cia: function () {
                        return $scope.companiaSeleccionada._id;
                    },
                }
            }).result.then(
                function (movimientoSeleccionado) {
                    // el usuario selecciono un movimiento en base al cual debemos inicializar el siniestro
                    const today = new Date();
                    $scope.siniestro = {
                        _id: new Mongo.ObjectID()._str,
                        numero: 0,

                        source: {
                            entityID: movimientoSeleccionado.idRiesgo,
                            subEntityID: movimientoSeleccionado.idMovimiento,
                            origen: 'fac',
                            numero: movimientoSeleccionado.numeroRiesgo.toString() + '-' +
                                movimientoSeleccionado.numeroMovimiento.toString()
                        },

                        moneda: movimientoSeleccionado.moneda,
                        compania: movimientoSeleccionado.compania,
                        ramo: movimientoSeleccionado.ramo,
                        asegurado: movimientoSeleccionado.asegurado,
                        suscriptor: movimientoSeleccionado.suscriptor,

                        fechaOcurrencia: movimientoSeleccionado.fechaOcurrencia,
                        fechaEmision: new Date(today.getFullYear(), today.getMonth(), today.getDate()),

                        companias: [],
                        reservas: [],
                        liquidaciones: [],

                        ingreso: new Date(),
                        usuario: Meteor.user().emails[0].address,
                        cia: $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : null,
                        docState: 1
                    };

                    if (movimientoSeleccionado.companias && movimientoSeleccionado.companias.length) {
                        movimientoSeleccionado.companias.forEach(function (c) {
                            $scope.siniestro.companias.push(c);
                        });
                    }

                    $scope.companias_ui_grid.data = [];
                    $scope.reservas_ui_grid.data = [];
                    $scope.liquidaciones_ui_grid.data = [];
                    $scope.cuotas_ui_grid.data = [];

                    if ($scope.siniestro.companias) {
                        $scope.companias_ui_grid.data = $scope.siniestro.companias;
                    }

                    return true;
                },
                function (cancel) {
                    // el usuario puede cancelar el modal que permite agregar desde un riesgo y agregar
                    // el siniestro en forma 'directa'

                    if (cancel != 'Cancel') {
                        DialogModal($uibModal, "<em>Siniestros</em> - Agregar en forma <em>directa</em>",
                            "Ok, Ud. puede ahora agregar un nuevo siniestro en forma 'directa'; es decir, " +
                            "sin asociarlo a un riesgo antes y tomar muchos datos del mismo (cedente, asegurado, " +
                            "reaseguradores y sus ordenes, etc).<br /><br />" +
                            "Simplemente, registre Ud. todos los datos del siniestro y grabe el mismo.",
                            false).then();
                    }
                    else {
                        DialogModal($uibModal, "<em>Siniestros</em>",
                            "Para <em>cancelar</em> el registro del nuevo siniestro, simplemente haga un click en <em>Regresar</em>, " +
                            "o en alguna de las opciones del menú principal del programa.<br />" +
                            "Al hacerlo, el registro será, simplemente, descartado y la acción será cancelada.",
                            false).then();
                    }

                    $scope.siniestro = {
                        _id: new Mongo.ObjectID()._str,
                        numero: 0,
                        companias: [],
                        reservas: [],
                        liquidaciones: [],
                        ingreso: new Date(),
                        usuario: Meteor.user().emails[0].address,
                        cia: $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : null,

                        docState: 1
                    };

                    $scope.companias_ui_grid.data = [];
                    $scope.reservas_ui_grid.data = [];
                    $scope.liquidaciones_ui_grid.data = [];
                    $scope.cuotas_ui_grid.data = [];

                    return true;
                });
        }
        else {

            $scope.helpers({
                siniestro: () => {
                    return Siniestros.findOne($scope.id);
                },
            })

            $scope.showProgress = true;

            const filtro = JSON.stringify({ "source.entityID": $scope.id });

            Meteor.subscribe('cuotas', filtro, () => {

                $scope.helpers({
                    cuotas: () => {
                        return Cuotas.find({ "source.entityID": $scope.id });
                    },
                })

                $scope.companias_ui_grid.data = [];

                if ($scope.siniestro.companias) {
                    $scope.companias_ui_grid.data = $scope.siniestro.companias;
                }

                if ($scope.siniestro.reservas) {
                    $scope.reservas_ui_grid.data = $scope.siniestro.reservas;
                }

                if ($scope.siniestro.liquidaciones) {
                    $scope.liquidaciones_ui_grid.data = $scope.siniestro.liquidaciones;
                }

                if ($scope.cuotas) {
                    $scope.cuotas_ui_grid.data = $scope.cuotas;
                }

                // si el siniestro viene con un riesgo asociado, suscribimos al mismo para que esté disponible en el client ...
                if ($scope.siniestro.source && $scope.siniestro.source.origen == 'fac') {
                    Meteor.subscribe('riesgos', JSON.stringify({ _id: $scope.siniestro.source.entityID }), () => {
                        $scope.showProgress = false;
                        $scope.$apply();
                    })
                }
                else {
                    $scope.showProgress = false;
                }
            })
        }
    }

    inicializarItem();

    // siempre vamos al state Generales cuando el usuario inicia este state ...
    $scope.currentStateName = "Generales";
    $state.go("siniestro.generales");
}])