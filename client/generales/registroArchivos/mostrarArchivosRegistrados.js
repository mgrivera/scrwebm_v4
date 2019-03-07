

import lodash from 'lodash'; 
import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

import { CollectionFS_templates } from '/client/imports/collectionFS/Files_CollectionFS_templates'; 
import { CollectionFS_logos } from '/client/imports/collectionFS/Files_CollectionFS_logos'; 

// importamos el module generales, pues está en  imports ... 
import scrwebmGenerales from '/client/imports/generales/generalesAngularModule'; 

angular.module(scrwebmGenerales.name).controller('MostrarArchivosRegistradosController',
['$scope', '$modalInstance', '$modal',
function ($scope, $modalInstance, $modal) {

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

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
        // éstas; por ejemplo: templates (word, excel, ...) o logos ...
        if (lodash.startsWith(file.metadata.tipo, 'TMP-')) {
            let id = file._id; 
            let document = CollectionFS_templates.findOne(id); 
            if (document) { 
                let urlString = document.url().toString();

                var url = Pictures.findOne({'metadata.make': context}).url();


                return urlString;
            } else { 
                return "url indefinido - no fue posible obtenerlo (???)";
            }
        } else {
            let id = file._id; 
            let document = CollectionFS_templates.findOne(id); 
            if (document && document.url && document.url()) { 
                let urlString = document.url().toString();
                return urlString;
            } else { 
                return "url indefinido - no fue posible obtenerlo (???)";
            }
        }
    }

    // --------------------------------------------------------------------------------------------------------------------
    // suscribimos a las imagenes registradas para la cia seleccionada
    $scope.showProgress = true;

    $scope.subscribe("collectionFS_files", () => { return []; }, {
        onReady: function () {
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
                  if (lodash.startsWith(file.metadata.tipo, 'TMP-')) {
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
