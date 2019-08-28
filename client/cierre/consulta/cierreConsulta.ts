

import * as angular from 'angular'; 

import * as numeral from 'numeral';
import * as moment from 'moment';
import * as lodash from 'lodash';
import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Temp_consulta_cierreRegistro } from 'imports/collections/consultas/temp_consulta_cierreRegistro'; 
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Filtros } from 'imports/collections/otros/filtros'; 

angular.module("scrwebm").controller("Cierre.Consulta.Controller", ['$scope', '$modal', '$interval', function ($scope, $modal, $interval) {

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

    // true si el usuario decide obtener cuentas corrientes 
    $scope.cuentasCorrientes_contratosProporcionales_flag = false; 

    $scope.setIsEdited = function (fieldName) {
        
        // si el usuario selecciona la opción cuentasCorrientes, seleccionamos solo ese tipo en la lista de tipos de negocio 
        // y bloquemos la lista .. 
        if (fieldName === 'cuentasCorrientes') {
            // asignamos el banco, cada vez que el usuario cambia la cuenta bancaria
            if ($scope.filtro.cuentasCorrientes) {
                $scope.filtro.tipoNegocio = [ 'Prop' ]; 
                // al poner este valor en true, desabilitamos el select que permite al usuario seleccionar el tipo de negocio 
                $scope.cuentasCorrientes_contratosProporcionales_flag = true; 
            } else { 
                $scope.cuentasCorrientes_contratosProporcionales_flag = false; 
                $scope.filtro.cuentasCorrientes_separarCorretaje = false; 
            }
        }
    }

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'cierre_consulta' });
    EventDDP.addListener('cierre_consulta_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // -------------------------------------------------------------------------------------------------------

    $scope.$parent.tituloState = "Cierre - Consulta del registro - Reporte"; 

    $scope.tiposNegocio = [
        { tipo: "Prop", descripcion: "Prop" },
        { tipo: "NoProp", descripcion: "NoProp" },
        { tipo: "Fac", descripcion: "Fac" },
        { tipo: "Otro", descripcion: "Otro" },
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
    $scope.activeTab = { tab1: true, tab2: false, };

    let consulta_ui_grid_api = {} as any;
    let itemSeleccionado = {};

    let angularInterval = null;           // para detener el interval que usamos más abajo

    $scope.consulta_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableFiltering: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            consulta_ui_grid_api = gridApi;

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
                consulta_ui_grid_api.core.handleWindowResize();
            }, 200)
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

    $scope.consulta_ui_grid.columnDefs = [
        {
            name: 'moneda.simbolo',
            field: 'moneda.simbolo',
            displayName: 'Mon',
            width: '80',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'compania.abreviatura',
            field: 'compania.abreviatura',
            displayName: 'Compañía',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'cedente.abreviatura',
            field: 'cedente.abreviatura',
            displayName: 'Cedente',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'orden',
            field: 'orden',
            displayName: 'Orden',
            width: '50',
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '80',
            enableFiltering: false,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'date'
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
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'categoria',
            field: 'categoria',
            displayName: 'Cat',
            width: 80,
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
            type: 'number'
        },
    ]


    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    $scope.myForm = {}; 

    let filtroConstruido = { }; 
    $scope.submitted = false;

    $scope.submit_cierreConsulta_Form = function () {

        $scope.submitted = true;

        $scope.filtro.cia = $scope.companiaSeleccionada._id; 

        if ($scope.filtro.cuentasCorrientes === undefined) { 
            $scope.filtro.cuentasCorrientes = false; 
        }

        if ($scope.filtro.cuentasCorrientes_separarCorretaje === undefined) { 
            $scope.filtro.cuentasCorrientes_separarCorretaje = false; 
        }

        if ($scope.myForm.cierreConsulta_Form.$valid) {
            $scope.submitted = false;
            $scope.myForm.cierreConsulta_Form.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            submit_cierreConsulta_Form2(); 
        }
    }

    function submit_cierreConsulta_Form2() { 

        $scope.showProgress = true;

        // ------------------------------------------------------------------------------------------------------
        // guardamos el filtro indicado por el usuario
        if (Filtros.findOne({ nombre: 'cierres.consulta', userId: Meteor.userId() })) { 
            // el filtro existía antes; lo actualizamos
            // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
            Filtros.update(Filtros.findOne({ nombre: 'cierres.consulta', userId: Meteor.userId() })._id,
            { $set: { filtro: $scope.filtro } },
            { validate: false });
        }
        else { 
            Filtros.insert({
                _id: new Mongo.ObjectID()._str,
                userId: Meteor.userId(),
                nombre: 'cierres.consulta',
                filtro: $scope.filtro
            });
        }

        filtroConstruido = construirFiltro($scope.filtro); 

        // para medir y mostrar el progreso de la tarea ...
        $scope.processProgress.current = 0;
        $scope.processProgress.max = 0;
        $scope.processProgress.progress = 0;
        $scope.processProgress.message = "";

        // ejecutamos un método que lee el registro, para el filtro indicado, y graba en la tabla 'temp' para el current user ... 
        Meteor.call('cierre.consulta.leerRegistro', filtroConstruido, 
                                                    $scope.filtro.fecha1, 
                                                    $scope.filtro.fecha2, 
                                                    $scope.companiaSeleccionada._id, 
                                                    $scope.filtro.cuentasCorrientes, 
                                                    $scope.filtro.cuentasCorrientes_separarCorretaje, 
                                                    (err, result) => {

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

            // ------------------------------------------------------------------------------------------------------
            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            leerPrimerosRegistrosDesdeServidor(50, filtroConstruido);
        
            // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
            $scope.activeTab = { tab1: false, tab2: true };
        })
    }


    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'cierres.consulta', userId: Meteor.userId() });

    if (filtroAnterior) { 
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }

    // ejecutamos la función al entrar; la idea es desabilitar el Select si ya viene marcado, por una ejecución anterior
    $scope.setIsEdited("cuentasCorrientes");''
    // ------------------------------------------------------------------------------------------------------

    $scope.consulta_ui_grid.data = [];

    let recordCount = 0;
    let limit = 0;

    function leerPrimerosRegistrosDesdeServidor(cantidadRecs, filtroConstruido) {
        // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
        limit = cantidadRecs;
        Meteor.call('getCollectionCount', 'Temp_consulta_cierreRegistro', (err, result) => {

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
            $scope.leerRegistrosDesdeServer(limit);
        })
    }


    let subscriptionHandle = {} as any;
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

        $scope.consulta_ui_grid.data = [];
        $scope.temp_consulta_cierreRegistro = [];

        subscriptionHandle =
        Meteor.subscribe('cierre.consulta.leer_Temp_consulta_cierreRegistro', limit, () => {

            $scope.helpers({
                temp_consulta_cierreRegistro: () => {
                    return Temp_consulta_cierreRegistro.find({ user: Meteor.userId }, 
                                                             { sort: 
                                                                { 
                                                                    'moneda.simbolo': 1, 
                                                                    'compania.abreviatura': 1, 
                                                                    referencia: 1, 
                                                                    orden: 1, fecha: 1,  
                                                                    serie: 1, 
                                                                }});
                }
            });

            $scope.consulta_ui_grid.data = $scope.temp_consulta_cierreRegistro;

            let message = `${numeral($scope.temp_consulta_cierreRegistro.length).format('0,0')} registros
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
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }

    $scope.leerTodosLosRegistros = function () {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }

     // ------------------------------------------------------------------------------------------------------
     // para recibir los eventos desde la tarea en el servidor ...
     EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'cierre_consulta' });
     EventDDP.addListener('cierre_consulta_reportProgress', function(process) {

         $scope.processProgress.current = process.current;
         $scope.processProgress.max = process.max;
         $scope.processProgress.progress = process.progress;
         // if we don't call this method, angular wont refresh the view each time the progress changes ...
         // until, of course, the above process ends ...
         $scope.$apply();
     });
     // ------------------------------------------------------------------------------------------------------

     $scope.reporteOpcionesModal = function() { 

        var modalInstance = $modal.open({
            templateUrl: 'client/cierre/consulta/opcionesReportModal.html',
            controller: 'Cierre_opcionesReportController',
            size: 'md',
            resolve: {
                companiaSeleccionada: function () {
                    return $scope.companiaSeleccionada;
                },
                fechaInicialPeriodo: () => { 
                    return $scope.filtro.fecha1; 
                }, 
                fechaFinalPeriodo: () => { 
                    return $scope.filtro.fecha2; 
                }, 
                cuentasCorrientes: () => { 
                    return $scope.filtro.cuentasCorrientes; 
                }, 
            }
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
     }

     // ------------------------------------------------------------------------------------------------
     // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
     // para limpiar los items en minimongo ...
     $scope.$on('$destroy', function() {
         if (subscriptionHandle && subscriptionHandle.stop) {
             subscriptionHandle.stop();
         };
     })
}
])

// construimos el filtro en el cliente, pues lo usamos en varias partes en este código y debe estar disponible. 
// nota: en otras funciones similares, se filtran los registros en el servidor y se graban a un collection 'temporal' 
// para el usuario. En estos casos, posteriormente no se usa más el filtro, pues solo basta con leer los records para 
// el usuario. No es así en este caso, que se leen y regresan los records desde el collection original, sin que medie 
// ningún collection 'temporal' ... 
function construirFiltro(criterioSeleccion) { 

    let filtro = {} as any; 

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

    if (criterioSeleccion.tipoNegocio && Array.isArray(criterioSeleccion.tipoNegocio) && criterioSeleccion.tipoNegocio.length) {
        var array = lodash.clone(criterioSeleccion.tipoNegocio);
        filtro.tipoNegocio = { $in: array };
    }

    filtro.cia = criterioSeleccion.cia; 

    return filtro; 
}

