
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

import lodash from 'lodash';
import angular from 'angular';

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { Riesgos, Riesgos_InfoRamo, Riesgo_InfoRamos_Autos_SimpleSchema } from '/imports/collections/principales/riesgos'; 
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Cuotas } from '/imports/collections/principales/cuotas'; 
import { TiposFacultativo } from '/imports/collections/catalogos/tiposFacultativo'; 
import { TiposObjetoAsegurado } from '/imports/collections/catalogos/tiposObjetoAsegurado'; 
import { AutosMarcas } from '/imports/collections/catalogos/autosMarcas'; 

import { Coberturas } from '/imports/collections/catalogos/coberturas'; 
import { Indoles } from '/imports/collections/catalogos/indoles'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { NotasDebitoCredito } from '/imports/collections/principales/notasDebitoCredito'; 
import { LeerCompaniaNosotros } from '/imports/generales/leerCompaniaNosotros'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

// esto es un angular module 
// import '../generales/agregarNuevoAsegurado.html';           // html: el path *debe* ser relativo y *no* absoluto (???!!!)        
import AgregarNuevoAsegurado from "../generales/agregarNuevoAseguradoController"; 

// importamos el resto del código, otros states, html files etc., que se necesitan para manejar el riesgo 
// import './riesgo.generales.html';
import RiesgosGenerales from '/client/imports/riesgos/riesgo.generales';

// import './riesgo.movimientos.html';
import RiesgoMovimientos from '/client/imports/riesgos/riesgo.movimientos'; 

// import './riesgo.infoRamo_autos.html';
import RiesgosInfoRamo from '/client/imports/riesgos/riesgo.infoRamo_autos'; 

// import './riesgo.productores.html';
import RiesgoProductores from '/client/imports/riesgos/riesgo.productores'; 

// import './riesgo.cuotas.html';
import RiesgoCuotas from './riesgo.cuotas'; 

// para imprimir las cuotas; obtener las notas de cobertura 
// import './imprimirNotasModal.html';
import RiesgoImprimirNotasCobertura from './imprimirNotasModalController'; 

// para hacer la renovación de un riesgo 
import renovarRiesgo_htmlTemplate from './renovarRiesgo/renovarRiesgoModal.html';
import RenovarRiesgo from './renovarRiesgo/renovarRiesgoController';

// para hacer el 'download to disk' del riesgo 
import DownloadRiesgoToDisk from './downloadRiesgo/downloadRiesgo'; 
import downloadToDisk_htmlTemplate from './downloadRiesgo/downloadRiesgo.html'; 

// construir notas de débito 
// import './notasDebito/notasDebito.html';
import ConstruirNotasDebito from './notasDebito/notasDebito'; 

