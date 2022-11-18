
import angular from 'angular';
import { Mongo } from 'meteor/mongo';

import lodash from 'lodash';
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebm.contratos.contrato").controller('CopiarReaseguradoresEntreCapasController',
['$scope', '$uibModalInstance', '$uibModal', 'contrato', function ($scope, $uibModalInstance, $uibModal, contrato) {

    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.contrato = contrato;

    var capasSource = [];
    var capasTarget = [];

    $scope.contrato.capas.forEach(function (capa) {
        capasSource.push(capa);
        capasTarget.push(capa);
    });

    // ----------------------------------------------------
    // ng-grid: configuramos el 1er. grid ...
    // ----------------------------------------------------
    $scope.capaSourceSeleccionada = {};

    $scope.capasSource_ui_grid_Options = {
        enableSorting: false,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 30,
        enableSelectionBatchEvent: false,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                $scope.capaSourceSeleccionada = {};

                if (row.isSelected)
                    $scope.capaSourceSeleccionada = row.entity;

            });
        },
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    };

    $scope.capasSource_ui_grid_Options.columnDefs = [
          {
              name: 'numero',
              field: 'numero',
              displayName: '#',
              width: 40,
              enableColumnMenu: false,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              type: 'number'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 120,
              enableSorting: false,
              enableColumnMenu: false,
              type: 'string'
          }
    ];


    // ----------------------------------------------------
    // ng-grid: configuramos el 2do. grid ...
    // ----------------------------------------------------
    $scope.capasTargetSeleccionadas = [];

    $scope.capasTarget_ui_grid_Options = {
        enableSorting: false,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: true,
        enableSelectAll: false,
        enableSelectionBatchEvent: false,
        selectionRowHeaderWidth: 30,
        rowHeight: 25,
        onRegisterApi: function (gridApi) {
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                if (row.isSelected) {
                    // el item no existe; el usuario seleccionó; agregamos el item al array
                    if (!lodash.find($scope.capasTargetSeleccionadas, function (capa) { return capa === row.entity; }))
                        $scope.capasTargetSeleccionadas.push(row.entity)
                }
                else
                    // el item existe; el usuario 'deseleccionó'; lo eliminamos del array
                    lodash.remove($scope.capasTargetSeleccionadas, function (capa) { return capa === row.entity; });
            });
        },
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    };

    $scope.capasTarget_ui_grid_Options.columnDefs = [
          {
              name: 'numero',
              field: 'numero',
              displayName: '#',
              width: 40,
              enableColumnMenu: false,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              type: 'number'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 120,
              enableSorting: false,
              enableColumnMenu: false,
              type: 'string'
          }
    ];


    $scope.capasSource_ui_grid_Options.data = capasSource;
    $scope.capasTarget_ui_grid_Options.data = capasTarget;


    $scope.ok = function () {

        if (!lodash.isObject($scope.capaSourceSeleccionada) ||
            lodash.isEmpty($scope.capaSourceSeleccionada) ||
            !lodash.isArray($scope.capasTargetSeleccionadas) ||
            $scope.capasTargetSeleccionadas.length == 0) {
            // el usuario debe seleccionar al menos una capa en cada lista

            const message = `Seleccione <b>al menos una capa</b> en cada lista.
                        `
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });

            return;
        }


        // la capa seleccionada en la 1ra lista no debe ser seleccionada en la segunda lista

        if (lodash.find($scope.capasTargetSeleccionadas, function (r) { return r == $scope.capaSourceSeleccionada; })) {

            const message = `La capa seleccionada en la 1ra. lista <b>no debe ser seleccionada</b> en la 2da. lista.
                        `
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });

            return;
        }


        // la capa seleccionada debe tener reaseguradores

        if (!lodash.isArray($scope.capaSourceSeleccionada.reaseguradores) || $scope.capaSourceSeleccionada.reaseguradores.length == 0) {

            const message = `La capa seleccionada en la 1ra. lista <b>debe tener</b> reaseguradores registrados.
                          `
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });

            return;
        }

        var capasTargetTienenReaseguradores = false;

        $scope.capasTargetSeleccionadas.forEach(function (capa) {
            if (lodash.isArray(capa.reaseguradores) && capa.reaseguradores.length > 0) {
                capasTargetTienenReaseguradores = true;
            }
        })

        if (capasTargetTienenReaseguradores) {
            // nótese que pasamos true al último parameter, pues queremos mostrar los botones Ok/Cancel; solo continuamos si el
            // usuario hace click en Ok ...
            DialogModal($uibModal,
                `Copiar reaseguradores entre capas`,
                `Al menos una de las capas seleccionadas en la <b>2da. lista</b>
                <em>tiene ahora</em> reaseguradores registrados.<br /><br />
                Si Ud. continúa con este proceso, los reaseguradores en las capas de la
                <b>2da. lista</b> serán eliminados y
                sustituídos por los reaseguradores de la capa seleccionada en la <b>1ra. lista</b>.<br /><br />
                Ud. puede continuar (<em>Ok</em>) o cancelar (<em>Cancelar</em>) esta operación.`,
                true).then(
                function () {
                    const message = copiarReaseguradoresEntreCapas($uibModal, $scope.capaSourceSeleccionada, $scope.capasTargetSeleccionadas);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: message
                    })

                    if (!$scope.contrato.docState) { 
                        $scope.contrato.docState = 2;
                    }   
                },
                function () {
                    return;
                })
            return;
        }
        else {
            const message = copiarReaseguradoresEntreCapas($uibModal, $scope.capaSourceSeleccionada, $scope.capasTargetSeleccionadas);

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: message
            })

            if (!$scope.contrato.docState) { 
                $scope.contrato.docState = 2;
            }    
        }
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    }

    const message = `Este proceso le permite copiar los reaseguradores registrados para una capa del contrato, a otras capas.
                   <b>Nota importante:</b> si Ud. indica que quiere copiar a una capa que <b>ya tiene</b> resaeguradores registrados, 
                   éstos serán eliminados y sustituídos por los de la capa original.
    `

    $scope.alerts.length = 0;
    $scope.alerts.push({
        type: 'info',
        msg: message
    })
}])

