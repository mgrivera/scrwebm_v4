

import * as angular from 'angular';

import { Asegurados } from '/imports/collections/catalogos/asegurados'; 

export default angular.module("scrwebm.riesgos.generales", []).controller("RiesgoGenerales_Controller",
['$scope', '$uibModal', function ($scope, $uibModal) {

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

    $scope.setIsEdited = function (field = "") {

        if (field === "compania") { 
            if ($scope.riesgo.compania && !$scope.riesgo.cedenteOriginal) { 
                $scope.riesgo.cedenteOriginal = $scope.riesgo.compania; 
            }
        }

        if ($scope.riesgo.docState)  { 
            return;
        }
            
        $scope.riesgo.docState = 2;
    }

    aseguradoSetSelectize($uibModal, $scope); 
}])


// para establecer las opciones del select asegurado; nótese como usamos selectize, debemos usar un $apply ... 
// el setTimeout es para que angular reconozca el control 
function aseguradoSetSelectize($uibModal, $scope) {
    setTimeout(function () {
        $scope.$apply(function () {

            const items = []; 

            if ($scope.riesgo && !$scope.riesgo.asegurado) { 
                $scope.riesgo.asegurado = null; 
            }

            if ($scope.riesgo && $scope.riesgo.asegurado) { 
                items.push($scope.riesgo.asegurado); 
            }
            
            const asegurado = $("#asegurado"); 
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

                create: function (input, callback) {

                    agregarAsegurado_desdeInput($uibModal, input).then((result) => {

                        // Ok, el usuario agregó el asegurado desde el modal; regresamos el item para que selectize lo 
                        // agregue a sus choices 

                        // solo si el usuario cancela, intentamos regresar el asegurado que ya existía 
                        if (!result && $scope.riesgo.asegurado) { 
                            const asegurado = Asegurados.findOne($scope.riesgo.asegurado); 

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
                        
                    }).catch(() => {
                        // error ocurred!
                        // no esperamos nunca un error, pues siempre resolvemos los erroes en el modal ... 
                    })
                }, 
            });
        });
    }, 0);
  }


  const agregarAsegurado_desdeInput = ($uibModal, nombre) => {
    return new Promise((resolve) => {
      
        $uibModal.open({
            templateUrl: 'client/html/generales/agregarNuevoAsegurado.html',
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
              function () {
                  // el usuario canceló y *no* agregó el nuevo asseguado a la base de datos ... 
                  resolve(undefined);
              }
        )
  
        // nunca regeresamos un error pues siempre resolvemos cualquier error en el modal 
        // reject(Error("It broke"));
    })
  }