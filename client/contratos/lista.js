
import { Meteor } from 'meteor/meteor'; 
import angular from 'angular';
import numeral from 'numeral';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Temp_Consulta_Contratos } from '/imports/collections/consultas/tempConsultaContratos'; 

export default angular.module("scrwebm.contratos.list", [])
       .controller("ContratosListaController", ['$scope', '$state', '$stateParams',

function ($scope, $state, $stateParams) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;
    let limit = parseInt($stateParams.limit);

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (companiaSeleccionada)
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc)
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    else
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    // ------------------------------------------------------------------------------------------------

    $scope.nuevo = function () {
        $state.go('contrato.generales', {
            origen: $scope.origen,
            id: "0",
            limit: limit,
            vieneDeAfuera: false
        });
    };

    $scope.regresar = function () {
        $state.go('contratosFiltro', { origen: $scope.origen });
    };

    let itemSeleccionadoEnLaLista = {};

    $scope.list_ui_grid = {

        enableSorting: true,
        showGridFooter: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableFiltering: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionadoEnLaLista = {};

                if (row.isSelected) {
                    itemSeleccionadoEnLaLista = row.entity;

                    $state.go('contrato', {
                        origen: $scope.origen,
                        id: itemSeleccionadoEnLaLista.id,
                        limit: limit,
                        vieneDeAfuera: false
                    });

                    $scope.showProgress = false;
                }
                else
                    return;
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

    $scope.list_ui_grid.columnDefs = [
        {
            name: 'numero',
            field: 'numero',
            displayName: 'Número',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
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
            name: 'hasta',
            field: 'hasta',
            displayName: 'Hasta',
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
            name: 'codigo',
            field: 'codigo',
            displayName: 'Código',
            width: 220,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'referencia',
            field: 'referencia',
            displayName: 'Referencia',
            width: 150,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'compania',
            field: 'compania',
            displayName: 'Compañía',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'suscriptor',
            field: 'suscriptor',
            displayName: 'Suscriptor',
            width: 70,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },

        {
            name: 'ramo',
            field: 'ramo',
            displayName: 'Ramo',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripcion',
            width: 100,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
    ];

    $scope.contratos = []
    $scope.list_ui_grid.data = [];
    $scope.showProgress = true;
    let subscriptionHandle = null;

    $scope.leerRegistrosDesdeMongo = (limit) => {
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

        subscriptionHandle =
            Meteor.subscribe('temp.consulta.contratos.list', limit, () => {

                $scope.contratos = Temp_Consulta_Contratos.find({ user: Meteor.userId() },
                    {
                        sort: {
                            numero: 1,
                        }
                    }).fetch();

                $scope.list_ui_grid.data = $scope.contratos;

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `${numeral($scope.contratos.length).format('0,0')} registros
                        (de ${numeral(recordCount).format('0,0')}) han sido seleccionados ...`
                });

                $scope.showProgress = false;
                $scope.$apply();
            });
    };

    // al abrir la página, mostramos los primeros 50 items
    // inicialmente, el limit siempre viene en 50; cuando seleccionamos un item de la lista, mantenemos
    // el limit ...
    let recordCount = 0;

    Meteor.call('getCollectionCount', 'Temp_Consulta_Contratos', (err, result) => {

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
        $scope.leerRegistrosDesdeMongo(limit);
    });

    $scope.leerMasRegistros = () => {
        limit += 50;    // la próxima vez, se leerán 50 más ...
        $scope.leerRegistrosDesdeMongo(limit);     // cada vez se leen 50 más ...
    };

    $scope.leerTodosLosRegistros = () => {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeMongo(limit);     // cada vez se leen 50 más ...
    };

    // ------------------------------------------------------------------------------------------------
    // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
    // para limpiar los items en minimongo ...

    $scope.$on('$destroy', function() {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }
    });
}])