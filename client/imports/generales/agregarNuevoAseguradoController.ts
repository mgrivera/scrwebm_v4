

import * as angular from 'angular'; 

import { Asegurados } from 'imports/collections/catalogos/asegurados'; 

import { mensajeErrorDesdeMethod_preparar } from './mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebm").controller('AgregarNuevoAsegurado_ModalController',
['$scope', '$modalInstance', 'nombre', function ($scope, $modalInstance, nombre) {
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        $modalInstance.close($scope.asegurado);
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.asegurado = { 
        _id: new Mongo.ObjectID()._str, 
        nombre: nombre, 
        abreviatura: nombre.substring(0, 15), 
    }

    $scope.forms = {}; 

    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

    $scope.agregarNuevoAsegurado_form_submit = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if ($scope.forms.agregarNuevoAsegurado_form.$valid) {

            $scope.submitted = false;
            $scope.forms.agregarNuevoAsegurado_form.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
            
            let isValid = false;
            let errores = [];
            
            // intentamos validar el asegurado que se desea grabar 
            isValid = Asegurados.simpleSchema().namedContext().validate($scope.asegurado);

            if (!isValid) {
                Asegurados.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + "." as never);
                });
            }
                
            if (errores && errores.length) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                        errores.reduce(function (previous, current) {
  
                            if (previous == "")
                                // first value
                                return current;
                            else
                                return previous + "<br />" + current;
                        }, "")
                });
  
                $scope.showProgress = false;
                return;
            }
            
            $scope.showProgress = true

            // nótese como, para grabar el nuevo asegurado, usamos el mismo method que usa el catálogo de aseguarados ... 
            let editedItems = [ 
                { 
                    _id: $scope.asegurado._id, 
                    nombre: $scope.asegurado.nombre, 
                    abreviatura: $scope.asegurado.abreviatura, 
                    docState: 1, 
                }]; 
 
            Meteor.call('aseguradosSave', editedItems, (err, result) => {

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
  
                // al terminar, regresamos el asegurado que se ha recién grabado a mongo ... 
                $scope.ok(); 
              })
        }
    }
}
])