

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

        // ejecutamos un método que lee y regresa desde dropbox las plantillas para notas de cobertura 
        Meteor.call('plantillas.obtenerListaArchivosDesdeDirectorio', "/facultativo/notasDebito", (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            if (result.error) { 
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg:  result.message
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // para que solo se muestre el mensaje en alerts que muestra la cantidad de notas de débito leídas (registradas)
            // $scope.alerts.length = 0;
            // $scope.alerts.push({
            //     type: 'info',
            //     msg: result.message,
            // });

            $scope.template_files = result && result.files && Array.isArray(result.files) ? result.files : [ { name: "indefinido", type: "indefinido"} ]; 

            $scope.showProgress = false;
            $scope.$apply();
        })
    })

    $scope.notasDebito_construir = function(file: any) { 

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

    $scope.notasDebito_obtenerEnWord = function() { 

        const template_files: { name: string }[] = $scope.template_files; 

        if (!template_files || !Array.isArray(template_files) || !template_files.length) { 

            let message = `Error: no existe una plantilla registrada en Dropbox para imprimir las notas de débito.<br />
                           Ud. debe agregar una plantilla para este tipo de documentos, al directorio apropiado en la 
                           cuenta Dropbox del programa.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message,
            });
            return; 
        }

        if (!$scope.riesgo || !$scope.riesgo._id) { 

            let message = `Error: no se ha seleccionado un riesgo. Ud. debe seleccionar un riesgo antes de ejecutar esta función.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message,
            });
            return; 
        }

        if (!$scope.movimientoSeleccionado || !$scope.movimientoSeleccionado._id) { 

            let message = `Error: no se ha seleccionado un movimiento. Ud. debe seleccionar un movimiento antes de ejecutar esta función.`; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres???

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message,
            });
            return; 
        }

        $scope.alerts.length = 0;
        $scope.showProgress = true;

        Meteor.call('notasDebito.obtenerNotasImpresas',
            "/facultativo/notasDebito", template_files[0].name,
            $scope.riesgo._id, $scope.movimientoSeleccionado._id, (err: any, result: any) => {

                if (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                if (result.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: result.message });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message,
                })

                $scope.showProgress = false;
                $scope.$apply();
            }
        )
    }
}
]);
