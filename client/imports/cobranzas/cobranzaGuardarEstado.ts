

import * as angular from 'angular'; 
import saveAs from 'save-as'; 

import { mensajeErrorDesdeMethod_preparar } from 'client/imports/generales/mensajeDeErrorDesdeMethodPreparar'; 
import { DialogModal } from 'client/imports/generales/angularGenericModal'; 

angular.module("scrwebm").controller('CobranzaGuardarEstado_Controller',
['$scope', '$modalInstance', '$modal', 'temp_cobranzas', 'companiaSeleccionada', 
function ($scope, $modalInstance, $modal, temp_cobranzas, companiaSeleccionada) {

    // debugger;
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = companiaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };


    $scope.cobranza_guardarEstado = function() { 

        // vamos a guardar las los montos que el usuario marcó ... 
        let cuotasSeleccionadas = temp_cobranzas.filter(x => x.pagar); 

        if (!cuotasSeleccionadas || !cuotasSeleccionadas.length) { 

            let message = `Aparentemente, Ud. no ha seleccionado pagos a ser aplicados.<br />
                            No hay nada que grabar. 
                        `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
            
            DialogModal($modal, "<em>Cobranzas</em>", message, false).then();

            return;
        }

        let message = ""; 

        try {
            // construye y regresa un objeto como el que usa contabm, para que luego pueda ser leído allí 
            var blob = new Blob([JSON.stringify(cuotasSeleccionadas)], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "cobranza - cuotas seleccionadas");
        }
        catch(err) {
            message = err.message ? err.message : err.toString();
        }
        finally {
            if (message) {
                DialogModal($modal, "<em>Cobranzas - Guardar estado parcial del proceso</em>",
                                    "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                    message,
                                    false).then();
            } else { 

                let message = `Ok, las cuotas seleccionadas han sido guardadas a un archivo en disco<br />
                               Mediante este archivo, Ud. podrá recuperar el estado actual de este proceso en un futuro. 
                               `; 
                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
                
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: message,
                });

                $scope.showProgress = false;
            }
        }
    }

    $scope.cobranza_leerEstado = function() { 

        if (!temp_cobranzas || !temp_cobranzas.length) { 
            let message = `Aparentemente, no hay cuotas para la remesa. Deben haber cuotas asociadas a la remesa, 
                            para poder recuperarlas desde el archivo indicado.<br /> 
                            Por favor cierre este diálogo y revise. No existen cuotas asociadas a la remesa.
                        `; 
            message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
            
            DialogModal($modal, "<em>Cobranzas - Recuperar el estado parcial del proceso</em>", message, false).then();

            return;
        }

        // permitimos al usuario leer el archivo que se guardó antes ...
        let inputFile = angular.element("#fileInput");
        if (inputFile) { 
            inputFile.click();        // simulamos un click al input (file) para que el usuario pueda importar desde el archivo 
        }
    }


    $scope.uploadFile = function(files) {

        let userSelectedFile = files[0];

        if (!userSelectedFile) {
            DialogModal($modal, "<em>Cobranzas - Recuperar el estado parcial del proceso</em",
                                "Aparentemente, Ud. no ha seleccionado un archivo.<br />" +
                                "Por favor seleccione un archivo que corresponda al <em>estado de este proceso</em> que Ud. haya exportado antes.",
                                false).then();

            // let inputFile = angular.element("#fileInput") as any;
            // if (inputFile && inputFile[0] && inputFile[0].value) { 
            //     // para que el input type file "limpie" el file indicado por el usuario
            //     inputFile[0].value = null;
            // }
                
            return;
        }

        var reader: any = new FileReader();
        let message = "";

        let cantidadCuotasRecuperadas = 0; 
        let cantidadCuotasSeleccionadas = 0; 

        let cuotasSeleccionadas = []; 

        reader.onload = function(e) {
            try {
                var content = e.target.result;
                cuotasSeleccionadas = JSON.parse(content);

                // intentamos encontrar cada cuota para seleccionarla ... 
                let cuotaRecuperada = {} as any; 

                for (cuotaRecuperada of cuotasSeleccionadas) { 
                    let cuota = temp_cobranzas.find(x => x.cuota.cuotaID === cuotaRecuperada.cuota.cuotaID); 

                    if (cuota) { 
                        cuota.pagar = cuotaRecuperada.pagar; 
                        cuota.monto = cuotaRecuperada.monto; 
                        cuota.completo = cuotaRecuperada.completo; 

                        cantidadCuotasSeleccionadas++; 
                    }

                    cantidadCuotasRecuperadas++; 
                }
            }
            catch(err) {
                message = err.message ? err.message : err.toString();
            }
            finally {
                if (message) { 
                    DialogModal($modal, "<em>Cobranzas - Recuperar estado parcial del proceso</em>",
                                    "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                    message,
                                    false).then();
                }
                else {

                    let message = `Ok, las cuotas que Ud. había seleccionado antes, han sido recuperadas desde el archivo indicado<br /><br />
                                   En total, se han leído <b>${cantidadCuotasRecuperadas.toString()}</b> cuotas que se habían seleccionado antes; <br />
                                   de éstas, se han encontrado y seleccionado <b>${cantidadCuotasSeleccionadas.toString()} cuotas para la remesa actual.</b></b>
                                   Ud. podrá ver las cuotas seleccionadas cuando cierre este diálogo. 
                        `; 
                    message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
            
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: message,
                    }); 
                }

                // let inputFile = angular.element("#fileInput") as any;
                // if (inputFile && inputFile[0] && inputFile[0].value) { 
                //     // para que el input type file "limpie" el file indicado por el usuario
                //     inputFile[0].value = null;
                // }

                $scope.showProgress = false;
                $scope.$apply(); 
            }
        }

        reader.readAsText(userSelectedFile);
    }
}
])