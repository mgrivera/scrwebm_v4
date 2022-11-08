
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

import angular from 'angular';
import lodash from 'lodash'; 
import moment from 'moment'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { determinarSiExistenCuotasConCobrosAplicados } from '/client/imports/generales/determinarSiExistenCuotasCobradas'; 

// controller (modal) para prorratear las primas brutas 
// import './prorratearPrimasModal.html'; 
import ProrratearPrimasBrutas from './prorratearPrimasBrutasController'; 

import ConstruirCuotas from './construirCuotasController'; 
import ConstruirCuotasProductor from './construirCuotasProductoresController'; 
import { LeerCompaniaNosotros } from '/imports/generales/leerCompaniaNosotros'; 

import construirCuotasMovimiento_htmlTemplate from '/client/imports/riesgos/construirCuotas.html'; 

export default angular.module("scrwebm.riesgos.movimientos", [ ProrratearPrimasBrutas.name, 
                                                               ConstruirCuotas.name, 
                                                               ConstruirCuotasProductor.name ])
                      .controller("RiesgoMovimientos_Controller", ['$scope', '$uibModal', 'uiGridConstants', '$interval', 
  function ($scope, $uibModal, uiGridConstants, $interval) {

    $scope.showProgress = true;

    // --------------------------------------------------------------------------------------
    // ui-grid de Movimientos
    // --------------------------------------------------------------------------------------
    let movimientoSeleccionado = {}; 
    
    if ($scope.movimientoSeleccionado) { 
        // NOTA: $scope.movimientoSeleccionado fue definido en $parentScope ... 
        movimientoSeleccionado = $scope.movimientoSeleccionado; 
    }

    let movimientos_ui_grid_gridApi = {}; 

    $scope.movimientos_ui_grid = {
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

            movimientos_ui_grid_gridApi = gridApi; 

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                movimientoSeleccionado = {};
                $scope.$parent.movimientoSeleccionado = movimientoSeleccionado;     // para que esté disponible en cualquier state 

                if (row.isSelected) {

                    movimientoSeleccionado = row.entity;

                    $scope.companias_ui_grid.data = [];
                    $scope.coberturas_ui_grid.data = [];
                    $scope.coberturasCompanias_ui_grid.data = [];
                    $scope.primas_ui_grid.data = [];

                    if (movimientoSeleccionado.companias) { 
                        $scope.companias_ui_grid.data = movimientoSeleccionado.companias;
                    }
                        
                    if (movimientoSeleccionado.coberturas) { 
                        $scope.coberturas_ui_grid.data = movimientoSeleccionado.coberturas;
                    }
                        

                    if (movimientoSeleccionado.coberturasCompanias) { 
                        $scope.coberturasCompanias_ui_grid.data = movimientoSeleccionado.coberturasCompanias;
                    }
                        
                    if (movimientoSeleccionado.primas) { 
                        $scope.primas_ui_grid.data = movimientoSeleccionado.primas;
                    }
                    
                    $scope.$parent.movimientoSeleccionado = movimientoSeleccionado;     // para que esté disponible en cualquier state 
                }
                else
                    return;
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    if (!$scope.riesgo.docState)
                        $scope.riesgo.docState = 2;
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

    $scope.movimientos_ui_grid.columnDefs = [
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
            width: 180,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposMovimiento,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposMovimiento:"tipo":"descripcion"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
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
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
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
            name: 'hasta',
            field: 'hasta',
            displayName: 'Hasta',
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
            name: 'cantidadDias',
            field: 'cantidadDias',
            displayName: 'Cant días',
            width: 120,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'factorProrrata',
            field: 'factorProrrata',
            displayName: 'Factor prorrata',
            cellFilter: 'number8decimals',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        }
    ]

    $scope.agregarMovimiento = function () {

        if (!Array.isArray($scope.riesgo.movimientos)) { 
            $scope.riesgo.movimientos = [];
        }
            
        // solo para el 1er. movimiento, agregamos la compañía 'nosotros', la cual representa nuestra compañía, y es la que,
        // justamente, tendrá 'nuestra orden'
        let companiaNosotros = {};
        const result = LeerCompaniaNosotros(Meteor.userId()); 

        if (result.error) {
            DialogModal($uibModal, "<em>Riesgos - Error al intentar leer la compañía 'nosotros'</em>", result.message, false).then();
            return;
        }

        companiaNosotros = result.companiaNosotros; 

        if ($scope.riesgo.movimientos.length > 0) {

            // para agregar un movimiento cuando ya existen otros, copiamos el último (lodash clone) y lo modificamos levemente ...
            const ultimoMovimiento = $scope.riesgo.movimientos[$scope.riesgo.movimientos.length - 1];
            let nuevoMovimiento = lodash.cloneDeep(ultimoMovimiento);

            if (nuevoMovimiento) {

                nuevoMovimiento._id = new Mongo.ObjectID()._str;
                nuevoMovimiento.numero++;
                nuevoMovimiento.tipo = null;
                nuevoMovimiento.fechaEmision = new Date();
                // delete nuevoMovimiento.$$hashKey;

                // nótese como eliminamos los arrays de coberturas por compañía y primas
                nuevoMovimiento.coberturasCompanias = [];
                nuevoMovimiento.primas = [];

                if (nuevoMovimiento.documentos) { 
                    nuevoMovimiento.documentos = []; 
                }

                // recorremos los arrays en el nuevo movimiento, para asignar nuevos _ids
                nuevoMovimiento.coberturas.forEach(c => c._id = new Mongo.ObjectID()._str); 
                nuevoMovimiento.companias.forEach(c => c._id = new Mongo.ObjectID()._str); 

                if (nuevoMovimiento.productores) {
                    nuevoMovimiento.productores.forEach(x => x._id = new Mongo.ObjectID()._str); 
                }
                        
                $scope.riesgo.movimientos.push(nuevoMovimiento);

                if (!$scope.riesgo.docState) { 
                    $scope.riesgo.docState = 2;
                }
                    
                nuevoMovimiento = {};

                $scope.movimientos_ui_grid.data = [];
                $scope.companias_ui_grid.data = [];
                $scope.coberturas_ui_grid.data = [];
                $scope.coberturasCompanias_ui_grid.data = [];
                $scope.primas_ui_grid.data = [];

                $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;
                // $scope.companias_ui_grid.data = $scope.riesgo.movimientos.companias;
                // $scope.coberturas_ui_grid.data = $scope.riesgo.movimientos.coberturas;
                // $scope.coberturasCompanias_ui_grid.data = $scope.riesgo.movimientos.coberturasCompanias;
                // $scope.primas_ui_grid.data = $scope.riesgo.movimientos.primas;

                DialogModal($uibModal,
                    "<em>Riesgos - Nuevo movimiento</em>",
                    "Ok, un nuevo movimiento ha sido agregado al riesgo. " +
                    "Nóte que el nuevo movimiento es, simplemente, una copia del movimiento anterior.<br /><br />" +
                    "Ud. debe <b>seleccionarlo en la lista</b> y asignarle un tipo. Luego debe hacer las " +
                    "modificaciones que le parezca adecuadas.<br /><br />" +
                    "Recuerde que las cifras que indique para el nuevo movimiento, deben corresponder <em>siempre al " +
                    "100%</em> de la orden y a la totalidad del período; es derir, no al período que corresponde a " +
                    "la modificación.<br /><br />" +
                    "Posteriormente, y si es adecuado, Ud. podrá prorratear la prima para obtener solo la " +
                    "parte que corresponde al período.",
                    false).then();

                return;
            }
        }
        else {
            let movimiento = {};

            movimiento._id = new Mongo.ObjectID()._str;
            movimiento.numero = 1;
            movimiento.fechaEmision = new Date();
            movimiento.desde = $scope.riesgo.desde;
            movimiento.hasta = $scope.riesgo.hasta;
            movimiento.tipo = "OR";
            movimiento.cantidadDias = moment($scope.riesgo.hasta).diff(moment($scope.riesgo.desde), 'days');

            // redondemos, al menos por ahora, a 365 días
            if (movimiento.cantidadDias == 366) { 
                movimiento.cantidadDias = 365;
            }
                
            movimiento.factorProrrata = movimiento.cantidadDias / 365;

            // 1er. movimiento del riesgo; agregamos la compañía 'nosotros' en forma automática ...
            movimiento.companias = [];
            movimiento.coberturas = [];

            movimiento.companias.push({
                _id: new Mongo.ObjectID()._str,
                compania: companiaNosotros._id,
                nosotros: true
            });

            $scope.riesgo.movimientos.push(movimiento);

            if (!$scope.riesgo.docState) { 
                $scope.riesgo.docState = 2;
            }
                
            movimiento = {};

            $scope.movimientos_ui_grid.data = [];
            $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;
        }
    }

    $scope.eliminarMovimiento = function () {

        if (movimientoSeleccionado && !lodash.isEmpty(movimientoSeleccionado)) {
            lodash.remove($scope.riesgo.movimientos, function (movimiento) { return movimiento._id === movimientoSeleccionado._id; });

            // para que los grids que siguen dejen de mostrar registros para el movimiento
            $scope.companias_ui_grid.data = [];
            $scope.coberturas_ui_grid.data = [];
            $scope.coberturasCompanias_ui_grid.data = [];
            $scope.primas_ui_grid.data = [];

            if (!$scope.riesgo.docState)
                $scope.riesgo.docState = 2;
        }
        else {
            DialogModal($uibModal, "<em>Riesgos</em>",
                        "Ud. debe seleccionar un movimiento antes de intentar eliminarlo.",
                        false).then();
            return;
        }
    }

    $scope.movimientosCalcular = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar calcular sus valores.",
                                false).then();

            return;
        }

        if (movimientoSeleccionado.desde && movimientoSeleccionado.hasta) { 
            movimientoSeleccionado.cantidadDias = moment(movimientoSeleccionado.hasta).diff(moment(movimientoSeleccionado.desde), 'days');
        }
            
        if (movimientoSeleccionado.desde && !movimientoSeleccionado.hasta && lodash.isFinite(movimientoSeleccionado.cantidadDias)) { 
            // tenemos la fecha inicial y la cantidad de días; calculamos la fecha final agregando los días a la fecha inicial
            moment(movimientoSeleccionado.desde).add(movimientoSeleccionado.cantidadDias, 'months');
        }

        if (!movimientoSeleccionado.desde && movimientoSeleccionado.hasta && lodash.isFinite(movimientoSeleccionado.cantidadDias)) { 
            // tenemos la fecha final y la cantidad de días; calculamos la fecha incial restando la cantidad de días a la fecha final
            moment(movimientoSeleccionado.hasta).subtract(movimientoSeleccionado.cantidadDias, 'months');
        }  

        // redondemos, al menos por ahora, a 365 días
        if (movimientoSeleccionado.cantidadDias == 366) { 
            movimientoSeleccionado.cantidadDias = 365;
        }
           
        movimientoSeleccionado.factorProrrata = movimientoSeleccionado.cantidadDias / 365;
    }

    // ---------------------------------------------------------------------
    // para registrar los documentos de cada movimiento (cesión y recibo)
    // ---------------------------------------------------------------------
    $scope.registroDocumentosMovimiento = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos - Documentos</em>",
                        "Ud. debe seleccionar un movimiento antes de intentar registrar sus documentos.",
                        false).then();

            return;
        }

        $uibModal.open({
            templateUrl: 'client/generales/registroDocumentos.html',
            controller: 'RegistroDocumentosController',
            size: 'md',
            resolve: {
                entidad: function () {
                    // pasamos la entidad (puede ser: contratos, siniestros, ...) solo para marcar docState si se agrega/eliminar
                    // un documento (y no se había 'marcado' esta propiedad antes)...
                    return $scope.riesgo;
                },
                documentos: function () {
                    if (!lodash.isArray(movimientoSeleccionado.documentos))
                    movimientoSeleccionado.documentos = [];

                    return movimientoSeleccionado.documentos;
                },
                tiposDocumentoLista: function () {
                    return [ { tipo: 'CES', descripcion: 'Cesión' }, { tipo: 'REC', descripcion: 'Recibo' } ];
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


    // --------------------------------------------------------------------------------------
    // ui-grid de Compañías
    // --------------------------------------------------------------------------------------
    let companiaSeleccionada = {};

    $scope.companias_ui_grid = {
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
                companiaSeleccionada = {};

                if (row.isSelected) { 
                companiaSeleccionada = row.entity;
                }
                else { 
                return;
                }
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                if (!$scope.riesgo.docState) { 
                    $scope.riesgo.docState = 2;
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
            enableCellEdit: false,
            type: 'boolean'
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
        {
            name: 'comisionPorc',
            field: 'comisionPorc',
            displayName: 'Com(%)',
            cellFilter: 'number6decimals',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'impuestoPorc',
            field: 'impuestoPorc',
            displayName: 'Imp(%)',
            cellFilter: 'number6decimals',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'corretajePorc',
            field: 'corretajePorc',
            displayName: 'Corr(%)',
            cellFilter: 'number6decimals',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'impuestoSobrePNPorc',
            field: 'impuestoSobrePNPorc',
            displayName: 'Imp/pn(%)',
            cellFilter: 'number6decimals',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        }
    ]


    $scope.agregarCompania = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar agregar una compañía.",
                                false).then();

            return;
        }

        const companiaNosotros = lodash.find(movimientoSeleccionado.companias, function (c) { return c.nosotros; });
        const companiaAnterior = (movimientoSeleccionado.companias && movimientoSeleccionado.companias.length) ? 
                                movimientoSeleccionado.companias[movimientoSeleccionado.companias.length - 1] : 
                                null;
        
        let reaseguradoresOrden = lodash(movimientoSeleccionado.companias).
                                        filter(function(c) { return !c.nosotros; }).
                                        sumBy(function(c) { return c.ordenPorc; });

        if (!reaseguradoresOrden) { 
            reaseguradoresOrden = 0;
        }
            
        let ordenPorc = null;

        if (companiaNosotros) { 
            ordenPorc = companiaNosotros.ordenPorc;
        }
            
        if (ordenPorc && reaseguradoresOrden) { 
            ordenPorc -= reaseguradoresOrden;
        } 
            
        // cada compañía que agregamos, usa los 'defaults' de la compañía anterior
        const compania = {
            _id: new Mongo.ObjectID()._str,
            nosotros: false,
            comisionPorc: companiaAnterior ? companiaAnterior.comisionPorc : null,
            impuestoPorc: companiaAnterior ? companiaAnterior.impuestoPorc : null,
            corretajePorc: companiaAnterior ? companiaAnterior.corretajePorc : null,
            impuestoSobrePNPorc: companiaAnterior ? companiaAnterior.impuestoSobrePNPorc : null,
            ordenPorc: ordenPorc
        };

        if (!movimientoSeleccionado.companias) { 
            movimientoSeleccionado.companias = [];
        }
            
        movimientoSeleccionado.companias.push(compania);

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }
    }

    $scope.eliminarCompania = function () {
        //debugger;
        // cada vez que el usuario selecciona un row, lo guardamos ...
        if (movimientoSeleccionado && movimientoSeleccionado.companias && companiaSeleccionada) {
            lodash.remove(movimientoSeleccionado.companias, function (compania) { return compania._id === companiaSeleccionada._id; });

            if (!$scope.riesgo.docState) { 
                $scope.riesgo.docState = 2;
            }    
        }
    }

    $scope.refrescarGridCompanias = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        const companiasParaListaUIGrid = lodash.chain($scope.companias).
                                    filter(function(c) { return (c.nosotros || c.tipo == 'REA' || c.tipo == "CORRR") ? true : false; }).
                                    sortBy(function(item) { return item.nombre; }).
                                    value();

        $scope.companias_ui_grid.columnDefs[0].editDropdownOptionsArray = companiasParaListaUIGrid;
    }


    $scope.registrarPersonasCompanias = function() {

        if (!$scope.riesgo || !$scope.riesgo.compania) {
            DialogModal($uibModal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. no ha seleccionado una compañía como cedente para este riesgo.<br />" +
                                "El riesgo debe tener una compañía cedente antes de intentar registrar sus personas.",
                                false).then();

            return;
        }


        $uibModal.open({
            templateUrl: 'client/imports/generales/registrarPersonasAEntidad/registrarPersonas.html',
            controller: 'RegistrarPersonasController',
            size: 'lg',
            resolve: {
                companias: function () {
                    const riesgo = $scope.riesgo;
                    const companias = [];

                    if (lodash.isArray(riesgo.personas)) {
                        riesgo.personas.forEach(persona => {
                            companias.push({ compania: persona.compania, titulo: persona.titulo, nombre: persona.nombre });
                        });
                    }

                    // ahora revisamos las compañías en el riesgo y agregamos las que
                    // *no* existan en el array de compañías
                    if (!lodash.some(companias, (c) => { return c.compania == riesgo.compania; } )) { 
                        companias.push({ compania: riesgo.compania });
                    }
                        
                    if (lodash.isArray(riesgo.movimientos)) {
                        riesgo.movimientos.forEach(movimiento => {
                        if (lodash.isArray(movimiento.companias)) {
                            movimiento.companias.forEach(r => {
                                if (!r.nosotros) { 
                                    if (!lodash.some(companias, (c) => { return c.compania == r.compania; } )) { 
                                        companias.push({ compania: r.compania });
                                    } 
                                }
                            })
                        }
                        })
                    }

                    return companias;
                }
            }
        }).result.then(
            function () {
                return true;
            },
            function (cancel) {
                // recuperamos las personas de compañías, según las indicó el usuario en el modal
                if (cancel.entityUpdated) {
                    const companias = cancel.companias;
                    $scope.riesgo.personas = [];

                    if (lodash.isArray(companias)) {
                        companias.forEach(c => {
                            $scope.riesgo.personas.push({
                                compania: c.compania,
                                titulo: c.titulo ? c.titulo : null,
                                nombre: c.nombre? c.nombre : null
                            })
                        })
                    }

                if (!$scope.riesgo.docState)
                    $scope.riesgo.docState = 2;
                }

                return true;
            })
    }

    // --------------------------------------------------------------------------------------
    // ui-grid de Coberturas
    // --------------------------------------------------------------------------------------
    let coberturaSeleccionada = {};

    $scope.coberturas_ui_grid = {
        enableSorting: false,
        showColumnFooter: true,
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
                //debugger;
                coberturaSeleccionada = {};

                if (row.isSelected)
                    coberturaSeleccionada = row.entity;
                else
                    return;
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                //debugger;
                if (newValue != oldValue) {

                    switch (colDef.name) {

                        case "valorARiesgo": {

                            if (!rowEntity.sumaAsegurada && rowEntity.valorARiesgo)
                                rowEntity.sumaAsegurada = rowEntity.valorARiesgo;

                            if (rowEntity.valorARiesgo && rowEntity.tasa && !rowEntity.prima)
                                rowEntity.prima = rowEntity.valorARiesgo * rowEntity.tasa / 1000

                            break;
                        }
                        case "tasa": {

                            if (rowEntity.valorARiesgo && rowEntity.tasa && !rowEntity.prima)
                                rowEntity.prima = rowEntity.valorARiesgo * rowEntity.tasa / 1000

                            break;
                        }
                        case "prima": {

                            if (rowEntity.valorARiesgo && !rowEntity.tasa && rowEntity.prima)
                                rowEntity.tasa = rowEntity.prima * 1000 / rowEntity.valorARiesgo;

                            break;
                        }

                    }

                    if (!$scope.riesgo.docState)
                        $scope.riesgo.docState = 2;
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

    $scope.coberturas_ui_grid.columnDefs = [
        {
            name: 'cobertura',
            field: 'cobertura',
            displayName: 'Cobertura',
            width: 180,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: lodash.sortBy($scope.coberturas, function(item) { return item.descripcion; }),
            cellFilter: 'mapDropdown:row.grid.appScope.coberturas:"_id":"descripcion"',
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
            name: 'valorARiesgo',
            field: 'valorARiesgo',
            displayName: 'Valor a riesgo',
            cellFilter: 'currencyFilterAndNull',
            width: 140,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'sumaAsegurada',
            field: 'sumaAsegurada',
            displayName: 'Suma asegurada',
            cellFilter: 'currencyFilterAndNull',
            width: 140,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'tasa',
            field: 'tasa',
            displayName: 'Tasa',
            cellFilter: 'number8decimals',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'prima',
            field: 'prima',
            displayName: 'Prima',
            cellFilter: 'currencyFilterAndNull',
            width: 140,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        }
    ]


    $scope.agregarCobertura = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar agregar una cobertura.",
                                false).then();

            return;
        }

        const cobertura = {
            _id: new Mongo.ObjectID()._str,
            moneda: $scope.riesgo.moneda
        };

        if (!movimientoSeleccionado.coberturas) { 
            movimientoSeleccionado.coberturas = [];
        }
            
        movimientoSeleccionado.coberturas.push(cobertura);

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }   
    }

    $scope.eliminarCobertura = function () {
        //debugger;
        // cada vez que el usuario selecciona un row, lo guardamos ...
        if (movimientoSeleccionado && movimientoSeleccionado.coberturas && coberturaSeleccionada) {
            lodash.remove(movimientoSeleccionado.coberturas, function (cobertura) { return cobertura._id === coberturaSeleccionada._id; });

            if (!$scope.riesgo.docState) { 
                $scope.riesgo.docState = 2;
            }
        }
    }

    $scope.coberturasCalcular = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) { 
            return;
        }

        // nótese como usamos lodash isFinite() para saber si una variable contiene un valor numérico, incluyendo el cero.
        // Si solo usamos "if (!var)" y la variable es 0, la condición será cierta ...
        movimientoSeleccionado.coberturas.forEach(function(cobertura) {

            if (lodash.isFinite(cobertura.valorARiesgo) && lodash.isFinite(cobertura.tasa)) { 
                cobertura.prima = cobertura.valorARiesgo * cobertura.tasa / 100;
            }
                
            if (!lodash.isFinite(cobertura.valorARiesgo) && lodash.isFinite(cobertura.prima) && cobertura.tasa) { 
                cobertura.valorARiesgo = cobertura.prima * 100 / cobertura.tasa;
            }

            if (!lodash.isFinite(cobertura.tasa) && lodash.isFinite(cobertura.prima) && cobertura.valorARiesgo) { 
                cobertura.tasa = cobertura.prima * 100 / cobertura.valorARiesgo;
            }

            if (lodash.isFinite(cobertura.valorARiesgo) && !lodash.isFinite(cobertura.sumaAsegurada)) { 
                cobertura.sumaAsegurada = cobertura.valorARiesgo;
            }
        })
    }

    $scope.refrescarGridCoberturas = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        $scope.coberturas_ui_grid.columnDefs[0].editDropdownOptionsArray = lodash.sortBy($scope.coberturas, function(item) { return item.descripcion; });
        $scope.coberturas_ui_grid.columnDefs[1].editDropdownOptionsArray = lodash.sortBy($scope.monedas, function(item) { return item.simbolo; });
    }

    // --------------------------------------------------------------------------------------------------
    // para construir las coberturas para cada una de las compañías del movimiento
    // --------------------------------------------------------------------------------------------------
    $scope.construirCifrasCoberturasParaCompanias = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos - Determinación de cifras de coberturas para cada compañía</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if (movimientoSeleccionado.coberturasCompanias && movimientoSeleccionado.coberturasCompanias.length > 0) {
            DialogModal($uibModal, "<em>Riesgos - Determinación de cifras de coberturas para cada compañía</em>",
                                "Ya existen cifras de coberturas para el movimiento seleccionado.<br />" +
                                "Si Ud. continúa y ejecuta esta función, estos registros <em>serán eliminados</em> antes de " +
                                "determinar y agregar unos nuevos.<br /><br />" +
                                "Aún así, desea continuar y eliminar los registros que ahora existen?",
                true).then(
                function() {
                    construirCifrasCoberturasParaCompanias2();
                    return;
                },
                function() {
                    return;
                });
        return;
        }

        construirCifrasCoberturasParaCompanias2();
    }


    const construirCifrasCoberturasParaCompanias2 = function () {

        movimientoSeleccionado.coberturasCompanias = [];

        let coberturaCompania = {};

        movimientoSeleccionado.companias.forEach(function (compania) {
            movimientoSeleccionado.coberturas.forEach(function (cobertura) {

                coberturaCompania = {};

                coberturaCompania._id = new Mongo.ObjectID()._str;
                coberturaCompania.compania = compania.compania;
                coberturaCompania.nosotros = compania.nosotros;
                coberturaCompania.cobertura = cobertura.cobertura;
                coberturaCompania.moneda = cobertura.moneda;

                coberturaCompania.valorARiesgo = cobertura.valorARiesgo;
                coberturaCompania.sumaAsegurada = cobertura.sumaAsegurada;
                coberturaCompania.tasa = cobertura.tasa;
                coberturaCompania.prima = cobertura.prima;
                coberturaCompania.ordenPorc = compania.ordenPorc;
                coberturaCompania.sumaReasegurada = cobertura.sumaAsegurada * compania.ordenPorc / 100;
                coberturaCompania.primaBrutaAntesProrrata = cobertura.prima * compania.ordenPorc / 100;
                coberturaCompania.primaBruta = coberturaCompania.primaBrutaAntesProrrata;

                movimientoSeleccionado.coberturasCompanias.push(coberturaCompania);
            })
        })

        // mostramos los items recién agregados en el grid ...
        $scope.coberturasCompanias_ui_grid.data = movimientoSeleccionado.coberturasCompanias;

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }
    }

    // --------------------------------------------------------------------------------------
    // ui-grid de Coberturas por compañía
    // --------------------------------------------------------------------------------------
    let coberturaCompaniaSeleccionada = {};

    $scope.coberturasCompanias_ui_grid = {
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
                //debugger;
                coberturaCompaniaSeleccionada = {};

                if (row.isSelected)
                    coberturaCompaniaSeleccionada = row.entity;
                else
                    return;
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!$scope.riesgo.docState) { 
                    $scope.riesgo.docState = 2;
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

    $scope.coberturasCompanias_ui_grid.columnDefs = [
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 80,
            cellFilter: 'companiaAbreviaturaFilter',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'cobertura',
            field: 'cobertura',
            displayName: 'Cobertura',
            width: 80,
            cellFilter: 'coberturaAbreviaturaFilter',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
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
            name: 'valorARiesgo',
            field: 'valorARiesgo',
            displayName: 'Valor a riesgo',
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
            type: 'number'
        },
        {
            name: 'tasa',
            field: 'tasa',
            displayName: 'Tasa',
            cellFilter: 'number8decimals',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
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
            type: 'number'
        },
        {
            name: 'ordenPorc',
            field: 'ordenPorc',
            displayName: 'Orden',
            cellFilter: 'number6decimals',
            width: 70,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
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
            type: 'number'
        },
        {
            name: 'primaBrutaAntesProrrata',
            field: 'primaBrutaAntesProrrata',
            displayName: 'PB antes prorrata',
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
            name: 'primaBruta',
            field: 'primaBruta',
            displayName: 'Prima bruta',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        }
    ]


    $scope.eliminarCoberturaCompania = function () {
        // cada vez que el usuario selecciona un row, lo guardamos ...
        if (movimientoSeleccionado && movimientoSeleccionado.coberturasCompanias && coberturaCompaniaSeleccionada) {
            lodash.remove(movimientoSeleccionado.coberturasCompanias, function (coberturaCompania) { return coberturaCompania._id === coberturaCompaniaSeleccionada._id; });

            if (!$scope.riesgo.docState) { 
                $scope.riesgo.docState = 2;
            }
        }
    }

    $scope.refrescarGridCoberturasCompanias = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        $scope.coberturasCompanias_ui_grid.columnDefs[2].editDropdownOptionsArray = lodash.sortBy($scope.monedas, function(item) { return item.simbolo; });
    }

    $scope.calcularCoberturasCompanias = function () {

        // nótese como usamos lodash isFinite() para saber si una variable contiene un valor numérico, incluyendo el cero. Si solo usamos
        // if (!var) y la variable es 0, la condición será cierta ...
        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado) || !movimientoSeleccionado.coberturasCompanias ||
            !movimientoSeleccionado.coberturasCompanias.length) {
            return;
        }

        movimientoSeleccionado.coberturasCompanias.forEach(function (cobertura) {

            // prima (siempre)
            if (lodash.isFinite(cobertura.valorARiesgo) && lodash.isFinite(cobertura.tasa)) { 
                cobertura.prima = cobertura.valorARiesgo * cobertura.tasa / 100;
            }

            // tasa (solo si es blanco)
            if (!lodash.isFinite(cobertura.tasa) && cobertura.valorARiesgo && lodash.isFinite(cobertura.prima)){ 
                cobertura.tasa = cobertura.prima * 100 / cobertura.valorARiesgo;
            } 

            // suma reasegurada (siempre)
            if (lodash.isFinite(cobertura.sumaAsegurada) && lodash.isFinite(cobertura.ordenPorc)){ 
                cobertura.sumaReasegurada = cobertura.sumaAsegurada * cobertura.ordenPorc / 100;
            }
                
            // prima bruta (siempre)
            if (lodash.isFinite(cobertura.prima) && lodash.isFinite(cobertura.ordenPorc)) {
                cobertura.primaBrutaAntesProrrata = cobertura.prima * cobertura.ordenPorc / 100;
                cobertura.primaBruta = cobertura.primaBrutaAntesProrrata;
            }

            // suma asegurada (solo si es blanco)
            if (!lodash.isFinite(cobertura.sumaAsegurada) && lodash.isFinite(cobertura.sumaReasegurada) && cobertura.ordenPorc){ 
                cobertura.sumaAsegurada = cobertura.sumaReasegurada / cobertura.ordenPorc * 100;
            }
                
            // orden (solo si es blanco)
            if (!lodash.isFinite(cobertura.ordenPorc) && lodash.isFinite(cobertura.sumaReasegurada) && cobertura.sumaAsegurada){ 
                cobertura.ordenPorc = cobertura.sumaReasegurada * 100 / cobertura.sumaAsegurada;
            }
                
            // prima (solo si es blanco)
            if (!lodash.isFinite(cobertura.prima) && lodash.isFinite(cobertura.primaBrutaAntesProrrata) && cobertura.ordenPorc){ 
                cobertura.prima = cobertura.primaBrutaAntesProrrata * 100 / cobertura.ordenPorc;
            } 
        });

        if (!$scope.riesgo.docState) {
            $scope.riesgo.docState = 2;
        }
    }

    $scope.construirPrimasParaCompanias = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de registros de primas para cada compañía</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if (movimientoSeleccionado.primas && movimientoSeleccionado.primas.length > 0) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de registros de primas para cada compañía</em>",
                                "Ya existen registros de prima para cada compañía en el movimiento seleccionado.<br />" +
                                "Si Ud. continúa y ejecuta esta función, estos registros <em>serán eliminados</em> antes de " +
                                "ser construidos y agregados nuevamente.<br /><br />" +
                                "Aún así, desea continuar y eliminar (sustituir) los registros que ahora existen?",
                true).then(
                function () {
                    construirPrimasParaCompanias();
                    return;
                },
                function () {
                    return;
                })
            return;
        }

        construirPrimasParaCompanias();
    }


    function construirPrimasParaCompanias() {

        movimientoSeleccionado.primas = [];

        // usamos lodash para agrupar las primas brutas para cada compañía
        const primasBrutasCompanias = lodash.groupBy(movimientoSeleccionado.coberturasCompanias, function (c) { return c.compania; });

        let primaItem = {};

        for (const compania in primasBrutasCompanias) {

            // arriba agrupamos por compañía; ahora agrupamos por moneda
            const primasBrutasMonedas = lodash.groupBy(primasBrutasCompanias[compania], function (c) { return c.moneda; });

            for(const moneda in primasBrutasMonedas) {

                primaItem = {};

                primaItem._id = new Mongo.ObjectID()._str;

                primaItem.compania = compania;
                primaItem.moneda = moneda;

                primaItem.primaBruta = lodash.sumBy(primasBrutasMonedas[moneda], 'primaBruta');

                // leemos la compañía en el movimiento, para obtener sus porcentajes (defaults)

                const companiaItem = lodash.find(movimientoSeleccionado.companias, function (c) { return c.compania === compania; });

                primaItem.nosotros = companiaItem.nosotros;

                primaItem.comisionPorc = companiaItem.comisionPorc;
                primaItem.impuestoPorc = companiaItem.impuestoPorc;
                primaItem.corretajePorc = companiaItem.corretajePorc;
                primaItem.impuestoSobrePNPorc = companiaItem.impuestoSobrePNPorc;

                // nótese como, inicialmente, simplemente calculamos la prima bruta aplicando el factor prorrata;
                // luego habrá una función para calcular esta prorrata, usando, cuando el usuario lo indique, la prima
                // anterior.

                // además, si la compañía no es nosotros, multiplicamos por -1
                if (!primaItem.nosotros) { 
                    primaItem.primaBruta *= -1;
                }
                    
                movimientoSeleccionado.primas.push(primaItem);
            }
        }

        $scope.primas_ui_grid.data = movimientoSeleccionado.primas;

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }
    }

    // para abrir un modal que permite al usuario calcular las primas prorrateadas del movimiento
    // (casi siempre en base a las primas del movimiento anterior y las del actual)
    $scope.prorratearPrimasBrutas = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos - Prorratear primas brutas</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        $uibModal.open({
            templateUrl: 'client/html/riesgos/prorratearPrimasModal.html',
            controller: 'Riesgos_ProrratearPrimasController',
            size: 'lg',
            resolve: {
                riesgo: function () {
                    return $scope.riesgo;
                },
                movimiento: function () {
                    return movimientoSeleccionado;
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

    // --------------------------------------------------------------------------------------
    // ui-grid de primas por compañía
    // --------------------------------------------------------------------------------------

    $scope.primas_ui_grid = {
        enableSorting: false,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            $scope.primas_ui_gridApi = gridApi;

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!$scope.riesgo.docState)
                        $scope.riesgo.docState = 2;
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

    $scope.primas_ui_grid.columnDefs = [
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 80,
            cellFilter: 'companiaAbreviaturaFilter',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 40,
            cellFilter: 'monedaSimboloFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'primaBruta',
            field: 'primaBruta',
            displayName: 'Prima bruta',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'comisionPorc',
            field: 'comisionPorc',
            displayName: 'Com(%)',
            cellFilter: 'currencyFilterAndNull',
            width: 70,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'comision',
            field: 'comision',
            displayName: 'Comisión',
            cellFilter: 'currencyFilterAndNull',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'impuestoPorc',
            field: 'impuestoPorc',
            displayName: 'Imp(%)',
            cellFilter: 'currencyFilterAndNull',
            width: 70,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'impuesto',
            field: 'impuesto',
            displayName: 'Impuesto',
            cellFilter: 'currencyFilterAndNull',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'corretajePorc',
            field: 'corretajePorc',
            displayName: 'Corr(%)',
            cellFilter: 'currencyFilterAndNull',
            width: 70,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'corretaje',
            field: 'corretaje',
            displayName: 'Corretaje',
            cellFilter: 'currencyFilterAndNull',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'primaNeta0',
            field: 'primaNeta0',
            displayName: 'Prima neta',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'impuestoSobrePNPorc',
            field: 'impuestoSobrePNPorc',
            displayName: 'Imp/pn(%)',
            cellFilter: 'currencyFilterAndNull',
            width: 70,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'impuestoSobrePN',
            field: 'impuestoSobrePN',
            displayName: 'Imp/pn',
            cellFilter: 'currencyFilterAndNull',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        },
        {
            name: 'primaNeta',
            field: 'primaNeta',
            displayName: 'Prima neta',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        }
    ]

    $scope.calcularPrimas = function () {

        // nótese como usamos lodash isFinite() para saber si una variable contiene un valor numérico, incluyendo el cero. Si solo usamos
        // if (!var) y el valor es 0, la condición será cierta ...
        if (!movimientoSeleccionado || !movimientoSeleccionado.primas || !movimientoSeleccionado.primas.length) {
            return;
        }

        movimientoSeleccionado.primas.forEach(function (p) {

            // comision%
            if (!lodash.isFinite(p.comisionPorc) && p.primaBruta && lodash.isFinite(p.comision)) {
                p.comisionPorc = Math.abs(p.comision / p.primaBruta * 100);
            }

            // comision
            // nótese como, en adelante, los costos son calculados con signo contrario
            if (lodash.isFinite(p.primaBruta) && lodash.isFinite(p.comisionPorc)) {
                p.comision = (p.primaBruta * p.comisionPorc / 100) * -1;
            }

            // impuesto%
            if (!lodash.isFinite(p.impuestoPorc) && p.primaBruta && lodash.isFinite(p.impuesto)) {
                p.impuestoPorc = Math.abs(p.impuesto / p.primaBruta * 100);
            }

            // impuesto
            if (lodash.isFinite(p.primaBruta) && lodash.isFinite(p.impuestoPorc)) {
                p.impuesto = (p.primaBruta * p.impuestoPorc / 100) * -1;
            }

            // corretaje%
            if (!lodash.isFinite(p.corretajePorc) && p.primaBruta && lodash.isFinite(p.corretaje)) {
                p.corretajePorc = Math.abs(p.corretaje / p.primaBruta * 100);
            }

            // corretaje
            if (lodash.isFinite(p.primaBruta) && lodash.isFinite(p.corretajePorc)) {
                p.corretaje = (p.primaBruta * p.corretajePorc / 100) * -1;
            }

            // prima neta
            // como los 'costos' vienen ya con signo contrario, al sumar quitamos el costo al monto
            if (lodash.isFinite(p.primaBruta)) {
                p.primaNeta0 = p.primaBruta;

                if (p.comision) {
                    p.primaNeta0 += p.comision;
                }

                if (p.impuesto) {
                    p.primaNeta0 += p.impuesto;
                }

                if (p.corretaje) {
                    p.primaNeta0 += p.corretaje;
                }
            }

            // impuestoSobrePN%
            if (!lodash.isFinite(p.impuestoSobrePNPorc) && p.primaNeta0 && lodash.isFinite(p.impuestoSobrePN)) {
                p.impuestoSobrePNPorc = Math.abs(p.impuestoSobrePN / p.primaNeta0 * 100);
            }

            // impuestoSobrePN
            if (lodash.isFinite(p.primaNeta0) && lodash.isFinite(p.impuestoSobrePNPorc)) {
                p.impuestoSobrePN = (p.primaNeta0 * p.impuestoSobrePNPorc / 100) * -1;
            }

            // prima neta despues de impuesto/pn
            if (lodash.isFinite(p.primaNeta0)) {
                p.primaNeta = p.primaNeta0;

                if (p.impuestoSobrePN)
                p.primaNeta += p.impuestoSobrePN;
            }

            // finalmente, el usuario puede indicar la prima neta más no la prima bruta
            if (lodash.isFinite(p.primaNeta) && !lodash.isFinite(p.primaNeta0)) {
                p.primaNeta0 = p.primaNeta;

                // el impuesto viene con signo contrario; al restar, agregamos el monto a la pn
                if (p.impuestoSobrePN) {
                    p.primaNeta0 -= p.impuestoSobrePN;
                }
            }

            if (lodash.isFinite(p.primaNeta0) && !lodash.isFinite(p.primaBruta)) {
                p.primaBruta = p.primaNeta0;

                // cómo los 'costos' ya vienen con signo diferente a la prima, al restar, agregamos el monto a la pb
                if (p.comision) {
                    p.primaBruta -= p.comision;
                }

                if (p.impuesto) {
                    p.primaBruta -= p.impuesto;
                }

                if (p.corretaje) {
                    p.primaBruta -= p.corretaje;
                }
            }
        })

        // nótese lo que hacemos para 'refrescar' el grid (solo hace falta, aparentemente, para los totales ...

        //$scope.gridApi.core.refresh();
        $scope.primas_ui_gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);

        if (!$scope.riesgo.docState)
            $scope.riesgo.docState = 2;
    }

    $scope.construirCuotasMovimiento = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de cuotas</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if (!movimientoSeleccionado.primas || !movimientoSeleccionado.primas.length) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de cuotas</em>",
                                "El movimiento seleccionado no tiene registros de prima registrados; debe tenerlos.<br />" +
                                "Las cuotas se construyen en base a los registros de prima del movimiento. " +
                                "El movimiento debe tener registros de prima registrados.",
                                false).then();

            return;
        }

        // ------------------------------------------------------------------------------------------------------------------------
        // determinamos si las cuotas han recibido cobros; de ser así, impedimos editarlas ... 
        // leemos solo las cuotas que corresponden al 'sub' entity; por ejemplo, solo al movimiento, capa, cuenta, etc., que el 
        // usuario está tratando en ese momento ...  
        // ------------------------------------------------------------------------------------------------------------------------
        const cuotasMovimientoSeleccionado = lodash.filter($scope.cuotas, (c) => { 
            return c.source.subEntityID === movimientoSeleccionado._id; }
        )

        const existenCuotasConCobrosAplicados = determinarSiExistenCuotasConCobrosAplicados(cuotasMovimientoSeleccionado); 
        if (existenCuotasConCobrosAplicados.existenCobrosAplicados) { 
            DialogModal($uibModal, "<em>Cuotas - Existen cobros/pagos asociados</em>", existenCuotasConCobrosAplicados.message, false).then(); 
            return;
        }

        const cantidadCuotasMovimientoSeleccionado = lodash($scope.cuotas).filter(function (c) { return c.source.subEntityID === movimientoSeleccionado._id; }).size();

        if (cantidadCuotasMovimientoSeleccionado) {
            DialogModal($uibModal, "<em>Riesgos - Construcción de cuotas</em>",
                                "Ya existen cuotas registradas para el movimiento seleccionado.<br />" +
                                "Si Ud. continúa y ejecuta esta función, las cuotas que corresponden al movimiento seleccionado <em>serán eliminadas</em> antes de " +
                                "construirlas y agregarlas nuevamente.<br /><br />" +
                                "Aún así, desea continuar y eliminar (sustituir) las cuotas que ahora existen?",
                true).then(
                function () {
                    construirCuotasMovimiento();
                    return;
                },
                function () {
                    return;
                });
            return;
        }

        construirCuotasMovimiento();
    }

    // si el usuario selecciona una moneda, intentamos mostrar solo items para la misma en el grid de primas ...
    $scope.gridPrimas_SeleccionarPorMoneda = function(monedaSeleccionada) {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado))
            return;

        if (!movimientoSeleccionado.primas || lodash.isEmpty(movimientoSeleccionado.primas))
            return;

        if (monedaSeleccionada)
            $scope.primas_ui_grid.data = lodash.filter(movimientoSeleccionado.primas, function(item) { return item.moneda === monedaSeleccionada; });
        else
            $scope.primas_ui_grid.data = movimientoSeleccionado.primas;
    }

    function construirCuotasMovimiento() {

        $uibModal.open({
            templateUrl: construirCuotasMovimiento_htmlTemplate,
            controller: 'Riesgos_ConstruirCuotasController',
            size: 'md',
            resolve: {
                riesgo: function () {
                    return $scope.riesgo;
                },
                movimiento: function () {
                    return movimientoSeleccionado;
                },
                cuotas: function () {
                    return $scope.cuotas;
                }
            }
        }).result.then(
            function () {
                return true;
            },
            function () {
                return true;
            })
    }

    if ($scope.riesgo.movimientos) { 
        $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;
    }

    $interval( () => { 
        if (movimientoSeleccionado && !lodash.isEmpty(movimientoSeleccionado)) { 
            // intentamos recuperar el movimiento que se ha seleccionado antes ... 
            movimientos_ui_grid_gridApi.core.refresh();  
            movimientos_ui_grid_gridApi.selection.selectRow(movimientoSeleccionado);
        }

        // si el usuario no ha seleccionado un movimiento pero existen, seleccionamos el 1ro. ... 
        if ($scope.riesgo && $scope.riesgo.movimientos && Array.isArray($scope.riesgo.movimientos) && $scope.riesgo.movimientos.length) { 

            movimientoSeleccionado = $scope.riesgo.movimientos[0]; 
            $scope.$parent.movimientoSeleccionado = movimientoSeleccionado;     // para que esté disponible en cualquier state 

            movimientos_ui_grid_gridApi.core.refresh();  
            movimientos_ui_grid_gridApi.selection.selectRow(movimientoSeleccionado);
        }
    }, 500, 1);

    $scope.showProgress = false; 
}])