


import saveAs from 'save-as'

let permitirUsuarioDownloadFiles = function($modal, files, mensajeAlUsuario) {

    var modalInstance = $modal.open({
        templateUrl: 'client/generales/downloadFilesModal.html',
        controller: 'DownloadFilesController',
        size: 'lg',
        resolve: {
            files: function () {
                return files;
            },
            mensaje: function() {
                return mensajeAlUsuario;
            }
        }
    }).result.then(
          function (resolve) {
              return true;
          },
          function (cancel) {
              return true;
          });
};

Global_Methods.PermitirUsuarioDownloadFiles = permitirUsuarioDownloadFiles;


angular.module("scrwebM").controller('DownloadFilesController',
['$scope', '$modalInstance', '$modal', 'files', 'mensaje',
function ($scope, $modalInstance, $modal, files, mensaje) {

    // este modal recibe un array con información de files (content y name) y genera links para cada uno de ellos;
    // la idea es que el usuario pueda copiar (download) cada archivo al disco duro local ...
    $scope.files = files;
    $scope.mensaje = mensaje;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.downloadFile = (file) => {
        try {
            let blob = new Blob([file.fileContent], {type: "text/csv;charset=utf-8"});
            saveAs(blob, file.fileName);
        }
        catch(err) {
            let errorMessage = `Aparentemente, se ha producido un error al intentar guardar el archivo al disco duro.
                                El mensaje del error obtenido es:
                                Error al intentar guardar el archivo: <em>${err}</em>.
                               `;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });
        };
    };
}
]);
