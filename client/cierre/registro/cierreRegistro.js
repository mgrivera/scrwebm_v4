
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';

import angular from 'angular'; 

import numeral from 'numeral';
import moment from 'moment';
import lodash from 'lodash';

import Papa from 'papaparse';
import saveAs from 'save-as'

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { CierreRegistro } from '/imports/collections/cierre/registroCierre'; 
import { registroCierre_simpleSchema_validar_import } from './registroCierre_simpleSchema_validar_import'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Filtros } from '/imports/collections/otros/filtros'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { convertFromStringToDate } from '/imports/funciones/DateFunctions'; 

angular.module("scrwebm")
       .controller("Cierre.Registro.Controller", ['$scope', '$uibModal', '$interval', 
function ($scope, $uibModal, $interval) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.currentTab = 0;               // para establecer / cambiar el 'active' tab 

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    }

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
    })
    // -------------------------------------------------------------------------------------------------------

    $scope.$parent.tituloState = "Cierre - Edición/consulta del registro"; 

    // para usar en el filtro, para que el usuario seleccione por tipo 
    $scope.tipo_list = [
        { tipo: "", descripcion: "Todos" },
        { tipo: "A", descripcion: "Automáticos" },
        { tipo: "M", descripcion: "Manuales" },
    ];

    // para usar en el ui-grid, cuando el usuario edita un registro 
    $scope.tiposArray = [
        { tipo: "A", descripcion: "Auto" },
        { tipo: "M", descripcion: "Man" },
    ];

    $scope.tiposNegocio = [
        { tipo: "Prop", descripcion: "Prop" },
        { tipo: "NoProp", descripcion: "NoProp" },
        { tipo: "Fac", descripcion: "Fac" },
        { tipo: "Otro", descripcion: "Otro" },
    ];

    $scope.cobroPago_list = [
        { value: null, descripcion: "Todos" },
        { value: "cobros/pagos", descripcion: "Cobros o pagos" },
        { value: "montos", descripcion: "Montos emitidos" },
    ];

    $scope.categorias_list = [
        { value: null, descripcion: "" },
        { value: "Prima", descripcion: "Prima" },
        { value: "Sin", descripcion: "Sin" },
        { value: "Saldo", descripcion: "Saldo" },
        { value: "Cobro", descripcion: "Cobro" },
        { value: "Pago", descripcion: "Pago" },
        { value: "ComAdic", descripcion: "Comisión adicional" },
        { value: "PartBeneficios", descripcion: "Part beneficios" },
        { value: "RetCartPr", descripcion: "Ret cart primas" },
        { value: "EntCartPr", descripcion: "Ent cart primas" },
        { value: "RetCartSn", descripcion: "Ret cart Sin" },
        { value: "EntCartSn", descripcion: "Ent cart sin" },

    ];

    $scope.helpers({
        companias: () => {
            return Companias.find({}, { sort: { nombre: 1 } });
        },
        cedentes: () => {
            return Companias.find({ tipo: "SEG", }, { sort: { nombre: 1 } });
        },
        monedas: () => {
            return Monedas.find({}, { sort: { descripcion: 1 } });
        },
    });

    // -----------------------------------------------------------------------------------------------
    // para exportar los items en la lista a un archivo de texto 
    // -----------------------------------------------------------------------------------------------
    $scope.exportarItems = () => {
        // permitimos grabar el asiento contable, como un json, a un archivo en la máquina. Luego, este archivo podrá
        // ser importado como un asiento nuevo ...
        try {
            $scope.showProgress = true;

            // para tener un clone del array 
            const items = [...$scope.registro];

            // eliminamos algunas propiedades que no queremos en el txt (csv) 
            items.forEach(x => {
                delete x._id;
                delete x.docState;
                delete x.origen_keys; 
                delete x.usuario; 
                delete x.ingreso; 
                delete x.ultAct; 

                const compania = Companias.findOne(x.compania, { fields: { abreviatura: 1 } });
                const moneda = Monedas.findOne(x.moneda, { fields: { simbolo: 1 } });
                const cedente = Companias.findOne(x.cedente, { fields: { abreviatura: 1 } });
                
                x.fecha = moment(x.fecha).format("YYYY-MM-DD"); 
                x.compania = compania.abreviatura;
                x.moneda = moneda.simbolo;
                x.cedente = cedente.abreviatura;
                x.cobro_pago = x.cobroPagoFlag ? 'Ok' : ''; 
                x.cia = $scope.companiaSeleccionada.abreviatura;

                delete x.cobroPagoFlag; 
            });

            // papaparse: convertimos el array json a un string csv ...
            const config = {
                quotes: false,
                // quoteChar: "'",
                delimiter: "\t",
                header: true
            };

            const csvString = Papa.unparse(items, config);

            // cambiamos los headers por textos más apropiados (pareciera que ésto no se puede hacer desde el config)
            // csvString = csvString.replace("ano", "lapso");
            // csvString = csvString.replace("compania", "compañía");

            var blob = new Blob([csvString], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "registro.txt");

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, la lista ha sido exportada a un archivo de texto en forma exitosa. <br /> 
                      En total, se han exportado <b>${items.length.toString()}</b> lineas. 
                     `
            });

            $scope.showProgress = false;
        }
        catch (err) {
            const message = err.message ? err.message : err.toString();

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });

            $scope.showProgress = false;
        }
    }

    // -----------------------------------------------------------------------------------------------
    // para importar los items en la lista desde un archivo de texto 
    // -----------------------------------------------------------------------------------------------
    $scope.importarItems1 = function () {

        const items = [...$scope.registro];

        const editandoAhora = items.some(x => x.docState);

        if (editandoAhora) {
            DialogModal($uibModal, "<em>Proceso de cierre - Registro - Importar</em>",
                `Los registros en la lista han sido editados, pero <b>no</b> han sido guardados a la base de datos.<br /> 
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

    $scope.importarItems2 = function (files) {

        const userSelectedFile = files[0];

        if (!userSelectedFile) {
            DialogModal($uibModal, "<em>Proceso de cierre - Registro - Importar</em>",
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
                let message = `Se han encontrado errores al intentar leer el archivo con los registros a importar. <br /><br /><ul>`;

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

            const meteorUser = Meteor.user().username ? Meteor.user().username : Meteor.user().emails[0].address; 
            const newItems = [...result.data]; 

            for (const item of newItems) {
                item._id = new Mongo.ObjectID()._str; 

                item.tipo = item.tipo ? item.tipo : "M";
                item.cobroPagoFlag = item.cobro_pago ? item.cobro_pago : false; 
                delete item.cobro_pago; 

                item.usuario = meteorUser; 
                item.ingreso = new Date(); 
                item.ultAct = new Date(); 
                item.cia = $scope.companiaSeleccionada._id; 
                
                const compania = Companias.findOne({ abreviatura: item.compania }, { fields: { _id: 1 } });
                const moneda = Monedas.findOne({ simbolo: item.moneda }, { fields: { _id: 1 } });
                const cedente = Companias.findOne({ abreviatura: item.cedente }, { fields: { _id: 1 } });

                item.compania = compania?._id ? compania._id : null;
                item.moneda = moneda?._id ? moneda._id : null;
                item.cedente = cedente?._id ? cedente._id : null;

                // convertimos a valores numéricos; por alguna razón, Excel pone comillas en valores también numéricos 
                item.fecha = item.fecha ? convertFromStringToDate(item.fecha).date : null; 
                item.serie = item.serie ? parseInt(item.serie) : null; 
                item.monto = item.monto ? parseFloat(item.monto) : 0; 

                item.docState = 1; 
            }

            // nótese como validamos cada item antes de intentar guardar en el servidor
            let isValid = false;
            const errores = [];

            newItems.forEach((item) => {
                if (item.docState != 3) {
                    isValid = registroCierre_simpleSchema_validar_import.namedContext().validate(item);

                    if (!isValid) {
                        registroCierre_simpleSchema_validar_import.namedContext().validationErrors().forEach((error) => {
                            if (error.type === "custom") {
                                // cuando pasamos errores del tipo custom es porque el error no corresponde a un field en particular, sino a 
                                // todo el registro. En un caso tal, mostramos solo el nombre (name), pues allí ponemos la descripción del error 
                                errores.push(`${error.name}`);
                            } else {
                                const id = item.referencia ? item.referencia : ""; 
                                errores.push(`(<em>${id}</em>) El valor '${error.value}' no es adecuado para el campo '${registroCierre_simpleSchema_validar_import.label(error.name)}'; error de tipo '${error.type}'.`);
                            }
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

                // para que el input type file "limpie" el file indicado por el usuario
                const inputFile = angular.element("#fileInput");
                if (inputFile && inputFile[0] && inputFile[0].value) {
                    inputFile[0].value = null;
                }

                $scope.showProgress = false;
                return;
            }

            // agregamos los items que se han importado al array original que se muestra en la lista 
            newItems.forEach(item => $scope.registro.push(item));
            $scope.registro_ui_grid.data = $scope.registro;

            // para que el input type file "limpie" el file indicado por el usuario
            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) {
                inputFile[0].value = null;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, el proceso ha sido ejecutado en forma satisfactoria. <br /> 
                      En total, han sido importados <b>${newItems.length.toString()}</b> registros a la lista. <br /> 
                      Los registros han sido importados a la lista como <b><em>registros nuevos</em></b>. <br />
                      Ahora Ud. debe revisarlos muy bien y hacer un <em>click</em> en <em>Grabar</em>, 
                      para grabarlos a la base de datos. <br /><br /> 
                      También, de ser necesario, puede salir <b>sin</b> grabar, para descartar los cambios.  
                     `
            });

            $scope.showProgress = false;
            $scope.$apply();
        }

        reader.readAsText(userSelectedFile, 'ISO-8859-1');
    }

    let registro_ui_grid_api = {};

    let angularInterval = null;           // para detener el interval que usamos más abajo

    $scope.registro_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableFiltering: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

        registro_ui_grid_api = gridApi;
            // -----------------------------------------------------------------------------------------------------
            // cuando el ui-grid está en un bootstrap tab y tiene más columnas de las que se pueden ver,
            // al hacer horizontal scrolling los encabezados no se muestran sincronizados con las columnas;
            // lo que sigue es un 'workaround'
            // -----------------------------------------------------------------------------------------------------
            angularInterval = $interval(function() {
                registro_ui_grid_api.core.handleWindowResize();
            }, 200)

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) { 
                    if (!rowEntity.docState) { 
                        rowEntity.docState = 2;
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

    // para detener el angular $Interval que usamos en el ui-gris arriba, cuando el $scope es destruido ...
    $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        $interval.cancel(angularInterval);
    })

    $scope.registro_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
            '<span  ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableColumnMenu: false,
            enableSorting: false,
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '120',
            enableFiltering: false,
            enableCellEdit: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: '80',
            enableFiltering: true,
            enableCellEdit: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'simbolo',
            editDropdownOptionsArray: $scope.monedas,
            cellFilter: 'mapDropdown:row.grid.appScope.monedas:"_id":"simbolo"',

            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,
            enableFiltering: true,
            enableCellEdit: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'abreviatura',
            editDropdownOptionsArray: $scope.companias,
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"abreviatura"',

            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'cedente',
            field: 'cedente',
            displayName: 'Cedente',
            width: 100,
            enableFiltering: true,
            enableCellEdit: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: '_id',
            editDropdownValueLabel: 'abreviatura',
            editDropdownOptionsArray: $scope.companias,
            cellFilter: 'mapDropdown:row.grid.appScope.companias:"_id":"abreviatura"',

            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: 60,
            enableFiltering: true,
            enableCellEdit: false, 
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposArray,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposArray:"tipo":"descripcion"',

            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'origen',
            field: 'origen',
            displayName: 'Origen',
            width: '80',
            enableFiltering: true,
            enableCellEdit: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'cobroPagoFlag',
            field: 'cobroPagoFlag',
            displayName: 'Cob/Pag',
            width: '80',
            enableCellEdit: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter', 
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'boolean'
        },
        {
            name: 'referencia',
            field: 'referencia',
            displayName: 'Referencia',
            width: 200,
            enableFiltering: true,
            enableCellEdit: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'tipoNegocio',
            field: 'tipoNegocio',
            displayName: 'Negocio',
            width: 80,
            enableFiltering: true,
            enableCellEdit: true, 
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposNegocio,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposNegocio:"tipo":"descripcion"',

            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'categoria',              
            field: 'categoria',
            displayName: 'Cat',
            width: 60,
            enableFiltering: true,
            enableCellEdit: true, 
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'value',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.categorias_list,
            cellFilter: 'mapDropdown:row.grid.appScope.categorias_list:"value":"descripcion"',

            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'serie',
            field: 'serie',
            displayName: 'Serie',
            width: 60,
            enableFiltering: true,
            enableCellEdit: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripcion',
            width: 220,
            enableFiltering: true,
            enableCellEdit: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            cellFilter: 'currencyFilter',
            width: 100,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: false,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ]

    $scope.deleteItem = function (item) {

        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.registro, (x) => { return x._id === item._id; });
        }
        else {
            item.docState = 3;
        }
    }

    $scope.nuevo = function () {
        $scope.registro.push({
            _id: new Mongo.ObjectID()._str,
            fecha: new Date(), 
            tipo: "M",
            cobroPagoFlag: false, 
            monto: 0,  
            usuario: Meteor.user().emails[0].address,
            ingreso: new Date(),
            ultAct: new Date(),
            cia: $scope.companiaSeleccionada._id,
            docState: 1
        });
    }

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    let filtroConstruido = { }; 
    let filtroConstruidoMasPeriodo = { };       // con el período incluido, ya para usar en minimongo (client) 

    $scope.aplicarFiltro = function () {
        $scope.showProgress = true;

        $scope.filtro.cia = $scope.companiaSeleccionada._id; 

        // ------------------------------------------------------------------------------------------------------
        // guardamos el filtro indicado por el usuario
        if (Filtros.findOne({ nombre: 'cierres.registro', userId: Meteor.userId() })) { 
            // el filtro existía antes; lo actualizamos
            // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
            Filtros.update(Filtros.findOne({ nombre: 'cierres.registro', userId: Meteor.userId() })._id,
            { $set: { filtro: $scope.filtro } },
            { validate: false });
        }
        else { 
            Filtros.insert({
                _id: new Mongo.ObjectID()._str,
                userId: Meteor.userId(),
                nombre: 'cierres.registro',
                filtro: $scope.filtro
            });
        }

        filtroConstruido = construirFiltro($scope.filtro); 
        filtroConstruidoMasPeriodo = agregarPeriodoAlFiltro(filtroConstruido); 

        // ------------------------------------------------------------------------------------------------------
        // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
        leerPrimerosRegistrosDesdeServidor(50, filtroConstruido);

        $scope.currentTab = 1;               // para establecer / cambiar el 'active' tab 
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'cierres.registro', userId: Meteor.userId() });

    if (filtroAnterior) { 
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }
    // ------------------------------------------------------------------------------------------------------

    $scope.registro_ui_grid.data = [];

    let recordCount = 0;
    let limit = 0;

    function leerPrimerosRegistrosDesdeServidor(cantidadRecs, filtroConstruido) {
        // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
        limit = cantidadRecs;
        Meteor.call('getCollectionCount', 'CierreRegistro', filtroConstruido, (err, result) => {

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

            // el método regresa la cantidad de items en el collection (siempre para el usuario)
            recordCount = result;
            $scope.leerRegistrosDesdeServer(limit, filtroConstruido);
        })
    }

    let subscriptionHandle = {};
    $scope.leerRegistrosDesdeServer = function (limit, filtroConstruido) {
        // la idea es 'paginar' los registros que se suscriben, de 50 en 50
        // el usuario puede indicar 'mas', para leer 50 más; o todos, para leer todos los registros ...
        $scope.showProgress = true;

        // lamentablemente, tenemos que hacer un stop al subscription cada vez que hacemos una nueva,
        // pues el handle para cada una es diferente; si no vamos deteniendo cada una, las anteriores
        // permanecen pues solo detenemos la última al destruir el stop (cuando el usaurio sale de
        // la página). Los documents de subscriptions anteriores permanecen en minimongo y el reactivity
        // de los subscriptions también ...
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }

        $scope.registro_ui_grid.data = [];
        $scope.registro = [];

        subscriptionHandle =
        Meteor.subscribe('cierre.leerRegistro', filtroConstruido, limit, () => {

            $scope.helpers({
                registro: () => {
                    return CierreRegistro.find(filtroConstruidoMasPeriodo, { sort: { fecha: 1, moneda: 1, compania: 1, }});
                }
            });

            $scope.registro_ui_grid.data = $scope.registro;

            let message = `${numeral($scope.registro.length).format('0,0')} registros
            (<b>de ${numeral(recordCount).format('0,0')}</b>) han sido seleccionados ...`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: message, 
            });

            $scope.showProgress = false;
            $scope.$apply();
        });
    }

    $scope.leerMasRegistros = function () {
        limit += 50;    // la próxima vez, se leerán 50 más ...
        $scope.leerRegistrosDesdeServer(limit, filtroConstruido);     // cada vez se leen 50 más ...
    }

    $scope.leerTodosLosRegistros = function () {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeServer(limit, filtroConstruido);     // cada vez se leen 50 más ...
    }

    // -------------------------------------------------------------------------
    // Grabar las modificaciones hechas al registro
    // -------------------------------------------------------------------------
    $scope.grabar = function () {

        const hayEdiciones = lodash.some($scope.registro, (x) => { 
            return x.docState; 
        }); 

        if (!hayEdiciones) {
            const message = `Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.`; 
            
            DialogModal($uibModal, "<em>Cierre - Registro</em>", message, false).then();
            return;
        }

        const hayEdicionesRegTipoAuto = $scope.registro.find(x => x.docState && x.tipo === "A"); 

        if (hayEdicionesRegTipoAuto) {
            const message = `Aparentemente, Ud. ha editado o eliminado registros de tipo <em>Auto</em>.<br /> 
                             Los registros de tipo <em>Auto</em> debe ser <b>solo</b> afectados por el proceso de cierre; 
                             nunca deben ser editados en forma directa por el usuario. 
                            `; 
            
            DialogModal($uibModal, "<em>Cierre - Registro</em>", message, false).then();
            return;
        }

        grabar2();
    }

    function grabar2() {
        $scope.showProgress = true;

        // solo los items que el usuario ha editado 
        const editedItems = $scope.registro.filter(x =>  x.docState);

        // nótese como validamos cada item antes de intentar guardar en el servidor
        let isValid = false;
        const errores = [];

        editedItems.forEach((item) => { 
            if (item.docState != 3) {
                isValid = CierreRegistro.simpleSchema().namedContext().validate(item);
    
                if (!isValid) {
                    CierreRegistro.simpleSchema().namedContext().validationErrors().forEach((error) => {
                        if (error.type === "custom") { 
                            // cuando pasamos errores del tipo custom es porque el error no corresponde a un field en particular, sino a 
                            // todo el registro. En un caso tal, mostramos solo el nombre (name), pues allí ponemos la descripción del error 
                            errores.push(`${error.name}`);
                        } else { 
                            errores.push(`El valor '${error.value}' no es adecuado para el campo '${CierreRegistro.simpleSchema().label(error.name)}'; error de tipo '${error.type}'.`);
                        }
                    });
                }
            }
        })

        if (errores && errores.length) {

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar grabar las modificaciones efectuadas en la base de datos:<br /><br />" +
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

        Meteor.call('cierreRegistro.save', editedItems, (err, result) => {

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

            if (result.error) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message
                });
                $scope.showProgress = false;
                $scope.$apply();

                return; 
            } 

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message
            });

            // refrescamos el helper 
            $scope.helpers({
                registro: () => {
                    return CierreRegistro.find(filtroConstruidoMasPeriodo, { sort: { fecha: 1, moneda: 1, compania: 1, }});
                }
            });

            $scope.registro_ui_grid.data = $scope.registro;

            $scope.showProgress = false;
            $scope.$apply();
        })
    }

     // ------------------------------------------------------------------------------------------------------
     // para recibir los eventos desde la tarea en el servidor ...
     EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'leerBancosProveedoresDesdeSqlServer' });
     EventDDP.addListener('bancos_proveedores_reportProgressDesdeSqlServer', function(process) {

         $scope.processProgress.current = process.current;
         $scope.processProgress.max = process.max;
         $scope.processProgress.progress = process.progress;
         // if we don't call this method, angular wont refresh the view each time the progress changes ...
         // until, of course, the above process ends ...
         $scope.$apply();
     });
     // ------------------------------------------------------------------------------------------------------

     // para leer el último cierre efectuado 
     $scope.showProgress = true;
     const ultimoCierre_subscriptionHandle = Meteor.subscribe('utimoPeriodoCerrado', $scope.companiaSeleccionada._id , () => { 
        $scope.showProgress = false;
    })

    // ------------------------------------------------------------------------------------------------
     // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
     // para limpiar los items en minimongo ...
     $scope.$on('$destroy', function() {
         if (subscriptionHandle && subscriptionHandle.stop) {
             subscriptionHandle.stop();
         }

         ultimoCierre_subscriptionHandle.stop(); 
     })
}
])

// construimos el filtro en el cliente, pues lo usamos en varias partes en este código y debe estar disponible. 
// nota: en otras funciones similares, se filtran los registros en el servidor y se graban a un collection 'temporal' 
// para el usuario. En estos casos, posteriormente no se usa más el filtro, pues solo basta con leer los records para 
// el usuario. No es así en este caso, que se leen y regresan los records desde el collection original, sin que medie 
// ningún collection 'temporal' ... 
function construirFiltro(criterioSeleccion) { 

    // construimos el filtro en base a todos los criterios indicados; menos el período, pues lo pasamos al method en el server 
    // para construirlo allí ... 
    const filtro = {
        fecha1: criterioSeleccion.fecha1, 
        fecha2: criterioSeleccion.fecha2
    }

    if (criterioSeleccion.tipo) { 
        filtro.tipo = criterioSeleccion.tipo; 
    }

    if (criterioSeleccion.cobroPagoFlag) { 
        switch (criterioSeleccion.cobroPagoFlag) { 
            case "cobros/pagos": { 
                filtro.cobroPagoFlag = { $eq: true };
                break; 
            }
            case "montos": { 
                filtro.cobroPagoFlag = { $eq: false };
                break; 
            }
        }
    }

    if (criterioSeleccion.tipoNegocio && Array.isArray(criterioSeleccion.tipoNegocio) && criterioSeleccion.tipoNegocio.length) {
        const array = lodash.clone(criterioSeleccion.tipoNegocio);
        filtro.tipoNegocio = { $in: array };
    }

    if (criterioSeleccion.compania && Array.isArray(criterioSeleccion.compania) && criterioSeleccion.compania.length) {
        const array = lodash.clone(criterioSeleccion.compania);
        filtro.compania = { $in: array };
    }

    if (criterioSeleccion.cedente && Array.isArray(criterioSeleccion.cedente) && criterioSeleccion.cedente.length) {
        const array = lodash.clone(criterioSeleccion.cedente);
        filtro.cedente = { $in: array };
    }

    if (criterioSeleccion.moneda && Array.isArray(criterioSeleccion.moneda) && criterioSeleccion.moneda.length) {
        const array = lodash.clone(criterioSeleccion.moneda);
        filtro.moneda = { $in: array };
    }

    if (criterioSeleccion.referencia) { 
        const search = new RegExp(criterioSeleccion.referencia, 'i');
        filtro.referencia = search;
    }

    filtro.cia = criterioSeleccion.cia; 

    return filtro; 
}

function agregarPeriodoAlFiltro(filtro) { 
    let { fecha1, fecha2 } = filtro; 

    fecha1 = moment(fecha1).isValid() ? moment(fecha1).toDate() : null; 
    fecha2 = moment(fecha2).isValid() ? moment(fecha2).toDate() : null; 

    // la fecha final del período debe ser el último momento del día, para que incluya cualquier fecha de ese día 
    fecha2 = fecha2 ? new Date(fecha2.getFullYear(), fecha2.getMonth(), fecha2.getDate(), 23, 59, 59) : null; 

    const fecha = {}; 

    if (fecha1) { 
        if (fecha2) {
            // las fechas vienen como strings ... 
            fecha.$gte = fecha1;
            fecha.$lte = fecha2;
        }
        else { 
            fecha.$eq = fecha1;
        }
    }

    const filtro2 = { ...filtro, fecha }; 

    delete filtro2.fecha1; 
    delete filtro2.fecha2; 

    return filtro2; 
}