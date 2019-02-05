

import * as lodash from 'lodash';
import * as angular from 'angular';

import * as riesgos_funcionesGenerales from './riesgos_funcionesGenerales'; 
import { mensajeErrorDesdeMethod_preparar } from 'client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Riesgos, Riesgos_InfoRamo, Riesgo_InfoRamos_Autos_SimpleSchema } from 'imports/collections/principales/riesgos'; 
import { Monedas } from 'imports/collections/catalogos/monedas'; 
import { Companias } from 'imports/collections/catalogos/companias'; 
import { Asegurados } from 'imports/collections/catalogos/asegurados'; 
import { Ramos } from 'imports/collections/catalogos/ramos'; 
import { EmpresasUsuarias } from 'imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from 'imports/collections/catalogos/companiaSeleccionada'; 
import { Cuotas } from 'imports/collections/principales/cuotas'; 
import { TiposFacultativo } from 'imports/collections/catalogos/tiposFacultativo'; 
import { TiposObjetoAsegurado } from 'imports/collections/catalogos/tiposObjetoAsegurado'; 
import { AutosMarcas } from 'imports/collections/catalogos/autosMarcas'; 

import { Coberturas } from 'imports/collections/catalogos/coberturas'; 
import { Indoles } from 'imports/collections/catalogos/indoles'; 
import { Suscriptores } from 'imports/collections/catalogos/suscriptores'; 
import { NotasDebitoCredito } from 'imports/collections/principales/notasDebitoCredito'; 


import { DialogModal } from 'client/imports/generales/angularGenericModal'; 

// esto es un angular module 
import '../generales/agregarNuevoAsegurado.html';           // html: el path *debe* ser relativo y *no* absoluto (???!!!)        
import AgregarNuevoAsegurado from "../generales/agregarNuevoAseguradoController"; 

// importamos los files necesarios para el registro de cúmulos ... 
import '../generales/cumulos/registro/registroCumulos.html'; 
import 'client/imports/generales/cumulos/registro/registroCumulos'; 

// importamos el resto del código, otros states, html files etc., que se necesitan para manejar el riesgo 
import './riesgo.generales.html';
import RiesgosGenerales from 'client/imports/riesgos/riesgo.generales';

import './riesgo.movimientos.html'; 
import RiesgoMovimientos from 'client/imports/riesgos/riesgo.movimientos'; 

import './riesgo.infoRamo_autos.html'; 
import RiesgosInfoRamo from 'client/imports/riesgos/riesgo.infoRamo_autos'; 

import './riesgo.productores.html'; 
import RiesgoProductores from 'client/imports/riesgos/riesgo.productores'; 

import './riesgo.cuotas.html'; 
import RiesgoCuotas from './riesgo.cuotas'; 

// para imprimir las cuotas; obtener las notas de cobertura 
import './imprimirNotasModal.html'; 
import RiesgoImprimirNotasCobertura from './imprimirNotasModalController'; 

// para hacer la renovación de un riesgo 
import './renovarRiesgo/renovarRiesgoModal.html'; 
import RenovarRiesgo from './renovarRiesgo/renovarRiesgoController'; 

// construir notas de débito 
import './notasDebito/notasDebito.html'; 
import ConstruirNotasDebito from './notasDebito/notasDebito'; 


