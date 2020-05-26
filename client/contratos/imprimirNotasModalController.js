
import angular from 'angular';
import moment from 'moment';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 


import { CollectionFS_templates } from '/client/imports/collectionFS/Files_CollectionFS_templates'; 

angular.module("scrwebm").controller('ImprimirNotasContratosModalController',
['$scope', '$modalInstance', '$modal', 'contrato',
function ($scope, $modalInstance, $modal, contrato) {

    // este modal intenta construir un pdf para cada tipo de nota de cobertura: cedente, reasegurador, interna
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        // $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

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

    $scope.submitted = false;
    $scope.parametros = {};

    $scope.parametros.fecha = "Caracas, " + moment().format("D") + " de " + moment().format("MMMM") + " de " + moment().format("YYYY");
    $scope.parametros.reaseguradorSeleccionado = null;

    $scope.submitted = false;
    $scope.parametros = {};

    $scope.parametros.fecha = "Caracas, " + moment().format("D") + " de " + moment().format("MMMM") + " de " + moment().format("YYYY");

    // para mostrar los links que permiten al usuario hacer el download de las notas
    $scope.downLoadWordDocument_generales = false;
    $scope.selectedFile_generales = {};
    $scope.downLoadLink_generales = "";

    $scope.downLoadWordDocument_primas = false;
    $scope.selectedFile_primas = {};
    $scope.downLoadLink_primas = "";

    $scope.downLoadWordDocument_corretaje = false;
    $scope.selectedFile_corretaje = {};
    $scope.downLoadLink_corretaje = "";

    $scope.obtenerDocumentoWord = function (file) {

        if (!$scope.parametros.fecha || _.isEmpty($scope.parametros.fecha)) {
            DialogModal($modal, "<em>Contratos - Construcción de notas de contratos</em>",
                        `Ud. debe indicar la fecha que se mostrará en el documento.<br />
                         Ejemplo: Caracas, 25 de Abril del 2.015.
                        `,
                        false).then();
            return;
        }

        $scope.alerts.length = 0;
        $scope.showProgress = true;

        // notas de contratos - generales
        if (file.metadata.tipo === "TMP-CONT-NOTA-GENERAL") {
            Meteor.apply('contratos.obtenerNotasImpresas.generales',
                         [ file._id, contrato._id, $scope.parametros.fecha ],
                         [ { noRetry: true } ],
                         (err, result) => {

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

                    $scope.selectedFile_generales = file;
                    $scope.downLoadLink_generales = result;
                    $scope.downLoadWordDocument_generales = true;

                    $scope.showProgress = false;
                    $scope.$apply();
            })
        }

        // notas de contratos - primas
        if (file.metadata.tipo === "TMP-CONT-NOTA-PRIMAS") {
            Meteor.apply('contratos.obtenerNotasImpresas.primas',
                         [ file._id, contrato._id, $scope.parametros.fecha ],
                         [ { noRetry: true } ],
                         (err, result) => {

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

                $scope.selectedFile_primas = file;
                $scope.downLoadLink_primas = result;
                $scope.downLoadWordDocument_primas = true;

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
    }

    $scope.helpers({
        template_files: () => {
            return CollectionFS_templates.find({
                // regresamos solo archivos cuyo tipo comienza así ...
                'metadata.tipo': { $regex: /^TMP-CONT-NOTA/ },
            });
        },
    });


    // leemos las plantillas que corresponden a notas de cobertura impresas (cuyo tipo es: TMP-FAC-NOTA-CED, TMP-FAC-NOTA-REA, ...)
    $scope.showProgress = true;

    $scope.subscribe("collectionFS_files", () => { return ['TMP-CONT-NOTA']; }, {
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
  // --------------------------------------------------------------------------------------------------------------------

}
]);
