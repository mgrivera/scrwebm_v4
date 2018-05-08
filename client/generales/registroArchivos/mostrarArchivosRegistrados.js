

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller('MostrarArchivosRegistradosController',
['$scope', '$modalInstance', '$modal',
function ($scope, $modalInstance, $modal) {

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.helpers({
        logos: () => {
            return CollectionFS_logos.find();
        },
        templates: () => {
            return CollectionFS_templates.find();
        },
    });

    $scope.fileURL_toString = (file) => {
        // siempre tenemos varios collections (fs) con diferentes tipos de archivo registrados en
        // éstas ...
        if (_.startsWith(file.metadata.tipo, 'TMP-')) {
            let urlString = CollectionFS_templates.findOne({ _id: file._id }).url().toString();
            return urlString;
        } else {
            let urlString = CollectionFS_logos.findOne({ _id: file._id }).url().toString();
            return urlString;
        };

    }

    // --------------------------------------------------------------------------------------------------------------------
    // suscribimos a las imagenes registradas para la cia seleccionada
    $scope.showProgress = true;

    $scope.subscribe("collectionFS_files", () => { return []; }, {
        onReady: function () {
            // debugger;
            $scope.showProgress = false;
            $scope.$apply();
        },
        onStop: function (error) {
            $scope.showProgress = false;
            $scope.$apply();
      }
    })
  // --------------------------------------------------------------------------------------------------------------------

  $scope.removeFile = function(file) {

      DialogModal($modal, "<em>Registro de archivos</em>", `Desea eliminar el archivo <b><em>${file.original.name}</em></b> ?`, true).then(
              function (resolve) {
                  if (_.startsWith(file.metadata.tipo, 'TMP-')) {
                      // nótese como el usuario puede registrar varios tipos de archivos
                      // templates: word and excel files; logos; ...
                      CollectionFS_templates.remove({ _id: file._id });
                  } else {
                      CollectionFS_logos.remove({ _id: file._id });
                  }

                  return true;
              },
              function (cancel) {
                  return true;
              }
          )
  }
}
]);
