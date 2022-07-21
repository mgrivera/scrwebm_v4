﻿
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

import angular from 'angular'; 
import lodash from 'lodash'; 

import { mensajeErrorDesdeMethod_preparar } from '../../imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { userHasRole } from '/client/imports/generales/userHasRole';

import { ContratosParametros } from '/imports/collections/catalogos/contratosParametros'; 

angular.module("scrwebm").controller("ContratosParametrosController", ['$scope', 
function ($scope) {

    // para permitir editar la tabla en base a los roles asignados al usuario 
    $scope.catalogosEditar = userHasRole('catalogos') ||
                             userHasRole('catalogos_contratos') ? true : false;

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.setIsEdited = function () {
        if ($scope.contratosParametros.docState) {
            return;
        }

        $scope.contratosParametros.docState = 2;
    }

    let subscriptionHandle = null;

    $scope.save = function () {

        $scope.showProgress = true;

        var editedItems = [];
        editedItems[0] = $scope.contratosParametros;

        // nótese como validamos cada item antes de intentar guardar en el servidor
        var isValid = false;
        var errores = [];

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = ContratosParametros.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    ContratosParametros.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" +
                            ContratosParametros.simpleSchema().label(error.name) +
                            "'; error de tipo '" + error.type + "'.");
                    })
                }
            }
        });

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

        // para 'refrescar' el helper y el grid cuando se ingresar (nuevos) items ....
        Meteor.call('contratosParametrosSave', editedItems, (err, result) => {

            if (err) {
                const errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
                $scope.$apply();
                return;
            }


            if (subscriptionHandle) {
                subscriptionHandle.stop();
            }

            subscriptionHandle = Meteor.subscribe('contratosParametros', () => {
                $scope.contratosParametros = {};
                $scope.contratosParametros = ContratosParametros.findOne();

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result
                });

                $scope.showProgress = false;
                $scope.$apply();
            })
        })
    }

    $scope.showProgress = true;

    subscriptionHandle = Meteor.subscribe('contratosParametros', () => {
        $scope.contratosParametros = ContratosParametros.findOne();

        // si no existe un registro en la tabla (ie: collection), agregamos uno ...
        if (!$scope.contratosParametros || lodash.isEmpty($scope.contratosParametros)) {
            $scope.contratosParametros = {
                _id: new Mongo.ObjectID()._str,
                imp1Porc: 0.00,
                imp2Porc: 0.00,
                impSPNPorc: 0.00,
                corrPorc: 0.00,
                docState: 1,
            };
        }

        $scope.showProgress = false;
        $scope.$apply();
    })

    $scope.$on('$destroy', function () {
        subscriptionHandle.stop();
    })
}])