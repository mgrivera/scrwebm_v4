

import * as angular from 'angular'; 
import * as lodash from 'lodash'; 

import { mensajeErrorDesdeMethod_preparar } from 'client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 
import { NotasDebitoCredito } from 'imports/collections/principales/notasDebitoCredito'; 
import { CollectionFS_templates } from 'client/imports/collectionFS/Files_CollectionFS_templates'; 

import NotasDebito_angularComponents from './notasDebito_angularComponents'; 

export default angular.module("scrwebm.riesgos.riesgo.construirNotasDebito", [ NotasDebito_angularComponents.name, ]).
                       controller('NotasDebitoController', ['$scope', function ($scope) {

    $scope.showProgress = true; 

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index: number) {
        $scope.alerts.splice(index, 1);
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (companiaSeleccionada) { 
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
        
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) { 
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }  
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }

    // el usuario debió seleccionar un movimiento 
    // NOTA: $scope.movimientoSeleccionado fue definido en $parentScope ... 
    if (lodash.isEmpty($scope.movimientoSeleccionado)) {
        let message = `No hay un movimiento seleccionado.<br /> 
                    Ud. debe seleccionar un movimiento si quiere construir sus notas de débito u obtenerlas en Word.`; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'danger',
            msg: message
        });
    }

    let movimientoSeleccionado = {} as any; 
    $scope.numeroMovimientoSeleccinado = 1; 
    
    if ($scope.movimientoSeleccionado) { 
        // NOTA: $scope.movimientoSeleccionado fue definido en $parentScope ... 
        movimientoSeleccionado = $scope.movimientoSeleccionado; 
    }

    $scope.numeroMovimientoSeleccionado = function() {
        return (movimientoSeleccionado && !lodash.isEmpty(movimientoSeleccionado)) ? movimientoSeleccionado.numero : -1;
    }

    // refrescamos la suscripción a notasDebito pues debemos saber si el riesgo tiene o no notas de débito 
    // registradas para el movimiento seleccionado 
    Meteor.subscribe('notasDebitoCredito', $scope.riesgo._id, null, () => {

        $scope.helpers({
            notasDebitoCredito: () => { 
                return NotasDebitoCredito.find();  
            }, 
        })

        if ($scope.movimientoSeleccionado && $scope.movimientoSeleccionado._id) { 
            let notasDebito = $scope.notasDebitoCredito.filter((x: any) => { 
                return x.source.entityID == $scope.riesgo._id && x.source.subEntityID == $scope.movimientoSeleccionado._id; }); 

            if (!notasDebito.length) { 
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'warning',
                    msg: `El movimiento seleccionado <b>no tiene</b> notas de débito registradas.`
                });
            } else { 
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `El movimiento seleccionado tiene <b>${notasDebito.length.toString()}</b> notas de débito registradas.`
                });
            }
        }

        // leemos las plantillas que corresponden a notas de cobertura impresas (cuyo tipo es: TMP-FAC-NOTA-CED, TMP-FAC-NOTA-REA, ...)
        $scope.showProgress = true;

        $scope.subscribe("collectionFS_files", () => { return ['TMP-NOTA-DEBITO']; }, {
            onReady: function () {

                //   $scope.plantillas_ui_grid.data = [];
                //   $scope.plantillas_ui_grid.data = $scope.collectionFS_files;

                $scope.showProgress = false;
                $scope.$apply();
            },
            onStop: function (error) {
                $scope.showProgress = false;
                $scope.$apply();
            }
        });
    })

    $scope.notasDebito_construir = function() { 

        $scope.showProgress = true;

        Meteor.call('notasDebito_construir', $scope.riesgo._id, $scope.movimientoSeleccionado._id, (err: any, result: any) => {

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
                let errorMessage = result.message;

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();
                return;
            }

            $scope.alerts.length = 0;

            $scope.alerts.push({
                type: 'info',
                msg: result.message, 
            });
        })
    }

    // para mostrar los links que permiten al usuario hacer el download de las notas de débito 
    $scope.downLoadWordDocument_notasDebito = false;
    $scope.selectedFile_notasDebito = {};
    $scope.downLoadLink_notasDebito = "";

    $scope.notasDebito_obtenerEnWord = function() { 

        // TODO: aquí debemos leer desde el collection de files, la que corresponde al tipo: NOTA-DEBITO ... 
        let file = CollectionFS_templates.findOne({ 'metadata.tipo': "TMP-NOTA-DEBITO" });

        if (!file) { 
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: `Error: no existe una plantilla registrada para imprimir las notas de débito.<br />
                      Ud. debe abrir la opción <em>Generales/Registrar archivos</em> y registrar una plantilla para 
                      la impresión de notas de débito.`,
            });
            return; 
        }

        // nota para el cedente
        if (file.metadata.tipo === "TMP-NOTA-DEBITO") {
            Meteor.call('notasDebito.obtenerNotasImpresas',
                file._id,
                $scope.riesgo._id, $scope.movimientoSeleccionado._id, (err: any, result: any) => {

                    if (err) {
                        let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                        $scope.alerts.length = 0;
                        $scope.alerts.push({ type: 'danger', msg: errorMessage });

                        $scope.showProgress = false;
                        $scope.$apply();

                        return;
                    }

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: `Ok, el documento ha sido construido en forma exitosa.<br />
                                  Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                    });

                    $scope.selectedFile_notasDebito = file;
                    $scope.downLoadLink_notasDebito = result;
                    $scope.downLoadWordDocument_notasDebito = true;

                    $scope.showProgress = false;
                    $scope.$apply();
                });
        };
    }
}
]);
