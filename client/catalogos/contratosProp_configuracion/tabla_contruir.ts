

import * as angular from 'angular'; 
import * as lodash from 'lodash';
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 
import { TiposContrato } from 'imports/collections/catalogos/tiposContrato';  

import { DialogModal } from '../../imports/generales/angularGenericModal'; 
import { ContProp_tablaConf } from '../../lib/forerunnerDB'; 
import { LeerCompaniaNosotros } from 'imports/generales/leerCompaniaNosotros'; 

angular.module("scrwebm").controller("ContratosProp_Configuracion_Tabla_Construir_Controller",
['$scope', '$state', '$stateParams', '$meteor', '$modal', '$interval', 
  function ($scope, $state, $stateParams, $meteor, $modal, $interval) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    // este es el tab 'activo' en angular bootstrap ui ...
    // NOTA IMPORTANTE: esta propiedad cambio a partir de 1.2.1 en angular-ui-bootstrap. Sin embargo, parece que
    // atmosphere no tiene esta nueva versión (se quedó en 0.13.0) y no pudimos instalarla desde NPM. La verdad,
    // cuando podamos actualizar angular-ui-bootstrap a una nueve vesión, la propiedad 'active' va en el tabSet
    // y se actualiza con el index de la página (0, 1, 2, ...). Así resulta mucho más intuitivo y fácil
    // establecer el tab 'activo' en ui-bootstrap ...
    $scope.activeTab = { tab1: true, tab2: false, };

    // el código del contrato viene como un parámetro a este state 
    $scope.codigoContrato = $stateParams.codigoContrato;

    // la compañía seleccionada fue leída en el parent state 
    let companiaSeleccionada = $scope.$parent.companiaSeleccionada;

    // construimos una lista con los años que van desde el 2.000 hasta tres años por encima del actual. 
    let listaAnos = []; 
    let anoActual = new Date().getFullYear(); 
    for (let i = (anoActual + 3); i >= 2000; i--) { 
        listaAnos.push({ ano: i } as never); 
    }

    $scope.helpers({
        monedas: () => {
            return Monedas.find({}, { sort: { descripcion: 1 } });
        },
        companias: () => {
            return Companias.find({}, { sort: { nombre: 1 } });
        },
        ramos: () => {
            return Ramos.find({}, { sort: { descripcion: 1 } });
        },
        tiposContrato: () => {
            return TiposContrato.find({}, { sort: { descripcion: 1 } });
        },
        anos: () => { 
            return listaAnos; 
        }, 
    });

    // ------------------------------
    // ui-grid de años 
    // ------------------------------]
    let anos_ui_grid_api: any = {}; 
    let anos_selectedRows = []; 

    $scope.anos_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: true,
        enableSelectAll: true,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            anos_ui_grid_api = gridApi; 

            gridApi.selection.on.rowSelectionChanged($scope, function(row) {

                if (row.isSelected) { 
                    anos_selectedRows.push(row.entity as never); 
                }
                else { 
                    lodash.remove(anos_selectedRows, (x: any) => x.ano === row.entity.ano); 
                }   
            });

            // este evento se ejecuta cuando el usaurio selecciona/deselecciona todos los rows del ui-grid con el 
            // check que está arriba en el grid ... 
            gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {  

                if (!rows.length) { 
                    anos_selectedRows = []; 
                    return; 
                }
	 
                for (let row of rows) { 
                    if (row.isSelected) { 
                        let x = lodash.find(anos_selectedRows, (x: any) => x.ano === row.entity.ano); 
                        if (!x) { 
                            anos_selectedRows.push(row.entity as never); 
                        }
                    }
                    else { 
                        lodash.remove(anos_selectedRows, (x: any) => x.ano === row.entity.ano); 
                    }
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
    };

    $scope.anos_ui_grid.columnDefs = [
            {
                name: 'ano',
                field: 'ano',
                displayName: 'Año',
                width: 200, 
                headerCellClass: 'ui-grid-centerCell',
                cellClass: 'ui-grid-centerCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'number'
            },
    ];

    // ------------------------------
    // ui-grid de monedas 
    // ------------------------------
    let monedas_ui_grid_api: any = {}; 
    let monedas_selectedRows: {}[] = [];

    $scope.monedas_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: true,
        enableSelectAll: true,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            monedas_ui_grid_api = gridApi; 

            gridApi.selection.on.rowSelectionChanged($scope, function(row) {

                if (row.isSelected) { 
                    monedas_selectedRows.push(row.entity as never); 
                }
                else { 
                    lodash.remove(monedas_selectedRows, (x: any) => x._id === row.entity._id); 
                }   
            });

            // este evento se ejecuta cuando el usaurio selecciona/deselecciona todos los rows del ui-grid con el 
            // check que está arriba en el grid ... 
            gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {  

                if (!rows.length) { 
                    monedas_selectedRows = []; 
                    return; 
                }
	 
                for (let row of rows) { 
                    if (row.isSelected) { 
                        let x = lodash.find(monedas_selectedRows, (x: any) => x._id === row.entity._id); 
                        if (!x) { 
                            monedas_selectedRows.push(row.entity as never); 
                        }
                    }
                    else { 
                        lodash.remove(monedas_selectedRows, (x: any) => x._id === row.entity._id); 
                    }
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
    };

    $scope.monedas_ui_grid.columnDefs = [
            {
                name: 'descripcion',
                field: 'descripcion',
                displayName: 'Descripción',
                width: 200, 
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
    ];

    // ------------------------------
    // ui-grid de ramos 
    // ------------------------------
    let ramos_ui_grid_api: any = {}; 
    let ramos_selectedRows = []; 

    $scope.ramos_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: true,
        enableSelectAll: true,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            ramos_ui_grid_api = gridApi; 

            gridApi.selection.on.rowSelectionChanged($scope, function(row) {

                if (row.isSelected) { 
                    ramos_selectedRows.push(row.entity as never); 
                }
                else { 
                    lodash.remove(ramos_selectedRows, (x: any) => x._id === row.entity._id); 
                }   
            });

            // este evento se ejecuta cuando el usaurio selecciona/deselecciona todos los rows del ui-grid con el 
            // check que está arriba en el grid ... 
            gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {  

                if (!rows.length) { 
                    ramos_selectedRows = []; 
                    return; 
                }
	 
                for (let row of rows) { 
                    if (row.isSelected) { 
                        let x = lodash.find(ramos_selectedRows, (x: any) => x._id === row.entity._id); 
                        if (!x) { 
                            ramos_selectedRows.push(row.entity as never); 
                        }
                    }
                    else { 
                        lodash.remove(ramos_selectedRows, (x: any) => x._id === row.entity._id); 
                    }
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
    };

    $scope.ramos_ui_grid.columnDefs = [
            {
                name: 'descripcion',
                field: 'descripcion',
                displayName: 'Descripción',
                width: 200, 
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
    ];


    // ------------------------------
    // ui-grid de companias 
    // ------------------------------
    let companias_ui_grid_api: any = {}; 
    let companias_selectedRows = []; 

    $scope.companias_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: true,
        enableSelectAll: true,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            companias_ui_grid_api = gridApi; 

            gridApi.selection.on.rowSelectionChanged($scope, function(row) {

                if (row.isSelected) { 
                    companias_selectedRows.push(row.entity as never); 
                }
                else { 
                    lodash.remove(companias_selectedRows, (x: any) => x._id === row.entity._id); 
                }   
            });

            // este evento se ejecuta cuando el usaurio selecciona/deselecciona todos los rows del ui-grid con el 
            // check que está arriba en el grid ... 
            gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {  

                if (!rows.length) { 
                    companias_selectedRows = []; 
                    return; 
                }
	 
                for (let row of rows) { 
                    if (row.isSelected) { 
                        let x = lodash.find(companias_selectedRows, (x: any) => x._id === row.entity._id); 
                        if (!x) { 
                            companias_selectedRows.push(row.entity as never); 
                        }
                    }
                    else { 
                        lodash.remove(companias_selectedRows, (x: any) => x._id === row.entity._id); 
                        return; 
                    }
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
    };

    $scope.companias_ui_grid.columnDefs = [
            {
                name: 'nombre',
                field: 'nombre',
                displayName: 'Nombre',
                width: 200, 
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
    ];


    // ------------------------------
    // ui-grid de tipos de contrato 
    // ------------------------------
    let tipos_ui_grid_api: any = {}; 
    let tipos_selectedRows = []; 

    $scope.tiposContrato_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: true,
        enableSelectAll: true,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            tipos_ui_grid_api = gridApi; 

            gridApi.selection.on.rowSelectionChanged($scope, function(row) {

                if (row.isSelected) { 
                    tipos_selectedRows.push(row.entity as never); 
                }
                else { 
                    lodash.remove(tipos_selectedRows, (x: any) => x._id === row.entity._id); 
                }   
            });

            // este evento se ejecuta cuando el usaurio selecciona/deselecciona todos los rows del ui-grid con el 
            // check que está arriba en el grid ... 
            gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {  

                if (!rows.length) { 
                    tipos_selectedRows = []; 
                    return; 
                }
	 
                for (let row of rows) { 
                    if (row.isSelected) { 
                        let x = lodash.find(tipos_selectedRows, (x: any) => x._id === row.entity._id); 
                        if (!x) { 
                            tipos_selectedRows.push(row.entity as never); 
                        }
                    }
                    else { 
                        lodash.remove(tipos_selectedRows, (x: any) => x._id === row.entity._id); 
                    }
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
    };

    $scope.tiposContrato_ui_grid.columnDefs = [
            {
                name: 'descripcion',
                field: 'descripcion',
                displayName: 'Descripción',
                width: 200, 
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
    ];


    $scope.anos_ui_grid.data = $scope.anos; 
    $scope.monedas_ui_grid.data = $scope.monedas; 
    $scope.ramos_ui_grid.data = $scope.ramos; 
    $scope.companias_ui_grid.data = $scope.companias; 
    $scope.tiposContrato_ui_grid.data = $scope.tiposContrato; 

    // con los valores seleccionados, construimos un array que será mostrado en el ui-gridj
    let registrosConfiguracionArray: {}[] = [];


    $scope.construirTablaConfiguracionContrato = function() { 

        if (!anos_selectedRows.length || !monedas_selectedRows.length || !ramos_selectedRows.length || 
            !companias_selectedRows.length || !tipos_selectedRows) { 
                let message = `Error: Ud. debe seleccionar al menos un elemento en cada lista (años, monedas, ramos, compañías, ...).
               `; 
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);
                return;
        }

        // 1) leemos la compañía 'nosotros' ... 
        let companiaNosotros = {} as any;
        let result: any = LeerCompaniaNosotros(Meteor.userId()); 

        if (result.error) {
            DialogModal($modal, "<em>Riesgos - Error al intentar leer la compañía 'nosotros'</em>", result.message, false).then();
            return;
        }

        companiaNosotros = result.companiaNosotros; 

        // 2) comprobamos que el usuario haya seleccionado la compañía 'nosotros' 
        let existe: any = companias_selectedRows.find((x: any) => { return x._id === companiaNosotros._id; });
        if (!existe) {
            let message = `Error: Ud. debe seleccionar, en la lista de compañías, la que corresponde a
                           <em><b>nosotros</b></em>. Esa es, justamente, nuestra compañía y debe ser
                           seleccionada para representar nuestra participación en el contrato.
                          `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);
            return;
        }

        // 3) comprobamos que la compañía 'nosotros' tenga 'marcado' el campo 'nosotros' (más abajo se ordena por allí) ... 
        if (!existe.nosotros) {
            let message = `Error: aparentemente, la compañía del tipo <em><b>nosotros</b></em>, aunque fue seleccionada en la lista, 
                           no está marcada en la maestra (catálogo de Compañías) como <em><b>nosotros</b></em>. <br /><br /> 
                           Por favor abra el catálogo de Compañías y marque la compañía como <em><b>nosotros</b></em>. <br /> 
                           Luego regrese y continúe con este proceso. 
                          `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);
            return;
        }

        registrosConfiguracionArray = []; 
        let cantidadRegistros = 0; 

        $scope.showProgress = false;

        // ordenamos las compañías por: nosotros y nombre; la idea es que se muestre primero nuestra
        // compañía y luego el resto, ordenadas por su nombre ...
        lodash.orderBy(companias_selectedRows, ['nosotros', 'abreviatura'], ['desc', 'asc']).forEach((compania: any) => {
            anos_selectedRows.forEach((ano: any) => { 
                monedas_selectedRows.forEach((moneda: any) => {
                    ramos_selectedRows.forEach((ramo: any) => {
                        tipos_selectedRows.forEach((tipo: any) => {

                            let registroConfiguracionItem = {};

                            registroConfiguracionItem = {
                                _id: new Mongo.ObjectID()._str,
                                compania: compania._id,
                                companiaAbreviatura: compania.abreviatura, 
                                nosotros: compania.nosotros,
                                ano: ano.ano,
                                moneda: moneda._id,
                                monedaSimbolo: moneda.simbolo, 
                                ramo: ramo._id,
                                ramoAbreviatura: ramo.abreviatura, 
                                tipo: tipo._id,
                                tipoAbreviatura: tipo.abreviatura, 
                                ordenPorc: null,
                                comisionPorc: null,
                                imp1Porc: null,
                                imp2Porc: null,
                                imp3Porc: null,
                                corretajePorc: null,
                            };

                            registrosConfiguracionArray.push(registroConfiguracionItem);
                            cantidadRegistros++; 
                        })
                    })
                })
            })
        })

        // leemos la tabla de parametrización de contratos para intentar obtener porcentajes de impuesto y usarlos como default 
        // Nota: el publishing que lee y trae los códigos de contrato trae también esta tabla; ésto, cuando se leen y muestran los 
        // códigos de contrato en el 1er. state de este proceso ... 
        let contratosParametros = $scope.$parent.contratosParametros; 

        if (contratosParametros && Array.isArray(registrosConfiguracionArray) && registrosConfiguracionArray.length) { 
            let registroConf: any = registrosConfiguracionArray[0]; // asignamos porc default solo al 1er. item ... 

            registroConf.imp1Porc = contratosParametros && contratosParametros.imp1Porc ? contratosParametros.imp1Porc : null; 
            registroConf.imp2Porc = contratosParametros && contratosParametros.imp2Porc ? contratosParametros.imp2Porc : null; 

        }

        // --------------------------------------------------------------------------------------
        // actualizamos los items seleccionados en las listas ... 
        itemsSeleccionadosEnListas_grabarEnForerunnerDB(anos_selectedRows, monedas_selectedRows, ramos_selectedRows, 
                                                        companias_selectedRows, tipos_selectedRows). 
            then((resolve) => { 

                $scope.registrosConfiguracion_ui_grid.data = [];
                $scope.registrosConfiguracion_ui_grid.data = registrosConfiguracionArray;

                let message =  `Ok, los registros de configuración para el (los) año (s) y el contrato han sido construídos.<br />
                                En total, se han agregado <b>${cantidadRegistros.toString()}</b> registros. <br />
                                Ahora Ud. puede indicar los valores (%com, %imp, %corr, ..) apropiados para cada uno.<br /><br />
                                Para <em><b>propagar</b></em> los valores indicados a otros registros,
                                haga un <em>click</em> en <em>Propagar</em>.
                            `
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                DialogModal($modal, "<em>Contratos - Configuración</em>", message, false).then((x) => { 
                    $scope.showProgress = false;
                    // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
                    $scope.activeTab = { tab1: false, tab2: true, };
                });
            }). 
            catch((err) => { 
                let message =  `Error: hemos obtenido un error al intentar grabar los elementos que Ud. ha seleccionado 
                                en las listas. El mensaje específico del error es: <br />
                                ${err}
                            `
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);

                $scope.showProgress = false;
            })
    }


    $scope.regresarATablaPermanente = function () {
        if (registrosConfiguracionArray.find((x: any) => { return x.docState; })) {
            let message =  `Aparentemente, Ud. ha efectuado cambios en la lista de registros de configuración. <br /> 
                            Sin embargo, los registros no han sido agregados a la tabla de configuración permanente. <br />  
                            Aún así, desea <em>regresar</em> y perder estos cambios?
                            `
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            var promise = DialogModal($modal,
                                    "<em>Contratos - Configuración</em>", message, true).then(
                function (resolve) {
                    $state.go('catalogos.contrProp_configuracion.contratosListaProp_configuracion_tabla', 
                              { codigoContrato: $scope.codigoContrato, });
                },
                function (err) {
                    return true;
                });
            return;
        }
        else { 
            $state.go('catalogos.contrProp_configuracion.contratosListaProp_configuracion_tabla', 
                      { codigoContrato: $scope.codigoContrato, });
        }
    }


    let itemSeleccionado: any = {};
    let uiGridApi = null;

    $scope.datosItemSeleccionado = ""; 

    // para registrar el sort que el usuario aplica a la lista. Este sort debe ser usado en la function propagar, para que los datos se 
    // propaguen manteniendo este orden que el usuario ha aplicado ... 
    let gridSort = []; 

    $scope.registrosConfiguracion_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {
            uiGridApi = gridApi;

            // guardamos el row que el usuario seleccione
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                

                if (row.isSelected) { 
                    itemSeleccionado = row.entity;

                    // mostramos los detalles del item seleccionado ... 
                    let compania = Companias.findOne(itemSeleccionado.compania); 
                    let moneda = Monedas.findOne(itemSeleccionado.moneda); 
                    let ramo = Ramos.findOne(itemSeleccionado.ramo); 
                    let tipo =  TiposContrato.findOne(itemSeleccionado.tipo); 

                    let compania2 = compania.nosotros ? (`${compania.abreviatura} (Nosotros)`) : compania.abreviatura; 

                    itemSeleccionado = `${compania2} - ${itemSeleccionado.ano.toString()} - ${moneda.simbolo} - ${ramo.abreviatura} - ${tipo.abreviatura}`;
                    $scope.datosItemSeleccionado = itemSeleccionado;  
                }
                else { 
                    return;
                }  
            })
            // marcamos el item como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
                    }  
                }
            }) 

            gridApi.core.on.sortChanged( $scope, function(grid, sortColumns){

                // sortColumns is an array containing just the column sorted in the grid
                var name = sortColumns[0].name; // the name of the first column sorted
                var direction = sortColumns[0].sort.direction // the direction of the first column sorted: "desc" or "asc"
      
                // Your logic to do the server sorting
                gridSort.length = 0; 

                for (let item of sortColumns) { 
                    let item2 = { name: item.name, direction: item.sort.direction, }; 
                    gridSort.push(item2 as never); 
                }
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        },
    };


    $scope.registrosConfiguracion_ui_grid.columnDefs = [
        {
            name: 'companiaAbreviatura',
            field: 'companiaAbreviatura',
            displayName: 'Compañía',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'nosotros',
            field: 'nosotros',
            displayName: 'Nosotros',
            width: 80,
            cellFilter: 'boolFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'boolean'
        },
        {
            name: 'ano',
            field: 'ano',
            displayName: 'Año',
            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'monedaSimbolo',
            field: 'monedaSimbolo',
            displayName: 'Mon',
            width: 60,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'ramoAbreviatura',
            field: 'ramoAbreviatura',
            displayName: 'Ramo',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'tipoAbreviatura',
            field: 'tipoAbreviatura',
            displayName: 'Tipo',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'ordenPorc',
            field: 'ordenPorc',
            displayName: 'Orden (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'comisionPorc',
            field: 'comisionPorc',
            displayName: 'Com (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'imp1Porc',
            field: 'imp1Porc',
            displayName: 'Imp1 (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'imp2Porc',
            field: 'imp2Porc',
            displayName: 'Imp2 (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'imp3Porc',
            field: 'imp3Porc',
            displayName: 'Imp3 (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
        },
        {
            name: 'corretajePorc',
            field: 'corretajePorc',
            displayName: 'Corr (%)',
            cellFilter: 'currencyFilterAndNull',
            width: 80,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number',
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

    $scope.deleteItem = (entity) => {
        if (entity) {
            lodash.remove(registrosConfiguracionArray, (x: any) => { return x._id === entity._id; });
        }
    }


    $scope.propagarCifras = () => {
        // recorremos el array de valores de configuración y 'propagamos' sus cifras; ésto es: dado un valor por el
        // usario para un campo, ejemplo comisionPorc, lo asignamos hacia abajo, en los próximos rows, mientras no exista otro valor ...
        let ordenPorc_anterior = null;
        let comPorc_anterior = null;
        let imp1Porc_anterior = null;
        let imp2Porc_anterior = null;
        let imp3Porc_anterior = null;
        let corrPorc_anterior = null;

        // si el usuario ha aplicado un sort en la lista, lo usamos. La idea es propagar usando el sort que el usuario ha aplicado ... 
        let itemsOrderedArray: {}[] = []; 

        if (Array.isArray(gridSort) && gridSort.length) { 
            // para ordenar con lodash, creamos dos arrays, uno con los nombres y otro con la dirección del sort 
            let names = []; 
            let directions = []; 

            let sortItem: any = {}; 
            for (sortItem of gridSort) { 
                names.push(sortItem.name as never); 
                directions.push(sortItem.direction as never); 
            }

            // usamos lodash para ordenar por el mismo criterio que indicó el usuario en la lista 
            // (cuando el usuario aplica un sort a la lista, ui-grid, el mismo no se aplica al array original)
            itemsOrderedArray = lodash.orderBy(registrosConfiguracionArray, names, directions); 

        } else { 
            itemsOrderedArray = lodash.clone(registrosConfiguracionArray); 
        }

        itemsOrderedArray.forEach((x: any) => {

            if (!lodash.isFinite(x.ordenPorc)) {
                // lodash.isFinite incluye cualquier número, incluso el cero
                x.ordenPorc = ordenPorc_anterior;
            } else {
                ordenPorc_anterior = x.ordenPorc;
            }

            if (!lodash.isFinite(x.comisionPorc)) {
                x.comisionPorc = comPorc_anterior;
            } else {
                comPorc_anterior = x.comisionPorc;
            }

            if (!lodash.isFinite(x.imp1Porc)) {
                x.imp1Porc = imp1Porc_anterior;
            } else {
                imp1Porc_anterior = x.imp1Porc;
            }

            if (!lodash.isFinite(x.imp2Porc)) {
                x.imp2Porc = imp2Porc_anterior;
            } else {
                imp2Porc_anterior = x.imp2Porc;
            }

            if (!lodash.isFinite(x.imp3Porc)) {
                x.imp3Porc = imp3Porc_anterior;
            } else {
                imp3Porc_anterior = x.imp3Porc;
            }

            if (!lodash.isFinite(x.corretajePorc)) {
                x.corretajePorc = corrPorc_anterior;
            } else {
                corrPorc_anterior = x.corretajePorc;
            }
        })

        // ahora que hicimos el Propagar en el array ordenado, lo pasamos al array original que mostramo en la lista ... 
        registrosConfiguracionArray.length = 0; 
        itemsOrderedArray.forEach((x) => { registrosConfiguracionArray.push(x); }); 

        $scope.registrosConfiguracion_ui_grid.data = [];
        $scope.registrosConfiguracion_ui_grid.data = registrosConfiguracionArray;
    }

    // recuperamos el state de la página, que guardamos en forerunnerDB ... 
    // lo que hacemos en el promise es un 'load' para cada collection en forerunnerDB; luego aquí hacemos el find ... 
    $scope.showProgress = true; 

    readPageState()
        .then((result: any) => {

            // sin el $interval dificilmente funciona el ui-grid-api.selection.selectRow(row) ... 
            $interval( () => { 
                // leemos en forerunnerDB las monedas que el usuario seleccionó en la lista antes ... 
                
                let item: any = null; 

                let anosLeidos = ContProp_tablaConf.find({ tipo: 'anos seleccionados', user: Meteor.userId()}); 
                for (item of anosLeidos) { 
                    let ano = $scope.anos_ui_grid.data.find(x => x.ano === item.ano); 
                    if (ano) { 
                        anos_ui_grid_api.selection.selectRow(ano); 
                    }
                }

                let monedasLeidas = ContProp_tablaConf.find({ tipo: 'monedas seleccionadas', user: Meteor.userId()}); 
                for (item of monedasLeidas) { 
                    let moneda = $scope.monedas_ui_grid.data.find(x => x._id === item.monedaID); 
                    if (moneda) { 
                        monedas_ui_grid_api.selection.selectRow(moneda); 
                    }
                }

                let companiasLeidas = ContProp_tablaConf.find({ tipo: 'companias seleccionadas', user: Meteor.userId()}); 
                for (item of companiasLeidas) { 
                    let compania = $scope.companias_ui_grid.data.find(x => x._id === item.companiaID); 
                    if (compania) { 
                        companias_ui_grid_api.selection.selectRow(compania); 
                    }
                }

                let ramosLeidos = ContProp_tablaConf.find({ tipo: 'ramos seleccionados', user: Meteor.userId()}); 
                for (item of ramosLeidos) { 
                    let ramo = $scope.ramos_ui_grid.data.find(x => x._id === item.ramoID); 
                    if (ramo) { 
                        ramos_ui_grid_api.selection.selectRow(ramo); 
                    }
                }

                let tiposLeidos = ContProp_tablaConf.find({ tipo: 'tipos seleccionados', user: Meteor.userId()}); 
                for (item of tiposLeidos) { 
                    let tipo = $scope.tiposContrato_ui_grid.data.find(x => x._id === item.tipoID); 
                    if (tipo) { 
                        tipos_ui_grid_api.selection.selectRow(tipo); 
                    }
                }

                $scope.registrosConfiguracion_ui_grid.data = [];
                $scope.showProgress = false;
            }, 500, 1);
        })
        .catch((err: any) => {
            let message =  `Error: hemos obtenido un error al intentar grabar los elementos que Ud. ha seleccionado 
                            en las listas. <br />
                            El mensaje específico del error es: <br />
                            ${err}
                            `
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);

            $scope.showProgress = false;
            $scope.$apply();
        })


    $scope.agregarRegistrosDeConfiguracion = () => {
        // finalmente, cuando el usuario ejecuta esta función, agregamos estos registros a la tabla de configuración

        if (!registrosConfiguracionArray.find((x: any) => { return x.docState; })) {
            let message =  `Aparentemente, Ud. <b>no ha efectuado</b> cambios en la lista de registros de configuración. <br /> 
                        Ud. debe efectuar cambios en estos registros antes de intentar agregarlos a la tabla 
                        <em>permanente</em> de registros de configuración.
                        `
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            var promise = DialogModal($modal, "<em>Contratos - Configuración</em>", message, false);
            return;
        }

        let message =  `Los registros que Ud. ha construido serán agregados a la
                        <em><b>tabla de configuración</b></em> definitiva.<br /><br />
                        Estos registros, aunque agregados, no serán permanentes. Ud. deberá hacer un
                        <em>click</em> en <em>Grabar</em> para grabar los registros agregados a la
                        base de datos. <br /><br />
                        Desea continuar y agregar estos registros a la tabla de configuracion?
                        `
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        DialogModal($modal, "<em>Contratos - Configuración</em>", message, true).then(() => {
                // Ok, vamos a agregar los registros a la tabla de configuración ...

                $scope.showProgress = true;

                // agregaamos los registros que el usuario ha construido a los que antes existían, para que en state 
                // anterior se graben (bind) y muestren en el grid ... 
                let itemsPorAgregar = []; 

                lodash(registrosConfiguracionArray).
                        sortBy(['ano', 'nosotros', 'compania', 'moneda', 'ramo', 'tipo'], ['asc', 'desc', 'asc', 'asc', 'asc', 'asc']).
                        forEach((x: any) => {

                    let itemConfiguracion = {
                        _id: new Mongo.ObjectID()._str,
                        codigo: $scope.codigoContrato,

                        ano: x.ano,
                        moneda: x.moneda,
                        ramo: x.ramo,
                        tipoContrato: x.tipo,
                        compania: x.compania,
                        nosotros: x.nosotros,
                        ordenPorc: x.ordenPorc,
                        comisionPorc: x.comisionPorc,
                        imp1Porc: x.imp1Porc,
                        imp2Porc: x.imp2Porc,
                        imp3Porc: x.imp3Porc,
                        corretajePorc: x.corretajePorc,

                        cia: companiaSeleccionada._id,
                        docState: 1,
                    };

                    itemsPorAgregar.push(itemConfiguracion as never);
                })

                let itemsAgregados = 0; 
                let itemsEliminados = 0; 
                let itemsObviados = 0; 

                let item: any; 
                for (item of itemsPorAgregar) { 

                    // si el item no tiene valores en ningún campo (porcentajes), lo obviamos 
                    if (!item.docState) { 
                        continue; 
                    }

                    if (!item.ordenPorc && !item.comisionPorc && !item.imp1Porc && !item.imp2Porc && !item.imp3Porc && !item.corretajePorc) { 
                        continue; 
                    }

                    // eliminamos el item si ya existía en la tabla; buscamos el item original y lo marcamos para ser eliminado ... 
                    let itemExiste_array = ContProp_tablaConf.find({ 
                        ano: item.ano,
                        moneda: item.moneda,
                        ramo: item.ramo,
                        tipoContrato: item.tipoContrato,
                        compania: item.compania,
                    });

                    if (itemExiste_array) { 
                        for (let x of itemExiste_array) { 
                            // frDB: nótese que no usamos '$set'; solo actualizamos el field en forma directa ... 
                            ContProp_tablaConf.updateById(x._id, { docState: 3 });
                            itemsEliminados++; 
                        }
                    }
                }

                for (item of itemsPorAgregar) { 

                    // si el item no tiene valores en ningún campo (porcentajes), lo obviamos 
                    if (!item.docState) { 
                        itemsObviados++; 
                        continue; 
                    }

                    if (!item.ordenPorc && !item.comisionPorc && !item.imp1Porc && !item.imp2Porc && !item.imp3Porc && !item.corretajePorc) { 
                        itemsObviados++; 
                        continue; 
                    }

                    item.tipo = 'reg conf'; 
                    item.user = Meteor.userId(); 

                    ContProp_tablaConf.insert(item); 
                    itemsAgregados++; 
                }

                let message =  `Ok, los registros de configuración han sido agregados a la tabla.<br /><br />
                                En total, <b>${itemsAgregados.toString()}</b> registros han sido agregados.<br />
                                <b>${itemsEliminados.toString()}</b> han sido eliminados pues ya existían y han sido sustituidos.<br />
                                <b>${itemsObviados.toString()}</b> han sido obviados por no tener valores en ningún campo o no 
                                haber sido editados.<br /><br />
                                Recuerde que Ud. debe hacer un <em>click</em> en <em>Grabar</em> para registrar estos registros 
                                en la base de datos.
                            `
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
                DialogModal($modal, "<em>Contratos - Configuración</em>", message, false).then((x) => { 
                    $state.go('catalogos.contrProp_configuracion.contratosListaProp_configuracion_tabla', 
                              { codigoContrato: $scope.codigoContrato, }); 
                });
            },
            () => {
                return;
            });
    }
}])


