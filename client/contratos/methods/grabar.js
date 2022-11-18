
import { Meteor } from 'meteor/meteor'; 
import lodash from 'lodash';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 
import { Contratos_Methods } from '/client/contratos/methods/_methods/_methods'; 
import { validarArrayContraSchema, validarItemContraSchema } from '/imports/generales/validarArrayContraSchema'; 

import { Contratos } from '/imports/collections/principales/contratos'; 

// siguen todos las tablas (collections) para el registro de contratos proporcionales 
import { ContratosProp_cuentas_resumen, ContratosProp_cuentas_distribucion, ContratosProp_cuentas_saldos, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_comAdic_resumen, ContratosProp_comAdic_distribucion, ContratosProp_comAdic_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_partBeneficios_resumen, ContratosProp_partBeneficios_distribucion, ContratosProp_partBeneficios_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartPr_resumen, ContratosProp_entCartPr_distribucion, ContratosProp_entCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_entCartSn_resumen, ContratosProp_entCartSn_distribucion, ContratosProp_entCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartPr_resumen, ContratosProp_retCartPr_distribucion, ContratosProp_retCartPr_montosFinales, } from '/imports/collections/principales/contratos'; 
import { ContratosProp_retCartSn_resumen, ContratosProp_retCartSn_distribucion, ContratosProp_retCartSn_montosFinales, } from '/imports/collections/principales/contratos'; 

import { Cuotas } from '/imports/collections/principales/cuotas'; 

