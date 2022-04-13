

import * as angular from 'angular';
import { mensajeErrorDesdeMethod_preparar } from 'client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

export default angular.module("scrwebm.riesgos.infoRamo.editarInfoRamo", []).controller('InfoRamo_editarItem_ModalController',
['$scope', '$uibModalInstance', 'infoRamo', 'autosMarcas', function ($scope, $uibModalInstance, infoRamo, autosMarcas) {
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function (infoRamo) {
        $uibModalInstance.close(infoRamo);
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    }

    // TODO: aquí debemos tener el item específico que corresponde al movimiento pasado; 
    // la idea sería pasarlo desde el controller que abre este modal ... 
    // en realidad, con el infoRamo que recibamos debemos inicializar el mismo item en el $scope, para que se actualice 
    // con los valores que el usuario indique en la forma. Nota: el infoRamo puede venir en nulls si el item es nuevo ... 
    $scope.infoRamo = infoRamo; 
    
    // el usuario hace un submit, cuando quiere 'salir' de edición ...
    $scope.submitted = false;

    $scope.infoRamo_editarItem_form_submit = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if ($scope.infoRamo_editarItem_form.$valid) {

            $scope.submitted = false;
            $scope.infoRamo_editarItem_form.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            $scope.ok(infoRamo); 

            return; 
        }
    }

    // para configurar el Selectize para Marca; 
    marcaSetSelectize($scope, autosMarcas); 
    modeloSetSelectize($scope, autosMarcas); 
}])


// el Input Marca usa un Selectize. Lo configuramos aquí ... 
function marcaSetSelectize($scope, autosMarcas) {
    setTimeout(function () {
        $scope.$apply(function () {

            // estos son los valores que el usuario ha seleccionado en la lista; en nuestro caso, nunca más de uno ... 
            let items = [];         

            if ($scope.infoRamo && $scope.infoRamo.marca) { 
                // si viene un valor en el item, lo seleccionamos en la lista 
                items.push($scope.infoRamo.marca as never); 
            }
            
            let marcaInput = $("#marca");           // usamos jQuery para obtener el Input ... 
            marcaInput.selectize({
                options: autosMarcas,        // esta es la lista de opciones que muestra la lista 
                valueField: '_id',
                labelField: 'marca', 
                searchField: ['marca'], 
                sortField: 'marca', 
                items: items, 
                maxItems: 1,                        // el usuario no podrá seleccionar más de un item en la lista 
                selectOnTab: false, 
                openOnFocus: false, 

                onItemAdd: function(value) { 

                    // cuando el usaurio selecciona un item en la lista 

                    // this way you can have the whole item (nótese como podemos seleccionar el item en forma completa, si lo 
                    // necesitamos para algo) 
                    // var data = this.options[value];

                    if (!$scope.infoRamo || !$scope.infoRamo.marca || $scope.infoRamo.marca != value) { 
                        // pasamos el valor seleccionado al $scope 
                        $scope.infoRamo.marca = value;

                        // cuando el usuario selecciona una marca, agregamos los items a la lista del selectize modelo ... 
                        let marcaSeleccionada = autosMarcas.find(x => x._id === value); 
                        let modeloItems = marcaSeleccionada.modelos ? marcaSeleccionada.modelos : []; 

                        let selectizeModelo = $("#modelo")[0].selectize;
                        selectizeModelo.clearOptions();
                        selectizeModelo.load(function(callback) {
                            callback(modeloItems);
                        });
                    }
                }, 

                create: function (input, callback) {

                    // en este method agregamos la nueva marca al collection y la regresamos en result 

                    // el method espera un array 
                    let items = [ 
                        { 
                            _id: new Mongo.ObjectID()._str, 
                            marca: input,
                            modelos: [],
                            docState: 1
                        }
                    ]; 

                    Meteor.call('autosMarcas.save', items, (err, result) => {

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
            
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'info',
                            msg: "Ok, la <b>marca</b> ha sido creada."
                        }); 

                        $scope.showProgress = false;
                        $scope.$apply();

                        // pasamos el nuevo item para que se muestre en la lista 
                        delete items[0].docState; 
                        callback(items[0]); 
                    })
                }, 
            });
        });
    }, 0);
  }


  // el Input Marca usa un Selectize. Lo configuramos aquí ... 
function modeloSetSelectize($scope, autosMarcas) {
    setTimeout(function () {
        $scope.$apply(function () {

            // los modelos mostrados en la lista deben corresponder a la marca seleccionada 
            let marca = $scope.infoRamo.marca ? $scope.infoRamo.marca : null; 
            let marcaSeleccionada = autosMarcas.find(x => x._id === marca); 
            let modelos = []; 

            if (marcaSeleccionada) { 
                modelos = marcaSeleccionada.modelos ? marcaSeleccionada.modelos : []; 
            }

            // estos son los valores que el usuario ha seleccionado en la lista; en nuestro caso, nunca más de uno ... 
            let items = [];         

            if ($scope.infoRamo && $scope.infoRamo.modelo) { 
                // si viene un valor en el item, lo seleccionamos en la lista 
                items.push($scope.infoRamo.modelo as never); 
            }

            let modeloInput = $("#modelo");           // usamos jQuery para obtener el Input ... 
            modeloInput.selectize({
                options: modelos,                   // esta es la lista de opciones que muestra la lista 
                valueField: '_id',
                labelField: 'modelo', 
                searchField: ['modelo'], 
                sortField: 'modelo', 
                items: items, 
                maxItems: 1,                        // el usuario no podrá seleccionar más de un item en la lista 
                selectOnTab: false, 
                openOnFocus: false, 

                onItemAdd: function(value) { 

                    // cuando el usaurio selecciona un item en la lista 

                    // this way you can have the whole item (nótese como podemos seleccionar el item en forma completa, si lo 
                    // necesitamos para algo) 
                    // var data = this.options[value];

                    if (!$scope.infoRamo.modelo || $scope.infoRamo.modelo != value) { 
                        $scope.infoRamo.modelo = value;
                    }
                }, 

                create: function (input, callback) {

                    // en este method agregamos el nuevo modelo al collection 
                    let marca = $scope.infoRamo.marca ? $scope.infoRamo.marca : null; 
                    let marcaSeleccionada = autosMarcas.find(x => x._id === marca); 

                    let nuevoModelo = { _id: new Mongo.ObjectID()._str, modelo: input }; 

                    marcaSeleccionada.modelos.push(nuevoModelo); 
                    marcaSeleccionada.docState = 2; 

                    // el method espera un array 
                    let items = [ marcaSeleccionada ]; 

                    Meteor.call('autosMarcas.save', items, (err, result) => {

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

                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'info',
                            msg: "Ok, el <b>modelo</b> ha sido creado."
                        }); 

                        $scope.showProgress = false;
                        $scope.$apply();

                        // pasamos el nuevo item para que se muestre en la lista 
                        callback(nuevoModelo); 
                    })
                }, 
            });
        });
    }, 0);
  }