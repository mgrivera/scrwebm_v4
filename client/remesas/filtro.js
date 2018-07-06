

import lodash from 'lodash'; 

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Temp_Consulta_Remesas } from '/imports/collections/consultas/tempConsultaRemesas';  
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

angular.module("scrwebM").controller("RemesasFiltroController",
['$scope', '$state', '$stateParams', '$meteor',
  function ($scope, $state, $stateParams, $meteor) {

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
      };

      $scope.origen = $stateParams.origen;

      $scope.miSu_List = ['', 'MI', 'SU'];

      $scope.tiposInstrumentoPago_List = [
            { tipo: 'CH', descripcion: 'Cheque' },
            { tipo: 'DP', descripcion: 'Depósito' },
            { tipo: 'TR', descripcion: 'Transferencia' }];

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      if (companiaSeleccionada) {
          var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
      }

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc) {
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      }
      else {
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      }
      // ------------------------------------------------------------------------------------------------

      $scope.helpers({
          companias: () => {
              return Companias.find();
          },
          monedas: () => {
              return Monedas.find();
          },
          bancos: () => {
              return Bancos.find();
          },
      })

      // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
      $scope.limpiarFiltro = function () {
          $scope.filtro = {};
      }


    // aplicamos el filtro indicado por el usuario y abrimos la lista
    $scope.aplicarFiltroYAbrirLista = function () {

        $scope.showProgress = true;
        let filtro = $scope.filtro;

        // agregamos la compañía seleccionada al filtro
        filtro.cia = $scope.companiaSeleccionada && $scope.companiaSeleccionada._id ? $scope.companiaSeleccionada._id : -999;

        Meteor.call('remesas.leerDesdeMongo', JSON.stringify(filtro), (err, result)  => {
        
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

            // si se efectuó un subscription al collection antes, la detenemos ...
            if (Remesas_Consulta_SubscriptionHandle) { 
                Remesas_Consulta_SubscriptionHandle.stop();
            }
                
            Remesas_Consulta_SubscriptionHandle = null;

            Remesas_Consulta_SubscriptionHandle = 
            Meteor.subscribe('temp.consulta.remesas.list', () => { 

                if (Temp_Consulta_Remesas.find({ user: Meteor.userId() }).count() == 0) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'warning',
                        msg: "0 registros seleccionados. Por favor revise el criterio de selección indicado e indique uno diferente.<br />" +
                            "(Nota: el filtro <b>solo</b> regresará registros si existe una <em>compañía seleccionada</em>.)"
                    });

                    $scope.showProgress = false; 
                    $scope.$apply(); 
                    
                    return;
                }

                if (Filtros.findOne({ nombre: 'remesas' })) { 
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    Filtros.update(Filtros.findOne({ nombre: 'remesas' })._id,
                    { $set: { filtro: $scope.filtro } },
                    { validate: false });
                }
                else { 
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'remesas',
                        filtro: $scope.filtro
                    });
                }
                
                $scope.showProgress = false;

                // activamos el state Lista ...
                $state.go('remesasLista', { origen: $scope.origen, pageNumber: -1 });
            })
        })
    }


    $scope.nuevo = function () {
        $state.go("remesa", { origen: 'edicion', id: '0', pageNumber: 0 });
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'remesas' });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) { 
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }

    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'remesas.consulta.remesasEmitidas' });
    EventDDP.addListener('remesas.consulta.remesasEmitidas.reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
  }
])