const grabar = ($state, $scope, $uibModal, uiGridConstants) => {

    if (!$scope.dataHasBeenEdited) {
        DialogModal($uibModal,
                    "<em>Contratos</em>",
                    "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                    false).then();
        return;
    }

    $scope.showProgress = true;

    // cuando el usuario deja la referencia vacía, la determinamos al grabar; nótese que debemos agregar algo,
    // pues el campo es requerido
    if (!$scope.contrato.referencia) {
        $scope.contrato.referencia = '0';
    }

    const errores = [];

    // validamos el contenido del item contra el simple-schema que se ha asociado al mongo collection 
    validarItemContraSchema($scope.contrato, Contratos, errores); 

    // validamos el contenido del array contra el simple-schema que se ha asociado al mongo collection 

    validarArrayContraSchema($scope.contratosProp_cuentas_resumen.filter(x => x.primas || x.siniestros), ContratosProp_cuentas_resumen, errores); 
    validarArrayContraSchema($scope.contratosProp_cuentas_distribucion, ContratosProp_cuentas_distribucion, errores); 
    validarArrayContraSchema($scope.contratosProp_cuentas_saldos, ContratosProp_cuentas_saldos, errores); 

    validarArrayContraSchema($scope.contratosProp_comAdic_resumen.filter(x => x.monto), ContratosProp_comAdic_resumen, errores); 
    validarArrayContraSchema($scope.contratosProp_comAdic_distribucion, ContratosProp_comAdic_distribucion, errores); 
    validarArrayContraSchema($scope.contratosProp_comAdic_montosFinales, ContratosProp_comAdic_montosFinales, errores); 

    validarArrayContraSchema($scope.contratosProp_partBeneficios_resumen.filter(x => x.monto), ContratosProp_partBeneficios_resumen, errores); 
    validarArrayContraSchema($scope.contratosProp_partBeneficios_distribucion, ContratosProp_partBeneficios_distribucion, errores); 
    validarArrayContraSchema($scope.contratosProp_partBeneficios_montosFinales, ContratosProp_partBeneficios_montosFinales, errores); 

    validarArrayContraSchema($scope.contratosProp_entCartPr_resumen.filter(x => x.monto), ContratosProp_entCartPr_resumen, errores); 
    validarArrayContraSchema($scope.contratosProp_entCartPr_distribucion, ContratosProp_entCartPr_distribucion, errores); 
    validarArrayContraSchema($scope.contratosProp_entCartPr_montosFinales, ContratosProp_entCartPr_montosFinales, errores); 

    validarArrayContraSchema($scope.contratosProp_entCartSn_resumen.filter(x => x.monto), ContratosProp_entCartSn_resumen, errores); 
    validarArrayContraSchema($scope.contratosProp_entCartSn_distribucion, ContratosProp_entCartSn_distribucion, errores); 
    validarArrayContraSchema($scope.contratosProp_entCartSn_montosFinales, ContratosProp_entCartSn_montosFinales, errores); 

    validarArrayContraSchema($scope.contratosProp_retCartPr_resumen.filter(x => x.monto), ContratosProp_retCartPr_resumen, errores); 
    validarArrayContraSchema($scope.contratosProp_retCartPr_distribucion, ContratosProp_retCartPr_distribucion, errores); 
    validarArrayContraSchema($scope.contratosProp_retCartPr_montosFinales, ContratosProp_retCartPr_montosFinales, errores); 

    validarArrayContraSchema($scope.contratosProp_retCartSn_resumen.filter(x => x.monto), ContratosProp_retCartSn_resumen, errores); 
    validarArrayContraSchema($scope.contratosProp_retCartSn_distribucion, ContratosProp_retCartSn_distribucion, errores); 
    validarArrayContraSchema($scope.contratosProp_retCartSn_montosFinales, ContratosProp_retCartSn_montosFinales, errores); 

    validarArrayContraSchema($scope.cuotas, Cuotas, errores); 

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

    let Contratos_SubscriptionHandle = null;

    Meteor.call('contratos.save', $scope.contrato, $scope.cuotas.filter((x) => { return x.docState; }), 

                                $scope.contratosProp_cuentas_resumen.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_cuentas_distribucion.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_cuentas_saldos.filter((x) => { return x.docState; }), 

                                $scope.contratosProp_comAdic_resumen.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_comAdic_distribucion.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_comAdic_montosFinales.filter((x) => { return x.docState; }), 

                                $scope.contratosProp_partBeneficios_resumen.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_partBeneficios_distribucion.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_partBeneficios_montosFinales.filter((x) => { return x.docState; }), 

                                $scope.contratosProp_entCartPr_resumen.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_entCartPr_distribucion.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_entCartPr_montosFinales.filter((x) => { return x.docState; }), 

                                $scope.contratosProp_entCartSn_resumen.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_entCartSn_distribucion.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_entCartSn_montosFinales.filter((x) => { return x.docState; }), 

                                $scope.contratosProp_retCartPr_resumen.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_retCartPr_distribucion.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_retCartPr_montosFinales.filter((x) => { return x.docState; }), 

                                $scope.contratosProp_retCartSn_resumen.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_retCartSn_distribucion.filter((x) => { return x.docState; }), 
                                $scope.contratosProp_retCartSn_montosFinales.filter((x) => { return x.docState; }), 
    
                                (err, contratoSave_result) => {

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

        // cuando el contrato es eliminado, ya no existe (y no es encontrado) ...
        const contratoID = $scope.contrato ? $scope.contrato._id : "xyzxyz***";

        // si se efectuó un subscription al collection antes, la detenemos ...
        if (Contratos_SubscriptionHandle) {
            Contratos_SubscriptionHandle.stop();
        }

        Contratos_SubscriptionHandle = 
        Meteor.subscribe('contrato', contratoID, () => { 

            $scope.helpers({ 
                cuotas: () => { 
                    return Cuotas.find({ "source.entityID": contratoID });
                }, 
                contrato: () => { 
                    return Contratos.findOne(contratoID);
                }, 
                contratosProp_comAdic_resumen: () => { 
                    return ContratosProp_comAdic_resumen.find({ contratoID: contratoID }); 
                }, 
                contratosProp_comAdic_distribucion: () => { 
                    return ContratosProp_comAdic_distribucion.find({ contratoID: contratoID }); 
                }, 
                contratosProp_comAdic_montosFinales: () => { 
                    return ContratosProp_comAdic_montosFinales.find({ contratoID: contratoID }); 
                }, 
                contratosProp_entCartPr_resumen: () => { 
                    return ContratosProp_entCartPr_resumen.find({ contratoID: contratoID }); 
                }, 
                contratosProp_entCartPr_distribucion: () => { 
                    return ContratosProp_entCartPr_distribucion.find({ contratoID: contratoID }); 
                }, 
                contratosProp_entCartPr_montosFinales: () => { 
                    return ContratosProp_entCartPr_montosFinales.find({ contratoID: contratoID }); 
                }, 
                contratosProp_entCartSn_resumen: () => { 
                    return ContratosProp_entCartSn_resumen.find({ contratoID: contratoID }); 
                }, 
                contratosProp_entCartSn_distribucion: () => { 
                    return ContratosProp_entCartSn_distribucion.find({ contratoID: contratoID }); 
                }, 
                contratosProp_entCartSn_montosFinales: () => { 
                    return ContratosProp_entCartSn_montosFinales.find({ contratoID: contratoID }); 
                }, 
                contratosProp_retCartPr_resumen: () => { 
                    return ContratosProp_retCartPr_resumen.find({ contratoID: contratoID }); 
                }, 
                contratosProp_retCartPr_distribucion: () => { 
                    return ContratosProp_retCartPr_distribucion.find({ contratoID: contratoID }); 
                }, 
                contratosProp_retCartPr_montosFinales: () => { 
                    return ContratosProp_retCartPr_montosFinales.find({ contratoID: contratoID }); 
                }, 
                contratosProp_retCartSn_resumen: () => { 
                    return ContratosProp_retCartSn_resumen.find({ contratoID: contratoID }); 
                }, 
                contratosProp_retCartSn_distribucion: () => { 
                    return ContratosProp_retCartSn_distribucion.find({ contratoID: contratoID }); 
                }, 
                contratosProp_retCartSn_montosFinales: () => { 
                    return ContratosProp_retCartSn_montosFinales.find({ contratoID: contratoID }); 
                }, 
                contratosProp_partBeneficios_resumen: () => { 
                    return ContratosProp_partBeneficios_resumen.find({ contratoID: contratoID }); 
                }, 
                contratosProp_partBeneficios_distribucion: () => { 
                    return ContratosProp_partBeneficios_distribucion.find({ contratoID: contratoID }); 
                }, 
                contratosProp_partBeneficios_montosFinales: () => { 
                    return ContratosProp_partBeneficios_montosFinales.find({ contratoID: contratoID }); 
                }, 
                contratosProp_cuentas_resumen: () => { 
                    return ContratosProp_cuentas_resumen.find({ contratoID: $scope.id }); 
                }, 
                contratosProp_cuentas_distribucion: () => { 
                    return ContratosProp_cuentas_distribucion.find({ contratoID: $scope.id }); 
                }, 
                contratosProp_cuentas_saldos: () => { 
                    return ContratosProp_cuentas_saldos.find({ contratoID: $scope.id }); 
                }, 
            })

            $scope.capasCuotas_ui_grid.data = [];

            // 'limpiamos' los ui-grids
            $scope.capas_ui_grid.data = [];
            $scope.capasReaseguradores_ui_grid.data = [];
            $scope.capasPrimasCompanias_ui_grid.data = [];

            if ($scope.contrato && $scope.contrato.capas && lodash.isArray($scope.contrato.capas)) {
                $scope.capas_ui_grid.data = $scope.contrato.capas;
            }

            if ($scope.contrato && lodash.isArray($scope.contrato.capasPrimasCompanias)) {
                $scope.capasPrimasCompanias_ui_grid.data = $scope.contrato.capasPrimasCompanias;
            }

            if ($scope.cuotas && $scope.cuotas.find((c) => { return c.source.origen == 'capa'; })) { 
                $scope.capasCuotas_ui_grid.data = $scope.cuotas.filter((c) => { return c.source.origen === 'capa'; });
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: contratoSave_result
            })

            // intentamos refrescar el ui-grid de cuotas; cuando se agregan registros y se guarda,
            // el '*' no desaparece ...
            if ($scope.capasCuotasGridApi && $scope.capasCuotasGridApi.core) {
                $scope.capasCuotasGridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL)
                $scope.capasCuotasGridApi.core.refresh();
            }

            $scope.dataHasBeenEdited = false; 

            $scope.showProgress = false;
            $scope.$apply();

            // cuando el usuario graba, regresamos al state 'generales'
            $state.go("contrato.generales");
        })
    })
}

Contratos_Methods.grabar = grabar; 