// --------------------------------------------------------------------------------------------------------------------------------
// recuperamos el state de la página desde forerunnerDB ... 
// en forerunnerDB debemos hacer un load para cargar, desde el storage en el browser, el contenido de cada collection ... 
// --------------------------------------------------------------------------------------------------------------------------------
function readPageState() { 

    return new Promise((resolve, reject) => {

        ContProp_tablaConf.load(function (err, tableStats, metaStats) {
            if (!err) {
                // Load was successful
                let result = `Ok, el 'load' fue exitoso en forerunnerDB ...`; 
                resolve(result); 
            } else { 
                reject(err); 
            }
        });

    })
} 


// --------------------------------------------------------------------------------------
// grabamos a forerunnerDB los items seleccionados en las listas ... 
// --------------------------------------------------------------------------------------
function itemsSeleccionadosEnListas_grabarEnForerunnerDB(anos_selectedRows, monedas_selectedRows, ramos_selectedRows, 
                                                         companias_selectedRows, tipos_selectedRows) { 

    return new Promise((resolve, reject) => {

        // lo primero que hacemos el eliminar el contendido que ahora existe 
        ContProp_tablaConf.remove({ user: Meteor.userId() });
        ContProp_tablaConf.remove({ tipo: 'anos seleccionados', user: Meteor.userId() });
        ContProp_tablaConf.remove({ tipo: 'monedas seleccionadas', user: Meteor.userId() });
        ContProp_tablaConf.remove({ tipo: 'ramos seleccionados', user: Meteor.userId() });
        ContProp_tablaConf.remove({ tipo: 'companias seleccionadas', user: Meteor.userId() });
        ContProp_tablaConf.remove({ tipo: 'tipos seleccionados', user: Meteor.userId() });

        // guardamos los rows seleccionados en forerunnerDB 
        anos_selectedRows.forEach((ano: any) => {
            ano.tipo = 'anos seleccionados'; 
            ano.user = Meteor.userId(); 

            ContProp_tablaConf.insert(ano);
        }); 

        monedas_selectedRows.forEach((moneda: any) => {
            moneda.monedaID = moneda._id; 
            delete moneda._id; 
            moneda.tipo = 'monedas seleccionadas'; 
            moneda.user = Meteor.userId(); 

            ContProp_tablaConf.insert(moneda);
        }); 

        ramos_selectedRows.forEach((ramo: any) => {
            ramo.ramoID = ramo._id; 
            delete ramo._id; 
            ramo.tipo = 'ramos seleccionados'; 
            ramo.user = Meteor.userId(); 

            ContProp_tablaConf.insert(ramo);
        }); 

        companias_selectedRows.forEach((compania: any) => {
            compania.companiaID = compania._id; 
            delete compania._id; 
            compania.tipo = 'companias seleccionadas'; 
            compania.user = Meteor.userId(); 

            ContProp_tablaConf.insert(compania);
        }); 

        tipos_selectedRows.forEach((tipo: any) => {
            tipo.tipoID = tipo._id; 
            delete tipo._id; 
            tipo.tipo = 'tipos seleccionados'; 
            tipo.user = Meteor.userId(); 

            ContProp_tablaConf.insert(tipo);
        }); 

        ContProp_tablaConf.save(function (err) {
            if (!err) {
                // Save was successful
                let result = `Ok, el 'save' fue exitoso en forerunnerDB ...`; 
                resolve(result); 
            } else { 
                reject(err); 
            }
        })
    })
}