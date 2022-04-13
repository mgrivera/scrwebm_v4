﻿
import { Meteor } from 'meteor/meteor'
import lodash from 'lodash';
import angular from 'angular';

import { userHasRole } from './userHasRole';  

import { Cuotas } from '/imports/collections/principales/cuotas'; 

// nótese como importamos la plantilla (html) para que browser la encuentre cuando se indique más abajo
// import './mostrarPagosCuotaModal.html';         

// -----------------------------------------------------------------------------
// para mostrar los pagos aplicados a una cuota en particular
// -----------------------------------------------------------------------------
export function MostrarPagosEnCuotas($uibModal, cuota, origen, cuotaID = null) {

    // si esta función no recibe una cuota, pero si una cuotaID, la idea es leer la cuota y
    // continuar con el proceso ...

    // el origen indica si la función se abre desde una entidad en modo: edición o consulta; como desde aquí se puede abrir la remesa, 
    // esta debe ser abierta en el modo en el que se abrió la entidad (riesgo, contrato, siniestro, etc.)
    if (cuota) {
        mostrarPagosEnCuotas2($uibModal, cuota, origen);
    }
    else {
        Meteor.subscribe('cuotas', JSON.stringify({ "_id": cuotaID }),
          function() {
              cuota = Cuotas.findOne(cuotaID);
              mostrarPagosEnCuotas2($uibModal, cuota, origen);
          })
    }
}


function mostrarPagosEnCuotas2($uibModal, cuota, origen) {

    $uibModal.open({
        templateUrl: 'client/html/generales/mostrarPagosCuotaModal.html',
        controller: 'MostrarPagosAplicadosACuotaController',
        size: 'md',
        resolve: {
            cuota: () => { return cuota; },
            origen: () => { return origen; }, 
        }
    }).result.then(
       function () {
           return true;
       },
       function () {
           return true;
       });
}

export const MostrarPagosAplicados = angular.module("scrwebm.cuotas.mostrarPagosAplicados", []).
                                        controller('MostrarPagosAplicadosACuotaController',
    ['$state', '$scope', '$uibModalInstance', 'cuota', 'origen', 
    function ($state, $scope, $uibModalInstance, cuota, origen) {

    $scope.cuota = cuota;

    // mostramos el total pagado en el footer de la tabla 
    $scope.montoTotalCobrosPagos = lodash.sumBy(cuota.pagos, "monto"); 

    $scope.ok = function () {
        $uibModalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss("Cancel");
    }
    
    $scope.abrirPaginaRemesa = function(remesaID) {

        let origen2 = origen; 

        // el usuario pudo haber abierto la página en mondo consulta o edicion; este modo (origen) es pasado a Remesas, para 
        // abrirla en el mismo modo: consulta/edición. Sin embargo, si el usuario no tiene el rol Remesas, usamos 
        // siempre 'consulta', para evitar que un usuario sin autorización pueda hacer cambios en una remesa ... 
        if (!userHasRole('remesas')) { 
            origen2 = 'consulta'; 
        }

        // nótese como angular nos permite abrir un route desde el code y, con window.open, en otro Tab ...
        var url2 = $state.href('remesa', { origen: origen2, id: remesaID, pageNumber: 0, vieneDeAfuera: true, });
        window.open(url2, '_blank');
    }
}
])
