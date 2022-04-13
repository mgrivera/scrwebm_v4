
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

import angular from 'angular'; 
import lodash from 'lodash';

import Papa from 'papaparse';
import saveAs from 'save-as'

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { ContratosProp_Configuracion_Tablas } from '/imports/collections/catalogos/ContratosProp_Configuracion';
import { ContProp_tablaConf } from '/client/lib/forerunnerDB'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { TiposContrato } from '/imports/collections/catalogos/tiposContrato'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { LeerCompaniaNosotros } from '/imports/generales/leerCompaniaNosotros'; 

angular.module("scrwebm")
       .controller("ContratosProp_Configuracion_Tabla_Controller", ['$scope', '$state', '$stateParams', '$uibModal', 
function ($scope, $state, $stateParams, $uibModal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // leemos la compañía seleccionada
    const companiaSeleccionada = $scope.$parent.companiaSeleccionada;

    // leemos los catálogos en el $scope
    $scope.monedas = Monedas.find().fetch();
    $scope.companias = Companias.find().fetch();
    $scope.suscriptores = Suscriptores.find().fetch();
    $scope.ramos = Ramos.find().fetch();

    $scope.codigoContrato = $stateParams.codigoContrato;

    $scope.regresarALista = function () {
        if (lodash.some($scope.contratosProp_configuracion_tablas, (x) => { return x.docState; })) {
            let message = `Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em>
            y perder los cambios?`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            DialogModal($uibModal, "<em>Contratos - Configuración</em>", message, true).then(
                function () {
                    $state.go('catalogos.contrProp_configuracion.contrProp_configuracion_lista');
                },
                function () {
                    return true;
                });
            return;
        }
        else
            $state.go('catalogos.contrProp_configuracion.contrProp_configuracion_lista');
    }

    $scope.exportarTablaConfiguracion = () => {
        // permitimos grabar el asiento contable, como un json, a un archivo en la máquina. Luego, este archivo podrá
        // ser importado como un asiento nuevo ...
        try {
            $scope.showProgress = true; 

            // para tener un clone del array 
            const items = JSON.parse(JSON.stringify($scope.contratosProp_configuracion_tablas)); 

            // eliminamos algunas propiedades que no queremos en el txt (csv) 
            items.forEach(x => { 
                delete x._id; 
                delete x.docState; 

                const compania = Companias.findOne(x.compania, { fields: { abreviatura: 1 } });
                const moneda = Monedas.findOne(x.moneda, { fields: { simbolo: 1 } });
                const ramo = Ramos.findOne(x.ramo, { fields: { abreviatura: 1 } });
                const tipoContrato = TiposContrato.findOne(x.tipoContrato, { fields: { abreviatura: 1 } });

                x.compania = compania.abreviatura; 
                x.moneda = moneda.simbolo; 
                x.ramo = ramo.abreviatura; 
                x.tipoContrato = tipoContrato.abreviatura; 
                x.cia = companiaSeleccionada.abreviatura; 
            });

            // papaparse: convertimos el array json a un string csv ...
            const config = {
                quotes: true,
                quoteChar: "'",
                delimiter: "\t",
                header: true
            };

            let csvString = Papa.unparse(items, config);

            // cambiamos los headers por textos más apropiados (pareciera que ésto no se puede hacer desde el config)
            csvString = csvString.replace("ano", "lapso");
            csvString = csvString.replace("compania", "empresa");

            var blob = new Blob([csvString], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "cont prop - tabla config");

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, la tabla ha sido exportada a un archivo de texto en forma exitosa. <br /> 
                      En total, se han exportado <b>${items.length.toString()}</b> lineas. 
                     `
            });

            // por alguna razón el ui-grid deja de mostrarse en forma correcta cuando este proceso termina ... 
            // $scope.configuracionContrato_ui_grid.data = $scope.contratosProp_configuracion_tablas;

            $scope.showProgress = false;
            // $timeout();
        }
        catch (err) {
            const message = err.message ? err.message : err.toString();

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });

            $scope.showProgress = false;
            // $timeout();
        }
    }

    $scope.importarTablaConfiguracion = function () {

        const items = $scope.contratosProp_configuracion_tablas.slice();

        const editandoAhora = items.some(x => x.docState); 

        if (editandoAhora) {
            DialogModal($uibModal, "<em>Contratos proporcionales - Tabla de configuración - Importar</em>",
                `Los registros en la tabla han sido editados, pero no han sido guardados a la base de datos.<br /> 
                 Ud. debe hacer un <em>click</em> en <em>Grabar</em> para grabar las modificaciones a la base de datos, 
                 antes de intentar ejecutar esta función. 
                `,
                false).then();

            return;
        }

        // leemos algún riesgo que se haya exportado antes (con un Download) y lo agregamos como un riesgo nuevo ... 
        const inputFile = angular.element("#fileInput");
        if (inputFile) {
            inputFile.click();        // simulamos un click al input (file)
        }
    }

    $scope.importarTablaConfiguracion2 = function (files) {

        const userSelectedFile = files[0];

        if (!userSelectedFile) {
            DialogModal($uibModal, "<em>Contratos proporcionales - Tabla de configuración - Importar</em>",
                `Aparentemente, Ud. no ha seleccionado un archivo.<br />
                                 Ud. debe seleccionar un archivo que haya sido creado antes 
                                 mediante la opción <em>Exportar</em>, que existe en este mismo menú.`,
                false).then();

            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) {
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }

            return;
        }

        // 1) leemos la compañía 'nosotros' ... 
        const result = LeerCompaniaNosotros(Meteor.userId());

        if (result.error) {
            DialogModal($uibModal, "<em>Riesgos - Error al intentar leer la compañía 'nosotros'</em>", result.message, false).then();

            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) {
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }

            return;
        }

        const companiaNosotros = result.companiaNosotros; 

        $scope.showProgress = true;
        const reader = new FileReader();

        reader.onload = function (e) {

            const content = e.target.result;

            // ya tenemos el contenido del archivo que el usuario ha seleccionado; ahora convertimos a json con papaparse 
            const config = {
                // delimiter: "\t",
                delimiter: "",	            // auto-detect
                quoteChar: '"',	            // a veces Excel usa comillas para calificar; solo en algunos valores (???)
                skipEmptyLines: 'greedy',   // super útil; si el usuario deja lineas en blanco en Excel, no las importamos 
                header: true                // el usuario debe dejar el header 
            };

            const result = Papa.parse(content, config);
            const errors = result.errors;   // si papa consigue errores, los deja aquí 

            if (errors.length) {
                let message = `Se han encontrado errores al intentar leer el archivo con los registros para actualizar. <br /><br /><ul>`;

                errors.map(x => {
                    message += `<li>${JSON.stringify(x)}</li>`;
                });

                message += `<ul>`

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: message
                });

                return;
            }

            const newItems = result.data.slice();

            for (const item of newItems) { 

                item._id = new Mongo.ObjectID()._str; 
                item.codigo = $scope.codigoContrato; 
                item.cia = companiaSeleccionada._id; 
                item.docState = 1; 

                const compania = Companias.findOne({ abreviatura: item.empresa }, { fields: { _id: 1 } });
                const moneda = Monedas.findOne({ simbolo: item.moneda }, { fields: { _id: 1 } });
                const ramo = Ramos.findOne({ abreviatura: item.ramo }, { fields: { _id: 1 } });
                const tipoContrato = TiposContrato.findOne({ abreviatura: item.tipoContrato }, { fields: { _id: 1 } });

                if (!compania || !moneda || !ramo || !tipoContrato) { 
                    let message = `Se han encontrado errores al intentar leer el archivo con los registros para actualizar. <br /><br /><ul>`;

                    if (!compania) { 
                        message += `<li>La compañía indicada no existe en la tabla de compañías.</li>`
                    }

                    if (!moneda) {
                        message += `<li>La moneda indicada no existe en la tabla de monedas.</li>`
                    }

                    if (!ramo) {
                        message += `<li>El ramo indicado no existe en la tabla de ramos.</li>`
                    }

                    if (!tipoContrato) {
                        message += `<li>El tipo de contrato indicado no existe en la tabla de tipos de contrato.</li>`
                    }

                    message += `<ul>`


                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: message
                    });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                item.compania = compania._id;
                item.moneda = moneda._id;
                item.ramo = ramo._id;
                item.tipoContrato = tipoContrato._id;

                // establecemos si la compañía es 'nosotros' 
                item.nosotros = item.compania === companiaNosotros._id ? true : false; 

                // convertimos a valores numéricos; por alguna razón, Excel pone comillas en valores también numéricos 
                item.ano = parseInt(item.lapso ? item.lapso : 0); 

                item.ordenPorc = parseFloat(item.ordenPorc ? item.ordenPorc : 0); 
                item.comisionPorc = parseFloat(item.comisionPorc ? item.comisionPorc : 0);  
                item.imp1Porc = parseFloat(item.imp1Porc ? item.imp1Porc : 0);  
                item.imp2Porc = parseFloat(item.imp2Porc ? item.imp2Porc : 0);  
                item.imp3Porc = parseFloat(item.imp3Porc ? item.imp3Porc : 0);  
                item.corretajePorc = parseFloat(item.corretajePorc ? item.corretajePorc : 0);  

                delete item.lapso; 
                delete item.empresa; 

                $scope.contratosProp_configuracion_tablas.push(item);
            }

            $scope.configuracionContrato_ui_grid.data = $scope.contratosProp_configuracion_tablas;

            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) {
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, el proceso ha sido ejecutado en forma satisfactoria. <br /> 
                      Los registros han sido importados a la tabla; ahora Ud. debe revisarlos muy bien y 
                      hacer un <em>click</em> en <em>Grabar</em>, para grabarlos a la base de datos. <br /><br /> 
                      También, de ser necesario, puede salir <b>sin</b> grabar, para descartar los cambios.  
                     `
            });

            $scope.showProgress = false;
            $scope.$apply();
        }

        reader.readAsText(userSelectedFile, 'ISO-8859-1');
    }

    $scope.configuracionContrato_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: true,
        selectionRowHeaderWidth: 25,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {

            // marcamos el item como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue)
                    if (!rowEntity.docState)
                        rowEntity.docState = 2;
            });
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        },
    };

    $scope.configuracionContrato_ui_grid.columnDefs = [
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
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,
            cellFilter: 'companiaAbreviaturaFilter',
            sortCellFiltered: true, 
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
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: 60,
            cellFilter: 'monedaSimboloFilter',
            sortCellFiltered: true, 
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'ramo',
            field: 'ramo',
            displayName: 'Ramo',
            width: 100,
            cellFilter: 'ramoAbreviaturaFilter',
            sortCellFiltered: true, 
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'tipoContrato',
            field: 'tipoContrato',
            displayName: 'Tipo',
            cellFilter: 'tipoContratoAbreviaturaFilter',
            sortCellFiltered: true, 
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
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ];

    $scope.deleteItem = function (item) {
        item.docState = 3;
    }

    $scope.eliminarTodosLosRowsEnElGrid = () => { 
        // marcamos todos los items en la lista para que sean eliminados; nota: el usuario debe hace un click en Grabar ... 
        $scope.contratosProp_configuracion_tablas.forEach(x => { 
            if (!x.docState) { 
                x.docState = 3; 
            }
        })
    }

    $scope.nuevo = function () {
        $scope.contratosProp_configuracion_tablas.push({
            _id: new Mongo.ObjectID()._str,
            codigo: $scope.codigoContrato,
            cia: companiaSeleccionada._id,
            docState: 1,
        });
    }

    // TODO: hacer este subscribe solo cuando venimos del 1er. state, no cuando regresamos de construir registros ... 
    $scope.showProgress = true; 

    // si existen registros en la tabla temporal (frDB) los usamos;  de otra forma, leemos desde la base de datos con un subscribe 
    const existenRegistrosConfiguracion =  ContProp_tablaConf.count({ tipo: 'reg conf', user: Meteor.userId(), }); 

    if (existenRegistrosConfiguracion) { 

        $scope.contratosProp_configuracion_tablas = []; 
        const items = ContProp_tablaConf.find({ tipo: 'reg conf', user: Meteor.userId(), });

        // en vez de leer el contenido desde mongo en server, agregamos ahora desde la tabla en forerunnerDB 
        for (const item of items) { 

            const regConf = { 
                _id: item._id, 
                codigo: item.codigo, 
                ano: item.ano, 
                moneda: item.moneda, 
                ramo: item.ramo, 
                tipoContrato: item.tipoContrato, 
                compania: item.compania, 
                nosotros: item.nosotros, 
                ordenPorc: item.ordenPorc, 
                comisionPorc: item.comisionPorc, 
                imp1Porc: item.imp1Porc, 
                imp2Porc: item.imp2Porc, 
                imp3Porc: item.imp3Porc, 
                corretajePorc: item.corretajePorc, 
                cia: item.cia, 
                docState: item.docState, 
            }; 

            $scope.contratosProp_configuracion_tablas.push(regConf); 
        }

        $scope.configuracionContrato_ui_grid.data = [];
        $scope.configuracionContrato_ui_grid.data = $scope.contratosProp_configuracion_tablas;
        $scope.showProgress = false;
    } else { 
        const filtro = { codigo: $scope.codigoContrato, cia: companiaSeleccionada._id, };
        Meteor.subscribe('contratosProp.configuracion.tablas', JSON.stringify(filtro), () => {

                $scope.helpers({
                    contratosProp_configuracion_tablas: () => {
                        return ContratosProp_Configuracion_Tablas.find(
                            {
                                codigo: $scope.codigoContrato,
                                cia: companiaSeleccionada._id,
                            });
                    },
                });

                $scope.configuracionContrato_ui_grid.data = $scope.contratosProp_configuracion_tablas;

                $scope.showProgress = false;
                $scope.$apply();
        })
    }

    $scope.agregarItemsATabla = () => {
        // agregamos los registros de la tabla de configuración a un collection en frDB para tenerlos disponibles en 
        // el próx state 
        ContProp_tablaConf.remove({ tipo: 'reg conf', user: Meteor.userId() });

        for (const item of $scope.contratosProp_configuracion_tablas) {
            item.tipo = 'reg conf';
            item.user = Meteor.userId();

            ContProp_tablaConf.insert(item);         // nótese como usamos el *mismo* collections para varias cosas en esta función 
        }

        ContProp_tablaConf.save(function (err) {
            if (!err) {
                // Save was successful
                $state.go('catalogos.contrProp_configuracion.contratosListaProp_configuracion_tabla_construir',
                    { codigoContrato: $scope.codigoContrato, });
            } else {
                throw new Meteor.Error("Error: ha ocurrido un error al intentar hacer un save en forerunnerDB: " + err);
            }
        })
    }

    $scope.save = function () {

        $scope.showProgress = true;

        const editedItems = lodash.filter($scope.contratosProp_configuracion_tablas, function (item) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        const errores = [];

        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = ContratosProp_Configuracion_Tablas.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    ContratosProp_Configuracion_Tablas.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push(`El valor '${error.value}' no es adecuado para el
                                    campo <b><em>${ContratosProp_Configuracion_Tablas.simpleSchema().label(error.name)}</b></em>;
                                    error de tipo '${error.type}'.
                                    `);
                    });
                }
            }
        });

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas " +
                    "en la base de datos:<br /><br />" +
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

        Meteor.call('contratosProp_configuracion_tablas_Save', editedItems, function (error, result) {

            if (error) {

                const errorMessage = mensajeErrorDesdeMethod_preparar(error);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
            // se queda el '*' para registros nuevos en el ui-grid ...
            $scope.contratosProp_configuracion_tablas = [];
            $scope.configuracionContrato_ui_grid.data = [];

            const filtro = { codigo: $scope.codigoContrato, cia: companiaSeleccionada._id, };
            Meteor.subscribe('contratosProp.configuracion.tablas', JSON.stringify(filtro), () => {
                $scope.helpers({
                    contratosProp_configuracion_tablas: () => {
                        return ContratosProp_Configuracion_Tablas.find(
                            {
                                codigo: $scope.codigoContrato,
                                cia: companiaSeleccionada._id,
                            });
                    },
                });

                $scope.configuracionContrato_ui_grid.data = $scope.contratosProp_configuracion_tablas;

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result
                });

                $scope.showProgress = false;
                $scope.$apply();
            })
        })
    }
}])