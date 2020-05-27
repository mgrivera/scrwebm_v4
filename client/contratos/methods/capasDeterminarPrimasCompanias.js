
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '/client/contratos/methods/_methods/_methods'; 

import { LeerCompaniaNosotros } from '/imports/generales/leerCompaniaNosotros'; 

const capasDeterminarRegistrosPrimaCompanias = function ($scope, $modal) {

    const contrato = $scope.contrato;

    // pueden existir registros construidos antes por esta función
    if (contrato.capasPrimasCompanias && contrato.capasPrimasCompanias.length) {
        DialogModal($modal, "<em>Contratos - Capas</em>",
                            "Ya existen registros de primas para las compañías en el contrato.<br /><br />" +
                            "Probablemente Ud. generó estos registros antes usando esta misma función.<br /><br />" +
                            "Desea continuar y sustituir estos registros por unos nuevos?",
                            true).
            then(
                function () {
                    capasDeterminarRegistrosPrimaCompanias1($scope, $modal);
                    return;
                },
                function () {
                    return;
                });
    }

    capasDeterminarRegistrosPrimaCompanias1($scope, $modal);
}

function capasDeterminarRegistrosPrimaCompanias1($scope, $modal) {
    // la compañía 'nosotros' es nuestra empresa ... es la que, inicialmente, recibe la orden de reaseguraro 
    let companiaNosotros = {};
    const result = LeerCompaniaNosotros(Meteor.userId()); 

    if (result.error) {
        DialogModal($modal, "<em>Contratos - Error al intentar leer la compañía 'nosotros'</em>", result.message, false).then();
        return;
    }

    companiaNosotros = result.companiaNosotros; 

    // cada capa debe tener un array de reaseguradores
    // nota: dejamos de hacer esta validación; ahora puede haber *solo* nuestra orden; sin reaseguradores 
    const contrato = $scope.contrato;

    if (!contrato.capas || !Array.isArray(contrato.capas) || !contrato.capas.length) {
        DialogModal($modal, "<em>Contratos - Capas</em>",
                            `El contrato debe tener capas registradas; <br />
                            Cada capa puede o no tener reaseguradores registrados.`, false).then();
        return;
    }

    contrato.capas.forEach((c) => {
        if (!c.reaseguradores || !Array.isArray(c.reaseguradores) || !c.reaseguradores.length) {
            c.reaseguradores = []; 
        }
    })

    capasDeterminarRegistrosPrimaCompanias2($scope, companiaNosotros);
}

function capasDeterminarRegistrosPrimaCompanias2($scope, companiaNosotros) {

    const contrato = $scope.contrato;

    if (contrato.capasPrimasCompanias && contrato.capasPrimasCompanias.length) { 
        contrato.capasPrimasCompanias.length = 0;
    }
        

    if (!contrato.capasPrimasCompanias) { 
        contrato.capasPrimasCompanias = [];
    }
        
    contrato.capas.forEach(function(capa) {

        const primaCompania = {};

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
        primaCompania.corretajePorc = capa.corretajePorc;
        primaCompania.impSPNPorc = capa.impSPNPorc;

        contrato.capasPrimasCompanias.push(primaCompania);

        capa.reaseguradores.forEach(function(reasegurador) {

            const primaCompania = {};

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

    if (Array.isArray($scope.contrato.capasPrimasCompanias)) { 
        $scope.capasPrimasCompanias_ui_grid.data = $scope.contrato.capasPrimasCompanias;
    }   
        
    if (!$scope.contrato.docState) { 
        $scope.contrato.docState = 2;
        $scope.dataHasBeenEdited = true; 
    }
}

Contratos_Methods.capasDeterminarRegistrosPrimaCompanias = capasDeterminarRegistrosPrimaCompanias;