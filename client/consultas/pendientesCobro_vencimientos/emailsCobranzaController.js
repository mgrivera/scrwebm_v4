


import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { CuentasBancarias } from '/imports/collections/catalogos/cuentasBancarias'; 
import { Bancos } from '/imports/collections/catalogos/bancos'; 

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

import { DialogModal } from '/client/imports/generales/angularGenericModal'; 

angular.module("scrwebM").controller('Consulta_MontosPorCobrar_Vencimientos_EmailsCobranza_Controller',
['$scope', '$modalInstance', '$meteor', '$modal', 'cuotasSeleccionadas',
function ($scope, $modalInstance, $meteor, $modal, cuotasSeleccionadas) {

    //   debugger;
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'scrwebm', process: 'montosPendientesCobro_envioEmails' });
    EventDDP.addListener('montosPendientesCobro_envioEmails_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // -------------------------------------------------------------------------------------------------------


    $scope.showProgress = false;
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close($scope.parametros);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionadaUsuario = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionada = null;

    if (companiaSeleccionadaUsuario)
        companiaSeleccionada = EmpresasUsuarias.findOne(companiaSeleccionadaUsuario.companiaID);
    // ------------------------------------------------------------------------------------------------


    $scope.submitted = false;
    $scope.parametros = {};

    $scope.submit_emailsCobranzaForm = function () {

        // debugger;
        $scope.submitted = true;
        $scope.alerts.length = 0;

        if ($scope.emailsCobranzaForm.$valid) {
            $scope.submitted = false;
            $scope.emailsCobranzaForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            if (!$scope.emailCobranza.docState) {
                DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                                    "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                   false).then();
                return;
            };

            $scope.showProgress = true;

            // obtenemos un clone de los datos a guardar ...
            let editedItem = _.cloneDeep($scope.emailCobranza);

            // nótese como validamos cada item antes de intentar guardar en el servidor
            let isValid = false;
            let errores = [];

            if (editedItem.docState != 3) {
                isValid = EmailsCobranzaCuotasPendientes.simpleSchema().namedContext().validate(editedItem);

                if (!isValid) {
                    EmailsCobranzaCuotasPendientes.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + EmailsCobranzaCuotasPendientes.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
                    });
                }
            };

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
                });

                $scope.showProgress = false;
                return;
            };

            $meteor.call('emailsCobranza.save', editedItem).then(
                function (data) {
                    $meteor.subscribe("emailsCobranzas").then(
                        function(subscriptionHandle) {
                            // debugger;
                            $scope.helpers({
                                emailCobranza: () => {
                                    return EmailsCobranzaCuotasPendientes.findOne();
                                },
                            });

                            $scope.alerts.length = 0;
                            $scope.alerts.push({
                                type: 'info',
                                msg: data.message
                            });

                            $scope.showProgress = false;
                        },
                        function() {
                            let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

                            $scope.alerts.length = 0;
                            $scope.alerts.push({
                                type: 'danger',
                                msg: errorMessage
                            });

                            $scope.showProgress = false;
                        }
                    );
                },
                function (err) {
                    let errorMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });

                    $scope.showProgress = false;
                });
        }
    };



    $scope.asignarTiposDeCorreo = () => {

        if ($scope.emailCobranza && $scope.emailCobranza.docState) {
            DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                                `Ud. debe guardar los cambios efectuados antes de intentar ejecutar esta función.`,
                               false).then();
            return;
        };

        if (!cuotasSeleccionadas.length) {
            DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                                `Ud. no ha seleccionado las cuotas a las cuales desea enviar e-mails.<br />
                                Ud. debe cerrar esta diálogo y seleccionar las cuotas, a las cuales desea
                                enviar correos, en la lista.<br />
                                Luego puede regresar y ejecutar esta función.
                                `,
                               false).then();
            return;
        };

        if ($scope.emailCobranza.reglas.length === _.filter($scope.emailCobranza.reglas, (x) => { return x.suspendido; }).length) {
            DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                                `Todas las reglas están suspendidas.<br />
                                 No hay reglas que aplicar.
                                `,
                               false).then();
            return;
        };

        $scope.showProgress = true;

        // si este proceso se ejecuta en forma sucesiva, pueden quedar emails asignados antes; por eso,
        // limpiamos este field antes de iniciar el proceso
        lodash(cuotasSeleccionadas).filter((x) => { return x.tipoEmail; })
                                   .forEach((x) => { x.tipoEmail = null; });


        let cuotasLeidas = 0;
        let cuotasConEmailAsignado = 0;

        // Nota importante: una de las razones por las cuales este proceso es efectuado en el cliente
        // y no en el servidor, es porque el proceso se efectua solo sobre las cuotas seleccionadas en el
        // ui-grid por el usuario. Para hacerlo en el servidor, tendríamos que, de alguna manera,
        // enviar al server los _ids de estos rows seleccionados ...

        // recorremos todas las cuotas; a cada una iremos aplicando las reglas ...
        cuotasSeleccionadas.forEach((cuota) => {

            // recorremos las reglas, ordenadas por su número
            lodash($scope.emailCobranza.reglas).filter((x) => { return !x.suspendido; })
                                               .orderBy(['numero'], ['asc'])
                                               .forEach((regla) => {

               // si la cantidad de emails ya enviados a la cuota es superior al indicado en la regla,
               // ni siquiera continuamos

               if (regla.emailsEnviarHasta && cuota.cantEmailsEnviadosAntes)
                  if (regla.emailsEnviarHasta <= cuota.cantEmailsEnviadosAntes)
                      return false;

               if (lodash.isNumber(regla.fechaCuotaDesde) && lodash.isNumber(regla.fechaCuotaHasta)) {
                   // la regla se definió en base a cantidad de días con respecto a la fecha de la cuota
                   if (regla.fechaCuotaDesde >= cuota.diasPendientes && regla.fechaCuotaHasta <= cuota.diasPendientes) {
                       // Ok, la cuota está en el rango indicado en la regla; aplicamos y pasamos a la próx cuota
                       // notese que lodah rompe el forEach si regresamos false
                       cuota.tipoEmail = regla.tipoEmail;
                       cuotasConEmailAsignado++;
                       return false;
                   };
               };

               if (lodash.isNumber(regla.fechaVencimientoDesde) && lodash.isNumber(regla.fechaVencimientoHasta)) {
                   // la regla se definió en base a cantidad de días con respecto a la fecha de la cuota
                   if (regla.fechaVencimientoDesde >= cuota.diasVencidos && regla.fechaVencimientoHasta <= cuota.diasVencidos) {
                       // Ok, la cuota está en el rango indicado en la regla; aplicamos y pasamos a la próx cuota
                       // notese que lodah rompe el forEach si regresamos false
                       cuota.tipoEmail = regla.tipoEmail;
                       cuotasConEmailAsignado++;
                       return false;
                   };
               };

            });

            cuotasLeidas++;
        });

        // grabamos los cambios hechos en el client al server ...
        let cuotasConEmailAsignado_array = lodash(cuotasSeleccionadas).
                                                     filter((x) => { return x.tipoEmail; }).
                                                     map((x) => {
                                                         return {
                                                             cuotaID: x._id,
                                                             tipoEmail: x.tipoEmail
                                                         };
                                                     }).
                                                     value();

         $meteor.call('consultas_MontosPendientesCobro_GrabarTiposEmail', cuotasConEmailAsignado_array).then(
           function (result) {
               DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                       `Ok, el proceso de <em>asignación de tipos de e-mail</em> ha concluído
                        en forma satisfactoria.<br />
                        En total, este proceso ha leído <b>${cuotasLeidas.toString()}</b> cuotas
                        y asignado <b>${cuotasConEmailAsignado.toString()}</b> tipos de e-mail a los mismos.<br />
                        <b>${result.cantidadCuotasActualizadas.toString()}</b> registros han sido actualizados
                        en el servidor, para guardar el e-mail asignado.
                       `,
                      false).then();

              $scope.showProgress = false;
           },
           function (err) {

               let errMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

               $scope.alerts.length = 0;
               $scope.alerts.push({
                   type: 'danger',
                   msg: errMessage
               });

               $scope.showProgress = false;
           });
    };



    $scope.enviarCorreos = () => {

        if ($scope.emailCobranza && $scope.emailCobranza.docState) {
            DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                                `Ud. debe guardar los cambios efectuados antes de intentar ejecutar esta función.`,
                               false).then();
            return;
        };

        if (!cuotasSeleccionadas.length) {
            DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                                `Ud. no ha seleccionado las cuotas a las cuales desea enviar e-mails.<br />
                                Ud. debe cerrar esta diálogo y seleccionar las cuotas, a las cuales desea
                                enviar correos, en la lista.<br />
                                Luego puede regresar y ejecutar esta función.
                                `,
                               false).then();
            return;
        };

        if ($scope.emailCobranza.reglas.length === _.filter($scope.emailCobranza.reglas, (x) => { return x.suspendido; }).length) {
            DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                                `Todas las reglas están suspendidas.<br />
                                 No hay reglas que aplicar.
                                `,
                               false).then();
            return;
        };

        DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                `Este proceso envía un e-mail a cada cuota a la cual se ha asignado un tipo de e-mail.<br /><br />
                 Desea continuar y ejecutar este proceso?
                `,
               true).then(
                   () => {
                       enviarCorreos2();
                   },
                   () => {
                       return true;
                   }
               );
    };

    function enviarCorreos2() {

        $scope.showProgress = true;

        $meteor.call('consultas_MontosPendientesCobro_EnviarEmails', companiaSeleccionada._id).then(
          function (result) {
              let modalMessage = `Ok, el proceso de <em>envío de e-mails</em> ha concluído en
               forma satisfactoria.<br /><br />
               En total, este proceso ha construído <b>${result.cantidadCuotasLeidas.toString()}</b> e-mails
               para cuotas seleccionadas y a las cuales se les había asignado un tipo de e-mail.<br /><br />
               Ud. puede revisar el contenido de los e-mails enviados, si hace un <em>click</em>
               en el <em>link</em> <font color="#337AB7"><em>Download...</em></font>,
               que se muestra abajo en este diálogo.
              `;

              if (result.procesoPrueba_noEnviarEmailsACompanias) {
                  modalMessage +=
                  `<br /><br />Los e-mails que se han construído <b>no han sido, realmente, enviados a las compañías</b>,
                  aunque sí han debido llegar copias a direcciones internas.`;
              } else {
                  modalMessage +=
                  `<br /><br />Los e-mails construídos <b>han sido enviados</b>.`;
              };

              if (result.noRegistrarEnvioEnCuotas) {
                  modalMessage +=
                  `<br /><br />El envío de los e-mails <b>no ha sido registrado</b> en las cuotas de prima.`;
              } else {
                  modalMessage +=
                  `<br /><br />El envío de los e-mails <b>ha sido registrado</b> en las cuotas de prima.`;
              };

              DialogModal($modal, "<em>Generación de e-mails de cobranza</em>",
                     modalMessage,
                     false).then();

             $scope.downLoadLink = result.url;
             $scope.showProgress = false;
          },
          function (err) {
              let errMessage = ClientGlobal_Methods.mensajeErrorDesdeMethod_preparar(err);

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: errMessage
              });

              $scope.showProgress = false;
          });
    };

    $scope.setIsEdited = function () {
        if ($scope.emailCobranza.docState)
            return;

        $scope.emailCobranza.docState = 2;
    };

    $scope.showProgress = true;

    $meteor.subscribe("emailsCobranzas").then(
        function(subscriptionHandle) {
            // debugger;
            $scope.helpers({
                users: () => {
                    return Meteor.users.find({ 'personales.nombre': { $exists : true }}, { sort: { 'personales.nombre': 1 }});
                },
                cuentasBancarias: () => {
                    return CuentasBancarias.find({ cia: companiaSeleccionada._id });
                },
                emailCobranza: () => {
                    return EmailsCobranzaCuotasPendientes.findOne();
                },
            });

            if (!$scope.emailCobranza) {
                $scope.emailCobranza = {
                    _id: new Mongo.ObjectID()._str,
                    fecha: 'Caracas, ' + moment().format('DD') + ' de ' +
                           lodash.capitalize(moment().format('MMMM')) + ' de ' +
                           numeral(parseInt(moment().format('YYYY'))).format('0,0'),
                    atencion: { },
                    usuarios: [],
                    firmantes: [],
                    cuentasBancarias: [],
                    reglas: [],
                    cia: companiaSeleccionada._id,
                    docState: 1
                };
            };

            if (!_.isArray($scope.emailCobranza.usuarios)) {
                $scope.emailCobranza.usuarios = [];
            };

            if (!_.isArray($scope.emailCobranza.firmantes)) {
                $scope.emailCobranza.firmantes = [];
            };

            if (!_.isArray($scope.emailCobranza.cuentasBancarias)) {
                $scope.emailCobranza.cuentasBancarias = [];
            };

            if (!_.isArray($scope.emailCobranza.reglas)) {
                $scope.emailCobranza.reglas = [];
            };

            // creamos listas para mostrar los ddl en las listas de forma más fácil
            $scope.listaUsuarios = [];
            $scope.listaCuentasBancarias = [];

            $scope.users.forEach((u) => {
                $scope.listaUsuarios.push({ userID: u._id, nombre: `${u.personales.titulo} ${u.personales.nombre}` });
            });

            $scope.cuentasBancarias.forEach((c) => {
                $scope.listaCuentasBancarias.push({
                    cuentaID: c._id,
                    nombre: `${Bancos.findOne(c.banco).abreviatura}
                             ${Monedas.findOne(c.moneda).simbolo}
                             ${c.tipo}
                             ${c.numero}`
                });
            });

            $scope.usuarios_ui_grid.data = $scope.emailCobranza.usuarios;
            $scope.firmantes_ui_grid.data = $scope.emailCobranza.firmantes;
            $scope.cuentasBancarias_ui_grid.data = $scope.emailCobranza.cuentasBancarias;
            $scope.reglas_ui_grid.data = $scope.emailCobranza.reglas;

            // nótese cómo es ahora, que tenemos las listas, que establecemos el dataSource en
            // los ui-grids
            $scope.usuarios_ui_grid.columnDefs[1].editDropdownOptionsArray = $scope.listaUsuarios;
            $scope.firmantes_ui_grid.columnDefs[1].editDropdownOptionsArray = $scope.listaUsuarios;
            $scope.cuentasBancarias_ui_grid.columnDefs[1].editDropdownOptionsArray = $scope.listaCuentasBancarias;

            // $scope.usuarios_ui_grid.data = $scope.users;
            $scope.showProgress = false;
        },
        function() {
        }
    );

    $scope.tiposUsuarioParaEmail = [
        { tipo: 'From' }, { tipo: 'cc' }, { tipo: 'bcc' },
    ];


    $scope.usuarios_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!rowEntity.docState) {
                        rowEntity.docState = 2;
                    };

                    if (!$scope.emailCobranza.docState) {
                        $scope.emailCobranza.docState = 2;
                    };
                };
            });
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },

        getRowIdentity: function (row) {
            return row._id;
        }

    };


    $scope.usuarios_ui_grid.columnDefs = [
             {
                 name: 'docState',
                 field: 'docState',
                 displayName: '',
                 cellClass: 'ui-grid-centerCell',
                 cellTemplate:
                      '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                      '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                      '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
                 enableCellEdit: false,
                 enableColumnMenu: false,
                 enableSorting: false,
                 width: 25
             },
             {
                 name: 'userID',
                 field: 'userID',
                 displayName: 'Usuario',

                 editableCellTemplate: 'ui-grid/dropdownEditor',
                 editDropdownIdLabel: 'userID',
                 editDropdownValueLabel: 'nombre',
                 // editDropdownOptionsArray: $scope.usuarios,
                 cellFilter: 'mapDropdown:row.grid.appScope.listaUsuarios:"userID":"nombre"',

                 width: 200,
                 headerCellClass: 'ui-grid-leftCell',
                 cellClass: 'ui-grid-leftCell',
                 enableColumnMenu: false,
                 enableCellEdit: true,
                 enableSorting: true,
                 type: 'string'
             },
             {
                 name: 'tipo',
                 field: 'tipo',
                 displayName: 'Tipo',

                 editableCellTemplate: 'ui-grid/dropdownEditor',
                 editDropdownIdLabel: 'tipo',
                 editDropdownValueLabel: 'tipo',
                 editDropdownOptionsArray: $scope.tiposUsuarioParaEmail,
                 cellFilter: 'mapDropdown:row.grid.appScope.tiposUsuarioParaEmail:"tipo":"tipo"',

                 width: 80,
                 headerCellClass: 'ui-grid-leftCell',
                 cellClass: 'ui-grid-leftCell',
                 enableColumnMenu: false,
                 enableCellEdit: true,
                 enableSorting: true,
                 type: 'string'
             },
            {
                name: 'delButton',
                displayName: '',
                cellClass: 'ui-grid-centerCell',
                cellTemplate: '<span ng-click="grid.appScope.deleteItemUsuarios(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableSorting: false,
                width: 25
            }
    ];


    $scope.deleteItemUsuarios = function (item) {
        item.docState = 3;

        if (!$scope.emailCobranza.docState) {
            $scope.emailCobranza.docState = 2;
        };
    };

    $scope.nuevoUsuario = function () {
        $scope.emailCobranza.usuarios.push({
            _id: new Mongo.ObjectID()._str,
            docState: 1
        });

        if (!$scope.emailCobranza.docState) {
            $scope.emailCobranza.docState = 2;
        };
    };


    $scope.numeroFirmantesParaEmail = [
        { numero: 1 }, { numero: 2 },
    ];

    $scope.firmantes_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!rowEntity.docState) {
                        rowEntity.docState = 2;
                    };

                    if (!$scope.emailCobranza.docState) {
                        $scope.emailCobranza.docState = 2;
                    };
                };
            });
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },

        getRowIdentity: function (row) {
            return row._id;
        }

    };


    $scope.firmantes_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
                 '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
       {
           name: 'userID',
           field: 'userID',
           displayName: 'Usuario',

           editableCellTemplate: 'ui-grid/dropdownEditor',
           editDropdownIdLabel: 'userID',
           editDropdownValueLabel: 'nombre',
        //    editDropdownOptionsArray: $scope.usuarios,
           cellFilter: 'mapDropdown:row.grid.appScope.listaUsuarios:"userID":"nombre"',

           width: 200,
           headerCellClass: 'ui-grid-leftCell',
           cellClass: 'ui-grid-leftCell',
           enableColumnMenu: false,
           enableCellEdit: true,
           enableSorting: true,
           type: 'string'
       },
       {
           name: 'numero',
           field: 'numero',
           displayName: '##',

           editableCellTemplate: 'ui-grid/dropdownEditor',
           editDropdownIdLabel: 'numero',
           editDropdownValueLabel: 'numero',
           editDropdownOptionsArray: $scope.numeroFirmantesParaEmail,
           cellFilter: 'mapDropdown:row.grid.appScope.numeroFirmantesParaEmail:"numero":"numero"',

           width: 80,
           headerCellClass: 'ui-grid-leftCell',
           cellClass: 'ui-grid-leftCell',
           enableColumnMenu: false,
           enableCellEdit: true,
           enableSorting: true,
           type: 'number'
       },
       {
           name: 'delButton',
           displayName: '',
           cellClass: 'ui-grid-centerCell',
           cellTemplate: '<span ng-click="grid.appScope.deleteItemFirmantes(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
           enableCellEdit: false,
           enableSorting: false,
           width: 25
       }
    ];


    $scope.deleteItemFirmantes = function (item) {
        item.docState = 3;

        if (!$scope.emailCobranza.docState) {
            $scope.emailCobranza.docState = 2;
        };
    };

    $scope.nuevoFirmante = function () {
        $scope.emailCobranza.firmantes.push({
            _id: new Mongo.ObjectID()._str,
            docState: 1
        });

        if (!$scope.emailCobranza.docState) {
            $scope.emailCobranza.docState = 2;
        };
    };

    $scope.cuentasBancarias_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!rowEntity.docState) {
                        rowEntity.docState = 2;
                    };

                    if (!$scope.emailCobranza.docState) {
                        $scope.emailCobranza.docState = 2;
                    };
                };
            });
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },

        getRowIdentity: function (row) {
            return row._id;
        }

    };


    $scope.cuentasBancarias_ui_grid.columnDefs = [
            {
                name: 'docState',
                field: 'docState',
                displayName: '',
                cellClass: 'ui-grid-centerCell',
                cellTemplate:
                     '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                     '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                     '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableColumnMenu: false,
                enableSorting: false,
                width: 25
            },
            {
                name: 'cuentaBancariaID',
                field: 'cuentaBancariaID',
                displayName: 'Cuenta bancaria',

                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownIdLabel: 'cuentaID',
                editDropdownValueLabel: 'nombre',
                // editDropdownOptionsArray: $scope.listaCuentasBancarias,
                cellFilter: 'mapDropdown:row.grid.appScope.listaCuentasBancarias:"cuentaID":"nombre"',

                width: 200,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: true,
                enableSorting: true,
                type: 'string'
            },
            {
                name: 'delButton',
                displayName: '',
                cellClass: 'ui-grid-centerCell',
                cellTemplate: '<span ng-click="grid.appScope.deleteItemCuentasBancarias(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                enableCellEdit: false,
                enableSorting: false,
                width: 25
            }
    ];


    $scope.deleteItemCuentasBancarias = function (item) {
        item.docState = 3;

        if (!$scope.emailCobranza.docState) {
            $scope.emailCobranza.docState = 2;
        };
    };

    $scope.nuevaCuentaBancaria = function () {
        $scope.emailCobranza.cuentasBancarias.push({
            _id: new Mongo.ObjectID()._str,
            docState: 1
        });

        if (!$scope.emailCobranza.docState) {
            $scope.emailCobranza.docState = 2;
        };
    };































    $scope.tiposEmail = [
        { tipo: 'Email #1' },
        { tipo: 'Email #2' },
        { tipo: 'Email #3' },
        { tipo: 'Email #4' },
        { tipo: 'Email #5' },
    ];


    $scope.reglas_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: false,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 35,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            // marcamos el contrato como actualizado cuando el usuario edita un valor
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!rowEntity.docState) {
                        rowEntity.docState = 2;
                    };

                    if (!$scope.emailCobranza.docState) {
                        $scope.emailCobranza.docState = 2;
                    };
                };
            });
        },

        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    };


    $scope.reglas_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate:
                 '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
                 '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },

        {
            name: 'numero',
            field: 'numero',
            displayName: '##',

            width: 50,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'fechaCuotaDesde',
            field: 'fechaCuotaDesde',
            displayName: 'Fecha - Desde',

            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'fechaCuotaHasta',
            field: 'fechaCuotaHasta',
            displayName: 'Fecha - Hasta',

            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'fechaVencimientoDesde',
            field: 'fechaVencimientoDesde',
            displayName: 'F venc - Desde',

            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'fechaVencimientoHasta',
            field: 'fechaVencimientoHasta',
            displayName: 'F venc - Hasta',

            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },

         {
             name: 'tipoEmail',
             field: 'tipoEmail',
             displayName: 'Email',

             editableCellTemplate: 'ui-grid/dropdownEditor',
             editDropdownIdLabel: 'tipo',
             editDropdownValueLabel: 'tipo',
             editDropdownOptionsArray: $scope.tiposEmail,
             cellFilter: 'mapDropdown:row.grid.appScope.tiposEmail:"tipo":"tipo"',

             width: 80,
             headerCellClass: 'ui-grid-leftCell',
             cellClass: 'ui-grid-leftCell',
             enableColumnMenu: false,
             enableCellEdit: true,
             enableSorting: true,
             type: 'string'
         },

         {
             name: 'emailsEnviarHasta',
             field: 'emailsEnviarHasta',
             displayName: 'Enviar hasta',

             width: 100,
             headerCellClass: 'ui-grid-centerCell',
             cellClass: 'ui-grid-centerCell',
             enableColumnMenu: false,
             enableCellEdit: true,
             enableSorting: true,
             type: 'number'
         },
         {
             name: 'suspendido',
             field: 'suspendido',
             displayName: 'Susp',

             width: 60,
             headerCellClass: 'ui-grid-centerCell',
             cellClass: 'ui-grid-centerCell',
             cellFilter: 'boolFilter',
             enableColumnMenu: false,
             enableCellEdit: true,
             enableSorting: true,
             type: 'boolean'
         },
        {
            name: 'delButton',
            displayName: '',
            cellClass: 'ui-grid-centerCell',
            cellTemplate: '<span ng-click="grid.appScope.deleteItemRegla(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ];


    $scope.deleteItemRegla = function (item) {
        item.docState = 3;

        if (!$scope.emailCobranza.docState) {
            $scope.emailCobranza.docState = 2;
        };
    };

    $scope.nuevaRegla = function () {
        let count = $scope.emailCobranza.reglas.length;

        $scope.emailCobranza.reglas.push({
            _id: new Mongo.ObjectID()._str,
            numero: count + 1,
            docState: 1
        });

        if (!$scope.emailCobranza.docState) {
            $scope.emailCobranza.docState = 2;
        };
    };



}
]);