function copiarReaseguradoresEntreCapas($uibModal, capaSource, capasTarget) {
    // finalmente, copiamos los reaseguradores desde source a target y notificamos al usuario ...
    // primero eliminamos los probables reaseguradores en las capas 'target'
    capasTarget.forEach(function (capa) {
        if (capa.reaseguradores)
            capa.reaseguradores.length = 0;
    })

    var newReasegurador = {};

    capaSource.reaseguradores.forEach(function (reasegurador) {
        capasTarget.forEach(function (capaTarget) {
            if (!capaTarget.reaseguradores)
                capaTarget.reaseguradores = [];

            newReasegurador = {};

            newReasegurador = {
                _id: new Mongo.ObjectID()._str,
                compania: reasegurador.compania,
                ordenPorc: reasegurador.ordenPorc,
                imp1Porc: reasegurador.imp1Porc,
                imp2Porc: reasegurador.imp2Porc,
                impSPNPorc: reasegurador.impSPNPorc,
                corretajePorc: reasegurador.corretajePorc
            };

            capaTarget.reaseguradores.push(newReasegurador);
        })
    })

    var numerosCapasTarget = capasTarget.reduce(function (capaAnterior, capaActual) {
        return capaAnterior ? capaAnterior + ", " + capaActual.numero.toString() : capaActual.numero.toString();
    }, "")

    if (capasTarget.length > 1) {
        const message = `Ok, los reaseguradores fueron copiados desde la capa <b>${capaSource.numero.toString()}</b> a las capas <b>${numerosCapasTarget}</b>.`; 
        return message;
    }
    else {
        const message = `Ok, los reaseguradores fueron copiados desde la capa <b>${capaSource.numero.toString()}</b> a la capa <b>${numerosCapasTarget.toString()}</b>.`; 
        return message;
    }
}