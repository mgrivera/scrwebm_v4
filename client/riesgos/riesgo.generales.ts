

import * as angular from 'angular';

import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Asegurados } from 'imports/collections/catalogos/asegurados'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 
import { TiposFacultativo } from 'imports/collections/catalogos/tiposFacultativo'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 
import { Suscriptores } from 'imports/collections/catalogos/suscriptores'; 

// importamos la plantilla y el controller, pues los usamos más abajo 
import '../imports/generales/agregarNuevoAsegurado.html';           // html: el path *debe* ser relativo y *no* absoluto (???!!!)        
import "../imports/generales/agregarNuevoAseguradoController"; 

angular.module("scrwebM").controller("RiesgoGenerales_Controller",
['$scope', '$state', '$stateParams', '$meteor', '$modal', function ($scope, $state, $stateParams, $meteor, $modal) {

    $scope.showProgress = false;

    $scope.estados = [
        { estado: 'CO', descripcion: 'Cotización' },
        { estado: 'AC', descripcion: 'Aceptado' },
        { estado: 'EM', descripcion: 'Emitido' },
        { estado: 'RE', descripcion: 'Renovación' },
        { estado: 'RV', descripcion: 'Renovado' },
        { estado: 'AN', descripcion: 'Anulado' },
        { estado: 'DE', descripcion: 'Declinado' },
    ];

    // ---------------------------------------------------------------------------
    // para inicializar la fecha final cuando se indica la inicial ...
    $scope.$watch(
        function(scope) { return scope.riesgo.desde; },
        function(newValue, oldValue) {
            if (newValue && (newValue != oldValue)) {
                if (!$scope.riesgo.hasta) {
                    // determinamos la fecha pero para el prox año
                    var newDate = new Date(newValue.getFullYear() + 1, newValue.getMonth(), newValue.getDate());
                    $scope.riesgo.hasta = newDate;
                }
            }
        }
    )

    $scope.setIsEdited = function () {
        if ($scope.riesgo.docState)  { 
            return;
        }
            
        $scope.riesgo.docState = 2;
    }

    aseguradoSetSelectize($modal, $scope); 
}])


// para establecer las opciones del select asegurado; nótese como usamos selectize, debemos usar un $apply ... 
// el setTimeout es para que angular reconozca el control 
function aseguradoSetSelectize($modal, $scope) {
    setTimeout(function () {
        $scope.$apply(function () {

            let items = []; 

            if ($scope.riesgo && !$scope.riesgo.asegurado) { 
                $scope.riesgo.asegurado = null; 
            }

            if ($scope.riesgo && $scope.riesgo.asegurado) { 
                items.push($scope.riesgo.asegurado as never); 
            }
            
            let asegurado = $("#asegurado"); 
            asegurado.selectize({
                options: $scope.asegurados, 
                valueField: '_id',
                labelField: 'nombre', 
                searchField: ['nombre', ], 
                sortField: 'nombre', 
                items: items, 
                maxItems: 1, 
                selectOnTab: false, 
                openOnFocus: false, 

                onItemAdd: function(value) { 

                    // this way you can have the whole item 
                    // var data = this.options[value];
                    if ($scope.riesgo.asegurado != value) { 
                        $scope.riesgo.asegurado = value;

                        if (!$scope.riesgo.docState) { 
                            $scope.riesgo.docState = 2;
                        } 
                    }
                }, 

                create:function (input, callback) {

                    agregarAsegurado_desdeInput($modal, input).then((result) => {

                        // Ok, el usuario agregó el asegurado desde el modal; regresamos el item para que selectize lo 
                        // agregue a sus choices 

                        // solo si el usuario cancela, intentamos regresar el asegurado que ya existía 
                        if (!result && $scope.riesgo.asegurado) { 
                            let asegurado = Asegurados.findOne($scope.riesgo.asegurado); 

                            // nota: si no se encuentra un asegurado, pasamos undefined y el Select debe quedar en blanco 
                            // (sin selección) 
                            callback(asegurado); 
                        } else { 

                            if (!$scope.riesgo.docState) { 
                                $scope.riesgo.docState = 2;
                            }  

                            // en result viene el asegurado, como un object, que se agrega como un choice en selectize
                            callback(result); 
                        }
                        
                    }).catch((error) => {
                        // error ocurred!
                        // no esperamos nunca un error, pues siempre resolvemos los erroes en el modal ... 
                    })
                }, 
            });
        });
    }, 0);
  }


  const agregarAsegurado_desdeInput = ($modal, nombre) => {
    return new Promise((resolve, reject) => {
      
        var modalInstance = $modal.open({
            templateUrl: 'client/imports/generales/agregarNuevoAsegurado.html',
            controller: 'AgregarNuevoAsegurado_ModalController',
            size: 'md',
            resolve: {
                nombre: function () {
                    return nombre;
                },
            }
        }).result.then(
              function (result) {
                  // en resolve viene el nuevo asegurado 
                  resolve(result);
              },
              function (cancel) {
                  // el usuario canceló y *no* agregó el nuevo asseguado a la base de datos ... 
                  resolve(undefined);
              }
        )
  
        // nunca regeresamos un error pues siempre resolvemos cualquier error en el modal 
        // reject(Error("It broke"));
    })
  }