export default angular.module("scrwebm.riesgos.riesgo", [ 
    'angular-meteor', 
    AgregarNuevoAsegurado.name, 
    RiesgosGenerales.name, 
    RiesgoMovimientos.name, 
    RiesgosInfoRamo.name, 
    RiesgoProductores.name, 
    RiesgoCuotas.name, 
    RiesgoImprimirNotasCobertura.name, 
    RenovarRiesgo.name, 
    ConstruirNotasDebito.name, 
])
.controller("Riesgo_Controller", ['$scope', '$state', '$stateParams', '$modal', function ($scope, $state, $stateParams, $modal) {

    $scope.showProgress = true;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let empresaUsuariaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (empresaUsuariaSeleccionada) { 
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(empresaUsuariaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
        
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) { 
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    }
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    $scope.goToState = function (state) {
        // para abrir alguno de los 'children' states ...
        if (state === "infoRamo") { 
            // abrimos un state que permite al usuario registrar información propia para el ramo; ej: para automovil el usuario 
            // puede registrar: marca, modelo, placa, etc. 
            let ramo = $scope.ramos.find(x => x._id === $scope.riesgo.ramo); 

            if (ramo) { 
                const tipoRamo = ramo.tipoRamo ? ramo.tipoRamo : ""; 
                switch (tipoRamo) { 
                    case "automovil": { 
                        $state.go("riesgo.infoRamo_autos");
                        break; 
                    }
                    default: { 
                        DialogModal($modal,
                            "<em>Riesgos - Información propia para el ramo del riesgo</em>",
                            `Error: no hay un <em>registro específico de información</em> para el ramo indicado para el riesgo. <br /><br />  
                             Ud. debe usar esta opción <b>solo</b> para riesgos cuyo ramo posea un registro propio de información. <br />
                             Por ejemplo, para el ramo automóvil, el usuario puede usar esta opción para registrar: marca, modelo, año, placa, etc.
                             `,
                            false);
                    }
                }
            }
        }
        else if (state != 'cuotas') { 
            $state.go("riesgo." + state);
        }
        else {  
            $state.go("riesgo.cuotas", {
                'origen': $stateParams.origen,
                'source': 'facXXX'
            });
        }
    }

    // aunque este array podría estar en movimientos, también lo usamos aquí para pasarlo al imprimir; 
    // por eso lo definimos una sola vez aquí ... 
    $scope.tiposMovimiento = [
        { tipo: 'OR', descripcion: 'Original' },
        { tipo: 'AS', descripcion: 'Aumento de Suma Asegurada' },
        { tipo: 'DS', descripcion: 'Disminución de Suma Asegurada' },
        { tipo: 'COAD', descripcion: 'Cobro Adicional de Prima' },
        { tipo: 'DP', descripcion: 'Devolucion de Prima' },
        { tipo: 'EC', descripcion: 'Extensión de Cobertura' },
        { tipo: 'CR', descripcion: 'Cambio de Reasegurador' },
        { tipo: 'SE', descripcion: 'Sin Efecto' },
        { tipo: 'AN', descripcion: 'Anulación' },
        { tipo: 'AE', descripcion: 'Anulación de Endoso' },
        { tipo: 'CAPA', descripcion: 'Cambio de Participación' },
        { tipo: 'PRAJ', descripcion: 'Prima de Ajuste' },
        { tipo: 'AJPR', descripcion: 'Ajuste de Prima' },
        { tipo: 'FRPR', descripcion: 'Fraccionamiento de Prima' },
        { tipo: 'DE', descripcion: 'Endoso declarativo' },
        { tipo: 'IncCob', descripcion: 'Inclusión de Cobertura' }
    ]

    // -------------------------------------------------------------------------------------------
    // leemos los catálogos en el $scope
    // TODO: creo que no! cada scope puede tener un helper con los catálogos que necesite. Revisar ... 
    // TODO: no! los leemos aquí y usamos en cualquier children state ... 
    $scope.helpers({
        suscriptores: () => { return Suscriptores.find({}); },
        monedas: () => { return Monedas.find({}); },
        indoles: () => { return Indoles.find({}); },
        companias: () => { return Companias.find({}); },
        ramos: () => { return Ramos.find({}); },
        coberturas: () => { return Coberturas.find({}); },
        asegurados: () => { return Asegurados.find({}); },
        tiposFacultativo: () => { return TiposFacultativo.find({}); },
        tiposObjetoAsegurado: () => { return TiposObjetoAsegurado.find(); },  
    })

    $scope.nuevo0 = function () {

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa para agregar un nuevo registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                                    true);

            promise.then(
                function (resolve) {
                    $scope.nuevo();
                },
                function (err) {
                    return true;
                });

            return;
        }
        else { 
            $scope.nuevo();
        }
    }

    let cuotasSubscriptionHandle: any = null;

    $scope.nuevo = function () {
        $scope.id = "0"; 
        inicializarItem(); 
    }


    // para copiar el riesgo seleccionado en uno nuevo que el usuario pueda editar y grabar como uno diferente
    $scope.copiarEnUnNuevoRiesgo = function() {

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            DialogModal($modal, "<em>Riesgos - Copiar riesgo en uno nuevo ...</em>",
                                "Aparentemente, <em>se han efectuado cambios</em> en el registro.<br /><br />" +
                                "Por favor guarde estos cambios antes de intentar ejecutar esta función.",
                                false).then();
            return;
        }

        $scope.showProgress = true;

        let message = `Este proceso copiará el riesgo que ahora está en la página, a un nuevo riesgo. <br />
                       Desea continuar y crear un nuevo riesgo en base al que ahora está en la página?`; 
        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        DialogModal($modal, "<em>Riesgos</em>", message, true).then(
            function (resolve) {
                let result = riesgos_funcionesGenerales.copiarRiesgoEnUnoNuevo($scope.riesgo); 

                if (result.error) { 

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'alert',
                        msg: result.message
                    });

                    return; 
                }

                let message = result.message; 
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: message
                });

                // nótese como *sustituimos* el riesgo actual por el nuevo ... 
                $scope.riesgo = {}; 
                $scope.cuotas = [];         // nótese que las cuotas no se copian; el usuario debe construirlas nuevamente ... 

                $scope.riesgo = result.nuevoRiesgo; 

                $scope.showProgress = false;
                $scope.$apply();
        
                $scope.goToState('generales');
            },
            function (err) {
                $scope.showProgress = false;
                return true;
            }
        )
    } 


    $scope.renovarRiesgo = function() { 

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            DialogModal($modal, "<em>Riesgos - Renovar riesgo</em>",
                                "Aparentemente, <em>se han efectuado cambios</em> en el registro.<br /><br />" +
                                "Por favor guarde estos cambios antes de intentar ejecutar esta función.",
                                false).then();
            return;
        }

        $modal.open({
            templateUrl: 'client/imports/riesgos/renovarRiesgo/renovarRiesgoModal.html',
            controller: 'RenovarRiesgo_ModalController',
            size: 'md',
            resolve: {
                riesgoOriginal: function () {
                    return $scope.riesgo;
                },
                companiaSeleccionada: function () {
                    return $scope.companiaSeleccionada;
                },
            }
        }).result.then(
          function (resolve) {
              return true;
          },
          function (cancel) {
              return true;
          })
    }
            

    $scope.origen = $stateParams.origen;
    $scope.id = $stateParams.id;
    $scope.limit = parseInt($stateParams.limit);
    // nótese que el boolean value viene, en realidad, como un string ...
    $scope.vieneDeAfuera = ($stateParams.vieneDeAfuera == "true");    // por ejemplo: cuando se abre desde siniestros ...


    $scope.grabar = function () {

        // lo primero que hacemos es intentar validar el item ...
        if (!$scope.riesgo || !$scope.riesgo.docState) {
            DialogModal($modal, "<em>Riesgos</em>",
                                "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                false).then();
            return;
        }

        // cuando el usuario deja la referencia vacía, la determinamos al grabar; nótese que debemos agregar algo,
        // pues el campo es requerido
        if (!$scope.riesgo.referencia) {
            $scope.riesgo.referencia = '0';
        }

        $scope.showProgress = true;

        // nótese como validamos antes de intentar guardar en el servidor
        var isValid = false;
        var errores = [];
            
        if ($scope.riesgo.docState != 3) {
            isValid = Riesgos.simpleSchema().namedContext().validate($scope.riesgo);

            if (!isValid) {
                Riesgos.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Riesgos.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'." as never);
                })
            }
        }

        // ------------------------------------------------------------------------------------------
        //  validamos la información propia del ramo, si existe 
        let editedItems = $scope.riesgos_infoRamo.filter((c) => c.docState); 

        editedItems.forEach(function (item) {
            if (item.docState != 3) {

                // el schema que usemos depende del tipo de ramo ... 
                let ramo = Ramos.findOne($scope.riesgo.ramo); 

                if (ramo.tipoRamo) { 
                    switch(ramo.tipoRamo) { 
                        case "automovil": { 
                            isValid = Riesgo_InfoRamos_Autos_SimpleSchema.namedContext().validate(item);

                            if (!isValid) {
                                Riesgo_InfoRamos_Autos_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Riesgo_InfoRamos_Autos_SimpleSchema.label(error.name) + "'; error de tipo '" + error.type + "'." as never);
                                });
                            }

                            break; 
                        }
                    }
                }
                
            }
        })

        // ------------------------------------------------------------------------------------------
        // ahora validamos las cuotas, las cuales son registradas en un collection diferente ...
        editedItems = $scope.cuotas.filter((c: any) => c.docState); 

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = Cuotas.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    Cuotas.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Cuotas.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'." as never);
                    });
                }
            }
        })

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
            })

            $scope.showProgress = false;
            return;
        }

        let item = lodash.cloneDeep($scope.riesgo); 
        $scope.showProgress = true; 

        // nótese como pasamos la información del ramo, cuando existe ... 
        let editedInfoRamo = $scope.riesgos_infoRamo.filter((c: any) => c.docState); 
        Meteor.call('riesgos.save', item, editedInfoRamo, (err: any, resultRiesgo: any) => {

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

            // guardamos, separadamente, las cuotas (solo las que el usuario ha editado
            // nota: eliminamos $$hashKey a cada row (agregado por ui-grid),  antes de grabar en mongo
            var cuotasArray = $scope.cuotas.filter(c => c.docState);  

            Meteor.call('cuotasSave', cuotasArray, (err, resultCuotas) => {

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
                
                Meteor.subscribe('riesgos', JSON.stringify({ _id: item._id }), () => {
                    $scope.riesgo = {};

                        $scope.helpers({
                            riesgo: () => { 
                                return Riesgos.findOne(item._id); 
                            }, 
                        })

                        // el riesgo puede no existir más si el usuario lo eliminó ... 
                        $scope.id = $scope.riesgo ? $scope.riesgo._id : "";

                        Meteor.subscribe('cuotas', JSON.stringify({ "source.entityID": $scope.id }), () => {
                            $scope.helpers({
                                cuotas: () => { 
                                    return Cuotas.find({ 'source.entityID': $scope.id }); 
                                }, 
                            })

                            // refrescamos este helper ... 
                            $scope.helpers({
                                riesgos_infoRamo: () => { 
                                    return Riesgos_InfoRamo.find({ riesgoID: $scope.id });  
                                }, 
                            })

                            $scope.showProgress = false;
                            $scope.$apply();

                            $scope.alerts.length = 0;
                            $scope.alerts.push({
                                type: 'info',
                                msg: resultRiesgo.message
                            });

                            // vamos a generales para no tener que refrescar ningún ui-grid que pueda estar mostrado en este momento. 
                            // como no sabemos cual es el state activo, sería complicado averiguarlo y refrescar ui-grids para cada 
                            // uno ... no es la mejor solución, pero es una solución ... 
                            $scope.goToState('generales');
                        })
                })
            })
        })
    }

    $scope.regresarALista = function () {

        if ($scope.riesgo && $scope.riesgo.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                    true).then(
                function (resolve) {
                    $state.go('riesgosLista', { origen: $scope.origen, limit: $scope.limit });
                },
                function (err) {
                    return true;
                })
            return;
        }
        else { 
            $state.go('riesgosLista', { origen: $scope.origen, limit: $scope.limit });
        }
    }

    $scope.eliminar = function () {
        if ($scope.riesgo.docState && $scope.riesgo.docState == 1) {
            if ($scope.riesgo.docState) {
                var promise = DialogModal($modal,
                                        "<em>Riesgos</em>",
                                        "El registro es nuevo; para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                                        false);

                promise.then(
                    function (resolve) {
                        return;
                    },
                    function (err) {
                        return;
                    });

                return;
            }
        }

        // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
        $scope.riesgo.docState = 3;
    }

    $scope.refresh = function () {
        if ($scope.riesgo.docState) {
            var promise = DialogModal($modal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa y refresca el registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios?",
                                    true);

            promise.then(
                function (resolve) {
                    inicializarItem();
                },
                function () {
                    return true;
                });

            return;
        }
        else {
            inicializarItem();
        }
    }


    $scope.imprimir = function() {
        if (!$scope.riesgo || !$scope.riesgo.movimientos || lodash.isEmpty($scope.riesgo.movimientos)) {
            DialogModal($modal, "<em>Riesgos - Construcción de notas de cobertura</em>",
                        "Aparentemente, el riesgo para el cual Ud. desea construir las notas de cobertura, no tiene movimientos registrados.",
                        false).then();
            return;
        };

        $modal.open({
            templateUrl: 'client/imports/riesgos/imprimirNotasModal.html',
            controller: 'ImprimirNotasRiesgosModalController',
            size: 'lg',
            resolve: {
                riesgo: function () {
                    return $scope.riesgo;
                },
                tiposMovimiento: function() {
                    return $scope.tiposMovimiento;
                }
            }
        }).result.then(
        function () {
            return true;
        },
        function () {
            return true;
        })
    }

    

    $scope.notasDebito = function() {
        if (!$scope.riesgo || !$scope.riesgo.movimientos || lodash.isEmpty($scope.riesgo.movimientos)) {
            DialogModal($modal, "<em>Riesgos - Construcción de notas de débito</em>",
                        "Aparentemente, el riesgo para el cual Ud. desea construir las notas de débito, no tiene movimientos registrados.",
                        false).then();
            return;
        };

        $modal.open({
            templateUrl: 'client/riesgos/notasDebito/imprimirNotasDebitoModal.html',
            controller: 'ImprimirNotasDebitoModalController',
            size: 'lg',
            resolve: {
                riesgo: function () {
                    return $scope.riesgo;
                },
                cuotas: function() {
                    return $scope.cuotas;
                },
                tiposMovimiento: function() {
                    return $scope.tiposMovimiento;
                }
            }
        }).result.then(
        function () {
            return true;
        },
        function () {
            return true;
        })
    }

    $scope.registrarPersonasCompanias = function() {

        if (!$scope.riesgo || !$scope.riesgo.compania) {
            DialogModal($modal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. no ha seleccionado una compañía como cedente para este riesgo.<br />" +
                                "El riesgo debe tener una compañía cedente antes de intentar registrar sus personas.",
                                false).then();

            return;
        }

        $modal.open({
            templateUrl: 'client/generales/registrarPersonas.html',
            controller: 'RegistrarPersonasController',
            size: 'lg',
            resolve: {
                companias: function () {
                    let riesgo = $scope.riesgo;
                    let companias = [];

                    if (lodash.isArray(riesgo.personas)) {
                        riesgo.personas.forEach(persona => {
                            companias.push({ compania: persona.compania, titulo: persona.titulo, nombre: persona.nombre } as never);
                        });
                    }

                    // ahora revisamos las compañías en el riesgo y agregamos las que *no* existan en el array de compañías
                    if (!lodash.some(companias, (c: any) => { return c.compania == riesgo.compania; } )) { 
                        companias.push({ compania: riesgo.compania } as never);
                    }
                        
                    if (lodash.isArray(riesgo.movimientos)) {
                        riesgo.movimientos.forEach(movimiento => {
                        if (lodash.isArray(movimiento.companias)) {
                            movimiento.companias.forEach(r => {
                                if (!r.nosotros) { 
                                    if (!lodash.some(companias, (c: any) => { return c.compania == r.compania; } )) { 
                                        companias.push({ compania: r.compania } as never);
                                    } 
                                }
                            })
                        }
                        })
                    }

                    return companias;
                }
            }
        }).result.then(
            function (resolve) {
                return true;
            },
            function (cancel) {
                // recuperamos las personas de compañías, según las indicó el usuario en el modal
                if (cancel.entityUpdated) {
                    let companias = cancel.companias;
                    $scope.riesgo.personas = [];

                    if (lodash.isArray(companias)) {
                        for (let compania of companias) { 
                            if (compania.titulo && compania.nombre) { 
                                $scope.riesgo.personas.push({
                                    compania: compania.compania,
                                    titulo: compania.titulo,
                                    nombre: compania.nombre, 
                                })
                            }
                        }
                    }

                    if (!$scope.riesgo.docState) { 
                        $scope.riesgo.docState = 2;
                    }
                }

                return true;
            }
        )
    }

    // ---------------------------------------------------------------------
    // para registrar los documentos (ej: póliza) del riesgo
    // ---------------------------------------------------------------------
    $scope.registroDocumentos = function() {

        $modal.open({
            templateUrl: 'client/generales/registroDocumentos.html',
            controller: 'RegistroDocumentosController',
            size: 'md',
            resolve: {
                entidad: function () {
                    return $scope.riesgo;
                },
                documentos: function () {
                    if (!lodash.isArray($scope.riesgo.documentos)) { 
                        $scope.riesgo.documentos = [];
                    }
                    
                    return $scope.riesgo.documentos;
                },
                tiposDocumentoLista: function () {
                    return [ { tipo: 'POL', descripcion: 'Póliza'} ];
                }
            }
        }).result.then(
            function (resolve) {
                return true;
            },
            function (cancel) {
                return true;
            });
    }

    $scope.registroCumulos = function() {

        if (!$scope.movimientoSeleccionado || lodash.isEmpty($scope.movimientoSeleccionado)) {
            DialogModal($modal, "<em>Riesgos - Cúmulos - Registro</em>",
                                "Aparentemente, Ud. <em>no ha seleccionado</em> un movimiento.<br />" +
                                "Debe seleccionar un movimiento antes de intentar abrir el registro de cúmulos.",
                                false).then();

            return;
        }

        // movimientoSeleccionado es inicializado en $scope.$parent cuando se selecciona un movimiento; luego está disponible en los 
        // (children) controllers una vez que se ha inializado ... 
        let riesgo = $scope.riesgo; 
        let movimiento = $scope.movimientoSeleccionado; 

        let valoresARiesgo = 0; 
        let sumaAsegurada = 0; 
        let prima = 0; 
        let nuestraOrdenPorc = 0; 
        let sumaReasegurada = 0; 
        let primaBruta = 0; 
              
        // determinamos nuestra orden 
        if (movimiento.companias) { 
            nuestraOrdenPorc = movimiento.companias.find(x => x.nosotros).ordenPorc;
        }

        if (movimiento.coberturas) { 
            valoresARiesgo = lodash.round(lodash.sumBy(movimiento.coberturas, 'valorARiesgo'), 2); 
            sumaAsegurada = lodash.round(lodash.sumBy(movimiento.coberturas, 'sumaAsegurada'), 2); 
            prima = lodash.round(lodash.sumBy(movimiento.coberturas, 'prima'), 2); 
            sumaReasegurada = lodash.round(sumaAsegurada * nuestraOrdenPorc / 100, 2);  
            primaBruta = lodash.round(prima * nuestraOrdenPorc / 100, 2);  
        }

        let reaseguradores = []; 

        if (movimiento.companias) { 
            movimiento.companias.filter(x => !x.nosotros).forEach((x) => { 
                reaseguradores.push({ 
                    _id: new Mongo.ObjectID()._str,
                    compania: x.compania, 
                    ordenPorc: x.ordenPorc, 
                } as never); 
            })
        }

        let infoCumulos = {

            _id: new Mongo.ObjectID()._str,

            source : {
                entityID : riesgo._id,
                subEntityID : movimiento._id,
                origen : "fac",
                numero : `${riesgo.numero}-${movimiento.numero}`
            },
            
            desde: movimiento.desde, 
            hasta: movimiento.hasta, 
            tipoCumulo: null, 
            zona: null, 
            moneda: riesgo.moneda,  
            cedente: riesgo.compania, 
            indole: riesgo.indole, 
            ramo: riesgo.ramo,  
            tipoObjetoAsegurado: riesgo.objetoAsegurado && riesgo.objetoAsegurado.tipo ? riesgo.objetoAsegurado.tipo : null,  

            valoresARiesgo: valoresARiesgo, 
            sumaAsegurada: sumaAsegurada,  
            prima: prima,  
            nuestraOrdenPorc: nuestraOrdenPorc,  
            sumaReasegurada: sumaReasegurada, 
            primaBruta: primaBruta,  

            reaseguradores: reaseguradores, 

            cia: $scope.companiaSeleccionada._id, 
        }; 

        $modal.open({
            templateUrl: 'client/imports/generales/cumulos/registro/registroCumulos.html',
            controller: 'RegistroCumulos_Controller',
            size: 'lg',
            resolve: {
                infoCumulos: function () {
                    return infoCumulos;
                },
                origen: function() { 
                    return $scope.origen;           // edición / consulta 
                }, 
                companiaSeleccionada: function() { 
                    return $scope.companiaSeleccionada; 
                }
            }
        }).result.then(
            function (resolve) {
                return true;
            },
            function (cancel) {
                return true;
            });
    }

    // -------------------------------------------------------------------------
    // para inicializar el item (en el $scope) cuando el usuario abre la página
    // -------------------------------------------------------------------------
    function inicializarItem() {
        if ($scope.id == "0") {
            // el id viene en '0' cuando el usuario hace un click en Nuevo ...
            $scope.riesgo = {
                _id: new Mongo.ObjectID()._str,
                numero: 0,
                ingreso: new Date(),
                usuario: Meteor.userId(),
                cia: $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : null,
                movimientos: [],
                docState: 1
            };

            // solo para crear el array en $scope ... 
            $scope.helpers({
                riesgos_infoRamo: () => { 
                    return Riesgos_InfoRamo.find({ riesgoID: $scope.id });  
                }, 
            })

            // aunque no existen cuotas para el riesgo, pues es nuevo, hacemos el subscribe para que las cuotas regresen
            // una vez grabadas al servidor (regresen como se han grabado; por ejemplo, sin 'docState')
            $scope.showProgress = true;

            if (cuotasSubscriptionHandle) {
                cuotasSubscriptionHandle.stop();
            }

            $scope.cuotas = [];

            // para leer el último cierre efectuado 
            Meteor.subscribe('cierre', () => { 
                Meteor.subscribe('autosMarcas', () => {

                    $scope.helpers({
                        autosMarcas: () => { 
                            return AutosMarcas.find(); 
                        }, 
                    })
                    
                    $scope.alerts.length = 0;
                    $scope.goToState('generales');

                    $scope.showProgress = false;
                })
            })
        }
        else {
            $scope.showProgress = true;
            $scope.riesgo = {};

            if ($scope.vieneDeAfuera) {
                // commo el riesgo se consulta 'desde afuera', no se aplicó el filtro en forma normal y
                // no se hizo el subscribe; por lo tanto, lo más seguro es que el riesgo no exista en minimongo ...
                var filtro = { _id: $scope.id };
                Meteor.subscribe('riesgos', JSON.stringify(filtro), () => {

                    $scope.helpers({
                        riesgo: () => { 
                            return Riesgos.findOne($scope.id); 
                        }, 
                    })

                    if (cuotasSubscriptionHandle) {
                        cuotasSubscriptionHandle.stop();
                    }

                    cuotasSubscriptionHandle = Meteor.subscribe('cuotas', JSON.stringify({ "source.entityID": $scope.id }), () => {

                        $scope.helpers({
                            cuotas: () => { 
                                return Cuotas.find({ 'source.entityID': $scope.id }); 
                            }, 
                        })

                        Meteor.subscribe('riesgos_infoRamo', $scope.id, () => {

                            $scope.helpers({
                                riesgos_infoRamo: () => { 
                                    return Riesgos_InfoRamo.find({ riesgoID: $scope.id });  
                                }, 
                            })

                            Meteor.subscribe('autosMarcas', () => {

                                $scope.helpers({
                                    autosMarcas: () => { 
                                        return AutosMarcas.find();  
                                    }, 
                                })

                                // leemos las notas de débito registradas para el riesgo; pasamos null como 2do parametro pues 
                                // queremos todas las notas para el riegso y no las de algún movimiento en particular ... 
                                Meteor.subscribe('notasDebitoCredito', $scope.riesgo._id, null);
                                
                                $scope.helpers({
                                    notasDebitoCredito: () => { 
                                        return NotasDebitoCredito.find();  
                                    }, 
                                })

                                $scope.alerts.length = 0;
                                $scope.goToState('generales');
        
                                $scope.showProgress = false;
                            })
                        })
                    })
                })
            }
            else {
                // antes el usuario indicaba un filtro y se leían y publicaban los riesgos; todos los
                // riesgos seleccionados estaban en minimongo. Ahora, los riesgos seleccionados se
                // graban a un collection 'temp'; por eso, aquí también hay que suscribir al riesgo
                // que el usuario seleccione en la lista ...
                var filtro = { _id: $scope.id };
                Meteor.subscribe('riesgos', JSON.stringify(filtro), () => {
                    
                    $scope.helpers({
                        riesgo: () => { 
                            return Riesgos.findOne($scope.id); 
                        }, 
                    })

                    if (cuotasSubscriptionHandle) {
                        cuotasSubscriptionHandle.stop();
                    }

                    cuotasSubscriptionHandle = 
                    Meteor.subscribe('cuotas', JSON.stringify({ "source.entityID": $scope.id }), () => {

                        $scope.helpers({
                            cuotas: () => { 
                                return Cuotas.find({ 'source.entityID': $scope.id }); 
                            }, 
                        })

                        Meteor.subscribe('riesgos_infoRamo', $scope.id, () => {

                            $scope.helpers({
                                riesgos_infoRamo: () => { 
                                    return Riesgos_InfoRamo.find({ riesgoID: $scope.id });  
                                }, 
                            })

                            Meteor.subscribe('autosMarcas', () => {

                                $scope.helpers({
                                    autosMarcas: () => { 
                                        return AutosMarcas.find();  
                                    }, 
                                })

                                // leemos las notas de débito registradas para el riesgo; pasamos null como 2do parametro pues 
                                // queremos todas las notas para el riegso y no las de algún movimiento en particular ... 
                                Meteor.subscribe('notasDebitoCredito', $scope.riesgo._id, null);
                                
                                $scope.helpers({
                                    notasDebitoCredito: () => { 
                                        return NotasDebitoCredito.find();  
                                    }, 
                                })
                                
                                $scope.alerts.length = 0;
                                $scope.goToState('generales');
        
                                $scope.showProgress = false;
                            })
                        })
                    })
                })
            }
        }
    }

    inicializarItem();
  
    // definimos en el $parent para que esté disponible en todos los states 
    $scope.movimientoSeleccionado = {}; 
}
])