
import { Mongo } from 'meteor/mongo'; 
import angular from 'angular'; 
import { jQuery } from 'meteor/jquery'; 

import XLSX from 'xlsx'; 

import { replaceAllInstances } from '/imports/funciones/texto/replaceAllInstances'; 
import { DialogModal } from '../../imports/generales/angularGenericModal'; 

angular.module("scrwebm")
       .controller('CuentasContablesImportarDesdeExcel_Controller',
    ['$scope', '$uibModalInstance', '$uibModal', 'cuentasContables', 'cuentasContables_ui_grid', 'ciaSeleccionada',
    function ($scope, $uibModalInstance, $uibModal, cuentasContables, cuentasContables_ui_grid, ciaSeleccionada) {

        // ui-bootstrap alerts ...
        $scope.alerts = [];

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        }

        $scope.companiaSeleccionada = ciaSeleccionada;

        $scope.ok = function () {
            $uibModalInstance.close("Ok");
        }

        $scope.cancel = function () {
            $uibModalInstance.dismiss("Cancel");
        }

        // para leer el archivo seleccionado mediante el Input ...
        let userSelectedFile;
        $scope.uploadFile = function (files) {
            userSelectedFile = files[0];
        }

        let cuentasContablesAgregadas = 0;

        $scope.submit_TratarFiles_Form = function () {

            $scope.submitted = true;

            $scope.alerts.length = 0;

            if (!userSelectedFile) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: `Aparentemente, Ud. no ha seleccionado un archivo (Excel) desde su PC aún.<br />
                        Ud. debe seleccionar un archivo (Excel) antes de intentar importar
                        las cuentas contables desde el mismo.`
                });

                return;
            }

            if ($scope.tratarFiles_Form.$valid) {
                $scope.submitted = false;
                $scope.tratarFiles_Form.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

                $scope.showProgress = true;

                const f = userSelectedFile;

                var reader = new FileReader();

                cuentasContablesAgregadas = 0;

                reader.onload = function (e) {
                    const data = e.target.result;

                    const workbook = XLSX.read(data, { type: 'binary' });
                    const first_sheet_name = workbook.SheetNames[0];

                    /* Get worksheet */
                    var worksheet = workbook.Sheets[first_sheet_name];

                    /* convertimos toda la hoja (en el documento Excel) a un objeto json ... */
                    const cuentasContablesDesdeExcel = XLSX.utils.sheet_to_json(worksheet, { raw: true });

                    cuentasContablesDesdeExcel.forEach((cuenta) => {

                        const cuentaContable = cuenta['Cuenta'] ? cuenta['Cuenta'].toString() : "";       // cuenta 'editada' 
                        const descripcion = cuenta['Descripción'] ? cuenta['Descripción'] : null;
                        const totDet = cuenta['Tot/Det'] ? cuenta['Tot/Det'] : null;

                        const item = {
                            _id: new Mongo.ObjectID()._str,
                            // quitamos los espacios a la cuenta 'editada' para obtener la cuenta .. 
                            cuenta: replaceAllInstances(cuentaContable, " ", ""),
                            descripcion: descripcion,
                            totDet: totDet,
                            cuentaEditada: cuentaContable,
                            cia: ciaSeleccionada._id,
                            docState: 1
                        };

                        cuentasContables.push(item);

                        cuentasContablesAgregadas++;
                    })

                    // cerramos el modal y terminamos ...
                    jQuery(":file").filestyle('clear');              // para regresar el input (file) a su estado inicial (ie: no selected file)
                    jQuery(":file").filestyle('disabled', false);     // (no) desabilitamos el input-file

                    $scope.showProgress = false;

                    cuentasContables_ui_grid.data = [];
                    if (Array.isArray(cuentasContables)) {
                        cuentasContables_ui_grid.data = cuentasContables;
                    }

                    DialogModal($uibModal,
                        `<em>Cuentas contables - Importar desde Excel</em>`,
                        `Ok, este proceso ha agregado <b>${cuentasContablesAgregadas.toString()}</b>
                    cuentas contables a la lista.<br />
                    Estas cuentas serán mostradas como <em>registros nuevos</em> en la lista.<br />
                    Ud. debe hacer un <em>click</em> en <em>Grabar</em> para que las cuentas contables
                    sean registradas en la base de datos.
                    `,
                        false).then();
                }

                reader.readAsBinaryString(f);
            }
        }

        $uibModalInstance.rendered.then(function () {
            // para mejorar el style al input-file ...
            // nótese que, en caso de bootstrap modals, ponemos en 'rendered'; de otra forma, los estilos no se aplican
            // correctamente al input ...
            jQuery(":file").filestyle();
            jQuery(":file").filestyle('buttonName', 'btn-primary');
            jQuery(":file").filestyle('buttonText', '&nbsp;&nbsp;1) Seleccione un documento Excel ...');
            jQuery(":file").filestyle('disabled', false);
            jQuery(":file").filestyle({ iconName: "glyphicon-file" });
            jQuery(":file").filestyle('size', 'sm');
            // $(":file").filestyle({input: false});
        })
}])