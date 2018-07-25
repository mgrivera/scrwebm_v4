

import * as moment from 'moment';
import * as lodash from 'lodash';
import * as angular from 'angular';

import * as riesgos_funcionesGenerales from './riesgos_funcionesGenerales'; 

import { Riesgos } from 'imports/collections/principales/riesgos'; 
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Asegurados } from 'imports/collections/catalogos/asegurados'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 
import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 
import { Cuotas } from 'imports/collections/principales/cuotas'; 
import { TiposFacultativo } from 'imports/collections/catalogos/tiposFacultativo'; 

import { Coberturas } from 'imports/collections/catalogos/coberturas'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 
import { Suscriptores } from 'imports/collections/catalogos/suscriptores'; 

import { determinarSiExistenCuotasConCobrosAplicados } from '../imports/generales/determinarSiExistenCuotasCobradas'; 
import { DialogModal } from '../imports/generales/angularGenericModal'; 
import { MostrarPagosEnCuotas } from '../imports/generales/mostrarPagosAplicadosACuotaController'; 

angular.module("scrwebM").controller("RiesgoController",
['$scope', '$state', '$stateParams', '$meteor', '$modal', 'uiGridConstants',
  function ($scope, $state, $stateParams, $meteor, $modal, uiGridConstants) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let empresaUsuariaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (empresaUsuariaSeleccionada) { 
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(empresaUsuariaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
        
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) { 
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    $scope.goToState = function (state) {
        // para abrir alguno de los 'children' states ...
        if (state != 'cuotas') { 
            $state.go("riesgo." + state);

            if (state === 'generales') { 
                // para inicializar el Select asegurado con selectize ... 
                aseguradoSetSelectize($modal, $scope); 
            }
        }
        else {
            // el state 'cuotas' recibe, en $scope.parent, este scope ... nos aseguramos de pasar el movimiento seleccionado ...
            if (movimientoSeleccionado) { 
                $scope.movimientoSeleccionado = movimientoSeleccionado;
            }
                
            $state.go("riesgo.cuotas", {
                'origen': $stateParams.origen,
                'source': 'facXXX'
            });
        };
    };

      // -------------------------------------------------------------------------------------------
    // leemos los catálogos en el $scope
    $scope.helpers({
        suscriptores: () => { return Suscriptores.find({}); },
        monedas: () => { return Monedas.find({}); },
        indoles: () => { return Indoles.find({}); },
        companias: () => { return Companias.find({}); },
        ramos: () => { return Ramos.find({}); },
        coberturas: () => { return Coberturas.find({}); },
        asegurados: () => { return Asegurados.find({}); },
        tiposFacultativo: () => { return TiposFacultativo.find({}); },
    })

    $scope.estados = [
        { estado: 'CO', descripcion: 'Cotización' },
        { estado: 'AC', descripcion: 'Aceptado' },
        { estado: 'EM', descripcion: 'Emitido' },
        { estado: 'RE', descripcion: 'Renovación' },
        { estado: 'RV', descripcion: 'Renovado' },
        { estado: 'AN', descripcion: 'Anulado' },
        { estado: 'DE', descripcion: 'Declinado' },
    ];

    $scope.nuevo0 = function () {

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa para agregar un nuevo registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                                    true);

            promise.then(
                function (resolve) {
                    $scope.nuevo();
                },
                function (err) {
                    return true;
                });

            return;
        }
        else
            $scope.nuevo();
    };

    let cuotasSubscriptionHandle: any = null;

    $scope.nuevo = function () {
        // $scope.riesgo fue inicializado a partir de un objeto Meteor (ie: $scope.meteorObject(coll, id)) ...
        // stop() lo 'desconcta' del objeto Meteor
        if ($scope.riesgo && $scope.riesgo.stop)
            $scope.riesgo.stop();

        $scope.riesgo = {};
        $scope.riesgo = {
            _id: new Mongo.ObjectID()._str,
            numero: 0,
            ingreso: new Date(),
            usuario: Meteor.userId(),
            cia: $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : null,
            docState: 1
        };

        // si existen algunas cuotas en minimongo, detenemos el subscription
        if (cuotasSubscriptionHandle) {
            cuotasSubscriptionHandle.stop();
        }

        $scope.cuotas = [];
        $scope.cuotas_ui_grid.data = $scope.cuotas;

        // inicialmente, mostramos el state 'generales'
        $scope.goToState('generales');
    };


    // para copiar el riesgo seleccionado en uno nuevo que el usuario pueda editar y grabar como uno diferente
    $scope.copiarEnUnNuevoRiesgo = function() {

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            DialogModal($modal, "<em>Riesgos - Copiar riesgo en uno nuevo ...</em>",
                                "Aparentemente, <em>se han efectuado cambios</em> en el registro.<br /><br />" +
                                "Por favor guarde estos cambios antes de intentar ejecutar esta función.",
                                false).then();
            return;
        }

        var promise = DialogModal($modal,
            "<em>Riesgos</em>",
            `Este proceso copiará el riesgo que ahora está en la página, a un nuevo riesgo. <br />
             Desea continuar y crear un nuevo riesgo en base al que ahora está e la página?
            `,
            true).then(
            function (resolve) {
                let result = riesgos_funcionesGenerales.copiarRiesgoEnUnoNuevo($scope.riesgo); 

                if (result.error) { 

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'alert',
                        msg: result.message
                    });

                    return; 
                }

                $scope.riesgo = {}; 
                $scope.riesgo = result.nuevoRiesgo; 

                $scope.movimientos_ui_grid.data = [];
                $scope.companias_ui_grid.data = [];
                $scope.coberturas_ui_grid.data = [];
                $scope.coberturasCompanias_ui_grid.data = [];
                $scope.primas_ui_grid.data = [];
                $scope.productores_ui_grid.data = [];
                $scope.cuotas_ui_grid.data = [];

                if ($scope.riesgo.movimientos) { 
                    $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;
                }


                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                });
        
                $scope.goToState('generales');
            },
            function (err) {
                return true;
            }
        )
    } 


    $scope.renovarRiesgo = function() { 

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            DialogModal($modal, "<em>Riesgos - Renovar riesgo</em>",
                                "Aparentemente, <em>se han efectuado cambios</em> en el registro.<br /><br />" +
                                "Por favor guarde estos cambios antes de intentar ejecutar esta función.",
                                false).then();
            return;
        }

        var modalInstance = $modal.open({
            templateUrl: 'client/riesgos/renovarRiesgo/renovarRiesgoModal.html',
            controller: 'RenovarRiesgo_ModalController',
            size: 'md',
            resolve: {
                riesgoOriginal: function () {
                    return $scope.riesgo;
                },
                companiaSeleccionada: function () {
                    return $scope.companiaSeleccionada;
                },
            }
        }).result.then(
          function (resolve) {
              return true;
          },
          function (cancel) {
              return true;
          })
    }
            

    $scope.origen = $stateParams.origen;
    $scope.id = $stateParams.id;
    $scope.limit = parseInt($stateParams.limit);
    // nótese que el boolean value viene, en realidad, como un string ...
    $scope.vieneDeAfuera = ($stateParams.vieneDeAfuera == "true");    // por ejemplo: cuando se abre desde siniestros ...

    // ---------------------------------------------------------------------------
    // para inicializar la fecha final cuando se indica la inicial ...
    $scope.$watch(
        function(scope) { return scope.riesgo.desde; },
        function(newValue, oldValue) {
            if (newValue && (newValue != oldValue)) {
                if (!$scope.riesgo.hasta) {
                    // determinamos la fecha pero para el prox año
                    var newDate = new Date(newValue.getFullYear() + 1, newValue.getMonth(), newValue.getDate());
                    $scope.riesgo.hasta = newDate;
                };
            };
        }
    );
    

    $scope.grabar = function () {

        // lo primero que hacemos es intentar validar el item ...
        if (!$scope.riesgo || !$scope.riesgo.docState) {
            DialogModal($modal, "<em>Riesgos</em>",
                                "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                false).then();
            return;
        }

        // cuando el usuario deja la referencia vacía, la determinamos al grabar; nótese que debemos agregar algo,
        // pues el campo es requerido
        if (!$scope.riesgo.referencia) {
            $scope.riesgo.referencia = '0';
        }

        $scope.showProgress = true;

        // nótese como validamos antes de intentar guardar en el servidor
        var isValid = false;
        var errores = [];

        var item = {} as any;

        if ($scope.riesgo.getRawObject) {           // getRawObject: solo cuando el riesgo viene de $meteorCollection ...
            item = $scope.riesgo.getRawObject();
        }
        else { 
        item = $scope.riesgo;
        }
            
        if (item.docState != 3) {
            isValid = Riesgos.simpleSchema().namedContext().validate(item);

            if (!isValid) {
                Riesgos.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Riesgos.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'." as never);
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
            });

            $scope.showProgress = false;
            return;
        }

        // ------------------------------------------------------------------------------------------
        // ahoa validamos las cuotas, las cuales son registradas en un collection diferente ...
        var editedItems = lodash($scope.cuotas).
                            filter(function (c) { return c.docState; }).
                            map(function (c) { delete c.$$hashKey; return c; }).
                            value();

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = Cuotas.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    Cuotas.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Cuotas.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'." as never);
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
            })

            $scope.showProgress = false;
            return;
        }

        $meteor.call('riesgosSave', item).then(
            function (resolve) {
                // guardamos, separadamente, las cuotas (solo las que el usuario ha editado
                // nota: eliminamos $$hashKey a cada row (agregado por ui-grid),  antes de grabar en mongo
                var cuotasArray = lodash($scope.cuotas).
                                    filter(function (c) { return c.docState; }).
                                    map(function (c) { delete c.$$hashKey; return c; }).
                                    value();

                // antes de guardar las cuotas en mongo, 'detenemos' (stop) el binding entre meteor y el $scope ...
                if ($scope.cuotas && $scope.cuotas.stop)
                    $scope.cuotas.stop();

                $meteor.call('cuotasSave', cuotasArray).then(
                    function (resolveCuotas) {
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'info',
                            msg: resolve
                        });

                        // cuando el usuario agrega un nuevo item, y viene desde un filtro, el item no estará en la lista (a menos que cumpla con el 'criterio'
                        // de selección ???). Por eso, hacemos un subscription solo del nuevo item. Como no destruimos el 'handle' del subscription anterior
                        // (que creó la lista), el nuevo item se agregará a la lista ....
                        if (item.docState == 1) {
                            $meteor.subscribe('riesgos', JSON.stringify({ _id: item._id })).then(
                                function (subscriptionHandle) {
                                    $scope.riesgo = {};

                                    $scope.riesgo = $scope.$meteorObject(Riesgos, item._id, false);   // luego del subscribe, el nuevo item estará en el collection
                                    $scope.id = $scope.riesgo._id;

                                    // asociamos los ui-grids a sus datos en el $scope
                                    if ($scope.riesgo.movimientos)
                                        $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;

                                    $scope.$meteorSubscribe('cuotas', JSON.stringify({ "source.entityID": $scope.id })).then(
                                        function (subscriptionHandle) {
                                            $scope.cuotas = Cuotas.find({ 'source.entityID': $scope.id }).fetch();

                                            if ($scope.cuotas)
                                                $scope.cuotas_ui_grid.data = $scope.cuotas;

                                            $scope.showProgress = false;
                                        });
                                });
                        }
                        else {

                            $scope.riesgo = {};

                            $scope.riesgo = $scope.$meteorObject(Riesgos, item._id, false);
                            $scope.id = $scope.riesgo._id;

                            // asociamos los ui-grids a sus datos en el $scope
                            $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;

                            $scope.$meteorSubscribe('cuotas', JSON.stringify({ "source.entityID": $scope.id })).then(
                                function (subscriptionHandle) {
                                    $scope.cuotas = Cuotas.find({ 'source.entityID': $scope.id }).fetch();

                                    if ($scope.cuotas)
                                        $scope.cuotas_ui_grid.data = $scope.cuotas;

                                    $scope.showProgress = false;
                                });
                        }
                    },
                    function (err) {
                        let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.<br />";
                        if (err.errorType)
                            errorMessage += err.errorType + " ";

                        if (err.message)
                            errorMessage += err.message + " ";

                        if (err.reason)
                            errorMessage += err.reason + " ";

                        if (err.details)
                            errorMessage += "<br />" + err.details;

                        if (!err.message && !err.reason && !err.details)
                            errorMessage += err.toString();

                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'danger',
                            msg: errorMessage
                        });

                        $scope.showProgress = false;
                    });
            },
            function (err) {
                let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.<br />";
                if (err.errorType)
                    errorMessage += err.errorType + " ";

                if (err.message)
                    errorMessage += err.message + " ";

                if (err.reason)
                    errorMessage += err.reason + " ";

                if (err.details)
                    errorMessage += "<br />" + err.details;

                if (!err.message && !err.reason && !err.details)
                    errorMessage += err.toString();

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
            });
    }

    $scope.regresarALista = function () {

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                    true).then(
                function (resolve) {
                    $state.go('riesgosLista', { origen: $scope.origen, limit: $scope.limit });
                },
                function (err) {
                    return true;
                })
            return;
        }
        else { 
        $state.go('riesgosLista', { origen: $scope.origen, limit: $scope.limit });
        }
    }


    $scope.eliminar = function () {
        if ($scope.riesgo.docState && $scope.riesgo.docState == 1) {
            if ($scope.riesgo.docState) {
                var promise = DialogModal($modal,
                                        "<em>Riesgos</em>",
                                        "El registro es nuevo; para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                                        false);

                promise.then(
                    function (resolve) {
                        return;
                    },
                    function (err) {
                        return;
                    });

                return;
            }
        };

        // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
        $scope.riesgo.docState = 3;
    }

    $scope.refresh = function () {
        if ($scope.riesgo.docState) {
            var promise = DialogModal($modal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa y refresca el registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios?",
                                    true);

            promise.then(
                function (resolve) {
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


    $scope.imprimir = function() {
        if (!$scope.riesgo || !$scope.riesgo.movimientos || lodash.isEmpty($scope.riesgo.movimientos)) {
            DialogModal($modal, "<em>Riesgos - Construcción de notas de cobertura</em>",
                        "Aparentemente, el riesgo para el cual Ud. desea construir las notas de cobertura, no tiene movimientos registrados.",
                        false).then();
            return;
        };

        $modal.open({
            templateUrl: 'client/riesgos/imprimirNotasModal.html',
            controller: 'ImprimirNotasRiesgosModalController',
            size: 'lg',
            resolve: {
            riesgo: function () {
                return $scope.riesgo;
            },
            cuotas: function() {
                return $scope.cuotas;
            },
            tiposMovimiento: function() {
                return $scope.tiposMovimiento;
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

    $scope.setIsEdited = function () {
        if ($scope.riesgo.docState)
            return;

        $scope.riesgo.docState = 2;
    }

    $scope.tiposMovimiento = [
        { tipo: 'OR', descripcion: 'Original' },
        { tipo: 'AS', descripcion: 'Aumento de Suma Asegurada' },
        { tipo: 'DS', descripcion: 'Disminución de Suma Asegurada' },
        { tipo: 'COAD', descripcion: 'Cobro Adicional de Prima' },
        { tipo: 'DP', descripcion: 'Devolucion de Prima' },
        { tipo: 'EC', descripcion: 'Extensión de Cobertura' },
        { tipo: 'CR', descripcion: 'Cambio de Reasegurador' },
        { tipo: 'SE', descripcion: 'Sin Efecto' },
        { tipo: 'AN', descripcion: 'Anulación' },
        { tipo: 'AE', descripcion: 'Anulación de Endoso' },
        { tipo: 'CAPA', descripcion: 'Cambio de Participación' },
        { tipo: 'PRAJ', descripcion: 'Prima de Ajuste' },
        { tipo: 'AJPR', descripcion: 'Ajuste de Prima' },
        { tipo: 'FRPR', descripcion: 'Fraccionamiento de Prima' },
        { tipo: 'DE', descripcion: 'Endoso declarativo' },
        { tipo: 'IncCob', descripcion: 'Inclusión de Cobertura' }
    ]

    // --------------------------------------------------------------------------------------
    // ui-grid de Movimientos
    // --------------------------------------------------------------------------------------
    var movimientoSeleccionado = {} as any;

    $scope.movimientos_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                movimientoSeleccionado = {};

                if (row.isSelected) {

                    movimientoSeleccionado = row.entity;

                    $scope.companias_ui_grid.data = [];
                    $scope.coberturas_ui_grid.data = [];
                    $scope.coberturasCompanias_ui_grid.data = [];
                    $scope.primas_ui_grid.data = [];
                    $scope.productores_ui_grid.data = [];

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
                        
                    if (movimientoSeleccionado.productores) { 
                    $scope.productores_ui_grid.data = movimientoSeleccionado.productores;
                    }
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


    $scope.numeroMovimientoSeleccionado = function() {
        return (movimientoSeleccionado && !lodash.isEmpty(movimientoSeleccionado)) ? movimientoSeleccionado.numero : -1;
    }


    $scope.agregarMovimiento = function () {

        if (!lodash.isArray($scope.riesgo.movimientos))
            $scope.riesgo.movimientos = [];

        // solo para el 1er. movimiento, agregamos la compañía 'nosotros', la cual representa nuestra compañía, y es la que,
        // justamente, tendrá 'nuestra orden'

        let companiaNosotros = {} as any;

        if (!$scope.riesgo.movimientos.length) {
            companiaNosotros = Companias.findOne({ nosotros: true }, { fields: { _id: 1 } });

            if (!companiaNosotros) {
                DialogModal($modal, "<em>Riesgos</em>",
                            "No hemos encotrado una compañía del tipo 'nosotros', la cual represente, justemente, nuestra compañía.<br />" +
                            "En el catálogo <em>Compañías</em> debe existir una compañía del tipo <em>nosotros</em>.<br />" +
                            "Por favor revise esta situación antes de continuar.",
                            false).then();

                return;
            }
        }


        if ($scope.riesgo.movimientos.length > 0) {

            // para agregar un movimiento cuando ya existen otros, copiamos el último (lodash clone) y lo modificamos levemente ...
            var ultimoMovimiento = $scope.riesgo.movimientos[$scope.riesgo.movimientos.length - 1];
            var nuevoMovimiento = lodash.clone(ultimoMovimiento);

            if (nuevoMovimiento) {

                nuevoMovimiento._id = new Mongo.ObjectID()._str;
                nuevoMovimiento.numero++;
                nuevoMovimiento.tipo = null;
                nuevoMovimiento.fechaEmision = new Date();
                delete nuevoMovimiento.$$hashKey;

                // nótese como eliminamos los arrays de coberturas por compañía y primas
                nuevoMovimiento.coberturasCompanias = [];
                nuevoMovimiento.primas = [];

                // recorremos los arrays en el nuevo movimiento, para asignar nuevos _ids y eliminar $$hashkey ...
                nuevoMovimiento.coberturas.map(function(c) {
                    if (c.$$hashKey)
                        delete c.$$hashKey;

                    c._id = new Mongo.ObjectID()._str;
                });

                nuevoMovimiento.companias.map(function(c) {
                    if (c.$$hashKey)
                        delete c.$$hashKey;

                    c._id = new Mongo.ObjectID()._str;
                });

                $scope.riesgo.movimientos.push(nuevoMovimiento);

                if (!$scope.riesgo.docState)
                    $scope.riesgo.docState = 2;

                nuevoMovimiento = {};

                DialogModal($modal,
                            "<em>Riesgos - Nuevo movimiento</em>",
                            "Ok, un nuevo movimiento ha sido agregado al riesgo. " +
                            "Nóte que el nuevo movimiento es, simplemente, una copia del movimiento anterior.<br /><br />" +
                            "Ud. debe seleccionarlo en la lista y asignarle un tipo. Luego debe hacer las " +
                            "modificaciones que le parezca adecuadas.<br /><br />" +
                            "Recuerde que las cifras que indique para el nuevo movimiento, deben corresponder <em>siempre al " +
                            "100%</em> de la orden y a la totalidad del período; es derir, no al período que corresponde a " +
                            "la modificación.<br /><br />" +
                            "Posteriormente, y si es adecuado, Ud. podrá prorratear la prima para obtener solo la " +
                            "parte que corresponde al período.",
                            false).then();

                $scope.movimientos_ui_grid.data = [];
                $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;

                return;
            };
        }
        else {
            var movimiento = {} as any;

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

            if (!$scope.riesgo.docState)
                $scope.riesgo.docState = 2;

            movimiento = {};

            $scope.movimientos_ui_grid.data = [];
            $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;
        }
    }

    $scope.eliminarMovimiento = function () {

        if (movimientoSeleccionado && !lodash.isEmpty(movimientoSeleccionado)) {
            lodash.remove($scope.riesgo.movimientos, function (movimiento: any) { return movimiento._id === movimientoSeleccionado._id; });

            // para que los grids que siguen dejen de mostrar registros para el movimiento
            $scope.companias_ui_grid.data = [];
            $scope.coberturas_ui_grid.data = [];
            $scope.coberturasCompanias_ui_grid.data = [];
            $scope.primas_ui_grid.data = [];

            if (!$scope.riesgo.docState)
                $scope.riesgo.docState = 2;
        }
        else {
            DialogModal($modal, "<em>Riesgos</em>",
                        "Ud. debe seleccionar un movimiento antes de intentar eliminarlo.",
                        false).then();
            return;
        };
    };

    $scope.movimientosCalcular = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar calcular sus valores.",
                                false).then();

            return;
        };

        if (movimientoSeleccionado.desde && movimientoSeleccionado.hasta)
            movimientoSeleccionado.cantidadDias = moment(movimientoSeleccionado.hasta).diff(moment(movimientoSeleccionado.desde), 'days');

        if (movimientoSeleccionado.desde && !movimientoSeleccionado.hasta && lodash.isFinite(movimientoSeleccionado.cantidadDias))
            // tenemos la fecha inicial y la cantidad de días; calculamos la fecha final agregando los días a la fecha inicial
            moment(movimientoSeleccionado.desde).add(movimientoSeleccionado.cantidadDias, 'months');

        if (!movimientoSeleccionado.desde && movimientoSeleccionado.hasta && lodash.isFinite(movimientoSeleccionado.cantidadDias))
            // tenemos la fecha final y la cantidad de días; calculamos la fecha incial restando la cantidad de días a la fecha final
            moment(movimientoSeleccionado.hasta).subtract(movimientoSeleccionado.cantidadDias, 'months');

        // redondemos, al menos por ahora, a 365 días

        if (movimientoSeleccionado.cantidadDias == 366)
            movimientoSeleccionado.cantidadDias = 365;

        movimientoSeleccionado.factorProrrata = movimientoSeleccionado.cantidadDias / 365;
    }

    // ---------------------------------------------------------------------
    // para registrar los documentos de cada movimiento (cesión y recibo)
    // ---------------------------------------------------------------------
    $scope.registroDocumentosMovimiento = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Documentos</em>",
                        "Ud. debe seleccionar un movimiento antes de intentar registrar sus documentos.",
                        false).then();

            return;
        };

        var modalInstance = $modal.open({
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
            function (resolve) {
                return true;
            },
            function (cancel) {
                return true;
            });
    }


    // --------------------------------------------------------------------------------------
    // ui-grid de Compañías
    // --------------------------------------------------------------------------------------
    let companiaSeleccionada = {} as any;

    $scope.companias_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
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
            DialogModal($modal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar agregar una compañía.",
                                false).then();

            return;
        };

        var companiaNosotros = lodash.find(movimientoSeleccionado.companias, function (c) { return c.nosotros; });
        var companiaAnterior = (movimientoSeleccionado.companias && movimientoSeleccionado.companias.length) ? 
                                movimientoSeleccionado.companias[movimientoSeleccionado.companias.length - 1] : 
                                null;
        
        var reaseguradoresOrden = lodash(movimientoSeleccionado.companias).
                                        filter(function(c: any) { return !c.nosotros; }).
                                        sumBy(function(c: any) { return c.ordenPorc; });

        if (!reaseguradoresOrden) { 
        reaseguradoresOrden = 0;
        }
            
        let ordenPorc: any = null;

        if (companiaNosotros) { 
        ordenPorc = companiaNosotros.ordenPorc;
        }
            
        if (ordenPorc && reaseguradoresOrden) { 
        ordenPorc -= reaseguradoresOrden;
        } 
            
        // cada compañía que agregamos, usa los 'defaults' de la compañía anterior
        var compania = {
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
            lodash.remove(movimientoSeleccionado.companias, function (compania: any) { return compania._id === companiaSeleccionada._id; });

            if (!$scope.riesgo.docState)
                $scope.riesgo.docState = 2;
        };
    }

    $scope.refrescarGridCompanias = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        var companiasParaListaUIGrid = lodash.chain($scope.companias).
                                    filter(function(c) { return (c.nosotros || c.tipo == 'REA' || c.tipo == "CORRR") ? true : false; }).
                                    sortBy(function(item) { return item.nombre; }).
                                    value();

        $scope.companias_ui_grid.columnDefs[0].editDropdownOptionsArray = companiasParaListaUIGrid;
    };


    $scope.registrarPersonasCompanias = function() {

        if (!$scope.riesgo || !$scope.riesgo.compania) {
            DialogModal($modal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. no ha seleccionado una compañía como cedente para este riesgo.<br />" +
                                "El riesgo debe tener una compañía cedente antes de intentar registrar sus personas.",
                                false).then();

            return;
        };


        var modalInstance = $modal.open({
            templateUrl: 'client/generales/registrarPersonas.html',
            controller: 'RegistrarPersonasController',
            size: 'lg',
            resolve: {
                companias: function () {
                //   debugger;
                    let riesgo = $scope.riesgo;
                    let companias = [];

                    if (lodash.isArray(riesgo.personas)) {
                        riesgo.personas.forEach(persona => {
                            companias.push({ compania: persona.compania, titulo: persona.titulo, nombre: persona.nombre } as never);
                        });
                    };

                    // ahora revisamos las compañías en el riesgo y agregamos las que
                    // *no* existan en el array de compañías

                    if (!lodash.some(companias, (c: any) => { return c.compania == riesgo.compania; } ))
                        companias.push({ compania: riesgo.compania } as never);

                    if (lodash.isArray(riesgo.movimientos)) {
                        riesgo.movimientos.forEach(movimiento => {
                        if (lodash.isArray(movimiento.companias)) {
                            movimiento.companias.forEach(r => {
                                if (!r.nosotros) { 
                                    if (!lodash.some(companias, (c: any) => { return c.compania == r.compania; } )) { 
                                        companias.push({ compania: r.compania } as never);
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
            function (resolve) {
                return true;
            },
            function (cancel) {
                // recuperamos las personas de compañías, según las indicó el usuario en el modal
                if (cancel.entityUpdated) {
                    let companias = cancel.companias;
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
                };

                return true;
            });
    }

    // --------------------------------------------------------------------------------------
    // ui-grid de Coberturas
    // --------------------------------------------------------------------------------------
    var coberturaSeleccionada = {} as any;

    $scope.coberturas_ui_grid = {
        enableSorting: false,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
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
                        };
                        case "tasa": {

                            if (rowEntity.valorARiesgo && rowEntity.tasa && !rowEntity.prima)
                                rowEntity.prima = rowEntity.valorARiesgo * rowEntity.tasa / 1000

                            break;
                        };
                        case "prima": {

                            if (rowEntity.valorARiesgo && !rowEntity.tasa && rowEntity.prima)
                                rowEntity.tasa = rowEntity.prima * 1000 / rowEntity.valorARiesgo;

                            break;
                        };

                    };

                    if (!$scope.riesgo.docState)
                        $scope.riesgo.docState = 2;
                };
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
            DialogModal($modal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar agregar una cobertura.",
                                false).then();

            return;
        };

        var cobertura = {
            _id: new Mongo.ObjectID()._str,
            moneda: $scope.riesgo.moneda
        };

        if (!movimientoSeleccionado.coberturas)
            movimientoSeleccionado.coberturas = [];

        movimientoSeleccionado.coberturas.push(cobertura);

        if (!$scope.riesgo.docState)
            $scope.riesgo.docState = 2;
    }

    $scope.eliminarCobertura = function () {
        //debugger;
        // cada vez que el usuario selecciona un row, lo guardamos ...
        if (movimientoSeleccionado && movimientoSeleccionado.coberturas && coberturaSeleccionada) {
            lodash.remove(movimientoSeleccionado.coberturas, function (cobertura: any) { return cobertura._id === coberturaSeleccionada._id; });

            if (!$scope.riesgo.docState)
                $scope.riesgo.docState = 2;
        };
    }

    $scope.coberturasCalcular = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado))
            return;

        // nótese como usamos lodash isFinite() para saber si una variable contiene un valor numérico, incluyendo el cero.
        // Si solo usamos "if (!var)" y la variable es 0, la condición será cierta ...

        movimientoSeleccionado.coberturas.forEach(function(cobertura) {

            if (lodash.isFinite(cobertura.valorARiesgo) && lodash.isFinite(cobertura.tasa))
                cobertura.prima = cobertura.valorARiesgo * cobertura.tasa / 1000;

            if (!lodash.isFinite(cobertura.valorARiesgo) && lodash.isFinite(cobertura.prima) && cobertura.tasa)
                cobertura.valorARiesgo = cobertura.prima * 1000 * cobertura.tasa;

            if (!lodash.isFinite(cobertura.tasa) && lodash.isFinite(cobertura.prima) && cobertura.valorARiesgo)
                cobertura.tasa = cobertura.prima * 1000 / cobertura.valorARiesgo;

            if (lodash.isFinite(cobertura.valorARiesgo) && !lodash.isFinite(cobertura.sumaAsegurada))
                cobertura.sumaAsegurada = cobertura.valorARiesgo;
        });
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
            DialogModal($modal, "<em>Riesgos - Determinación de cifras de coberturas para cada compañía</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        };

        if (movimientoSeleccionado.coberturasCompanias && movimientoSeleccionado.coberturasCompanias.length > 0) {
            DialogModal($modal, "<em>Riesgos - Determinación de cifras de coberturas para cada compañía</em>",
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
        };

        construirCifrasCoberturasParaCompanias2();
    }


    let construirCifrasCoberturasParaCompanias2 = function () {

        movimientoSeleccionado.coberturasCompanias = [];

        let coberturaCompania = {} as any;

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
            });
        });

        // mostramos los items recién agregados en el grid ...
        $scope.coberturasCompanias_ui_grid.data = movimientoSeleccionado.coberturasCompanias;

        if (!$scope.riesgo.docState) { 
        $scope.riesgo.docState = 2;
        }
    }

    // --------------------------------------------------------------------------------------
    // ui-grid de Coberturas por compañía
    // --------------------------------------------------------------------------------------
    var coberturaCompaniaSeleccionada = {} as any;

    $scope.coberturasCompanias_ui_grid = {
        enableSorting: false,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
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
            lodash.remove(movimientoSeleccionado.coberturasCompanias, function (coberturaCompania: any) { return coberturaCompania._id === coberturaCompaniaSeleccionada._id; });

            if (!$scope.riesgo.docState)
                $scope.riesgo.docState = 2;
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
            if (lodash.isFinite(cobertura.valorARiesgo) && lodash.isFinite(cobertura.tasa))
                cobertura.prima = cobertura.valorARiesgo * cobertura.tasa / 1000;

            // tasa (solo si es blanco)
            if (!lodash.isFinite(cobertura.tasa) && cobertura.valorARiesgo && lodash.isFinite(cobertura.prima))
                cobertura.tasa = cobertura.prima / cobertura.valorARiesgo * 1000;

            // suma reasegurada (siempre)
            if (lodash.isFinite(cobertura.sumaAsegurada) && lodash.isFinite(cobertura.ordenPorc))
                cobertura.sumaReasegurada = cobertura.sumaAsegurada * cobertura.ordenPorc / 100;

            // prima bruta (siempre)
            if (lodash.isFinite(cobertura.prima) && lodash.isFinite(cobertura.ordenPorc)) {
                cobertura.primaBrutaAntesProrrata = cobertura.prima * cobertura.ordenPorc / 100;
                cobertura.primaBruta = cobertura.primaBrutaAntesProrrata;
            }


            // suma asegurada (solo si es blanco)
            if (!lodash.isFinite(cobertura.sumaAsegurada) && lodash.isFinite(cobertura.sumaReasegurada) && cobertura.ordenPorc)
                cobertura.sumaAsegurada = cobertura.sumaReasegurada / cobertura.ordenPorc * 100;

            // orden (solo si es blanco)
            if (!lodash.isFinite(cobertura.ordenPorc) && lodash.isFinite(cobertura.sumaReasegurada) && cobertura.sumaAsegurada)
                cobertura.ordenPorc = cobertura.sumaReasegurada * 100 / cobertura.sumaAsegurada;

            // prima (solo si es blanco)
            if (!lodash.isFinite(cobertura.prima) && lodash.isFinite(cobertura.primaBrutaAntesProrrata) && cobertura.ordenPorc)
                cobertura.prima = cobertura.primaBrutaAntesProrrata * 100 / cobertura.ordenPorc;
        });

        if (!$scope.riesgo.docState) {
            $scope.riesgo.docState = 2;
        }
    }

    $scope.construirPrimasParaCompanias = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Construcción de registros de primas para cada compañía</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if (movimientoSeleccionado.primas && movimientoSeleccionado.primas.length > 0) {
            DialogModal($modal, "<em>Riesgos - Construcción de registros de primas para cada compañía</em>",
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
        var primasBrutasCompanias = lodash.groupBy(movimientoSeleccionado.coberturasCompanias, function (c) { return c.compania; });

        let primaItem = {} as any;

        for (var compania in primasBrutasCompanias) {

            // arriba agrupamos por compañía; ahora agrupamos por moneda
            var primasBrutasMonedas = lodash.groupBy(primasBrutasCompanias[compania], function (c: any) { return c.moneda; });

            for(var moneda in primasBrutasMonedas) {

                primaItem = {};

                primaItem._id = new Mongo.ObjectID()._str;

                primaItem.compania = compania;
                primaItem.moneda = moneda;

                primaItem.primaBruta = lodash.sumBy(primasBrutasMonedas[moneda], 'primaBruta');

                // leemos la compañía en el movimiento, para obtener sus porcentajes (defaults)

                var companiaItem = lodash.find(movimientoSeleccionado.companias, function (c) { return c.compania === compania; });

                primaItem.nosotros = companiaItem.nosotros;

                primaItem.comisionPorc = companiaItem.comisionPorc;
                primaItem.impuestoPorc = companiaItem.impuestoPorc;
                primaItem.corretajePorc = companiaItem.corretajePorc;
                primaItem.impuestoSobrePNPorc = companiaItem.impuestoSobrePNPorc;

                // nótese como, inicialmente, simplemente calculamos la prima bruta aplicando el factor prorrata;
                // luego habrá una función para calcular esta prorrata, usando, cuando el usuario lo indique, la prima
                // anterior.

                // además, si la compañía no es nosotros, multiplicamos por -1

                if (!primaItem.nosotros)
                    primaItem.primaBruta *= -1;

                movimientoSeleccionado.primas.push(primaItem);
            };
        };

        $scope.primas_ui_grid.data = movimientoSeleccionado.primas;

        if (!$scope.riesgo.docState)
            $scope.riesgo.docState = 2;
    }

    // para abrir un modal que permite al usuario calcular las primas prorrateadas del movimiento
    // (casi siempre en base a las primas del movimiento anterior y las del actual)

    $scope.prorratearPrimasBrutas = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Prorratear primas brutas</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        };

        var modalInstance = $modal.open({
            templateUrl: 'client/riesgos/prorratearPrimasModal.html',
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
            function (resolve) {
                return true;
            },
            function (cancel) {
                return true;
            });
    }

    // --------------------------------------------------------------------------------------
    // ui-grid de primas por compañía
    // --------------------------------------------------------------------------------------
    var primaSeleccionada = {};

    $scope.primas_ui_grid = {
        enableSorting: false,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            $scope.primas_ui_gridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                primaSeleccionada = {};

                if (row.isSelected)
                    primaSeleccionada = row.entity;
                else
                    return;
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!$scope.riesgo.docState)
                        $scope.riesgo.docState = 2;
                };
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
            if (lodash.isFinite(p.primaBruta) && lodash.isFinite(p.corretajePorc) && !p.nosotros) {
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
            DialogModal($modal, "<em>Riesgos - Construcción de cuotas</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if (!movimientoSeleccionado.primas || !movimientoSeleccionado.primas.length) {
            DialogModal($modal, "<em>Riesgos - Construcción de cuotas</em>",
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
        let cuotasMovimientoSeleccionado = lodash.filter($scope.cuotas, (c) => { 
            return c.source.subEntityID === movimientoSeleccionado._id; }
        )

        let existenCuotasConCobrosAplicados = determinarSiExistenCuotasConCobrosAplicados(cuotasMovimientoSeleccionado); 
        if (existenCuotasConCobrosAplicados.existenCobrosAplicados) { 
            DialogModal($modal, "<em>Cuotas - Existen cobros/pagos asociados</em>", existenCuotasConCobrosAplicados.message, false).then(); 
            return;
        }

        var cantidadCuotasMovimientoSeleccionado = lodash($scope.cuotas).filter(function (c) { return c.source.subEntityID === movimientoSeleccionado._id; }).size();

        if (cantidadCuotasMovimientoSeleccionado) {
            DialogModal($modal, "<em>Riesgos - Construcción de cuotas</em>",
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

        var modalInstance = $modal.open({
            templateUrl: 'client/generales/construirCuotas.html',
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
            function (resolve) {
                return true;
            },
            function (cancel) {
                // en el controller que usa este modal se contruyen las cuotas; regresamos cuando en usuario hace click en Cancel para cerrar
                // el diálogo. Si existen cuotas en el $scope, las mostramos en el grid que corresponde ...

                if ($scope.cuotas)
                    $scope.cuotas_ui_grid.data = $scope.cuotas;

                return true;
            })
    }


    // ---------------------------------------------------------------------
    // ui-grid: cuotas
    // ----------------------------------------------------------------------
    var cuotaSeleccionada = {};

    $scope.cuotas_ui_grid = {
        enableSorting: true,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            $scope.cuotasGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                cuotaSeleccionada = {};

                if (row.isSelected)
                    cuotaSeleccionada = row.entity;
                else
                    return;
            })

            // marcamos el item como 'editado', cuando el usuario modifica un valor en el grid ...
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                if (newValue != oldValue) {
                    // las cuotas se graban seperadamente; solo las cuotas 'marcadas' son enviadas al servidor y grabadas
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
                    }
                        

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
            enableSorting: false,
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

    $scope.cuotas_nuevo = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Cuotas</em>",
                "Ud. debe seleccionar un movimiento <em>antes</em> de intentar ejecutar esta función.",
                false).then();
            return;
        }

        if (!lodash.isArray($scope.cuotas)) { 
            $scope.cuotas = [];
        }
            
        let cuota = {} as any;

        cuota._id = new Mongo.ObjectID()._str;

        cuota.source = {};

        cuota.source.entityID = $scope.riesgo._id;
        cuota.source.subEntityID = movimientoSeleccionado._id;
        cuota.source.origen = "fac";
        cuota.source.numero = $scope.riesgo.numero.toString() + "-" + movimientoSeleccionado.numero.toString();

        cuota.moneda = $scope.riesgo.moneda;

        cuota.cia = $scope.riesgo.cia;
        cuota.docState = 1;

        $scope.cuotas.push(cuota);

        $scope.cuotas_ui_grid.data = $scope.cuotas;

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }
    }

    $scope.eliminarCuota = function (cuota) {

        if (cuota.docState === 1) { 
            lodash.remove($scope.cuotas, (c: any) => { return c._id === cuota._id; }); 
        } else { 
            cuota.docState = 3;
        }

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }
    }

    $scope.cuotas_copiarUnaCuota = function () {

        if (!cuotaSeleccionada || lodash.isEmpty(cuotaSeleccionada)) {
            DialogModal($modal, "<em>Riesgos - Cuotas - Copiar una cuota</em>",
                `Ud. debe seleccionar una cuota <em>antes</em> de intentar ejecutar esta función.<br />
                 Seleccione la cuota que desea copiar. 
                `,
                false).then();
            return;
        }

        if (!lodash.isArray($scope.cuotas)) { 
            DialogModal($modal, "<em>Riesgos - Cuotas - Copiar una cuota</em>",
                `Error inesperado: no se han encontrado cuotas asociadas al riesgo.<br /> 
                 Para copiar una cuota en otra, deben existir cuotas; al menos una cuota debe existir en la lista.
                `,
                false).then();
            return;
        }
            
        let cuota: any = lodash.cloneDeep(cuotaSeleccionada);

        cuota._id = new Mongo.ObjectID()._str;
        cuota.docState = 1; 

        $scope.cuotas.push(cuota);

        $scope.cuotas_ui_grid.data = $scope.cuotas;

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }
    }

    $scope.cuotas_calcular = function() { 

        if (!cuotaSeleccionada || lodash.isEmpty(cuotaSeleccionada)) {
            DialogModal($modal, "<em>Riesgos - Cuotas - Calcular</em>",
                `Ud. debe seleccionar una cuota <em>antes</em> de intentar ejecutar esta función.<br />
                 Seleccione la cuota que desea calcular. 
                `,
                false).then();
            return;
        }

        let c: any = cuotaSeleccionada; 

        if (!c.fechaEmision) { 
            c.fechaEmision = new Date(); 
        }

        if (!c.fechaVencimiento && c.fecha && (c.diasVencimiento || c.diasVencimiento == 0)) { 
            c.fechaVencimiento = moment(c.fecha).add(c.diasVencimiento, 'days').toDate();
        }

        if (!c.fecha && c.fechaVencimiento && (c.diasVencimiento || c.diasVencimiento == 0)) { 
            c.fecha = moment(c.fechaVencimiento).subtract(c.diasVencimiento, 'days').toDate();
        }

        if ((!c.diasVencimiento && c.diasVencimiento != 0) && c.fechaVencimiento && c.fecha) { 
            var startDate = moment(c.fecha);
            var endDate = moment(c.fechaVencimiento);

            c.diasVencimiento = endDate.diff(startDate, 'days');
        }

        if (!c.monto && c.montoOriginal && c.factor) { 
            c.monto = c.montoOriginal * c.factor;
            lodash.round(c.monto, 2); 
        }

        if (!c.montoOriginal && c.monto && c.factor) { 
            c.montoOriginal = c.monto / c.factor;
            lodash.round(c.montoOriginal, 2); 
        }

        if (!c.factor && c.monto && c.montoOriginal) { 
            c.factor = c.monto / c.montoOriginal;
            lodash.round(c.factor, 3);
        }
    }

    $scope.cuotas_refrescarGrid = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        var companiasParaListaUIGrid = lodash.chain($scope.companias).
                                    filter(function(c) { return (c.nosotros || c.tipo == 'REA' || c.tipo == "CORRR") ? true : false; }).
                                    sortBy(function(item) { return item.nombre; }).
                                    value();

        $scope.cuotas_ui_grid.columnDefs[2].editDropdownOptionsArray = companiasParaListaUIGrid;
        $scope.cuotas_ui_grid.columnDefs[3].editDropdownOptionsArray = lodash.sortBy($scope.monedas, function(item) { return item.simbolo; });
    }

    $scope.gridCuotas_SeleccionarPorMoneda = function(monedaSeleccionada) {

        if (!$scope.cuotas || lodash.isEmpty($scope.cuotas)) { 
            return;
        }
            

        if (monedaSeleccionada) { 
            $scope.cuotas_ui_grid.data = lodash.filter($scope.cuotas, function(item) { return item.moneda === monedaSeleccionada; });
        }
        else { 
            $scope.cuotas_ui_grid.data = $scope.cuotas;
        }
    }


    $scope.mostrarPagosEnCuota = function (cuota) {
        // mostramos los pagos aplicados a la cuota, en un modal ...

        // es una función que está en client/generales y que es llamada desde varios 'registros' (ui-grids) de cuotas 
        // (fac, contratos, sntros, etc.)
        MostrarPagosEnCuotas($modal, cuota, $stateParams.origen);
    }

    // -------------------------------------------------------------------------
    // grid de productores
    // -------------------------------------------------------------------------
    let productorSeleccionado = {} as any;

    $scope.productores_ui_grid = {
        enableSorting: false,
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

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                productorSeleccionado = {};

                if (row.isSelected) { 
                    productorSeleccionado = row.entity;
                }
                else { 
                    return;
                } 
            })

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

    $scope.productores_ui_grid.columnDefs = [
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compania',
            width: 180,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: lodash.sortBy($scope.companias, function(item) { return item.nombre; }),
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"nombre"',
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
            name: 'corretaje',
            field: 'corretaje',
            displayName: 'Corretaje',
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
            name: 'porcentaje',
            field: 'porcentaje',
            displayName: '%',
            cellFilter: 'currencyFilterAndNull',
            width: 50,
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
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',
            type: 'number'
        }
    ]


    $scope.agregarProductor = function () {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Productores</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar agregar un productor al mismo.",
                                false).then();

            return;
        }

        var productor = {
            _id: new Mongo.ObjectID()._str,
            moneda: $scope.riesgo.moneda
        };

        if (!movimientoSeleccionado.productores) { 
            movimientoSeleccionado.productores = [];
        }
            
        movimientoSeleccionado.productores.push(productor);
        $scope.productores_ui_grid.data = movimientoSeleccionado.productores;

        if (!$scope.riesgo.docState) { 
            $scope.riesgo.docState = 2;
        }    
    }

    $scope.eliminarProductor = function () {
        //debugger;
        // cada vez que el usuario selecciona un row, lo guardamos ...
        if (movimientoSeleccionado && movimientoSeleccionado.productores && productorSeleccionado) {
            lodash.remove(movimientoSeleccionado.productores, function (productor: any) { return productor._id === productorSeleccionado._id; });

            if (!$scope.riesgo.docState) {
                $scope.riesgo.docState = 2;
            }
        }
    }

    $scope.refrescarGridProductores = function() {
        // para refrescar las listas que usan los Selects en el ui-grid
        $scope.productores_ui_grid.columnDefs[0].editDropdownOptionsArray = lodash.sortBy($scope.companias, function(item) { return item.nombre; });
        $scope.productores_ui_grid.columnDefs[1].editDropdownOptionsArray = lodash.sortBy($scope.monedas, function(item) { return item.simbolo; });
    }

    $scope.productoresDeterminarCorretaje = function() {
        // determinamos el corretaje sumarizando, en las primas, las primas netas ...

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Productores</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if (!movimientoSeleccionado.productores || movimientoSeleccionado.productores.length == 0) {
            DialogModal($modal, "<em>Riesgos - Productores</em>",
                                "Aparentemente, Ud. no ha agregado un productor a la lista.<br />" +
                                "Agregue un productor a la lista antes de intentar determinar el corretaje.",
                                false).then();

            return;
        }


        if (!movimientoSeleccionado.primas || movimientoSeleccionado.primas.length == 0) {
            DialogModal($modal, "<em>Riesgos - Productores</em>",
                                "Aparentemente, no se han determinado los registros de prima para el movimiento seleccionado.<br />" +
                                "Para determinar el monto de corretaje del movimiento seleccionado, las primas (netas) " +
                                "de sus compañías han debido ser determinadas antes.",
                                false).then();

            return;
        }

        var corretaje = lodash.sumBy(movimientoSeleccionado.primas, 'primaNeta');

        // notese como asignamos el corretaje determinado a todos los productores (pueden ser varios!)
        movimientoSeleccionado.productores.map(function(productor) { productor.corretaje = corretaje; return productor; });
    }

    $scope.productoresCalcular = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            return;
        }


        if (!movimientoSeleccionado.productores || movimientoSeleccionado.productores.length == 0) {
            return;
        }


        movimientoSeleccionado.productores.forEach(function(p) {
            if (lodash.isFinite(p.corretaje) || lodash.isFinite(p.porcentaje))
                p.monto = p.corretaje * p.porcentaje / 100;
        })

        if (!$scope.riesgo.docState) {
            $scope.riesgo.docState = 2;
        }
    }

    $scope.determinarYRegistrarCuotasProductor = function() {

        if (!movimientoSeleccionado || lodash.isEmpty(movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Construcción de cuotas</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar ejecutar esta función.",
                                false).then();

            return;
        }

        if (!movimientoSeleccionado.productores || !movimientoSeleccionado.productores.length) {
            DialogModal($modal, "<em>Riesgos - Construcción de cuotas</em>",
                                "El movimiento seleccionado no tiene productores registrados; debe tenerlos.<br />" +
                                "Las cuotas se construyen en base a los registros de productores del movimiento. " +
                                "El movimiento debe tener registros de productores registrados.",
                                false).then();

            return;
        }

        if (!productorSeleccionado || lodash.isEmpty(productorSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Construcción de cuotas</em>",
                                "Ud. no ha seleccionado un productor para calcular y registrar sus cuotas.<br />" +
                                "Por favor seleccione el productor para el cual desea registrar cuotas.",
                                false).then();

            return;
        }

        if (!productorSeleccionado.monto) {
            DialogModal($modal, "<em>Riesgos - Construcción de cuotas</em>",
                                "No se ha indicado un monto de comisión para el productor.<br />" +
                                "Ud. debe indicar un monto de comisión para el productor antes de intentar calcular y registrar sus cuotas.",
                                false).then();

            return;
        }

        // ------------------------------------------------------------------------------------------------------------------------
        // determinamos si las cuotas han recibido cobros; de ser así, impedimos editarlas ... 
        // leemos solo las cuotas que corresponden al 'sub' entity; por ejemplo, solo al movimiento, capa, cuenta, etc., que el 
        // usuario está tratando en ese momento ...  
        // ------------------------------------------------------------------------------------------------------------------------
        let cuotasProductor = lodash.filter($scope.cuotas, (c) => { 
            return c.compania === productorSeleccionado.compania && c.source.subEntityID === movimientoSeleccionado._id; }
        )

        let existenCuotasConCobrosAplicados = determinarSiExistenCuotasConCobrosAplicados(cuotasProductor); 
        if (existenCuotasConCobrosAplicados.existenCobrosAplicados) { 
            DialogModal($modal, "<em>Cuotas - Existen cobros/pagos asociados</em>", existenCuotasConCobrosAplicados.message, false).then(); 
            return;
        }

        var cantidadCuotasMovimientoSeleccionado = lodash($scope.cuotas).filter(function (c) { 
            return c.compania === productorSeleccionado.compania && c.source.subEntityID === movimientoSeleccionado._id; })
            .size();

        if (cantidadCuotasMovimientoSeleccionado) {
            DialogModal($modal, "<em>Riesgos - Construcción de cuotas</em>",
                                "Ya existen cuotas registradas para el movimiento y productor seleccionados.<br />" +
                                "Si Ud. continúa y ejecuta esta función, las cuotas que corresponden al movimiento y productor seleccionados <em>serán eliminadas</em> antes de " +
                                "construirlas y agregarlas nuevamente.<br /><br />" +
                                "Aún así, desea continuar y eliminar (sustituir) las cuotas que ahora existen?",
                true).then(
                function () {
                    construirCuotasProductor();
                    return;
                },
                function () {
                    return;
                });
            return;
        }

        construirCuotasProductor();
    }

    function construirCuotasProductor() {
        var modalInstance = $modal.open({
            templateUrl: 'client/generales/construirCuotas.html',
            controller: 'Riesgos_ConstruirCuotasProductorController',
            size: 'md',
            resolve: {
                riesgo: function () {
                    return $scope.riesgo;
                },
                movimiento: function () {
                    return movimientoSeleccionado;
                },
                productor: function () {
                    return productorSeleccionado;
                },
                cuotas: function () {
                    return $scope.cuotas;
                }
            }
        }).result.then(
            function (resolve) {
                return true;
            },
            function (cancel) {

                // en el controller que usa este modal se contruyen las cuotas; regresamos cuando en usuario hace click en Cancel para cerrar
                // el diálogo. Si existen cuotas en el $scope, las mostramos en el grid que corresponde ...

                // debugger;

                if ($scope.cuotas)
                    $scope.cuotas_ui_grid.data = $scope.cuotas;

                return true;
            });
    }

    // ---------------------------------------------------------------------
    // para registrar los documentos (ej: póliza) del riesgo
    // ---------------------------------------------------------------------

    $scope.registroDocumentos = function() {

        var modalInstance = $modal.open({
            templateUrl: 'client/generales/registroDocumentos.html',
            controller: 'RegistroDocumentosController',
            size: 'md',
            resolve: {
                entidad: function () {
                    return $scope.riesgo;
                },
                documentos: function () {
                    if (!lodash.isArray($scope.riesgo.documentos))
                    $scope.riesgo.documentos = [];

                    return $scope.riesgo.documentos;
                },
                tiposDocumentoLista: function () {
                    return [ { tipo: 'POL', descripcion: 'Póliza'} ];
                }
            }
        }).result.then(
            function (resolve) {
                return true;
            },
            function (cancel) {
                return true;
            });
    }


      // -------------------------------------------------------------------------
      // para inicializar el item (en el $scope) cuando el usuario abre la página
      // -------------------------------------------------------------------------
      function inicializarItem() {
          if ($scope.id == "0") {
              // el id viene en '0' cuando el usuario hace un click en Nuevo ...
              $scope.riesgo = {
                  _id: new Mongo.ObjectID()._str,
                  numero: 0,
                  ingreso: new Date(),
                  usuario: Meteor.userId(),
                  cia: $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : null,
                  movimientos: [],
                  docState: 1
              };

              // aunque no existen cuotas para el riesgo, pues es nuevo, hacemos el subscribe para que las cuotas regresen
              // una vez grabadas al servidor (regresen como se han grabado; por ejemplo, sin 'docState')
              $scope.showProgress = true;

              if (cuotasSubscriptionHandle) {
                  cuotasSubscriptionHandle.stop();
              }

              cuotasSubscriptionHandle = 
              Meteor.subscribe('cuotas', JSON.stringify({ "source.entidadID": $scope.id }), () => {
                // inicialmente, mostramos el state 'generales'

                // para leer el último cierre efectuado 
                Meteor.subscribe('cierre', () => { 
                    $scope.alerts.length = 0;

                    $scope.goToState('generales');

                    $scope.showProgress = false;
                })
              })
          }
          else {
              $scope.showProgress = true;
              $scope.riesgo = {};

              if ($scope.vieneDeAfuera) {
                  // commo el riesgo se consulta 'desde afuera', no se aplicó el filtro en forma normal y
                  // no se hizo el subscribe; por lo tanto, lo más seguro es que el riesgo no exista en minimongo ...
                  var filtro = { _id: $scope.id };
                  Meteor.subscribe('riesgos', JSON.stringify(filtro), () => {
                      $scope.riesgo = $scope.$meteorObject(Riesgos, $scope.id, false);

                      if (cuotasSubscriptionHandle) {
                          cuotasSubscriptionHandle.stop();
                      }

                      cuotasSubscriptionHandle = 
                      Meteor.subscribe('cuotas', JSON.stringify({ "source.entityID": $scope.id }), () => {

                        // $scope.cuotas = $scope.$meteorCollection(Cuotas, false);
                        $scope.cuotas = Cuotas.find({ 'source.entityID': $scope.id }).fetch();

                        if ($scope.riesgo.movimientos) { 
                            $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;
                        }
                            
                        if ($scope.cuotas) { 
                            $scope.cuotas_ui_grid.data = $scope.cuotas;
                        }
                        
                        $scope.alerts.length = 0;
                        $scope.goToState('generales');

                        $scope.showProgress = false;
                    })
                  })
              }
              else {
                  // antes el usuario indicaba un filtro y se leían y publicaban los riesgos; todos los
                  // riesgos seleccionados estaban en minimongo. Ahora, los riesgos seleccionados se
                  // graban a un collection 'temp'; por eso, aquí también hay que suscribir al riesgo
                  // que el usuario seleccione en la lista ...
                  var filtro = { _id: $scope.id };
                  Meteor.subscribe('riesgos', JSON.stringify(filtro), () => {
                      // $scope.riesgo = $scope.$meteorObject(Riesgos, $scope.id, false);

                      $scope.helpers({
                          riesgo: () => { 
                              return Riesgos.findOne($scope.id); 
                          }, 
                      })

                      if (cuotasSubscriptionHandle) {
                          cuotasSubscriptionHandle.stop();
                      }

                      cuotasSubscriptionHandle = 
                      Meteor.subscribe('cuotas', JSON.stringify({ "source.entityID": $scope.id }), () => {

                            // parece que hay un problema cuando intentamos hacer ésto ...
                            // $scope.cuotas = $scope.$meteorCollection(function(){
                            //     Cuotas.find({ 'source.entityID': $scope.id })
                            // });
                            

                            $scope.helpers({
                                cuotas: () => { 
                                    return Cuotas.find({ 'source.entityID': $scope.id }); 
                                }, 
                            })

                            if ($scope.riesgo.movimientos) { 
                                $scope.movimientos_ui_grid.data = $scope.riesgo.movimientos;
                            }
                                
                            if ($scope.cuotas) { 
                                $scope.cuotas_ui_grid.data = $scope.cuotas;
                            }
                            
                            $scope.alerts.length = 0;
                            $scope.goToState('generales');

                            $scope.showProgress = false;
                        })
                  })
              }
          }
      }

      inicializarItem();
  }
])

