
import moment from 'moment';
import lodash from 'lodash';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { ContratosProp_Configuracion_Tablas } from '/imports/collections/catalogos/ContratosProp_Configuracion';
import { Cuotas } from '/imports/collections/principales/cuotas'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '/client/contratos/methods/_methods/_methods'; 

import { Contratos } from '/imports/collections/principales/contratos'; 

// siguen todos las tablas (collections) para el registro de contratos proporcionales 
import { ContratosProp_cuentas_resumen, ContratosProp_cuentas_distribucion, ContratosProp_cuentas_saldos, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_comAdic_resumen, ContratosProp_comAdic_distribucion, ContratosProp_comAdic_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_partBeneficios_resumen, ContratosProp_partBeneficios_distribucion, ContratosProp_partBeneficios_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartPr_resumen, ContratosProp_entCartPr_distribucion, ContratosProp_entCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartSn_resumen, ContratosProp_entCartSn_distribucion, ContratosProp_entCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartPr_resumen, ContratosProp_retCartPr_distribucion, ContratosProp_retCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartSn_resumen, ContratosProp_retCartSn_distribucion, ContratosProp_retCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 

angular.module("scrwebM").controller("ContratoController",
['$scope', '$state', '$stateParams', '$meteor', '$modal', 'uiGridConstants', '$q',
  function ($scope, $state, $stateParams, $meteor, $modal, uiGridConstants, $q) {

    $scope.showProgress = false;
    $scope.dataHasBeenEdited = false; 

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {};
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

    $scope.goToState = function (state) {
        // para abrir alguno de los children states ...
        if (state != 'cuentas') { 
            $state.go("contrato." + state);
        }  
        else { 
            // 'cuentas' tiene 2 sub states; abrimos el primero: definiciones ...
            $state.go("contrato.cuentas.definiciones");
        }  
    }

    $scope.nuevo0 = function () {

        if ($scope.dataHasBeenEdited && $scope.origen == 'edicion') {
            DialogModal($modal,
                        "<em>Contratos</em>",
                        `Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa
                        para agregar un nuevo registro, los cambios se perderán.<br /><br />
                        Desea continuar y perder los cambios efectuados al registro actual?`,
                        true).then(
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

    $scope.nuevo = function () {
        // $scope.contrato fue inicializado a partir de un objeto Meteor (ie: $scope.meteorObject(coll, id)) ...
        // stop() lo 'desconcta' del objeto Meteor
        if ($scope.contrato && $scope.contrato.stop)
            $scope.contrato.stop();

        $scope.contrato = {};
        $scope.contrato = {
            _id: new Mongo.ObjectID()._str,
            numero: 0,
            fechaEmision: new Date(),
            ingreso: new Date(),
            usuario: Meteor.userId(),
            cia: $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : null,
            docState: 1,
        };

        $scope.id = "0";

        // si había un contrato antes de hacer click en Nuevo, los grids mantendrán sus datos
        $scope.capas_ui_grid.data = [];
        $scope.capasReaseguradores_ui_grid.data = [];
        $scope.capasPrimasCompanias_ui_grid.data = [];
        $scope.capasCuotas_ui_grid.data = [];

        $scope.cuentasTecnicas_definiciones_ui_grid.data = [];

        $scope.dataHasBeenEdited = true; 

        // inicialmente, mostramos el state 'generales'
        $state.go("contrato.generales");
    }

    $scope.origen = $stateParams.origen;
    $scope.id = $stateParams.id;
    $scope.limit = parseInt($stateParams.limit);
    // nótese que el boolean value viene, en realidad, como un string ...
    $scope.vieneDeAfuera = ($stateParams.vieneDeAfuera == "true");    // por ejemplo: cuando se abre desde siniestros ...

    $scope.helpers({
        tiposContrato: () => {
            return TiposContrato.find();
        },
        companias: () => {
            return Companias.find();
        },
        monedas: () => {
            return Monedas.find();
        },
        ramos: () => {
            return Ramos.find();
        },
        suscriptores: () => {
            return Suscriptores.find();
        },
        contratosParametros: () => {
            // esta tabla debe estar en minimongo pues hicimos un subscribe en filter ...
            return ContratosParametros.findOne();
        }
    })

    $scope.exportarExcel_Capas = () => {
        let modalInstance = $modal.open({
            templateUrl: 'client/contratos/contratosCapasExportarExcel_Modal.html',
            controller: 'ContratosCapasExportarExcel_Controller',
            size: 'md',
            resolve: {
                contratoID: () => {
                    return $scope.contrato._id;
                },
                ciaSeleccionada: () => {
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


    // ---------------------------------------------------------------
    // Grabar()
    // ---------------------------------------------------------------

    $scope.grabar = function () {
        Contratos_Methods.grabar($state, $scope, $modal, $meteor, uiGridConstants);
    }

    $scope.regresarALista = function () {

        if ($scope.dataHasBeenEdited && $scope.origen && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Contratos</em>",
                                    "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                    true);

            promise.then(
                function (resolve) {
                    $state.go('contratosLista', { origen: $scope.origen, limit: $scope.limit });
                },
                function (err) {
                    return true;
                });

            return;
        }
        else { 
            $state.go('contratosLista', { origen: $scope.origen, limit: $scope.limit });
        } 
    }


    $scope.eliminar = function () {
        if ($scope.contrato.docState && $scope.contrato.docState == 1) {
            if ($scope.contrato.docState) {
                var promise = DialogModal($modal,
                                        "<em>Contratos</em>",
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
        }

        // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
        $scope.contrato.docState = 3;
        $scope.dataHasBeenEdited = true; 
    }

    $scope.refresh = function () {
        if (!$scope.contrato) {
            DialogModal($modal,
                        "<em>Contratos</em>",
                        `Aparentemente, <em>no se ha cargado un contrato</em> en esta página.<br />
                        Esta función refresca la información en la página ... pero no hay nada que refrescar.`,
                        false).then();
            return;
        }

        if ($scope.dataHasBeenEdited) {
            DialogModal($modal,
                        "<em>Contratos</em>",
                        `Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa y
                        refresca el registro, los cambios se perderán.<br /><br />Desea continuar y
                        perder los cambios?`,
                        true).then(
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


    $scope.setIsEdited = function (field) {

        switch (field) {
            case 'desde':
                if ($scope.contrato.desde && !$scope.contrato.hasta) {
                    let desde = $scope.contrato.desde;
                    let  newDate = new Date(desde.getFullYear() + 1, desde.getMonth(), desde.getDate());
                    newDate = moment(newDate).subtract(1, 'days').toDate();

                    $scope.contrato.hasta = newDate;
                }

                break;
        }

        if ($scope.contrato.docState) { 
            return;
        }
            
        $scope.contrato.docState = 2;
        $scope.dataHasBeenEdited = true; 
    }

    $scope.imprimir = function() {
        if (!$scope.contrato || !$scope.contrato.capas || lodash.isEmpty($scope.contrato.capas)) {
            DialogModal($modal, "<em>Contratos - Construcción de notas</em>",
                        "Aparentemente, el contrato para el cual Ud. desea construir las notas, no tiene capas registradas.",
                        false).then();
            return;
        };

        var modalInstance = $modal.open({
            templateUrl: 'client/contratos/imprimirNotasContratos_Modal.html',
            controller: 'ImprimirNotasContratosModalController',
            size: 'lg',
            resolve: {
                contrato: function () {
                    return $scope.contrato;
                },
            //   movimientoSeleccionado: function() {
            //       return movimientoSeleccionado;
            //   },
                cuotas: function() {
                    return $scope.cuotas;
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


      $scope.registrarPersonasCompanias = () => {
          if (!$scope.contrato || !$scope.contrato.compania) {
              DialogModal($modal, "<em>Contratos</em>",
              "Aparentemente, Ud. no ha seleccionado una compañía como cedente para el contrato.<br />" +
              "El contrato debe tener una compañía (cedente) antes de intentar registrar sus personas.",
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
                      let contrato = $scope.contrato;
                      let companias = [];

                      if (Array.isArray(contrato.personas)) {
                          contrato.personas.forEach(persona => {
                              companias.push({ compania: persona.compania, titulo: persona.titulo, nombre: persona.nombre });
                          });
                      };

                      // ahora revisamos las compañías en el contrato (cedente, cuentas, caaps) y agregamos las que
                      // *no* existan en el array de compañías

                      if (!lodash.some(companias, c => { return c.compania == contrato.compania; } ))
                         companias.push({ compania: contrato.compania });

                      if (Array.isArray(contrato.capas)) {
                          contrato.capas.forEach(capa => {
                            if (Array.isArray(capa.reaseguradores)) {
                                capa.reaseguradores.forEach(r => {
                                    if (!lodash.some(companias, c => { return c.compania == r.compania; } ))
                                       companias.push({ compania: r.compania });
                                });
                            };
                          });
                      };

                      if (contrato.cuentas && Array.isArray(contrato.cuentas.reaseguradores)) {
                          contrato.cuentas.reaseguradores.forEach(r => {
                            if (!lodash.some(companias, c => { return c.compania == r.compania; } ))
                               companias.push({ compania: r.compania });
                          });
                      };

                      return companias;
                  }
              }
          }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  // recuperamos las personas de compañías, según las indicó el usuario en el modal
                //   debugger;
                  if (cancel.entityUpdated) {
                      let companias = cancel.companias;
                      $scope.contrato.personas = [];

                      if (Array.isArray(companias)) {
                          companias.forEach(c => {
                               $scope.contrato.personas.push({
                                   compania: c.compania,
                                   titulo: c.titulo ? c.titulo : null,
                                   nombre: c.nombre? c.nombre : null
                               });
                          });
                      };

                    if (!$scope.contrato.docState)
                        $scope.contrato.docState = 2;
                        $scope.dataHasBeenEdited = true; 
                  };

                  return true;
              });
      }

      // --------------------------------------------------------------------------------------
      // ui-grid de Capas
      // --------------------------------------------------------------------------------------
      $scope.capaSeleccionada = {};

      $scope.capas_ui_grid = {
          enableSorting: false,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: true,
          enableRowSelection: true,
          enableRowHeaderSelection: true,
          multiSelect: false,
          enableSelectAll: true,
          selectionRowHeaderWidth: 35,
          rowHeight: 25,
          onRegisterApi: function (gridApi) {
              $scope.capasGridApi = gridApi;

              // guardamos el row que el usuario seleccione
              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  $scope.capaSeleccionada = {};

                  if (row.isSelected)
                      $scope.capaSeleccionada = row.entity;
                  else
                      return;


                  $scope.capasReaseguradores_ui_grid.data = [];

                  if ($scope.capaSeleccionada.reaseguradores)
                      $scope.capasReaseguradores_ui_grid.data = $scope.capaSeleccionada.reaseguradores;
              });

              // marcamos el contrato como actualizado cuando el usuario edita un valor
              gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {

                  if (newValue != oldValue) { 
                    if (!$scope.contrato.docState) { 
                        $scope.contrato.docState = 2;
                          $scope.dataHasBeenEdited = true; 
                      }
                  }         
              })
          },

          rowIdentity: function (row) {
              return row._id;
          },
          getRowIdentity: function (row) {
              return row._id;
          }
      }

      $scope.capas_ui_grid.columnDefs = [
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
                displayName: 'Moneda',
                width: 80,
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownIdLabel: '_id',
                editDropdownValueLabel: 'descripcion',
                editDropdownOptionsArray: $scope.monedas,
                cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"descripcion"',
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'string'
            },
            {
                name: 'descripcion',
                field: 'descripcion',
                displayName: 'Descripción',
                enableColumnMenu: false,
                type: 'string',
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                width: 150,
                enableCellEdit: true
            },
            {
                name: 'pmd',
                field: 'pmd',
                displayName: 'PMD',
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
                name: 'nuestraOrdenPorc',
                field: 'nuestraOrdenPorc',
                displayName: 'N orden (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number'
            },
            {
                name: 'imp1Porc',
                field: 'imp1Porc',
                displayName: 'Imp 1 (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number'
            },
            {
                name: 'imp2Porc',
                field: 'imp2Porc',
                displayName: 'Imp 2 (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number'
            },
            {
                name: 'corretajePorc',
                field: 'corretajePorc',
                displayName: 'Corretaje (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number'
            },
            {
                name: 'impSPNPorc',
                field: 'impSPNPorc',
                displayName: 'Imp/pn (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number'
            }, 
            {
                name: 'delButton',
                displayName: '',
                cellTemplate: '<span ng-click="grid.appScope.eliminarCapa(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableSorting: false,
                width: 25
            }
      ]


      $scope.agregarCapa = function () {

        if (!Array.isArray($scope.contrato.capas))  { 
            $scope.contrato.capas = [];
        }
            
        var capa = {};

        capa._id = new Mongo.ObjectID()._str;

        let monedaDefecto = Monedas.findOne({ defecto: true, });
        let contratosParametros = $scope.contratosParametros;

        if ($scope.contrato.capas.length === 0) {
            capa.numero = 1;
            capa.moneda = monedaDefecto ? monedaDefecto._id : null;
            capa.nuestraOrdenPorc = 100;
            capa.imp1Porc = $scope.contratosParametros && $scope.contratosParametros.imp1Porc ? $scope.contratosParametros.imp1Porc : null;
            capa.imp2Porc = $scope.contratosParametros && $scope.contratosParametros.imp2Porc ? $scope.contratosParametros.imp2Porc : null;
            capa.impSPNPorc = $scope.contratosParametros && $scope.contratosParametros.impSPNPorc ? $scope.contratosParametros.impSPNPorc : null;
            capa.corretajePorc = $scope.contratosParametros && $scope.contratosParametros.corrPorc ? $scope.contratosParametros.corrPorc : null;
        }


        if ($scope.contrato.capas.length > 0) {
            var maxCapa = lodash.maxBy($scope.contrato.capas, "numero");
            if (maxCapa) {
                capa.numero = maxCapa.numero + 1;
                capa.moneda = maxCapa.moneda ? maxCapa.moneda : null;
                capa.nuestraOrdenPorc = maxCapa.nuestraOrdenPorc ? maxCapa.nuestraOrdenPorc : null;
                capa.imp1Porc = maxCapa.imp1Porc ? maxCapa.imp1Porc : null;
                capa.imp2Porc = maxCapa.imp2Porc ? maxCapa.imp2Porc : null;
                capa.impSPNPorc = maxCapa.impSPNPorc ? maxCapa.impSPNPorc : null;
                capa.corretajePorc = maxCapa.corretajePorc ? maxCapa.corretajePorc : null;
            }
        }

        switch (capa.numero) {
            case 1:
                capa.descripcion = "1ra. capa";
                break;
            case 2:
                capa.descripcion = "2da. capa";
                break;
            case 3:
                capa.descripcion = "3ra. capa";
                break;
            case 4:
                capa.descripcion = "4ta. capa";
                break;
            case 5:
                capa.descripcion = "5ta. capa";
                break;
            case 6:
                capa.descripcion = "6ta. capa";
                break;
            default:
        }

        $scope.contrato.capas.push(capa);

        $scope.capas_ui_grid.data = $scope.contrato.capas;

        if (!$scope.contrato.docState)  { 
            $scope.contrato.docState = 2;
            $scope.dataHasBeenEdited = true; 
        }
    }

    $scope.eliminarCapa = function (entity) {

        lodash.remove($scope.contrato.capas, function (capa) { return capa._id === entity._id; });

        if (!$scope.contrato.docState) { 
            $scope.contrato.docState = 2;
            $scope.dataHasBeenEdited = true; 
        }
    }

    $scope.capasDeterminarRegistrosPrimaCompanias = () => {
        Contratos_Methods.capasDeterminarRegistrosPrimaCompanias($scope, $modal);
    }

      // --------------------------------------------------------------------------------------
      // ui-grid de Capas - Reaseguradores
      // --------------------------------------------------------------------------------------
      var companiasParaListaUIGrid =
                 lodash.chain($scope.companias).
                  filter(function(c) { return (c.nosotros || c.tipo == 'REA' || c.tipo == "CORRR") ? true : false; }).
                  sortBy(function(item) { return item.nombre; }).
                  value();

      $scope.capasReaseguradores_ui_grid_selectedRow = {};

      $scope.capasReaseguradores_ui_grid = {
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
              $scope.capasReaseguradoresGridApi = gridApi;

              // guardamos el row que el usuario seleccione
              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  $scope.capasReaseguradores_ui_grid_selectedRow = {};

                  if (row.isSelected)
                      $scope.capasReaseguradores_ui_grid_selectedRow = row.entity;
                  else
                      return;
              });

              // marcamos el contrato como actualizado cuando el usuario edita un valor
              gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                  if (newValue != oldValue) { 
                    if (!$scope.contrato.docState) { 
                        $scope.contrato.docState = 2;
                        $scope.dataHasBeenEdited = true; 
                      }
                  }         
              })
          },

          rowIdentity: function (row) {
              return row._id;
          },
          getRowIdentity: function (row) {
              return row._id;
          }
      }

      $scope.capasReaseguradores_ui_grid.columnDefs = [
            {
                name: 'compania',
                field: 'compania',
                displayName: 'Compañía',
                width: 170,
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownIdLabel: '_id',
                editDropdownValueLabel: 'nombre',
                editDropdownOptionsArray: companiasParaListaUIGrid,
                cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"nombre"',
                enableColumnMenu: false,
                enableCellEdit: true,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                type: 'string'
            },
            {
                name: 'ordenPorc',
                field: 'ordenPorc',
                displayName: 'Orden (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number',
                aggregationType: uiGridConstants.aggregationTypes.sum,
                aggregationHideLabel: true,
                footerCellFilter: 'currencyFilter',
                footerCellClass: 'ui-grid-centerCell'
            },
            {
                name: 'imp1Porc',
                field: 'imp1Porc',
                displayName: 'Imp 1 (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number'
            },
            {
                name: 'imp2Porc',
                field: 'imp2Porc',
                displayName: 'Imp 2 (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number'
            },
            {
                name: 'corretajePorc',
                field: 'corretajePorc',
                displayName: 'Corretaje (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number'
            },
            {
                name: 'impSPNPorc',
                field: 'impSPNPorc',
                displayName: 'Imp/pn (%)',
                cellFilter: 'currencyFilterAndNull',
                width: 90,
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableSorting: false,
                enableColumnMenu: false,
                enableCellEdit: true,
                type: 'number'
            }, 
            {
                name: 'delButton',
                displayName: '',
                cellTemplate: '<span ng-click="grid.appScope.eliminarCapaReasegurador(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableSorting: false,
                width: 25
            }
      ]

    $scope.agregarCapaReasegurador = function () {
        //debugger;
        // aquí está la capa seleccionada por el usuario ...
        if (!$scope.capaSeleccionada || lodash.isEmpty($scope.capaSeleccionada)) {
            DialogModal($modal,
                        "<em>Contratos - Registro de nuevo reasegurador</em>",
                        `Ud. debe seleccionar una capa.<br />
                        Antes de intentar agregar un reasegurador a la lista, Ud. debe seleccionar
                        la capa a la cual corresponde.
                        `,
                        false).then();

            return;
        }

        if (!Array.isArray($scope.capaSeleccionada.reaseguradores)) { 
            $scope.capaSeleccionada.reaseguradores = [];
        }
            
        var reasegurador = {};

        let ultimoReasegurador = null;
        if ($scope.capaSeleccionada.reaseguradores.length) { 
            ultimoReasegurador = lodash.last($scope.capaSeleccionada.reaseguradores);
        }
            
        reasegurador._id = new Mongo.ObjectID()._str;

        if (ultimoReasegurador) {
            reasegurador.ordenPorc = ultimoReasegurador.ordenPorc;
            reasegurador.imp1Porc = ultimoReasegurador.imp1Porc;
            reasegurador.imp2Porc = ultimoReasegurador.imp2Porc;
            reasegurador.impSPNPorc = ultimoReasegurador.impSPNPorc;
            reasegurador.corretajePorc = ultimoReasegurador.corretajePorc;
        }
        else {
            reasegurador.ordenPorc = $scope.capaSeleccionada.nuestraOrdenPorc;
            reasegurador.imp1Porc = $scope.capaSeleccionada.imp1Porc;
            reasegurador.imp2Porc = $scope.capaSeleccionada.imp2Porc;
            reasegurador.impSPNPorc = $scope.capaSeleccionada.impSPNPorc;
            reasegurador.corretajePorc = $scope.capaSeleccionada.corretajePorc;
        }

        $scope.capaSeleccionada.reaseguradores.push(reasegurador);

        $scope.capasReaseguradores_ui_grid.data = $scope.capaSeleccionada.reaseguradores;

        if (!$scope.contrato.docState) { 
            $scope.contrato.docState = 2;
            $scope.dataHasBeenEdited = true; 
        }
    }

    $scope.eliminarCapaReasegurador = function (entity) {
        lodash.remove($scope.capaSeleccionada.reaseguradores, function (r) { return r._id === entity._id; });

        if (!$scope.contrato.docState) { 
            $scope.contrato.docState = 2;
            $scope.dataHasBeenEdited = true; 
        }
    }

    $scope.refrescarGridCapasReaseguradores = function() {
        companiasParaListaUIGrid =
                    lodash.chain($scope.companias).
                    filter(function(c) { return (c.nosotros || c.tipo == 'REA' || c.tipo == "CORRR") ? true : false; }).
                    sortBy(function(item) { return item.nombre; }).
                    value();

        $scope.capasReaseguradores_ui_grid.columnDefs[0].editDropdownOptionsArray = companiasParaListaUIGrid;
    }

    // --------------------------------------------------------------------
    // para copiar reaseguradores entre capas ...
    $scope.copiarReaseguradoresEntreCapas = function () {

        var modalInstance = $modal.open({
            templateUrl: 'client/contratos/copiarReaseguradoresEntreCapas.html',
            controller: 'CopiarReaseguradoresEntreCapasController',
            size: 'lg',
            resolve: {
                $modal: function() {
                    return $modal;
                },
                contrato: function () {
                    return $scope.contrato;
                }
            }
        }).result.then(
            function (resolve) {
                return true;
            },
            function (cancel) {
                // si el usuario actualizó el contrato, nos aseguramos de actualizar el flag que permite saber que ha habido ediciones 
                if ($scope.contrato.docState) { 
                    $scope.dataHasBeenEdited = true; 
                }
                return true;
            })
    }

    // --------------------------------------------------------------------------------------
    // ui-grid de Capas - primas de compañías
    // --------------------------------------------------------------------------------------
    let capasPrimasCompaniasSeleccionada = {};
    let capasPrimasCompaniasGridApi = {};

    $scope.capasPrimasCompanias_ui_grid = {
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
            capasPrimasCompaniasGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                capasPrimasCompaniasSeleccionada = {};

                if (row.isSelected)
                    capasPrimasCompaniasSeleccionada = row.entity;
                else
                    return;
            });

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                if (!$scope.contrato.docState) { 
                    $scope.contrato.docState = 2;
                    $scope.dataHasBeenEdited = true; 
                    }
                }       
            })
        },
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.capasPrimasCompanias_ui_grid.columnDefs = [
        {
            name: 'numeroCapa',
            field: 'numeroCapa',
            displayName: 'Capa',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 60,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 90,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: companiasParaListaUIGrid,
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"abreviatura"',
            enableColumnMenu: false,
            enableCellEdit: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'nosotros',
            field: 'nosotros',
            displayName: 'Nosotros',
            cellFilter: 'boolFilter',
            width: 70,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'boolean'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 50,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'pmd',
            field: 'pmd',
            displayName: 'PMD',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'ordenPorc',
            field: 'ordenPorc',
            displayName: 'Orden (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 90,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'primaBruta',
            field: 'primaBruta',
            displayName: 'PB',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number',
            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell'
        },
        {
            name: 'imp1Porc',
            field: 'imp1Porc',
            displayName: 'Imp1 %',
            cellFilter: 'currencyFilterAndNull',
            width: 75,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'imp1',
            field: 'imp1',
            displayName: 'Imp 1',
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
            name: 'imp2Porc',
            field: 'imp2Porc',
            displayName: 'Imp2 %',
            cellFilter: 'currencyFilterAndNull',
            width: 75,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'imp2',
            field: 'imp2',
            displayName: 'Imp 2',
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
            name: 'corretajePorc',
            field: 'corretajePorc',
            displayName: 'Corr %',
            cellFilter: 'currencyFilterAndNull',
            width: 75,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'corretaje',
            field: 'corretaje',
            displayName: 'Corr',
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
            name: 'primaNeta0',
            field: 'primaNeta0',
            displayName: 'PN',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
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
            name: 'impSPNPorc',
            field: 'impSPNPorc',
            displayName: 'Imp/pn %',
            cellFilter: 'currencyFilterAndNull',
            width: 75,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'impSPN',
            field: 'impSPN',
            displayName: 'Imp/pn',
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
            name: 'primaNeta',
            field: 'primaNeta',
            displayName: 'PN',
            cellFilter: 'currencyFilterAndNull',
            width: 120,
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
    ]

    $scope.capasPrimasCompaniasCalcular = () => {
        // nótese como usamos lodash isFinite() para saber si una variable contiene un valor numérico, incluyendo el cero. Si solo usamos
        // if (!var) y la variable es 0, la condición será cierta ...
        if (!$scope.contrato.capasPrimasCompanias || !Array.isArray($scope.contrato.capasPrimasCompanias) ||
            !$scope.contrato.capasPrimasCompanias.length) { 
                return;
            }
            

        $scope.contrato.capasPrimasCompanias.forEach(function (p) {

            if (lodash.isFinite(p.pmd) && lodash.isFinite(p.ordenPorc))
                p.primaBruta = p.pmd * p.ordenPorc / 100;

            // impuesto%
            if (!lodash.isFinite(p.imp1Porc) && p.primaBruta && lodash.isFinite(p.imp1))
                p.imp1Porc = Math.abs(p.imp1 / p.primaBruta * 100);

            // impuesto
            if (lodash.isFinite(p.primaBruta) && lodash.isFinite(p.imp1Porc))
                p.imp1 = (p.primaBruta * p.imp1Porc / 100) * -1;

            // impuesto%
            if (!lodash.isFinite(p.imp2Porc) && p.primaBruta && lodash.isFinite(p.imp2))
                p.imp2Porc = Math.abs(p.imp2 / p.primaBruta * 100);

            // impuesto
            if (lodash.isFinite(p.primaBruta) && lodash.isFinite(p.imp2Porc))
                p.imp2 = (p.primaBruta * p.imp2Porc / 100) * -1;

            // corretaje%
            if (!lodash.isFinite(p.corretajePorc) && p.primaBruta && lodash.isFinite(p.corretaje))
                p.corretajePorc = Math.abs(p.corretaje / p.primaBruta * 100);

            // corretaje
            if (lodash.isFinite(p.primaBruta) && lodash.isFinite(p.corretajePorc) && !p.nosotros)
                p.corretaje = (p.primaBruta * p.corretajePorc / 100) * -1;

            // prima neta
            // como los 'costos' vienen ya con signo contrario, al sumar quitamos el costo al monto
            if (lodash.isFinite(p.primaBruta)) {
                p.primaNeta0 = p.primaBruta;

                if (p.imp1)
                p.primaNeta0 += p.imp1;

                if (p.imp2)
                p.primaNeta0 += p.imp2;

                if (p.corretaje)
                p.primaNeta0 += p.corretaje;
            }

            // impuestoSobrePN%
            if (!lodash.isFinite(p.impSPNPorc) && p.primaNeta0 && lodash.isFinite(p.impSPN))
                p.impSPNPorc = Math.abs(p.impSPN / p.primaNeta0 * 100);

            // impuestoSobrePN
            if (lodash.isFinite(p.primaNeta0) && lodash.isFinite(p.impSPNPorc))
                p.impSPN = (p.primaNeta0 * p.impSPNPorc / 100) * -1;

            // prima neta despues de impuesto/pn
            if (lodash.isFinite(p.primaNeta0)) {
                p.primaNeta = p.primaNeta0;

                if (p.impSPN)
                p.primaNeta += p.impSPN;
            }

            // finalmente, el usuario puede indicar la prima neta más no la prima bruta
            if (lodash.isFinite(p.primaNeta) && !lodash.isFinite(p.primaNeta0)) {
                p.primaNeta0 = p.primaNeta;

                // el impuesto viene con signo contrario; al restar, agregamos el monto a la pn
                if (p.impuestoSobrePN)
                p.primaNeta0 += p.impSPN;
            }

            if (lodash.isFinite(p.primaNeta0) && !lodash.isFinite(p.primaBruta)) {
                p.primaBruta = p.primaNeta0;

                // cómo los 'costos' ya vienen con signo diferente a la prima, al restar, agregamos el monto a la pb
                if (p.imp1)
                p.primaBruta += p.imp1;

                if (p.imp2)
                p.primaBruta += p.imp2;

                if (p.corretaje)
                p.primaBruta += p.corretaje;
            }
        })

        $scope.capasPrimasCompanias_ui_grid.data = $scope.contrato.capasPrimasCompanias;

        // nótese lo que hacemos para 'refrescar' el grid (solo hace falta, aparentemente, para los totales ...
        capasPrimasCompaniasGridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);

        if (!$scope.contrato.docState) { 
            $scope.contrato.docState = 2;
            $scope.dataHasBeenEdited = true; 
        }    
    }

    $scope.generarCuotasCapaSeleccionada = function () {
        Contratos_Methods.generarCuotasCapaSeleccionada($scope, $modal);
    }


    // ---------------------------------------------------------------------
    // ui-grid: cuotas para la capa seleccionada
    // ----------------------------------------------------------------------
    var capasCuotaSeleccionada = {};

    $scope.capasCuotas_ui_grid = {
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
            $scope.capasCuotasGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                capasCuotaSeleccionada = {};
                if (row.isSelected) { 
                    capasCuotaSeleccionada = row.entity;
                }
                else { 
                    return;
                }
            })
            // marcamos el item como 'editado', cuando el usuario modifica un valor en el grid ...
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    // las cuotas se graban seperadamente; solo las cuotas 'marcadas' son enviadas al servidor y grabadas
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
                    }

                    if (!$scope.contrato.docState) { 
                        $scope.contrato.docState = 2;
                        $scope.dataHasBeenEdited = true; 
                    }    
                }
            })
        },
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.capasCuotas_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
                    '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #0087F7; font: xx-small; padding-top: 8px; "></span>' +
                    '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #279C5D; font: xx-small; padding-top: 8px; "></span>' +
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
            width: 100,
            cellFilter: 'origenCuota_Filter',            // ej: fac-1-1 (riesgo 1, movimiento 1)
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
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
            enableSorting: true,
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
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            headerCellClass: 'ui-centerCell-leftCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: true,
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
            displayName: 'Cantidad',
            width: 45,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
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
            enableSorting: true,
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
            cellTemplate: '<div class="ui-grid-cell-contents">ver</div>',
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
            cellTemplate: '<span ng-click="grid.appScope.eliminarCapaCuota(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]

    $scope.agregarCapaCuota = function () {

        // la cuota que el usuario agrega es, siempre, una copia de alguna cuota que ya exista ...
        if (!capasCuotaSeleccionada || lodash.isEmpty(capasCuotaSeleccionada)) {
            DialogModal($modal, "<em>Contratos - Capas - Cuotas</em>",
                `Ud. debe seleccionar una cuota en la lista <em>antes</em> de intentar ejecutar esta función.<br />
                La cuota que Ud. agregue mediante esta función será una copia de la cuota seleccionada en la lista.<br />
                Luego, por supuesto, Ud. podrá modificar los valores en la cuota para agregar la cuota que Ud. desea.
                `,
                false).then();
            return;
        }

        if (!Array.isArray($scope.cuotas)) { 
            $scope.cuotas = [];
        }
            
        var cuota = {};

        cuota._id = new Mongo.ObjectID()._str;

        cuota.source = {};

        cuota.source.entityID = capasCuotaSeleccionada.source.entityID;
        cuota.source.subEntityID = capasCuotaSeleccionada.source.subEntityID;
        cuota.source.origen = capasCuotaSeleccionada.source.origen;
        cuota.source.numero = capasCuotaSeleccionada.source.numero;

        cuota.fechaEmision = new Date();
        cuota.fecha = capasCuotaSeleccionada.fecha;
        cuota.compania = capasCuotaSeleccionada.compania;
        cuota.moneda = capasCuotaSeleccionada.moneda;
        cuota.numero = capasCuotaSeleccionada.numero;
        cuota.cantidad = capasCuotaSeleccionada.cantidad;
        cuota.diasVencimiento = capasCuotaSeleccionada.diasVencimiento;
        cuota.fechaVencimiento = capasCuotaSeleccionada.fechaVencimiento;
        cuota.montoOriginal = capasCuotaSeleccionada.montoOriginal;
        cuota.factor = capasCuotaSeleccionada.factor;
        cuota.monto = capasCuotaSeleccionada.monto;

        cuota.cia = capasCuotaSeleccionada.cia;
        cuota.docState = 1;

        $scope.cuotas.push(cuota);

        $scope.capasCuotas_ui_grid.data = [];

        if ($scope.cuotas && lodash.some($scope.cuotas, (c) => { return c.source.origen == 'capa'; })) { 
            $scope.capasCuotas_ui_grid.data = lodash.filter($scope.cuotas, (c) => { return c.source.origen === 'capa'; });
        }
            
        if (!$scope.contrato.docState) { 
            $scope.contrato.docState = 2;
            $scope.dataHasBeenEdited = true; 
        }
    }

    $scope.eliminarCapaCuota = function (cuota) {

        let index = lodash.findIndex($scope.cuotas, (x) => { return x._id === cuota._id; });
        if (index != -1) {
            $scope.cuotas[index].docState = 3;
        }

        if (!$scope.contrato.docState) { 
            $scope.contrato.docState = 2;
            $scope.dataHasBeenEdited = true; 
        }
    }

    $scope.calcularCapasCuotas = function() {

        let cuotaActualizada = false; 

        $scope.cuotas.filter((c) => { return c.source.origen === "capa"; }).forEach((cuota) => {

            if (!cuota.fechaEmision) {
                cuota.fechaEmision = new Date();
                if (!cuota.docState) { cuota.docState = 2; }; 

                cuotaActualizada = true; 
            }

            // calculamos la fecha de vencimiento
            if (cuota.fecha && cuota.diasVencimiento && !cuota.fechaVencimiento) {
                cuota.fechaVencimiento = moment(cuota.fecha).add(cuota.diasVencimiento, 'days').toDate();
                if (!cuota.docState) { cuota.docState = 2; }; 
                
                cuotaActualizada = true; 
            }

            // calculamos la fecha
            if (!cuota.fecha && cuota.diasVencimiento && cuota.fechaVencimiento) {
                cuota.fecha = moment(cuota.fechaVencimiento).subtract(parametros.diasVencimiento, 'days').toDate();
                if (!cuota.docState) { cuota.docState = 2; }; 
                
                cuotaActualizada = true; 
            }

            // calculamos la cantidad de días
            if (cuota.fecha && !cuota.diasVencimiento && cuota.fechaVencimiento) {
                // calculamos la cantidad de días entre dos fechas con moment
                let duration = moment.duration(moment(cuota.fechaVencimiento).diff(cuota.fecha));
                cuota.diasVencimiento = duration.asDays();
                if (!cuota.docState) { cuota.docState = 2; }; 
                
                cuotaActualizada = true; 
            }

            // calculamos el monto
            if (cuota.montoOriginal && cuota.factor && !cuota.monto) {
                cuota.monto = cuota.montoOriginal * cuota.factor;
                if (!cuota.docState) { cuota.docState = 2; }; 
                
                cuotaActualizada = true; 
            }

            // calculamos el monto original
            if (!cuota.montoOriginal && cuota.factor && cuota.monto && cuota.factor != 0) {
                cuota.montoOriginal = cuota.monto / cuota.factor;
                if (!cuota.docState) { cuota.docState = 2; }; 
                
                cuotaActualizada = true; 
            }

            // calculamos el factor
            if (cuota.montoOriginal && !cuota.factor && cuota.monto && cuota.montoOriginal != 0) {
                cuota.factor = cuota.monto / cuota.montoOriginal;
                if (!cuota.docState) { cuota.docState = 2; }; 
                
                cuotaActualizada = true; 
            }
        })

        if (!cuotaActualizada) { 
            DialogModal($modal, "<em>Contratos - Cuotas",
                `Aparentemente, <b>ninguna</b> cuota ha sido <em>recalculada</em>.<br /><br />
                 Por favor recuerde que Ud. debe <em>dejar en blanco</em>, el (los) campo (s) en cada cuota que desea que sea recalculado.
                `,
                false);
            return;
        }

        if (!$scope.contrato.docState) { 
            $scope.contrato.docState = 2;
            $scope.dataHasBeenEdited = true; 
        }
    }

    $scope.mostrarPagosEnCuota = function (cuota) {
        // mostramos los pagos aplicados a la cuota, en un modal ...
        MostrarPagosEnCuotas($modal, cuota, $stateParams.origen);
    }


    // ---------------------------------------------------------------------------------
    // para ir a los 'states' de cuentas: cuentas, reaseguradores y detalles (rubros
    $scope.gotoContratoProporcional_State = function (stateName) {

        if (!definicionCuentaTecnicaSeleccionada || lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            DialogModal($modal,
                        "<em>Contratos - Proporcionales",
                        `Ud. debe seleccionar una <em>definición de cuenta técnica</em>.<br /><br />
                         Seleccione la <em>definción de cuenta técnica</em> a la cual
                         corresponden la cifras que desea registrar o consultar.
                        `,
                        false);
            return;
        }

        if (!$scope.contrato.codigo) {
            DialogModal($modal,
                        "<em>Contratos - Proporcionales - Registro de cuentas técnicas</em>",
                        `El contrato debe tener un valor para el campo <em>Código</em>.<br /><br />
                        Por favor asigne un <em>código</em> a este contrato, el cual debe corresponder a la <em>tabla de
                        configuración</em> respectiva.
                        `,
                        false);
            return;
        }

        switch (stateName) { 
            case "definiciones": { 
                $state.go("contrato.cuentas.definiciones");
                break; 
            }
            case "cuentasTecnicas": { 
                $state.go('contrato.cuentas.cuentasTecnicas');
                break; 
            }
            case "retCartPr": { 
                $state.go("contrato.cuentas.retiradaCarteraPrimas");
                break; 
            }
            case "entCartPr": { 
                $state.go("contrato.cuentas.entradaCarteraPrimas");
                break; 
            }
            case "retCartSin": { 
                $state.go("contrato.cuentas.retiradaCarteraSiniestros");
                break; 
            }
            case "entCartSin": { 
                $state.go("contrato.cuentas.entradaCarteraSiniestros");
                break; 
            }
            case "comAdic": { 
                $state.go("contrato.cuentas.comisionAdicional");
                break; 
            }
            case "partBenef": { 
                $state.go("contrato.cuentas.participacionBeneficios");
                break; 
            }
        }
    }

    // --------------------------------------------------------------------------------------
    // ui-grid de Cuentas
    // --------------------------------------------------------------------------------------

    let definicionCuentaTecnicaSeleccionada = {};
    $scope.definicionCuentaTecnicaSeleccionada_Info = {};       // para mostrar la cuenta seleccionada en las páginas (html)

    $scope.cuentasTecnicas_definiciones_ui_grid = {
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

                definicionCuentaTecnicaSeleccionada = {};
                $scope.definicionCuentaTecnicaSeleccionada = {};

                $scope.definicionCuentaTecnicaSeleccionada_Info = {};
                $scope.cuentasCuotas_ui_grid.data = [];

                if (row.isSelected) {
                    definicionCuentaTecnicaSeleccionada = row.entity;

                    $scope.definicionCuentaTecnicaSeleccionada_Info.numero = definicionCuentaTecnicaSeleccionada.numero;
                    $scope.definicionCuentaTecnicaSeleccionada_Info.desde = moment(definicionCuentaTecnicaSeleccionada.desde).format("DD-MM-YYYY");
                    $scope.definicionCuentaTecnicaSeleccionada_Info.moneda = Monedas.findOne(definicionCuentaTecnicaSeleccionada.moneda).simbolo;

                    $scope.definicionCuentaTecnicaSeleccionada = definicionCuentaTecnicaSeleccionada; 

                    // intentamos refrescar el ui-grid de cuotas para la definción seleccionada ...
                    if ($scope.cuotas) {
                        $scope.cuentasCuotas_ui_grid.data = lodash.filter($scope.cuotas, function (c) {
                            return c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id;
                        });
                    }
                }
                else { 
                    return;
                }
            })

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!$scope.contrato.docState) { 
                        $scope.contrato.docState = 2;   
                        $scope.dataHasBeenEdited = true;       
                    }
                }          
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        // nótese que usamos 'id', y no '_id', pues estos registros vienen de sql con un id único
        // (y nosotros no agregamos un _id mongo) ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.cuentasTecnicas_definiciones_ui_grid.columnDefs = [
        {
            name: 'numero',
            field: 'numero',
            displayName: 'Período',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            width: 60,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
            cellFilter: 'dateFilter',
            width: 90,
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
            width: 90,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 50,
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'fechaVencimiento',
            field: 'fechaVencimiento',
            displayName: 'F vencimiento',
            cellFilter: 'dateFilter',
            width: 90,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'fechaRecepcion',
            field: 'fechaRecepcion',
            displayName: 'F recepción',
            cellFilter: 'dateFilter',
            width: 90,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
    ]


    $scope.agregarCuenta = function () {

        if (!$scope.contrato.cuentasTecnicas_definicion) { 
            $scope.contrato.cuentasTecnicas_definicion = [];
        }

        let monedaDefault = Monedas.findOne({ defecto: true }); 
            
        var cuentaMayorNumero = lodash.maxBy($scope.contrato.cuentasTecnicas_definicion, (cuenta) => { return cuenta.numero; });
        var cuenta = {
            _id: new Mongo.ObjectID()._str, 
            desde: new Date(), 
            moneda: monedaDefault ? monedaDefault._id : null, 
        };

        if (!lodash.isObject(cuentaMayorNumero)) {
            cuenta.numero = 1;
        } else {
            cuenta.numero = cuentaMayorNumero.numero + 1;
            cuenta.desde = cuentaMayorNumero.desde;
            cuenta.moneda = cuentaMayorNumero.moneda;
        }

        $scope.contrato.cuentasTecnicas_definicion.push(cuenta);
        $scope.cuentasTecnicas_definiciones_ui_grid.data = $scope.contrato.cuentasTecnicas_definicion;

        if (!$scope.contrato.docState) { 
            $scope.contrato.docState = 2;
            $scope.dataHasBeenEdited = true; 
        }   
    }

    $scope.eliminarCuenta = function () {

        if (definicionCuentaTecnicaSeleccionada && !lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            lodash.remove($scope.contrato.cuentasTecnicas_definicion, (c) => { return c._id === definicionCuentaTecnicaSeleccionada._id; });
            $scope.cuentasTecnicas_definiciones_ui_grid.data = $scope.contrato.cuentasTecnicas_definicion;

            if (!$scope.contrato.docState) { 
                $scope.contrato.docState = 2;
                $scope.dataHasBeenEdited = true; 
            }    
        }
    }

    $scope.generarCuentas_definiciones = function () {
        // pasamos el ui-grid para que se haga el binding para ésta cuando el usuario cierra el modal ...
        Contratos_Methods.construirDefinicionCuentas($scope, $scope.contrato, $scope.monedas, $scope.cuentasTecnicas_definiciones_ui_grid, $modal);
    }

    $scope.generarCuotasCuentaTecnica = () => {

        // debe haber una definicion seleccionada
        if (!definicionCuentaTecnicaSeleccionada || lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            DialogModal($modal,
                        "<em>Contratos - Proporcionales - Registro de cuotas de cuentas técnicas</em>",
                        `Error: Ud. debe seleccionar una <em>definición de cuenta técnica</em> en la lista.
                            `,
                        false);
            return;
        }

        if ($scope.dataHasBeenEdited) { 
            DialogModal($modal,
                "<em>Contratos - Proporcionales - Registro de cuotas de cuentas técnicas</em>",
                `Se han efectuado cambios en el registro. Por favor grabe los cambios antes de intentar ejecutar esta función.
                `,
                false);
            return;
        }

        let definicionID = definicionCuentaTecnicaSeleccionada._id; 

        // si no hay saldos de cuentas técnicas ni de complementarios (ent cart de primas, etc.), notificamos al usuario 
        let existenSaldos = {}; 
        existenSaldos = $scope.contratosProp_cuentas_saldos.find(x => x.definicionID === definicionID); 
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_comAdic_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_entCartPr_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_entCartSn_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_retCartPr_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_retCartSn_montosFinales.find(x => x.definicionID === definicionID); }
        if (!existenSaldos) { existenSaldos = $scope.contratosProp_partBeneficios_montosFinales.find(x => x.definicionID === definicionID); }

        if (!existenSaldos) {
            DialogModal($modal,
                        "<em>Contratos - Proporcionales - Registro de cuotas de cuentas técnicas</em>",
                        `Error: aparentemente, la <em>definición de cuenta técnica</em> seleccionada no tiene
                        saldos de cuentas técnicas, ni tampoco de complementarios registrados.<br /><br />
                        Para calcular las cuotas de una <em>definición de cuenta técnica</em>, ésta debe tener
                        saldos de cuentas técnicas o de complementarios y registrados.
                        `,
                        false);
            return;
        }

        // TODO: determinar si las cuotas ya existen. De ser así, informar y pedir confirmación ...
        let existenCuotasParaLaDefinicionSeleccionada = $scope.cuotas.find(c => c.source.subEntityID === definicionID); 

        if (existenCuotasParaLaDefinicionSeleccionada) {
            DialogModal($modal,
                        `<em>Contratos</em> - Registro de cuotas para la definición seleccionada`,
                         `Ya existen <em>cuotas registradas</em> para la
                         <em>definición de cuenta técnica</em> seleccionada.<br /><br />
                         Si Ud. continúa, éstas serán eliminadas y unas nuevas serán calculadas y
                         registradas en su lugar.<br /><br />
                         Desea continuar y sustituir las cuotas registradas para la definición seleccionada?`,
                        true).then(
                function () {
                    generarCuotasCuentaTecnica2();
                },
                function () {
                    DialogModal($modal, "<em>Contratos</em> - Cuentas técnicas - Generación de cuotas",
                                        "Ok, el proceso ha sido cancelado.", true).then();
                });
            return;
        }
        else
            generarCuotasCuentaTecnica2();
        }


    function generarCuotasCuentaTecnica2() {

        // pasamos al modal todos los arrays que contienen las: 1) cuentas; 2) complementarios (6) 
        let definicionID = definicionCuentaTecnicaSeleccionada._id; 

        // si no hay saldos de cuentas técnicas ni de complementarios (ent cart de primas, etc.), notificamos al usuario 
        let cuentas_saldos = $scope.contratosProp_cuentas_saldos.filter(x => x.definicionID === definicionID); 
        let comAdic_montosFinales = $scope.contratosProp_comAdic_montosFinales.filter(x => x.definicionID === definicionID);
        let entCartPr_montosFinales = $scope.contratosProp_entCartPr_montosFinales.filter(x => x.definicionID === definicionID);
        let entCartSn_montosFinales = $scope.contratosProp_entCartSn_montosFinales.filter(x => x.definicionID === definicionID);
        let retCartPr_montosFinales = $scope.contratosProp_retCartPr_montosFinales.filter(x => x.definicionID === definicionID);
        let retCartSn_montosFinales = $scope.contratosProp_retCartSn_montosFinales.filter(x => x.definicionID === definicionID);
        let partBeneficios_montosFinales = $scope.contratosProp_partBeneficios_montosFinales.filter(x => x.definicionID === definicionID); 


        let modalInstance = $modal.open({
               templateUrl: 'client/contratos/methods/generarCuotasCuentasTecnicas/cuentasGenerarCuotas.html',
               controller: 'CuentasGenerarCuotasController',
               size: 'md',
               resolve: {
                    contrato: function () {
                        return $scope.contrato;
                    },
                    definicionCuentaTecnicaSeleccionada: function () {
                        return definicionCuentaTecnicaSeleccionada;
                    },
                    cuotas: function () {
                        return $scope.cuotas;
                    },
                    definicionCuentaTecnicaSeleccionada_Info: function () {
                        return $scope.definicionCuentaTecnicaSeleccionada_Info;
                    }, 
                    cuentas_saldos: function() { return cuentas_saldos; },  
                    comAdic_montosFinales: function() { return comAdic_montosFinales; },  
                    entCartPr_montosFinales: function() { return entCartPr_montosFinales; },    
                    entCartSn_montosFinales: function() { return entCartSn_montosFinales; },   
                    retCartPr_montosFinales: function() { return retCartPr_montosFinales; },    
                    retCartSn_montosFinales: function() { return retCartSn_montosFinales; },   
                    partBeneficios_montosFinales: function() { return partBeneficios_montosFinales; }
               }
           }).result.then(
               function (resolve) {
                   return true;
               },
               function (cancel) {
                   // refrescamos el ui-grid para que se muestren las cuotas registradas
                   $scope.cuentasCuotas_ui_grid.data = []

                   if ($scope.cuotas) {
                       $scope.cuentasCuotas_ui_grid.data = lodash.filter($scope.cuotas, function (c) {
                           return c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id;
                       });
                   }

                   // solo si el usuario actualizó el array de cuotas para la definición, ponemos el flag en true 
                   if ($scope.cuotas && Array.isArray($scope.cuotas)) {
                        let arrayCuotasDefinicion = $scope.cuotas.filter((c) => 
                            {  
                                return (c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id && 
                                        c.docState); 
                            });

                        if (arrayCuotasDefinicion && Array.isArray(arrayCuotasDefinicion) && arrayCuotasDefinicion.length) { 
                            $scope.dataHasBeenEdited = true; 
                        }
                    }

                   return true;
               })
    }


    $scope.exportarExcel_Cuentas = () => { 

        // debe haber una definicion seleccionada
        if (!definicionCuentaTecnicaSeleccionada || lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            DialogModal($modal,
                        "<em>Contratos - Proporcionales - Cuentas - Exportar a Excel</em>",
                        `Error: Ud. debe seleccionar una <em>definición de cuenta técnica</em> en la lista.<br /><br />
                         Muestre la lista de <em>definiciones de cuentas técnicas</em> para el contrato proporcional y seleccione alguna 
                         de ellas en la lista. 
                             `,
                        false);
            return;
        }

        if ($scope.dataHasBeenEdited) { 
            DialogModal($modal,
                        "<em>Contratos - Proporcionales - Cuentas - Exportar a Excel</em>",
                        `Error: Ud. ha efectuado cambios en el registro. Por favor guarde los cambios antes de continuar.
                        `,
                        false);
            return;
        }

        let modalInstance = $modal.open({
            templateUrl: 'client/contratos/exportarExcel/exportarExcel_Cuentas_Modal.html',
            controller: 'ContratosCuentasExportarExcel_Controller',
            size: 'md',
            resolve: {
                contratoID: () => {
                    return $scope.contrato._id;
                },
                definicionCuentaTecnicaSeleccionada: () => {
                    return definicionCuentaTecnicaSeleccionada;
                },
                ciaSeleccionada: () => {
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

    // ---------------------------------------------------------------------
    // ui-grid: cuotas para la definición (de cuenta técnica) seleccionada
    // ----------------------------------------------------------------------
    var definicionCuentaCuotaSeleccionada = {};

    $scope.cuentasCuotas_ui_grid = {
        enableSorting: true,
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
            $scope.cuentasCuotasGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                definicionCuentaCuotaSeleccionada = {};
                if (row.isSelected) { 
                definicionCuentaCuotaSeleccionada = row.entity;
                }
                else { 
                return;
                } 
            })

            // marcamos el item como 'editado', cuando el usuario modifica un valor en el grid ...
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    // las cuotas se graban seperadamente; solo las cuotas 'marcadas' son enviadas al servidor y grabadas
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
                        $scope.dataHasBeenEdited = true; 
                    }
                }
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        // nótese que usamos 'id', y no '_id', pues estos registros vienen de sql con un id único
        // (y nosotros no agregamos un _id mongo) ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.cuentasCuotas_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
                '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
                '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: maroon; font: xx-small; padding-top: 8px; "></span>' +
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
            width: 70,
            cellFilter: 'origenCuota_Filter',            // ej: fac-1-1 (riesgo 1, movimiento 1)
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            pinnedLeft: true,
            type: 'string'
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
            enableSorting: true,
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
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',
            headerCellClass: 'ui-centerCell-leftCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            enableCellEdit: true,
            type: 'string'
        },
        {
            name: 'numero',
            field: 'numero',
            displayName: '#',
            width: 40,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableSorting: true,
            enableCellEdit: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'cantidad',
            field: 'cantidad',
            displayName: 'Cantidad',
            width: 45,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
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
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'montoOriginal',
            field: 'montoOriginal',
            displayName: 'Monto original',
            cellFilter: 'currencyFilter',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: true,
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
            cellFilter: 'currencyFilter',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: true,
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
            cellTemplate: '<div class="ui-grid-cell-contents">ver</div>',
            cellTemplate: '<button class="btn btn-sm btn-link" type="button" ng-click="grid.appScope.mostrarPagosEnCuota(this.row.entity)">ver</button>',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: false,
            type: 'string'
        }
    ]


    $scope.agregarCuentaCuota = function () {

        if (!definicionCuentaTecnicaSeleccionada || lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            DialogModal($modal, "<em>Contratos - Cuotas</em>",
                `Ud. debe seleccionar una <em>definición de cuenta técnica</em>
                <b>antes</b> de intentar ejecutar esta función.`,
                false).then();
            return;
        };

        if (!Array.isArray($scope.cuotas)) { 
            $scope.cuotas = [];
        }
            
        var cuota = {};

        cuota._id = new Mongo.ObjectID()._str;

        cuota.source = {};

        cuota.source.entityID = $scope.contrato._id;
        cuota.source.subEntityID = definicionCuentaTecnicaSeleccionada._id;
        cuota.source.origen = "cuenta";
        cuota.source.numero = $scope.contrato.numero.toString() + "-" + definicionCuentaTecnicaSeleccionada.numero.toString();

        //cuota.moneda = $scope.contrato.moneda;

        cuota.moneda = definicionCuentaTecnicaSeleccionada.moneda;
        cuota.cia = $scope.contrato.cia;
        cuota.docState = 1;

        $scope.cuotas.push(cuota);

        $scope.cuentasCuotas_ui_grid.data = lodash.filter($scope.cuotas, function (c) { return c.source.subEntityID === definicionCuentaTecnicaSeleccionada._id; });

        $scope.dataHasBeenEdited = true; 
    }

    $scope.eliminarCuentaCuota = function () {

        if (!definicionCuentaTecnicaSeleccionada || lodash.isEmpty(definicionCuentaTecnicaSeleccionada)) {
            DialogModal($modal,
                        "<em>Contratos - Cuotas</em>",
                        `Ud. debe seleccionar la capa a la cual corresponde la cuota que desea eliminar.`,
                        false).then();
            return;
        }

        if (!definicionCuentaCuotaSeleccionada || lodash.isEmpty(definicionCuentaCuotaSeleccionada)) {
            DialogModal($modal,
                        `<em>Contratos - Cuotas</em>", "Ud. debe seleccionar la cuota que desea eliminar.`,
                        false).then();
            return;
        }

        lodash.remove($scope.cuotas, function (cuota) { return cuota._id === definicionCuentaCuotaSeleccionada._id; });

        capasCuotaSeleccionada = {};

        $scope.cuentasCuotas_ui_grid.data = lodash.filter($scope.cuotas, function (c) { return c.source.subEntityID === cuentaSeleccionada._id; });
        $scope.dataHasBeenEdited = true; 
    }


    // -------------------------------------------------------------------------
    // para inicializar el item (en el $scope) cuando el usuario abre la página
    // -------------------------------------------------------------------------

    function inicializarItem() {
        if ($scope.id == "0") {
            // el id viene en '0' cuando el usuario hace un click en Nuevo ...
            $scope.contrato = {
                _id: new Mongo.ObjectID()._str,
                numero: 0,
                fechaEmision: new Date(),
                ingreso: new Date(),
                usuario: Meteor.userId(),
                cia: $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : null,
                docState: 1
            };

            $scope.cuotas = [];   
            $scope.contratosProp_comAdic_resumen = []; 
            $scope.contratosProp_comAdic_distribucion = []; 
            $scope.contratosProp_comAdic_montosFinales = []; 
            $scope.contratosProp_entCartPr_resumen = []; 
            $scope.contratosProp_entCartPr_distribucion = []; 
            $scope.contratosProp_entCartPr_montosFinales = []; 
            $scope.contratosProp_entCartSn_resumen = []; 
            $scope.contratosProp_entCartSn_distribucion = []; 
            $scope.contratosProp_entCartSn_montosFinales = []; 
            $scope.contratosProp_retCartPr_resumen = []; 
            $scope.contratosProp_retCartPr_distribucion = []; 
            $scope.contratosProp_retCartPr_montosFinales = []; 
            $scope.contratosProp_retCartSn_resumen = []; 
            $scope.contratosProp_retCartSn_distribucion = []; 
            $scope.contratosProp_retCartSn_montosFinales = [];  
            $scope.contratosProp_partBeneficios_resumen = []; 
            $scope.contratosProp_partBeneficios_distribucion = []; 
            $scope.contratosProp_partBeneficios_montosFinales = []; 

            $scope.contratosProp_cuentas_resumen = [];  
            $scope.contratosProp_cuentas_distribucion = [];  
            $scope.contratosProp_cuentas_saldos = [];   

            $scope.dataHasBeenEdited = true; 
        } else {
            // nótese que, al menos por ahora, hacemos lo mismo tanto si se 'vieneDeAfuera' o no;
            // simplemente, suscribimos al contrato en particular y luego leemos sus cuotas ...
            $scope.showProgress = true;
            $scope.contrato = {};
            $scope.cuotas = [];

            let contratoID = $scope.id; 

            // si se efectuó un subscription al collection antes, la detenemos ...
            if (Contratos_SubscriptionHandle) {
                Contratos_SubscriptionHandle.stop();
            }

            Contratos_SubscriptionHandle = null;

            Contratos_SubscriptionHandle = 
            Meteor.subscribe('contrato', contratoID, () => { 

                $scope.helpers({ 
                    cuotas: () => { 
                        return Cuotas.find({ "source.entityID": $scope.id }).fetch();
                    }, 
                    contrato: () => { 
                        return Contratos.findOne($scope.id);
                    }, 
                    contratosProp_comAdic_resumen: () => { 
                        return ContratosProp_comAdic_resumen.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_comAdic_distribucion: () => { 
                        return ContratosProp_comAdic_distribucion.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_comAdic_montosFinales: () => { 
                        return ContratosProp_comAdic_montosFinales.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_entCartPr_resumen: () => { 
                        return ContratosProp_entCartPr_resumen.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_entCartPr_distribucion: () => { 
                        return ContratosProp_entCartPr_distribucion.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_entCartPr_montosFinales: () => { 
                        return ContratosProp_entCartPr_montosFinales.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_entCartSn_resumen: () => { 
                        return ContratosProp_entCartSn_resumen.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_entCartSn_distribucion: () => { 
                        return ContratosProp_entCartSn_distribucion.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_entCartSn_montosFinales: () => { 
                        return ContratosProp_entCartSn_montosFinales.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_retCartPr_resumen: () => { 
                        return ContratosProp_retCartPr_resumen.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_retCartPr_distribucion: () => { 
                        return ContratosProp_retCartPr_distribucion.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_retCartPr_montosFinales: () => { 
                        return ContratosProp_retCartPr_montosFinales.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_retCartSn_resumen: () => { 
                        return ContratosProp_retCartSn_resumen.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_retCartSn_distribucion: () => { 
                        return ContratosProp_retCartSn_distribucion.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_retCartSn_montosFinales: () => { 
                        return ContratosProp_retCartSn_montosFinales.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_partBeneficios_resumen: () => { 
                        return ContratosProp_partBeneficios_resumen.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_partBeneficios_distribucion: () => { 
                        return ContratosProp_partBeneficios_distribucion.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_partBeneficios_montosFinales: () => { 
                        return ContratosProp_partBeneficios_montosFinales.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_cuentas_resumen: () => { 
                        return ContratosProp_cuentas_resumen.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_cuentas_distribucion: () => { 
                        return ContratosProp_cuentas_distribucion.find({ contratoID: $scope.id }); 
                    }, 
                    contratosProp_cuentas_saldos: () => { 
                        return ContratosProp_cuentas_saldos.find({ contratoID: $scope.id }); 
                    }, 
                })

                // 'limpiamos' los ui-grids
                $scope.capas_ui_grid.data = [];
                $scope.capasReaseguradores_ui_grid.data = [];
                $scope.capasPrimasCompanias_ui_grid.data = [];
                $scope.capasCuotas_ui_grid.data = [];

                // asociamos los ui-grids a sus datos en el $scope
                if ($scope.contrato && Array.isArray($scope.contrato.capas)) { 
                    $scope.capas_ui_grid.data = $scope.contrato.capas;
                }
                    
                if ($scope.cuotas && $scope.cuotas.find((c) => { return c.source.origen == 'capa'; })) { 
                    $scope.capasCuotas_ui_grid.data = lodash.filter($scope.cuotas, (c) => { return c.source.origen === 'capa'; });
                }
                    
                if ($scope.contrato && $scope.contrato.cuentasTecnicas_definicion) { 
                    $scope.cuentasTecnicas_definiciones_ui_grid.data = $scope.contrato.cuentasTecnicas_definicion;
                }
                    
                if ($scope.contrato && Array.isArray($scope.contrato.capasPrimasCompanias)) { 
                    $scope.capasPrimasCompanias_ui_grid.data = $scope.contrato.capasPrimasCompanias;
                }

                // para leer el último cierre efectuado 
                Meteor.subscribe('cierre', () => { 
                    $scope.dataHasBeenEdited = false; 
                    $scope.showProgress = false;
                    $scope.$apply();

                    // inicialmente, mostramos el state 'generales'
                    $scope.goToState('generales');
                })
            })
        }
    }

    inicializarItem();
}])