export default angular.module("scrwebm.riesgos.riesgo", [ 'angular-meteor', 
                                                           AgregarNuevoAsegurado.name, RiesgosGenerales.name, 
                                                           RiesgoMovimientos.name, RiesgosInfoRamo.name, 
                                                           RiesgoProductores.name, RiesgoCuotas.name, 
                                                           RiesgoImprimirNotasCobertura.name, RenovarRiesgo.name, 
                                                           ConstruirNotasDebito.name, DownloadRiesgoToDisk.name
])
                       .controller("Riesgo_Controller", ['$scope', '$state', '$stateParams', '$uibModal', '$location', 
function ($scope, $state, $stateParams, $uibModal, $location) {

    $scope.showProgress = true;

    // para mostrar spinner cuando se ejecuta el search en el (bootstrap) ui-select 
    $scope.uiSelectLoading_companias = false; 
    $scope.uiSelectLoading_cedenteOriginal = false; 
    $scope.uiSelectLoading_corredores = false; 
    $scope.uiSelectLoading_ramos = false; 
    $scope.uiSelectLoading_indoles = false;     

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const empresaUsuariaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {}; 

    if (empresaUsuariaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(empresaUsuariaSeleccionada.companiaID, { fields: { nombre: 1 } });
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
            const ramo = $scope.ramos.find(x => x._id === $scope.riesgo.ramo); 

            if (ramo) { 
                const tipoRamo = ramo.tipoRamo ? ramo.tipoRamo : ""; 
                switch (tipoRamo) { 
                    case "automovil": { 
                        $state.go("riesgo.infoRamo_autos");
                        break; 
                    }
                    default: { 
                        DialogModal($uibModal,
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
            const promise = DialogModal($uibModal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa para agregar un nuevo registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                                    true);

            promise.then(
                function () {
                    $scope.nuevo();
                },
                function () {
                    return true;
                });

            return;
        }
        else { 
            $scope.nuevo();
        }
    }

    let cuotasSubscriptionHandle = null;

    $scope.nuevo = function () {
        $scope.id = "0"; 
        inicializarItem(); 
    }

    $scope.DownloadToDisk = function () {

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            DialogModal($uibModal, "<em>Riesgos - Download</em>",
                "Aparentemente, <em>se han efectuado cambios</em> en el registro.<br /><br />" +
                "Por favor guarde estos cambios antes de intentar ejecutar esta función.",
                false).then();
            return;
        }

        $uibModal.open({
            templateUrl: downloadToDisk_htmlTemplate,
            controller: 'DownloadRiesgoToDisk_ModalController',
            size: 'md',
            resolve: {
                riesgoOriginal: function () {
                    return $scope.riesgo;
                }, 
                riesgos_infoRamo: function() { 
                    return $scope.riesgos_infoRamo ? $scope.riesgos_infoRamo : []; 
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

    $scope.renovarRiesgo = function() { 

        if ($scope.riesgo.docState && $scope.origen == 'edicion') {
            DialogModal($uibModal, "<em>Riesgos - Renovar riesgo</em>",
                                "Aparentemente, <em>se han efectuado cambios</em> en el registro.<br /><br />" +
                                "Por favor guarde estos cambios antes de intentar ejecutar esta función.",
                                false).then();
            return;
        }

        $uibModal.open({
            templateUrl: renovarRiesgo_htmlTemplate,
            controller: 'RenovarRiesgo_ModalController',
            size: 'md',
            resolve: {
                riesgoOriginal: function () {
                    return $scope.riesgo;
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

    $scope.origen = $stateParams.origen;
    $scope.id = $stateParams.id;
    $scope.limit = parseInt($stateParams.limit);
    // nótese que el boolean value viene, en realidad, como un string ...
    $scope.vieneDeAfuera = ($stateParams.vieneDeAfuera == "true");    // por ejemplo: cuando se abre desde siniestros ...


    $scope.grabar = function () {

        // lo primero que hacemos es intentar validar el item ...
        if (!$scope.riesgo || !$scope.riesgo.docState) {
            DialogModal($uibModal, "<em>Riesgos</em>",
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

        // nótese como validamos antes de intentar guardar en el server
        let isValid = false;
        const errores = [];
            
        if ($scope.riesgo.docState != 3) {
            isValid = Riesgos.simpleSchema().namedContext().validate($scope.riesgo);

            if (!isValid) {
                Riesgos.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Riesgos.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
                })
            }
        }

        // ------------------------------------------------------------------------------------------
        //  validamos la información propia del ramo, si existe 
        let editedItems = $scope.riesgos_infoRamo.filter((c) => c.docState); 

        editedItems.forEach(function (item) {
            if (item.docState != 3) {

                // el schema que usemos depende del tipo de ramo ... 
                const ramo = Ramos.findOne($scope.riesgo.ramo); 

                if (ramo.tipoRamo) { 
                    switch(ramo.tipoRamo) { 
                        case "automovil": { 
                            isValid = Riesgo_InfoRamos_Autos_SimpleSchema.namedContext().validate(item);

                            if (!isValid) {
                                Riesgo_InfoRamos_Autos_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Riesgo_InfoRamos_Autos_SimpleSchema.label(error.name) + "'; error de tipo '" + error.type + "'.");
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
        editedItems = $scope.cuotas.filter((c) => c.docState); 

        editedItems.forEach(function (item) {
            if (item.docState != 3) {
                isValid = Cuotas.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    Cuotas.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Cuotas.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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

        const item = lodash.cloneDeep($scope.riesgo); 
        $scope.showProgress = true; 

        // nótese como pasamos la información del ramo, cuando existe ... 
        const editedInfoRamo = $scope.riesgos_infoRamo.filter((c) => c.docState); 
        Meteor.call('riesgos.save', item, editedInfoRamo, (err, resultRiesgo) => {

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

            // guardamos, separadamente, las cuotas (solo las que el usuario ha editado
            // nota: eliminamos $$hashKey a cada row (agregado por ui-grid),  antes de grabar en mongo
            const cuotasArray = $scope.cuotas.filter(c => c.docState);  

            Meteor.call('cuotasSave', cuotasArray, (err) => {

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
            DialogModal($uibModal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                    true).then(
                function () {
                    $state.go('riesgosLista', { origen: $scope.origen, limit: $scope.limit });
                },
                function () {
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
                const promise = DialogModal($uibModal,
                                        "<em>Riesgos</em>",
                                        "El registro es nuevo; para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                                        false);

                promise.then(
                    function () {
                        return;
                    },
                    function () {
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
            const promise = DialogModal($uibModal,
                                    "<em>Riesgos</em>",
                                    "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa y refresca el registro, " +
                                    "los cambios se perderán.<br /><br />Desea continuar y perder los cambios?",
                                    true);

            promise.then(
                function () {
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
            DialogModal($uibModal, "<em>Riesgos - Construcción de notas de cobertura</em>",
                        "Aparentemente, el riesgo para el cual Ud. desea construir las notas de cobertura, no tiene movimientos registrados.",
                        false).then();
            return;
        }

        $uibModal.open({
            templateUrl: 'client/html/riesgos/imprimirNotasModal.html',
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
            DialogModal($uibModal, "<em>Riesgos - Construcción de notas de débito</em>",
                        "Aparentemente, el riesgo para el cual Ud. desea construir las notas de débito, no tiene movimientos registrados.",
                        false).then();
            return;
        }

        $uibModal.open({
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
            DialogModal($uibModal, "<em>Riesgos</em>",
                                "Aparentemente, Ud. no ha seleccionado una compañía como cedente para este riesgo.<br />" +
                                "El riesgo debe tener una compañía cedente antes de intentar registrar sus personas.",
                                false).then();

            return;
        }

        $uibModal.open({
            templateUrl: 'client/imports/generales/registrarPersonasAEntidad/registrarPersonas.html',
            controller: 'RegistrarPersonasController',
            size: 'lg',
            resolve: {
                companias: () => { 
                    // pasamos un array con las compañías que se han definido para el riesgo (ced y reasegs)
                    const companias = []; 
                    const riesgo = $scope.riesgo; 

                    companias.push(riesgo.compania);
                    
                    const movimientos = riesgo.movimientos ? riesgo.movimientos : []; 

                    movimientos.forEach(m => { 
                        m.companias && m.companias.forEach(c => { 
                            if (!c.nosotros) { 
                                // normalmente, un riesgo tiene varios movimientos; las companias se repiten 
                                // en los movimientos 
                                if (!companias.some(x => x.compania === c.compania)) { 
                                    companias.push(c.compania);
                                }
                            }
                        })
                    })

                    return companias; 
                }, 
                personas: function () {
                    // pasamos un array con las personas (si hay) asociadas al riesgo 
                    const riesgo = $scope.riesgo;
                    return riesgo && riesgo.personas ? riesgo.personas : [];
                }
            }
        }).result.then(
            function (result) {
                // recuperamos las personas de compañías, según las indicó el usuario en el modal
                if (result.personas.some(x => x.docState)) {
                    // sustituimos las personas en el riesgo por las recibidas desde el modal 
                    $scope.riesgo.personas = [];
                    const personas = result.personas && Array.isArray(result.personas) ? result.personas : []; 
                    personas.forEach(p => $scope.riesgo.personas.push(p)); 

                    if (!$scope.riesgo.docState) {
                        $scope.riesgo.docState = 2;
                    }
                }

                return true;
            },
            function () {
                return true; 
            }
        )
    }

    // ---------------------------------------------------------------------
    // para registrar los documentos (ej: póliza) del riesgo
    // ---------------------------------------------------------------------
    $scope.registroDocumentos = function() {

        $uibModal.open({
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
            function () {
                return true;
            },
            function () {
                return true;
            });
    }

    $scope.registroCumulos = function() {

        if ($scope?.riesgo?.docState) {
            DialogModal($uibModal, "<em>Riesgos - Cúmulos - Registro</em>",
                `Aparentemente, el riesgo ha recibido modificaciones que no han sido grabadas. <br />
                 Ud. debe hacer un <em>click</em> en <em>Grabar</em> para guardar las modificaciones efectuadas,
                 antes de intentar ejecutar esta función. 
                `,
                false).then();
            return;
        }

        if (!$scope.riesgo || !$scope.riesgo.movimientos || !Array.isArray($scope.riesgo.movimientos) || !$scope.riesgo.movimientos.length) {
            DialogModal($uibModal, "<em>Riesgos - Cúmulos - Registro</em>",
                `Aparentemente, el riesgo no tiene movimientos registrados. <br />
                 El riesgo debe tener movimientos registrados para que la opción al registro de cúmulos esté disponible. 
                `,
                false).then();
            return;
        }

        // movimientoSeleccionado es inicializado en $scope.$parent cuando se selecciona un movimiento; luego está disponible en los 
        // (children) controllers una vez que se ha inializado ... 
        const riesgo = $scope.riesgo; 
        const movimiento = $scope.movimientoSeleccionado; 
 
        // aquí debemos ir al state: 'cumulos.registro'; desde este state se monta el angular component
        // RegistroCumulos, que es un angular component, que monta, a su vez, un react component del mismo nombre 
        $state.go('cumulos.registro', { modo: $scope.origen,                // edicion / consulta 
                                        origen: 'fac', 
                                        entityId: riesgo._id, 
                                        subEntityId: movimiento?._id, 
                                        url: $location.url() });
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
                usuario: Meteor.user().emails[0].address,
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

            Meteor.subscribe('autosMarcas', () => {

                $scope.helpers({
                    autosMarcas: () => { 
                        return AutosMarcas.find(); 
                    }, 
                })
                
                $state.go('riesgo.generales').then(() => { 

                    const inputFecha = document.getElementById("suscriptor"); 
                    if (inputFecha) { 
                        inputFecha.focus(); 
                    }

                    $scope.showProgress = false;
                    $scope.alerts.length = 0;
                })
            })
        }
        else {
            $scope.showProgress = true;
            $scope.riesgo = {};

            if ($scope.vieneDeAfuera) {
                // commo el riesgo se consulta 'desde afuera', no se aplicó el filtro en forma normal y
                // no se hizo el subscribe; por lo tanto, lo más seguro es que el riesgo no exista en minimongo ...
                const filtro = { _id: $scope.id };
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
                                Meteor.subscribe('notasDebitoCredito', $scope.riesgo._id, null, () => { 

                                    // ------------------------------------------------------------------------------------------------------------
                                    // finalmente, suscribimos a los datos 'iniciales' necesarios para mostrar el riesgo; comúnmente, son los 
                                    // catálogos, como: compañía, moneda, banco, cuenta bancaria ... 
                                    Meteor.subscribe('riesgo.loadInitialData', $scope.riesgo.compania, 
                                                                               $scope.riesgo.ramo, 
                                                                               $scope.riesgo.corredor, 
                                                                               $scope.riesgo.indole, 
                                                                               () => {

                                            $scope.helpers({
                                                indoles: () => { return Indoles.find({}); },
                                                companias: () => { return Companias.find({}); },
                                                ramos: () => { return Ramos.find({}); },
                                            })

                                            $scope.helpers({
                                                notasDebitoCredito: () => {
                                                    return NotasDebitoCredito.find();
                                                },
                                            })

                                            $state.go('riesgo.generales').then(() => { 

                                                const inputFecha = document.getElementById("suscriptor"); 
                                                if (inputFecha) { 
                                                    inputFecha.focus(); 
                                                }

                                                $scope.showProgress = false;
                                                $scope.alerts.length = 0;
                                            })
                                        })
                                })
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
                const filtro = { _id: $scope.id };
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
                                Meteor.subscribe('notasDebitoCredito', $scope.riesgo._id, null, () => { 

                                    Meteor.subscribe('riesgo.loadInitialData', $scope.riesgo.compania, 
                                                                               $scope.riesgo.ramo, 
                                                                               $scope.riesgo.corredor, 
                                                                               $scope.riesgo.indole, 
                                                                               () => {

                                        $scope.helpers({
                                            indoles: () => { return Indoles.find({}); },
                                            companias: () => { return Companias.find({}); },
                                            ramos: () => { return Ramos.find({}); },
                                        })

                                        $scope.helpers({
                                            notasDebitoCredito: () => {
                                                return NotasDebitoCredito.find();
                                            },
                                        })

                                        $state.go('riesgo.generales').then(() => { 

                                            const inputFecha = document.getElementById("suscriptor"); 
                                            if (inputFecha) { 
                                                inputFecha.focus(); 
                                            }

                                            $scope.showProgress = false;
                                            $scope.alerts.length = 0;
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            }
        }
    }

    $scope.importFromJson = function() { 
        // leemos algún riesgo que se haya exportado antes (con un Download) y lo agregamos como un riesgo nuevo ... 
        const inputFile = angular.element("#fileInput");
        if (inputFile) { 
            inputFile.click();        // simulamos un click al input (file)
        }
    }

    $scope.uploadFile = function(files) {

        if (!$scope.riesgo || !$scope.riesgo.docState || $scope.riesgo.docState != 1) {
            DialogModal($uibModal, "<em>Riesgos - Download</em>",
                                `Aparentemente, el riesgo que <em>recibirá la copia</em> <b>no es nuevo</b> (ya existía).<br /> 
                                 Ud. debe importar un riesgo siempre en un riesgo <b>nuevo</b>; es decir, 
                                 <b>no</b> en uno que ya exista.<br />
                                 Haga <em>click</em> en <em>Nuevo</em> para crear un nuevo registro; luego haga <em>click</em> en 
                                 <em>Importar</em> para importar el riesgo original. 
                                `,
                                false).then();

            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) { 
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }
                
            return;
        }

        const userSelectedFile = files[0];

        if (!userSelectedFile) {
            DialogModal($uibModal, "<em>Riesgos - Download</em>",
                                `Aparentemente, Ud. no ha seleccionado un archivo.<br />
                                 Ud. debe seleccionar un archivo que haya sido creado antes 
                                 mediante la opción <em>Download</em>, que existe en este mismo menú.`,
                                false).then();

            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) { 
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }
                
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            
            // esta función importa (merge) el contenido del archivo, que es un json, al riesgo en el $scope ... 
            const result = importarRiesgoFromTextFile(e, $scope.companiaSeleccionada); 

            const inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) { 
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }

            $scope.alerts.length = 0;
            const alertType = result.error ? 'danger' : 'info'; 

            $scope.alerts.push({
                type: alertType,
                msg: result.message
            });

            $scope.riesgo = result.riesgo; 
            $scope.riesgos_infoRamo = result.riesgos_infoRamo; 
                
            $scope.$apply();
        }

        reader.readAsText(userSelectedFile);
    }

    inicializarItem();
  
    // definimos en el $parent para que esté disponible en todos los states 
    $scope.movimientoSeleccionado = {}; 

    // para hacer el search de las compañías desde el server 
    $scope.searchCompanias = (search) => {

        $scope.uiSelectLoading_companias = true;

        Meteor.subscribe("search.companias", search, () => {

            $scope.helpers({
                companias: () => Companias.find()
            })

            $scope.uiSelectLoading_companias = false;
            $scope.$apply();
        })
    }

    $scope.searchCorredores = (search) => {

        $scope.uiSelectLoading_corredores = true;

        Meteor.subscribe("search.companias", search, () => {

            $scope.helpers({
                companias: () => Companias.find()
            })

            $scope.uiSelectLoading_corredores = false;
            $scope.$apply();
        })
    }

    $scope.searchCompaniasCedentes = (search) => {

        $scope.uiSelectLoading_cedenteOriginal = true;

        Meteor.subscribe("search.companias", search, () => {

            $scope.helpers({
                companias: () => Companias.find()
            })

            $scope.uiSelectLoading_cedenteOriginal = false;
            $scope.$apply();
        })
    }

    $scope.searchRamos = (search) => {

        $scope.uiSelectLoading_ramos = true;

        Meteor.subscribe("search.ramos", search, () => {

            $scope.helpers({
                ramos: () => Ramos.find()
            })

            $scope.uiSelectLoading_ramos = false;
            $scope.$apply();
        })
    }

    $scope.searchIndoles = (search) => {

        $scope.uiSelectLoading_indoles = true;

        Meteor.subscribe("search.indoles", search, () => {

            $scope.helpers({
                indoles: () => Indoles.find()
            })

            $scope.uiSelectLoading_indoles = false;
            $scope.$apply();
        })
    }
}])

function importarRiesgoFromTextFile(e, companiaSeleccionada) { 

    // esta función recibe un riesgo que fue exportado a un archivo de texto; la idea es permitir crear un nuevo en base 
    // al que fue exportado antes. 

    let riesgos_infoRamo = []; 
    let riesgo = {}; 
    let empresaUsuariaDiferente = false; 

    try {
        const content = e.target.result;
        const riesgoJson = JSON.parse(content);

        // con el riesgo en json viene la información del ramo, si existe (no siempre existe) 
        if (riesgoJson.riesgos_infoRamo) { 
            riesgos_infoRamo = riesgoJson.riesgos_infoRamo; 
            delete riesgoJson.riesgos_infoRamo; 
        }

        // hacemos un merge del objeto que el usuario importa
        riesgo = Object.assign({}, riesgoJson);         // to clone an object 

        // determinamos si el riesgo que estamos importando se registró bajo una empresa usuaria diferente 
        if (riesgo.cia != companiaSeleccionada._id) { 
            empresaUsuariaDiferente = true; 
        }

        // usamos un nuevo _id; además, ponemos el numero en cero 
        riesgo._id = new Mongo.ObjectID()._str;
        riesgo.numero = 0;
        riesgo.referencia = null; 
        riesgo.ingreso = new Date();
        riesgo.usuario = Meteor.userId();
        riesgo.cia = companiaSeleccionada && companiaSeleccionada._id ? companiaSeleccionada._id : null;
        riesgo.docState  = 1; 

        riesgo.ultAct = null; 
        riesgo.ultUsuario = null; 

        // nótese como las fechas vienen como strings (pues hicimos un json.parse del objecto original)
        riesgo.desde = new Date(riesgo.desde); 
        riesgo.hasta = new Date(riesgo.hasta); 

        if (riesgo.documentos) { 
            riesgo.documentos.forEach((x) => x._id = new Mongo.ObjectID()._str); 
        }

        // siempre eliminamos alguna información de renovación que pueda existir en el riesgo de origen 
        riesgo.renovacion = {}; 

        for (const movimiento of riesgo.movimientos) { 
            // guardamos el _id original del movimiento, para asignarlo en el array de info del ramo (si existe) ... 
            const movimiento_id_original = movimiento._id; 

            movimiento._id = new Mongo.ObjectID()._str;
            movimiento.fechaEmision = new Date(movimiento.fechaEmision); 
            movimiento.desde = new Date(movimiento.desde); 
            movimiento.hasta = new Date(movimiento.hasta); 

            // cambiamos el _id en cada array; la idea es que no sean los mismos que en riesgo original 
            if (movimiento.companias) { 
                movimiento.companias.forEach((x) => x._id = new Mongo.ObjectID()._str); 
            }

            if (movimiento.coberturas) { 
                movimiento.coberturas.forEach((x) => x._id = new Mongo.ObjectID()._str); 
            }

            if (movimiento.coberturasCompanias) { 
                movimiento.coberturasCompanias.forEach((x) => x._id = new Mongo.ObjectID()._str); 
            }

            if (movimiento.primas) { 
                movimiento.primas.forEach((x) => x._id = new Mongo.ObjectID()._str); 
            }

            if (movimiento.productores) { 
                movimiento.productores.forEach((x) => x._id = new Mongo.ObjectID()._str); 
            }

            if (movimiento.documentos) { 
                movimiento.documentos.forEach((x) => x._id = new Mongo.ObjectID()._str); 
            }

            // cambiamos los _ids en la info del ramo, si existe 
            riesgos_infoRamo.filter((x) => x.movimientoID === movimiento_id_original).forEach((x) => { 
                // aquí tenemos los items para el movimiento que estamos tratando; cambiamos los _ids que lo identifican 
                // como parte del riesgo y movimiento ... 
                x._id = new Mongo.ObjectID()._str; 
                x.movimientoID = movimiento._id; 
                x.riesgoID = riesgo._id; 
            }) 
        }

        if (empresaUsuariaDiferente) { 
            // el riesgo viene de otra empresa usuaria; cambiamos la compañía 'nosotros' ... 
            // leemos la compañía 'nosotros' definida para el usuario, para usarla en el nuevo riesgo que se ha importado 
            let companiaNosotros = {};
            const result = LeerCompaniaNosotros(Meteor.userId()); 

            if (result.error) {
                const message = `<em>Riesgos - Error al intentar leer la compañía 'nosotros'</em><br /> ${result.message}`; 

                return { 
                    error: true, 
                    message: message
                }
            }

            companiaNosotros = result.companiaNosotros;  

            // ok, ya tenemos la compañía 'nosotros'; ahora la cambiamos en los arrays en los cuales interviene ... 
            if (riesgo.movimientos) {

                for (const movimiento of riesgo.movimientos) {

                    if (movimiento.companias) {
                        // arreglo de compañías 
                        for (const compania of movimiento.companias) {
                            if (compania.nosotros) {
                                compania.compania = companiaNosotros._id;
                            }
                        }
                    }

                    if (movimiento.coberturasCompanias) {
                        // arreglo de coberturas para cada compañía  
                        for (const compania of movimiento.coberturasCompanias) {
                            if (compania.nosotros) {
                                compania.compania = companiaNosotros._id;
                            }
                        }
                    }

                    if (movimiento.primas) {
                        // arreglo de primas para cada compañía 
                        for (const compania of movimiento.primas) {
                            if (compania.nosotros) {
                                compania.compania = companiaNosotros._id;
                            }
                        }
                    }
                }
            }
        }
    }
    catch(err) {
        let message = "Error: ha ocurrido un error al intentar ejecutar esta función.<br />"; 
        message += err.message ? err.message : err.toString();

        return { 
            error: true, 
            message: message
        }
    }

    let message = `<em>Riesgos - Importar un riesgo</em> <br /> 
                   Ok, el riesgo ha sido importado en un riesgo nuevo.<br />
                   Ud. puede hacer modificaciones y luego hacer un <em>click</em> en <em>Grabar</em>.`; 

    if (empresaUsuariaDiferente) { 
        message += `<br /><br /><b>Nota:</b> el riesgo original fue registrado en una <em>empresa usuaria</em> diferente. 
                    La compañía usuaria ha sido cambiada para reflejar la que ahora está seleccionada para el usuario.`
    }

    return { 
        riesgo: riesgo, 
        riesgos_infoRamo: riesgos_infoRamo, 
        error: false, 
        message: message
    }
}