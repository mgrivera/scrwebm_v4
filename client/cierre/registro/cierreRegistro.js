

import numeral from 'numeral';
import moment from 'moment';
import lodash from 'lodash';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { CierreRegistro } from '/imports/collections/cierre/registroCierre'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller("Cierre.Registro.Controller",
['$stateParams', '$scope', '$meteor', '$modal', '$interval', function ($stateParams, $scope, $meteor, $modal, $interval) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

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
    });
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


    // este es el tab 'activo' en angular bootstrap ui ...
    // NOTA IMPORTANTE: esta propiedad cambio a partir de 1.2.1 en angular-ui-bootstrap. Sin embargo, parece que
    // atmosphere no tiene esta nueva versión (se quedó en 0.13.0) y no pudimos instalarla desde NPM. La verdad,
    // cuando podamos actualizar angular-ui-bootstrap a una nueve vesión, la propiedad 'active' va en el tabSet
    // y se actualiza con el index de la página (0, 1, 2, ...). Así resulta mucho más intuitivo y fácil
    // establecer el tab 'activo' en ui-bootstrap ...
    $scope.activeTab = { tab1: true, tab2: false, tab3: false, };

    let registro_ui_grid_api = null;
    let itemSeleccionado = {};

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
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado = {};
                if (row.isSelected) {
                    itemSeleccionado = row.entity;
                }
            }), 
            
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
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableColumnMenu: false,
            enableSorting: false,
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '80',
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
            width: 100,
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

        // ------------------------------------------------------------------------------------------------------
        // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
        leerPrimerosRegistrosDesdeServidor(50, filtroConstruido);

        // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
        $scope.activeTab = { tab1: false, tab2: true };
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
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();
                return;
            };

            // el método regresa la cantidad de items en el collection (siempre para el usuario)
            recordCount = result;
            $scope.leerRegistrosDesdeServer(limit, filtroConstruido);
        })
    }


    let subscriptionHandle = null;
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
                    return CierreRegistro.find(filtroConstruido, { sort: { fecha: 1, moneda: 1, compania: 1, }});
                }
            });

            $scope.registro_ui_grid.data = $scope.registro;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `${numeral($scope.registro.length).format('0,0')} registros
                    (<b>de ${numeral(recordCount).format('0,0')}</b>) han sido seleccionados ...`
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

        let hayEdiciones = lodash.some($scope.registro, (x) => { 
            return x.docState; 
        }); 

        if (!hayEdiciones) {
            DialogModal($modal, "<em>Cierre - Registro</em>",
                                `Aparentemente, <em>no se han efectuado cambios</em> en el registro.
                                No hay nada que grabar.`,
                                false).then();
            return;
        };

        grabar2();
    }


    function grabar2() {
        $scope.showProgress = true;

        // obtenemos un clone de los datos a guardar ...
        let editedItems = lodash.filter($scope.registro, (x) => { return x.docState; });

        // nótese como validamos cada item antes de intentar guardar en el servidor
        let isValid = false;
        let errores = [];

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

        $scope.registro_ui_grid.data = [];
        $scope.registro = [];

        Meteor.call('cierreRegistro.save', editedItems, (err, result) => {

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
                    return CierreRegistro.find(filtroConstruido, { sort: { fecha: 1, moneda: 1, compania: 1, }});
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

     // ------------------------------------------------------------------------------------------------
     // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
     // para limpiar los items en minimongo ...
     $scope.$on('$destroy', function() {
         if (subscriptionHandle && subscriptionHandle.stop) {
             subscriptionHandle.stop();
         };
     })

     // para leer el último cierre efectuado 
     $scope.showProgress = true;
     Meteor.subscribe('cierre', () => { 
        $scope.showProgress = false;
    })
}
])

// construimos el filtro en el cliente, pues lo usamos en varias partes en este código y debe estar disponible. 
// nota: en otras funciones similares, se filtran los registros en el servidor y se graban a un collection 'temporal' 
// para el usuario. En estos casos, posteriormente no se usa más el filtro, pues solo basta con leer los records para 
// el usuario. No es así en este caso, que se leen y regresan los records desde el collection original, sin que medie 
// ningún collection 'temporal' ... 
function construirFiltro(criterioSeleccion) { 

    let filtro = { }; 

    if (criterioSeleccion.fecha1) { 
        if (criterioSeleccion.fecha2) {
            filtro.fecha = { }; 
            // las fechas vienen como strings ... 
            filtro.fecha.$gte = moment(criterioSeleccion.fecha1).toDate();
            filtro.fecha.$lte = moment(criterioSeleccion.fecha2).toDate();
        }
        else { 
            filtro.fecha = { }; 
            filtro.fecha.$eq = moment(criterioSeleccion.fecha1).toDate();
        }
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
        var array = lodash.clone(criterioSeleccion.tipoNegocio);
        filtro.tipoNegocio = { $in: array };
    }

    if (criterioSeleccion.compania && Array.isArray(criterioSeleccion.compania) && criterioSeleccion.compania.length) {
        var array = lodash.clone(criterioSeleccion.compania);
        filtro.compania = { $in: array };
    }

    if (criterioSeleccion.cedente && Array.isArray(criterioSeleccion.cedente) && criterioSeleccion.cedente.length) {
        var array = lodash.clone(criterioSeleccion.cedente);
        filtro.cedente = { $in: array };
    }

    if (criterioSeleccion.moneda && Array.isArray(criterioSeleccion.moneda) && criterioSeleccion.moneda.length) {
        var array = lodash.clone(criterioSeleccion.moneda);
        filtro.moneda = { $in: array };
    }

    filtro.cia = criterioSeleccion.cia; 

    return filtro; 
}


