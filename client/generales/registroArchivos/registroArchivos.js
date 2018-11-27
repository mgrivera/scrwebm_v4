


import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

import { CollectionFS_templates } from '/imports/collectionFS/Files_CollectionFS_templates'; 
import { CollectionFS_logos } from '/imports/collectionFS/Files_CollectionFS_logos'; 

angular.module("scrwebM").controller("RegistroArchivosController",
['$scope', '$state', '$stateParams', '$meteor', '$modal',
  function ($scope, $state, $stateParams, $meteor, $modal) {

    //   debugger;
      $scope.showProgress = true;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.tiposArchivos_List = [
            { tipo: 'LG-HEADER', descripcion: 'Logo - Encabezado' },
            { tipo: 'LG-FOOTER', descripcion: 'Logo - Pié' },
            { tipo: 'TMP-CB-EMAIL1', descripcion: 'E-mail cobranza cuotas pendientes - 1' },
            { tipo: 'TMP-CB-EMAIL2', descripcion: 'E-mail cobranza cuotas pendientes - 2' },
            { tipo: 'TMP-CB-EMAIL3', descripcion: 'E-mail cobranza cuotas pendientes - 3' },
            { tipo: 'TMP-CB-EMAIL4', descripcion: 'E-mail cobranza cuotas pendientes - 4' },
            { tipo: 'TMP-CB-EMAIL5', descripcion: 'E-mail cobranza cuotas pendientes - 5' },
            { tipo: 'TMP-FAC-NOTA-CED', descripcion: 'Facultativo - Notas - Cedente' },
            { tipo: 'TMP-FAC-NOTA-REA', descripcion: 'Facultativo - Notas - Reaseguradores' },
            { tipo: 'TMP-FAC-NOTA-INT', descripcion: 'Facultativo - Notas - Interna' },
            { tipo: 'TMP-CONT-NOTA-GENERAL', descripcion: 'Contratos - Notas - General' },
            { tipo: 'TMP-CONT-NOTA-PRIMAS', descripcion: 'Contratos - Notas - Primas' },
            { tipo: 'TMP-SNTR-NOTA-RES', descripcion: 'Siniestros - Notas - Reservas' },
            { tipo: 'TMP-SNTR-NOTA-LIQ', descripcion: 'Siniestros - Notas - Liquidaciones' },
        ];

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

      $scope.subscribe('collectionFS_files');

      let userSelectedFile = null;

      $scope.uploadFile = function(files) {
          userSelectedFile = files[0];
        };

        $scope.submitted = false;

        $scope.mostrarArchivosRegistrados = () => {

            var modalInstance = $modal.open({
                templateUrl: 'client/generales/registroArchivos/mostrarArchivosRegistrados.html',
                controller: 'MostrarArchivosRegistradosController',
                size: 'lg',
                // resolve: {
                //     ciaSeleccionada: function () {
                //         return companiaSeleccionadaDoc;
                //     }
                // }
            }).result.then(
                  function (resolve) {
                      return true;
                  },
                  function (cancel) {
                      return true;
                  });
        };

        // para mejorar el style al input-file ...
        $(":file").filestyle();

        $(":file").filestyle('buttonName', 'btn-danger');
        $(":file").filestyle('buttonText', '&nbsp;&nbsp;Seleccione un archivo ...');
        $(":file").filestyle('disabled', true);
        $(":file").filestyle('size', 'sm');

        $scope.tipoArchivo_Change = () => {
            // cuando el usuario selecciona un tipo de imagen, activamos el input file ...
            if ($scope.tipoArchivo)
                $(":file").filestyle('disabled', false);
            else
                $(":file").filestyle('disabled', true);
        };

        $scope.submitGrabarArchivosForm = function () {
          $scope.submitted = true;

          $scope.alerts.length = 0;

          if (!userSelectedFile) {
              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: "Aparentemente, Ud. no ha seleccionado un archivo desde su PC aún.<br />" +
                       "Ud. debe seleccionar un archivo antes de intentar registrarlo (en el servidor)."
              });

              return;
          }

          if ($scope.grabarArchivosForm.$valid) {
              $scope.submitted = false;
              $scope.grabarArchivosForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

              $scope.showProgress = true;

              // -----------------------------------------------------------------------
              // NOTA IMPORTANTE: nótese como aquí determinamos el collection que vamos a usar para registrar
              // el archivo; ahora tenemos *dos* collections (FS): uno para logos y uno para plantillas
              // (word y excel); dependiendo del tipo de archivo que el usuario seleccione, determinamos cual
              // de los dos collections (FS) vamos a usar para grabar el archivo
              let collectionFS = null;

              switch ($scope.tipoArchivo[0]) {
                  case 'LG-FOOTER':
                  case 'LG-HEADER':
                      collectionFS = CollectionFS_logos;
                      break;
                  case 'TMP-CB-EMAIL1':
                  case 'TMP-CB-EMAIL2':
                  case 'TMP-CB-EMAIL3':
                  case 'TMP-CB-EMAIL4':
                  case 'TMP-CB-EMAIL5':
                  case 'TMP-FAC-NOTA-CED':
                  case 'TMP-FAC-NOTA-REA':
                  case 'TMP-FAC-NOTA-INT':
                  case 'TMP-SNTR-NOTA-RES':
                  case 'TMP-SNTR-NOTA-LIQ':
                  case 'TMP-CONT-NOTA-GENERAL':
                  case 'TMP-CONT-NOTA-PRIMAS':
                      collectionFS = CollectionFS_templates;
                      break;
                  default:
              };

              // eliminamos (en collectionFS) un archivo que pueda existir con el mismo nombre;
              // la idea es que pueden exitir varios archivos del mismo tipo, pero con diferente nombre
              let archivossQueYeExisten = collectionFS.find({ 'original.name': userSelectedFile.name }).fetch();

              archivossQueYeExisten.forEach((file) => {
                  // el file puede existir en alguno de estos collections, de acuerdo a su tipo
                  collectionFS.remove({ _id: file._id });
              });

              let newFile = new FS.File(userSelectedFile);

              // agregamos algunos valores al file que vamos a registrar con collectionFS
              newFile.metadata = {
                  user: Meteor.user().emails[0].address,
                  fecha: new Date(),
                  tipo: $scope.tipoArchivo[0],      // como la lista es 'multiple', regresa un array ...
                  cia: companiaSeleccionadaDoc._id,
              };

              collectionFS.insert(newFile, function (err, fileObj) {
                // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP

                if (err) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: "Se ha producido un error al intentar registrar el archivo indicado en el servidor.<br />" +
                             "El mensaje específico del error es: " + err.toString()
                    });

                    $scope.showProgress = false;
                    return;
                }

                userSelectedFile = null;

                $(":file").filestyle('clear');              // para regresar el input (file) a su estado inicial (ie: no selected file)
                $(":file").filestyle('disabled', true);     // desabilitamos el input-file

                $scope.tipoArchivo = "";

                // $scope.alerts.length = 0;
                // $scope.alerts.push({
                //     type: 'info',
                //     msg: "Ok, la imagen seleccionada ha sido registrada en el servidor en forma satisfactoria."
                // });
                //
                // $scope.apply();

                DialogModal($modal,
                    "<em>Registro de archivos</em>",
                    "Ok, el archivo fue registrado en forma satisfactoria (en el servidor).<br />" +
                    "Para registrar un nuevo archivo, selecciónelo, asígnele un tipo y haga un <em>click</em> en el botón respectivo.",
                    false).then();

                $scope.showProgress = false;
          });
      };
    };

    $scope.showProgress = false;
  }
]);