// para establecer las opciones del select asegurado ... 
// nótese como usamos selectize, debemos usar un $apply ... 
function aseguradoSetSelectize($modal, $scope) {
    setTimeout(function () {
        $scope.$apply(function () {

            let items = []; 

            if ($scope.riesgo && !$scope.riesgo.asegurado) { 
                $scope.riesgo.asegurado = null; 
            }

            if ($scope.riesgo && $scope.riesgo.asegurado) { 
                items.push($scope.riesgo.asegurado as never); 
            }
            
            let asegurado = $("#asegurado"); 
            asegurado.selectize({
                options: $scope.asegurados, 
                valueField: '_id',
                labelField: 'nombre', 
                searchField: ['nombre', ], 
                sortField: 'nombre', 
                items: items, 
                maxItems: 1, 
                selectOnTab: false, 
                openOnFocus: false, 

                onItemAdd: function(value) { 

                    // this way you can have the whole item 
                    // var data = this.options[value];
                    if ($scope.riesgo.asegurado != value) { 
                        $scope.riesgo.asegurado = value;

                        if (!$scope.riesgo.docState) { 
                            $scope.riesgo.docState = 2;
                        } 
                    }
                }, 

                create:function (input, callback) {

                    agregarAsegurado_desdeInput($modal, input).then((result) => {

                        // Ok, el usuario agregó el asegurado desde el modal; regresamos el item para que selectize lo 
                        // agregue a sus choices 

                        // solo si el usuario cancela, intentamos regresar el asegurado que ya existía 
                        if (!result && $scope.riesgo.asegurado) { 
                            let asegurado = Asegurados.findOne($scope.riesgo.asegurado); 

                            // nota: si no se encuentra un asegurado, pasamos undefined y el Select debe quedar en blanco 
                            // (sin selección) 
                            callback(asegurado); 
                        } else { 

                            if (!$scope.riesgo.docState) { 
                                $scope.riesgo.docState = 2;
                            }  

                            // en result viene el asegurado, como un object, que se agrega como un choice en selectize
                            callback(result); 
                        }
                        
                    }).catch((error) => {
                        // error ocurred!
                        // no esperamos nunca un error, pues siempre resolvemos los erroes en el modal ... 
                    })
                }, 
            });
        });
    }, 0);
  }

const agregarAsegurado_desdeInput = ($modal, nombre) => {
    return new Promise((resolve, reject) => {
      
        var modalInstance = $modal.open({
            templateUrl: 'client/generales/agregarNuevoAsegurado/agregarNuevoAsegurado.html',
            controller: 'AgregarNuevoAsegurado_ModalController',
            size: 'md',
            resolve: {
                nombre: function () {
                    return nombre;
                },
            }
        }).result.then(
              function (result) {
                  // en resolve viene el nuevo asegurado 
                  resolve(result);
              },
              function (cancel) {
                  // el usuario canceló y *no* agregó el nuevo asseguado a la base de datos ... 
                  resolve(undefined);
              }
        )
  
        // nunca regeresamos un error pues siempre resolvemos cualquier error en el modal 
        // reject(Error("It broke"));
    })
  }