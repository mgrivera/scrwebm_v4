

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '/client/contratos/methods/_methods/_methods'; 

import { LeerCompaniaNosotros } from '/imports/generales/leerCompaniaNosotros'; 

let capasDeterminarRegistrosPrimaCompanias = function ($scope, $modal) {

    let contrato = $scope.contrato;

    // debe haber una capa seleccionada
    if (contrato.capasPrimasCompanias && contrato.capasPrimasCompanias.length) {
        DialogModal($modal, "<em>Contratos - Capas</em>",
                            "Ya existen registros de primas para las compañías en el contrato.<br /><br />" +
                            "Probablemente Ud. generó estos registros antes usando esta misma función.<br /><br />" +
                            "Desea continuar y sustituir estos registros por unos nuevos?",
                            true).
            then(
                function () {
                    capasDeterminarRegistrosPrimaCompanias2($scope);
                    return;
                },
                function () {
                    return;
                });
            return;
    }

    // solo para el 1er. movimiento, agregamos la compañía 'nosotros', la cual representa nuestra compañía, y es la que,
    // justamente, tendrá 'nuestra orden'
    let companiaNosotros = {};
    let result = LeerCompaniaNosotros(Meteor.userId()); 

    if (result.error) {
        DialogModal($modal, "<em>Contratos - Error al intentar leer la compañía 'nosotros'</em>", result.message, false).then();
        return;
    }

    companiaNosotros = result.companiaNosotros; 

    // cada capa debe tener un array de reaseguradores
    let error = false;

    if (!contrato.capas || !_.isArray(contrato.capas) || !contrato.capas.length) {
        error = true;
    }

    contrato.capas.forEach((c) => {
        if (!c.reaseguradores || !_.isArray(c.reaseguradores) || !c.reaseguradores.length) {
            error = true;
        }
    })

    if (error) {
        DialogModal($modal, "<em>Contratos - Capas</em>",
                            `El contrato debe tener capas registradas;
                            A su vez, cada capa debe tener reaseguradores registrados.`, false).then();
        return;
    }

    capasDeterminarRegistrosPrimaCompanias2($scope, companiaNosotros);
}

function capasDeterminarRegistrosPrimaCompanias2($scope, companiaNosotros) {

    let contrato = $scope.contrato;

    if (contrato.capasPrimasCompanias && contrato.capasPrimasCompanias.length) { 
        contrato.capasPrimasCompanias.length = 0;
    }
        

    if (!contrato.capasPrimasCompanias) { 
        contrato.capasPrimasCompanias = [];
    }
        
    contrato.capas.forEach(function(capa) {

        let primaCompania = {};

        // primero grabamos un registro para 'nosotros'; luego, un registro para cada reasegurador
        primaCompania._id = new Mongo.ObjectID()._str;
        primaCompania.capaID = capa._id;
        primaCompania.numeroCapa = capa.numero;
        primaCompania.compania = companiaNosotros._id;
        primaCompania.nosotros = true;
        primaCompania.moneda = capa.moneda;
        primaCompania.pmd = capa.pmd;
        primaCompania.ordenPorc = capa.nuestraOrdenPorc;

        primaCompania.imp1Porc = capa.imp1Porc;
        primaCompania.imp2Porc = capa.imp2Porc;
        primaCompania.impSPNPorc = capa.impSPNPorc;

        contrato.capasPrimasCompanias.push(primaCompania);

        capa.reaseguradores.forEach(function(reasegurador) {

            let primaCompania = {};

            // primero grabamos un registro para 'nosotros'; luego, un registro para cada reasegurador
            primaCompania._id = new Mongo.ObjectID()._str;
            primaCompania.capaID = capa._id;
            primaCompania.numeroCapa = capa.numero;
            primaCompania.compania = reasegurador.compania;
            primaCompania.nosotros = false;
            primaCompania.moneda = capa.moneda;
            primaCompania.pmd = capa.pmd * -1;
            primaCompania.ordenPorc = reasegurador.ordenPorc;

            primaCompania.imp1Porc = reasegurador.imp1Porc;
            primaCompania.imp2Porc = reasegurador.imp2Porc;
            primaCompania.corretajePorc = reasegurador.corretajePorc;
            primaCompania.impSPNPorc = reasegurador.impSPNPorc;

            contrato.capasPrimasCompanias.push(primaCompania);
        })
    })

    $scope.capasPrimasCompanias_ui_grid.data = [];

    if (_.isArray($scope.contrato.capasPrimasCompanias)) { 
        $scope.capasPrimasCompanias_ui_grid.data = $scope.contrato.capasPrimasCompanias;
    }   
        
    if (!$scope.contrato.docState) { 
        $scope.contrato.docState = 2;
        $scope.dataHasBeenEdited = true; 
    }
}

Contratos_Methods.capasDeterminarRegistrosPrimaCompanias = capasDeterminarRegistrosPrimaCompanias;
