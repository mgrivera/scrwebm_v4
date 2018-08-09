

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { TiposFacultativo } from '/imports/collections/catalogos/tiposFacultativo'; 
import { Suscriptores } from '/imports/collections/catalogos/suscriptores'; 
import { Indoles } from '/imports/collections/catalogos/indoles'; 
import { TiposObjetoAsegurado } from '/imports/collections/catalogos/tiposObjetoAsegurado'; 
import { Filtros } from '/imports/collections/otros/filtros'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebM").controller("RiesgosFiltro_Controller",
['$scope', '$state', '$stateParams', '$meteor', function ($scope, $state, $stateParams, $meteor) {

    $scope.showProgress = false;

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.origen = $stateParams.origen;

    $scope.estados = [
        { estado: 'CO', descripcion: 'Cotización' },
        { estado: 'AC', descripcion: 'Aceptado' },
        { estado: 'EM', descripcion: 'Emitido' },
        { estado: 'RV', descripcion: 'Renovado' },
        { estado: 'RE', descripcion: 'Renovación' },
        { estado: 'AN', descripcion: 'Anulado' },
        { estado: 'DE', descripcion: 'Declinado' },
    ];

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

    let companiaSeleccionadaDoc = {}; 
    if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
    }
        
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc) { 
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    } 
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }

    // leemos los catálogos en el $scope
    $scope.helpers({
        suscriptores: () => { return Suscriptores.find({}); },
        monedas: () => { return Monedas.find({}); },
        indoles: () => { return Indoles.find({}); },
        companias: () => { return Companias.find({}); },
        ramos: () => { return Ramos.find({}); },
        asegurados: () => { return Asegurados.find({}); },
        tiposFacultativo: () => { return TiposFacultativo.find({}); },
        tiposObjetoAsegurado: () => { return TiposObjetoAsegurado.find(); },  
    })

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...

    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }


    $scope.aplicarFiltroYAbrirLista = function () {

        $scope.showProgress = true;
        Meteor.call('riesgos.leerDesdeMongo', JSON.stringify($scope.filtro), $scope.companiaSeleccionada._id, (err, result) => {

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

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            if (Filtros.findOne({ nombre: 'riesgos', userId: Meteor.userId() })) { 
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'riesgos', userId: Meteor.userId() })._id,
                                { $set: { filtro: $scope.filtro } }, { validate: false });
            }
            else { 
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'riesgos',
                    filtro: $scope.filtro
                });
            }
                
            $scope.showProgress = false;

            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            $state.go('riesgosLista', { origen: $scope.origen, limit: 50 });
        })
    }

    $scope.nuevo = function () {
        //debugger;
        $state.go("riesgo", { origen: 'edicion', id: '0', pageNumber: -1, vieneDeAfuera: false });
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'riesgos', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) { 
        $scope.filtro = _.clone(filtroAnterior.filtro);
    }
        
    // --------------------------------------------------------------------------------
    // para filtrar el contenido de la lista de compañías
    $scope.soloSegYCorr_Filter = function (item) {
        if (item.tipo == 'SEG' || item.tipo == 'CORR') { 
            return true;
        }
        else { 
            return false;
        }  
    }

    $scope.soloReaseguradores_Filter = function (item) {
        if (item.tipo == 'REA') { 
            return true;
        }
        else { 
            return false;
        }  
    }

    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'riesgos', process: 'riesgos_leerRiesgos_reportProgress' });
    EventDDP.addListener('leerRiesgos', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })

}])
