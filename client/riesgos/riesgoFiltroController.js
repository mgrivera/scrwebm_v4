

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

angular.module("scrwebM").controller("RiesgosFiltroController",
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
    };

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
    var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    if (companiaSeleccionada)
        var companiaSeleccionadaDoc = EmpresasUsuarias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });

    $scope.companiaSeleccionada = {};

    if (companiaSeleccionadaDoc)
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
    else
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    // ------------------------------------------------------------------------------------------------


    // -------------------------------------------------------------------------------------------
    // leemos los catálogos en el $scope
    //$scope.tiposRiesgo = $scope.$meteorCollection(TiposRiesgo, false);
    $scope.companias = $scope.$meteorCollection(Companias, false);
    $scope.suscriptores = $scope.$meteorCollection(Suscriptores, false);
    $scope.monedas = $scope.$meteorCollection(Monedas, false);
    $scope.indoles = $scope.$meteorCollection(Indoles, false);
    $scope.ramos = $scope.$meteorCollection(Ramos, false);
    $scope.asegurados = $scope.$meteorCollection(Asegurados, false);
    $scope.tiposFacultativo = $scope.$meteorCollection(TiposFacultativo, false);

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...

    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }


      $scope.aplicarFiltroYAbrirLista = function () {

          $scope.showProgress = true;
          Meteor.call('riesgos.leerDesdeMongo', JSON.stringify($scope.filtro), $scope.companiaSeleccionada._id, (err, result) => {

              if (err) {
                  let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'danger',
                      msg: errorMessage
                  });

                  $scope.showProgress = false;
                  $scope.$apply();
                  return;
              };

              // ------------------------------------------------------------------------------------------------------
              // guardamos el filtro indicado por el usuario
              if (Filtros.findOne({ nombre: 'riesgos', userId: Meteor.userId() }))
                  // el filtro existía antes; lo actualizamos
                  // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                  Filtros.update(Filtros.findOne({ nombre: 'riesgos', userId: Meteor.userId() })._id,
                                 { $set: { filtro: $scope.filtro } },
                                 { validate: false });
              else
                  Filtros.insert({
                      _id: new Mongo.ObjectID()._str,
                      userId: Meteor.userId(),
                      nombre: 'riesgos',
                      filtro: $scope.filtro
                  });

              $scope.showProgress = false;

              // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
              $state.go('riesgosLista', { origen: $scope.origen, limit: 50 });
          });
      };

      $scope.nuevo = function () {
          //debugger;
          $state.go("riesgo", { origen: 'edicion', id: '0', pageNumber: -1, vieneDeAfuera: false });
      };

      // ------------------------------------------------------------------------------------------------------
      // si hay un filtro anterior, lo usamos
      // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
      $scope.filtro = {};
      var filtroAnterior = Filtros.findOne({ nombre: 'riesgos', userId: Meteor.userId() });

      // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
      if (filtroAnterior)
          $scope.filtro = _.clone(filtroAnterior.filtro);
      // ------------------------------------------------------------------------------------------------------

      // --------------------------------------------------------------------------------
      // para filtrar el contenido de la lista de compañías
      $scope.soloSegYCorr_Filter = function (item) {
          if (item.tipo == 'SEG' || item.tipo == 'CORR')
              return true;
          else
              return false;
      };

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
      });
  }
]);
