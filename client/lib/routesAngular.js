
import { Meteor } from 'meteor/meteor'; 
import angular from 'angular';

angular.module("scrwebm").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function ($urlRouterProvider, $stateProvider, $locationProvider) {

        $locationProvider.html5Mode(true);

          $stateProvider
            .state('main', {
                url: '/',
                templateUrl: 'client/main.html'
        })
        // ----------------------------------------------------------------
        // catálogos
        // ----------------------------------------------------------------
        .state('catalogos', {
            url: '/catalogos',
            templateUrl: 'client/catalogos/catalogos.html', 
            controller: 'Catalogos_Controller'
        })

        // configuración de contratos proporcionales
        .state('catalogos.contrProp_configuracion', {
            url: '/contratosProp_configuracion',
            templateUrl: 'client/catalogos/contratosProp_configuracion/main.html',
            controller: 'ContratosProp_Configuracion_Controller',
            parent: 'catalogos',
        })
        .state('catalogos.contrProp_configuracion.contrProp_configuracion_lista', {
            url: '/lista',
            templateUrl: 'client/catalogos/contratosProp_configuracion/lista.html',
            controller: 'ContratosProp_Configuracion_Lista_Controller',
            parent: 'catalogos.contrProp_configuracion',
        })
        .state('catalogos.contrProp_configuracion.contratosListaProp_configuracion_tabla', {
            url: '/tabla?codigoContrato',
            templateUrl: 'client/catalogos/contratosProp_configuracion/tabla.html',
            controller: 'ContratosProp_Configuracion_Tabla_Controller',
            params: { codigoContrato: null, },
            parent: 'catalogos.contrProp_configuracion',
        })
        .state('catalogos.contrProp_configuracion.contratosListaProp_configuracion_tabla_construir', {
            url: '/tabla_construir?codigoContrato',
            templateUrl: 'client/catalogos/contratosProp_configuracion/tabla_construir.html',
            controller: 'ContratosProp_Configuracion_Tabla_Construir_Controller',
            params: { codigoContrato: null, },
            parent: 'catalogos.contrProp_configuracion',
        })

        .state('catalogos.companias', {
            url: '/companias',
            templateUrl: 'client/imports/catalogos/companias/companias.html',
            controller: 'CompaniasController'
        })
        .state('catalogos.asegurados', {
            url: '/asegurados',
            templateUrl: 'client/catalogos/asegurados/asegurados.html',
            controller: 'AseguradosController'
        })
        .state('catalogos.monedas', {
            url: '/monedas',
            templateUrl: 'client/catalogos/monedas.html',
            controller: 'MonedasController'
        })
        .state('catalogos.bancos', {
            url: '/bancos',
            templateUrl: 'client/catalogos/bancos.html',
            controller: 'BancosController'
        })
        .state('catalogos.cuentasBancarias', {
            url: '/cuentasBancarias',
            templateUrl: 'client/catalogos/cuentasBancarias/cuentasBancarias.html',
            controller: 'CuentasBancariasController'
        })
        .state('catalogos.ciasUsuarias', {
            url: '/ciasUsuarias',
            templateUrl: 'client/catalogos/empresasUsuarias/empresasUsuarias.html',
            controller: 'EmpresasUsuarias_Controller'
        })
        .state('catalogos.coberturas', {
            url: '/coberturas',
            templateUrl: 'client/catalogos/coberturas.html',
            controller: 'CoberturasController'
        })
        .state('catalogos.ramos', {
            url: '/ramos',
            templateUrl: 'client/catalogos/ramos/ramos.html',
            controller: 'RamosController'
        })
        .state('catalogos.indoles', {
            url: '/indoles',
            templateUrl: 'client/catalogos/indoles.html',
            controller: 'IndolesController'
        })
        .state('catalogos.tiposObjetoAsegurado', {
            url: '/tiposObjetoAsegurado',
            templateUrl: 'client/imports/catalogos/tiposObjetoAsegurado/tiposObjetoAsegurado.html',
            controller: 'TiposObjetoAseguradoController'
        })
        .state('catalogos.cumulos', {
            url: '/cumulos',
            templateUrl: 'client/imports/catalogos/cumulos/cumulos.html',
            controller: 'CumulosController'
        })
        .state('catalogos.suscriptores', {
            url: '/suscriptores',
            templateUrl: 'client/catalogos/suscriptores.html',
            controller: 'SuscriptoresController'
        })
        .state('catalogos.tiposContrato', {
            url: '/tiposContrato',
            templateUrl: 'client/catalogos/tiposContrato/tiposContrato.html',
            controller: 'TiposContratoController'
        })
        .state('catalogos.tiposFacultativo', {
            url: '/tiposFacultativo',
            templateUrl: 'client/catalogos/tiposFacultativo/tiposFacultativo.html',
            controller: 'TiposFacultativoController'
        })
        .state('catalogos.tiposSiniestro', {
            url: '/tiposSiniestro',
            templateUrl: 'client/catalogos/tiposSiniestro/tiposSiniestro.html',
            controller: 'TiposSiniestroController'
        })
        .state('catalogos.causasSiniestro', {
            url: '/causasSiniestro',
            templateUrl: 'client/catalogos/causasSiniestro.html',
            controller: 'CausasSiniestroController'
        })
        .state('catalogos.roles', {
            url: '/roles',
            templateUrl: 'client/catalogos/roles.html',
            controller: 'RolesController'
        })
        .state('catalogos.contratosParametros', {
            url: '/contratosParametros',
            templateUrl: 'client/catalogos/contratosParametros/contratosParametros.html',
            controller: 'ContratosParametrosController'
        })
        .state('catalogos.cuentasContables', {
            url: '/cuentasContables',
            templateUrl: 'client/catalogos/cuentasContables/cuentasContables.html',
            controller: 'CuentasContablesController'
        })
        .state('catalogos.cuentasContablesAsociadas', {
            url: '/cuentasContablesAsociadas',
            templateUrl: 'client/catalogos/cuentasContablesAsociadas/cuentasContablesAsociadas.html',
            controller: 'CuentasContablesAsociadas_Controller'
        })
        // ----------------------------------------------------------------
        // generales
        // ----------------------------------------------------------------
        // seleccionar compañía
        .state('seleccionarCompania', {
            url: '/generales/seleccionarCiaUsuaria',
            templateUrl: 'client/generales/seleccionarCompania/seleccionarCompania.html',
            controller: 'SeleccionarCompaniaController'
        })
        // ----------------------------------------------------------------
        // contratos
        // ----------------------------------------------------------------
        .state('contratosFiltro', {
            url: '/contratos/filtro?origen',
            templateUrl: 'client/contratos/filtro.html',
            controller: 'ContratosFiltroController',
            params: { 'origen': null, },
        })
        .state('contratosLista', {
            url: '/contratos/lista?origen&limit',
            templateUrl: 'client/contratos/lista.html',
            controller: 'ContratosListaController',
            params: { 'origen': null, 'limit': null, },
        })
        .state('contrato', {
            url: '/contratos/contrato?origen&id&limit&vieneDeAfuera',
            templateUrl: 'client/contratos/contrato.html',
            params: { 'origen': null, 'id': null, 'limit': null, 'vieneDeAfuera': null },
            controller: 'ContratoController',
        })
        .state('contrato.generales', {
            templateUrl: 'client/contratos/contrato.generales.html',
            parent: 'contrato',
        })
        .state('contrato.capas', {
            templateUrl: 'client/contratos/contrato.capas.html',
            parent: 'contrato'
        })
        .state('contrato.cuentas', {
            templateUrl: 'client/contratos/contrato.cuentas.html',
            parent: 'contrato'
        })
        .state('contrato.cuentas.definiciones', {
            templateUrl: 'client/contratos/contratos.cuentas/contrato.cuentas.definiciones.html',
            controller: 'Contrato_Cuentas_Definiciones_Controller', 
            parent: 'contrato.cuentas'
        })
        .state('contrato.cuentas.cuentasTecnicas', {
            templateUrl: 'client/contratos/contratos.cuentas/contrato.cuentas.cuentasTecnicas.html',
            controller: 'Contrato_Cuentas_CuentasTecnicas_Controller',
            parent: 'contrato.cuentas'
        })
        .state('contrato.cuentas.comisionAdicional', {
            templateUrl: 'client/contratos/contratos.cuentas/contrato.cuentas.comisionAdic.html',
            controller: 'Contrato_Cuentas_ComisionAdicional_Controller',
            parent: 'contrato.cuentas'
        })
        .state('contrato.cuentas.participacionBeneficios', {
            templateUrl: 'client/contratos/contratos.cuentas/contrato.cuentas.partBeneficios.html',
            controller: 'Contrato_Cuentas_ParticipacionBeneficios_Controller',
            parent: 'contrato.cuentas'
        })
        .state('contrato.cuentas.entradaCarteraPrimas', {
            templateUrl: 'client/contratos/contratos.cuentas/contrato.cuentas.entCartPrimas.html',
            controller: 'Contrato_Cuentas_EntCartPr_Controller',
            parent: 'contrato.cuentas'
        })
        .state('contrato.cuentas.retiradaCarteraPrimas', {
            templateUrl: 'client/contratos/contratos.cuentas/contrato.cuentas.retCartPrimas.html',
            controller: 'Contrato_Cuentas_RetCartPr_Controller',
            parent: 'contrato.cuentas'
        })
        .state('contrato.cuentas.entradaCarteraSiniestros', {
            templateUrl: 'client/contratos/contratos.cuentas/contrato.cuentas.entCartSiniestros.html',
            controller: 'Contrato_Cuentas_EntCartSn_Controller',
            parent: 'contrato.cuentas'
        })
        .state('contrato.cuentas.retiradaCarteraSiniestros', {
            templateUrl: 'client/contratos/contratos.cuentas/contrato.cuentas.retCartSiniestros.html',
            controller: 'Contrato_Cuentas_RetCartSn_Controller',
            parent: 'contrato.cuentas'
        })
        // ----------------------------------------------------------------
        // riesgos (facultativo)
        // ----------------------------------------------------------------
        .state('riesgosFiltro', {
            url: '/riesgos/filtro?origen',
            templateUrl: 'client/imports/riesgos/filtro.html',
            controller: 'RiesgosFiltro_Controller',
            params: { 'origen': null, },
        })
        .state('riesgosLista', {
            url: '/riesgos/lista?origen&limit',
            templateUrl: 'client/imports/riesgos/lista.html',
            controller: 'RiesgosLista_Controller',
            params: { 'origen': null, 'limit': null, },
        })
        .state('riesgo', {
            url: '/riesgos/riesgo?origen&id&limit&vieneDeAfuera',
            templateUrl: 'client/imports/riesgos/riesgo.html',
            controller: 'Riesgo_Controller',
            params: { 'origen': null, 'id': null, 'limit': null, 'vieneDeAfuera': null },
        })

        .state('riesgo.generales', {
            templateUrl: 'client/imports/riesgos/riesgo.generales.html',
            controller: 'RiesgoGenerales_Controller',
            parent: 'riesgo'
        })
        .state('riesgo.movimientos', {
            templateUrl: 'client/imports/riesgos/riesgo.movimientos.html',
            controller: 'RiesgoMovimientos_Controller',
            parent: 'riesgo'
        })
        .state('riesgo.infoRamo_autos', {
            templateUrl: 'client/imports/riesgos/riesgo.infoRamo_autos.html',
            controller: 'RiesgoInfoRamo_autos_Controller',
            parent: 'riesgo'
        })
        .state('riesgo.productores', {
            templateUrl: 'client/imports/riesgos/riesgo.productores.html',
            controller: 'RiesgoProductores_Controller',
            parent: 'riesgo'
        })
        .state('riesgo.cuotas', {
            templateUrl: 'client/imports/riesgos/riesgo.cuotas.html',
            controller: 'RiesgoCuotas_Controller',
            parent: 'riesgo'
        })
        .state('riesgo.notasDebito', {
            templateUrl: 'client/imports/riesgos/notasDebito/notasDebito.html',
            controller: 'NotasDebitoController',
            parent: 'riesgo'
        })

        // ----------------------------------------------------------------
        // remesas
        // ----------------------------------------------------------------
        .state('remesasFiltro', {
            url: '/remesas/filtro?origen',
            templateUrl: 'client/imports/remesas/filtro.html',
            controller: 'RemesasFiltroController'
        })
        .state('remesasLista', {
            url: '/remesas/lista?origen&pageNumber',
            templateUrl: 'client/imports/remesas/lista.html',
            controller: 'RemesasListaController',
            params: { 'origen': null, 'pageNumber': null }
        })
        .state('remesa', {
            url: '/remesas/remesa?origen&id&pageNumber&vieneDeAfuera',
            templateUrl: 'client/imports/remesas/remesa.html',
            controller: 'RemesaController',
            params: { 'origen': null, 'id': null, 'pageNumber': null, 'vieneDeAfuera': null }
        })
        .state('remesa.generales', {
            templateUrl: 'client/imports/remesas/remesa.generales.html',
            parent: 'remesa'
        })
        .state('remesa.detalle', {
            templateUrl: 'client/imports/remesas/remesa.detalle.html',
            parent: 'remesa'
        })
        .state('remesa.cuadre', {
            templateUrl: 'client/imports/remesas/remesa.cuadre.html',
            parent: 'remesa'
        })

        // ----------------------------------------------------------------
        // cobranzas
        // ----------------------------------------------------------------
        .state('cobranzas', {
            url: '/cobranzas',
            templateUrl: 'client/html/cobranzas/cobranzas.html',
            controller: 'CobranzasController'
        })
        .state('cobranzas.seleccionRemesa', {
            url: '/cobranzas/seleccionRemesa',
            templateUrl: 'client/html/cobranzas/cobranzas.seleccionRemesa.html',
            controller: 'CobranzasSeleccionRemesaController'
        })
        .state('cobranzas.aplicarPagos', {
            url: '/cobranzas/aplicarPagos?remesaPK',
            templateUrl: 'client/html/cobranzas/cobranzas.aplicarPagos.html',
            controller: 'CobranzasAplicarPagosController',
            params: { 'remesaPK': null }
        })
        .state('cobranzas.resultados', {
            url: '/cobranzas/resultados?remesaID&cantPagos',
            templateUrl: 'client/html/cobranzas/cobranzas.resultados.html',
            controller: 'CobranzasResultadosController',
            params: { 'remesaID': null, 'cantPagos': null }
        })

        // ----------------------------------------------------------------
        // siniestros
        // ----------------------------------------------------------------
        .state('siniestrosFiltro', {
            url: '/siniestros/filtro?origen',
            templateUrl: 'client/siniestros/filtro.html',
            controller: 'SiniestrosFiltroController',
            params: { 'origen': null }
        })
        .state('siniestrosLista', {
            url: '/siniestros/lista?origen&pageNumber',
            templateUrl: 'client/siniestros/lista.html',
            controller: 'SiniestrosListaController',
            params: { 'origen': null, 'pageNumber': null }
        })
        .state('siniestro', {
            url: '/siniestros/siniestro?origen&id&pageNumber',
            templateUrl: 'client/siniestros/siniestro.html',
            controller: 'SiniestroController',
            params: { 'origen': null, 'id': null, 'pageNumber': null }
        })
        .state('siniestro.generales', {
            templateUrl: 'client/siniestros/siniestro.generales.html',
            parent: 'siniestro'
        })
        .state('siniestro.entidadDeOrigen', {
            templateUrl: 'client/siniestros/siniestro.entidadDeOrigen.html',
            parent: 'siniestro'
        })
        .state('siniestro.notas', {
            templateUrl: 'client/siniestros/siniestro.notas.html',
            parent: 'siniestro'
        })
        .state('siniestro.companias', {
            templateUrl: 'client/siniestros/siniestro.companias.html',
            parent: 'siniestro'
        })
        .state('siniestro.reservas', {
            templateUrl: 'client/siniestros/siniestro.reservas.html',
            parent: 'siniestro'
        })
        .state('siniestro.liquidaciones', {
            templateUrl: 'client/siniestros/siniestro.liquidaciones.html',
            parent: 'siniestro'
        })
        .state('siniestro.cuotas', {
            templateUrl: 'client/siniestros/siniestro.cuotas.html',
            parent: 'siniestro'
        })

        // ----------------------------------------------------------------
        // consultas            
        // ----------------------------------------------------------------
        .state('consultas', {
            url: '/consultas',
            abstract: true,
            template: '<div class="row" ui-view></div>'
        })

        .state('consultas.primasEmitidas', {
            url: '/primasEmitidas',
            abstract: true,
            template: '<div class="row" ui-view></div>', 
            parent: 'consultas'
        })

        .state('consultas.primasEmitidas.reaseguradores', {
            url: '/reaseguradores',
            template: '<consultas-primas-emitidas-reaseguradores />',
            parent: 'consultas.primasEmitidas', 
        })   

        // IMPORTANTE: nótese lo que hacemos para pasar props al react component. En realidad, aquí se pasan al angular 
        // component; luego, con react2angular, al react component. En resolve, obtenemos los datos que necesitamos; en este 
        // caso, usamos un meteor method. Luego, en el (inline) controller, usamos this para mantener estos datos. Para 
        // poder pasarlos al template, usamos controllerAs, para crear un controller (ctrl) que es el que se pasa 
        // en el template (upppssss!) 
        .state('consultas.primasEmitidas.reaseguradores-lista', {
            url: '/reaseguradores-lista',

            resolve: {
                recCount: () => {
                    return new Promise((resolve) => {
                        Meteor.call('consultas.primasEmitidas.reaseguradores.getRecCount', Meteor.userId(), (err, result) => {
                            this.recCount = result.recordCount; 
                            resolve(result.recordCount); 
                        })
                    })
                }
            },

            controller: ['recCount', function (recCount) {
                this.recCount = recCount;
            }],
            controllerAs: 'ctrl',

            template: `<consultas-primas-emitidas-reaseguradores-lista record-count="ctrl.recCount" />`,
            parent: 'consultas.primasEmitidas'
        })      
        
        .state('montosPendientesFiltro', {
            url: '/consultas/pendientes/filtro',
            templateUrl: 'client/consultas/montosPendientes/filtro.html',
            controller: 'ConsultasMontosPendientesFiltroController'
        })
        .state('montosPendientesLista', {
            url: '/consultas/pendientes/lista?companiaSeleccionada&parametrosReporte',
            templateUrl: 'client/consultas/montosPendientes/lista.html',
            controller: 'ConsultaMontosPendientesListaController',
            params: { 'companiaSeleccionada': null, 'parametrosReporte': null }
        })

        // ------------------------------------------------------------------------------------
        // montos pendientes de cobro - vencimientos 
        .state('pendientesCobro_vencimientos_consulta', {
            url: '/pendientesCobro_vencimientos',
            templateUrl: 'client/imports/consultas/pendientesCobro_vencimientos/main.html',
            controller: 'ConsultasMontosPendientesCobroVencimientos_Controller', 
            parent: 'consultas'
        })
        .state('pendientesCobro_vencimientos_consulta_filter', {
            url: '/filter',
            templateUrl: 'client/imports/consultas/pendientesCobro_vencimientos/filtro.html',
            controller: 'ConsultasMontosPendientesCobroVencimientos_Filtro_Controller',
            parent:'pendientesCobro_vencimientos_consulta',
        })
        .state('pendientesCobro_vencimientos_consulta_list', {
            url: '/list?companiaSeleccionada&parametrosReporte',
            templateUrl: 'client/imports/consultas/pendientesCobro_vencimientos/list.html',
            controller: 'ConsultasMontosPendientesCobroVencimientos_Lista_Controller',
            params: { companiaSeleccionada: null, parametrosReporte: null },
            parent:'pendientesCobro_vencimientos_consulta',
        })

        .state('pendientesPago_vencimientos_consulta', {
            url: '/consultas/pendientesPago_vencimientos',
            templateUrl: 'client/consultas/pendientesPago_vencimientos/main.html',
            controller: 'ConsultasMontosPendientesPagoVencimientos_Controller'
        })
        .state('pendientesPago_vencimientos_consulta_filter', {
            url: '/filter',
            templateUrl: 'client/consultas/pendientesPago_vencimientos/filtro.html',
            controller: 'ConsultasMontosPendientesPagoVencimientos_Filtro_Controller',
            parent:'pendientesPago_vencimientos_consulta',
        })
        .state('pendientesPago_vencimientos_consulta_list', {
            url: '/list?companiaSeleccionada&parametrosReporte',
            templateUrl: 'client/consultas/pendientesPago_vencimientos/list.html',
            controller: 'ConsultasMontosPendientesPagoVencimientos_Lista_Controller',
            params: { companiaSeleccionada: null, parametrosReporte: null },
            parent:'pendientesPago_vencimientos_consulta',
        })

        .state('corretaje_consulta', {
            url: '/consultas/corretaje',
            templateUrl: 'client/consultas/corretaje/main.html',
            controller: 'ConsultasCorretaje_Controller'
        })
        .state('corretaje_consulta_filter', {
            url: '/filter',
            templateUrl: 'client/consultas/corretaje/filtro.html',
            controller: 'ConsultasCorretaje_Filtro_Controller',
            parent:'corretaje_consulta',
        })
        .state('corretaje_consulta_list', {
            url: '/list?companiaSeleccionada&parametrosReporte',
            templateUrl: 'client/consultas/corretaje/list.html',
            controller: 'CConsultasCorretaje_Lista_Controller',
            params: { companiaSeleccionada: null },
            parent:'corretaje_consulta',
        })

        // ------------------------------------------------------------------------------------
        // cúmulos - consulta 
        .state('consultas.cumulos', {
            url: '/cumulos',
            abstract: true,
            template: '<div class="row" ui-view></div>', 
            parent: 'consultas'
        })

        .state('consultas.cumulos.filtro', {
            url: '/filtro',
            template: '<consulta-cumulos-filtro />',
            parent: 'consultas.cumulos', 
        }) 
        // IMPORTANTE: nótese lo que hacemos para pasar props al react component. En realidad, aquí se pasan al angular 
        // component; luego, con react2angular, al react component. En resolve, obtenemos los datos que necesitamos; en este 
        // caso, usamos un meteor method. Luego, en el (inline) controller, usamos this para mantener estos datos. Para 
        // poder pasarlos al template, usamos controllerAs, para crear un controller (ctrl) que es el que se pasa 
        // en el template (upppssss!) 
        .state('consultas.cumulos.lista', {
            url: '/lista',

            resolve: {
                recCount: () => {
                    return new Promise((resolve) => {
                        Meteor.call('consultas.cumulos.getRecCount', Meteor.userId(), (err, result) => {
                            this.recCount = result.recordCount; 
                            resolve(result.recordCount); 
                        })
                    })
                }
            },

            controller: ['recCount', function (recCount) {
                this.recCount = recCount;
            }],
            controllerAs: 'ctrl',

            template: `<consulta-cumulos-lista record-count="ctrl.recCount" />`,
            parent: 'consultas.cumulos', 
        }) 
        
        // ------------------------------------------------------------------------------------
        // montos cobrados - consulta 
        // ------------------------------------------------------------------------------------
        .state('consultas.montosCobrados', {
            url: '/montosCobrados',
            abstract: true,
            template: '<div class="row" ui-view></div>',
            parent: 'consultas'
        })

        .state('consultas.montosCobrados.filtro', {
            url: '/filtro',
            template: '<consulta-montos-cobrados-filtro />',
            parent: 'consultas.montosCobrados',
        })
        // IMPORTANTE: nótese lo que hacemos para pasar props al react component. En realidad, aquí se pasan al angular 
        // component; luego, con react2angular, al react component. En resolve, obtenemos los datos que necesitamos; en este 
        // caso, usamos un meteor method. Luego, en el (inline) controller, usamos this para mantener estos datos. Para 
        // poder pasarlos al template, usamos controllerAs, para crear un controller (ctrl) que es el que se pasa 
        // en el template (upppssss!) 
        .state('consultas.montosCobrados.lista', {
            url: '/lista',

            resolve: {
                recCount: () => {
                    return new Promise((resolve) => {
                        Meteor.call('consultas.montosCobrados.getRecCount', Meteor.userId(), (err, result) => {
                            this.recCount = result.recordCount;
                            resolve(result.recordCount);
                        })
                    })
                }
            },

            controller: ['recCount', function (recCount) {
                this.recCount = recCount;
            }],
            controllerAs: 'ctrl',

            template: `<consulta-montos-cobrados-lista record-count="ctrl.recCount" />`,
            parent: 'consultas.montosCobrados',
        }) 

        // ------------------------------------------------------------------------------------
        // montos pagados - consulta 
        // ------------------------------------------------------------------------------------
        .state('consultas.montosPagados', {
            url: '/montosPagados',
            abstract: true,
            template: '<div class="row" ui-view></div>',
            parent: 'consultas'
        })

        .state('consultas.montosPagados.filtro', {
            url: '/filtro',
            template: '<consulta-montos-pagados-filtro />',
            parent: 'consultas.montosPagados',
        })
        // IMPORTANTE: nótese lo que hacemos para pasar props al react component. En realidad, aquí se pasan al angular 
        // component; luego, con react2angular, al react component. En resolve, obtenemos los datos que necesitamos; en este 
        // caso, usamos un meteor method. Luego, en el (inline) controller, usamos this para mantener estos datos. Para 
        // poder pasarlos al template, usamos controllerAs, para crear un controller (ctrl) que es el que se pasa 
        // en el template (upppssss!) 
        .state('consultas.montosPagados.lista', {
            url: '/lista',

            resolve: {
                recCount: () => {
                    return new Promise((resolve) => {
                        Meteor.call('consultas.montosPagados.getRecCount', Meteor.userId(), (err, result) => {
                            this.recCount = result.recordCount;
                            resolve(result.recordCount);
                        })
                    })
                }
            },

            controller: ['recCount', function (recCount) {
                this.recCount = recCount;
            }],
            controllerAs: 'ctrl',

            template: `<consulta-montos-pagados-lista record-count="ctrl.recCount" />`,
            parent: 'consultas.montosPagados',
        }) 

        // ----------------------------------------------------------------
        // cumulos            
        // ----------------------------------------------------------------
        .state('cumulos', {
            url: '/cumulos',
            abstract: true,
            template: '<div class="row" ui-view></div>', 
        })

        // nótese cómo funciona este (angular) state: 
        // 1) el state tiene un nombre: 'cumulos.registro' 
        // 2) el state tiene un url; con el url, el state recibe parámetros 
        // 3) los parámetros son pasados al controller ($stateParams); el controller está codificado allí mismo 
        // 4) se intenta montar el component, pero angular, y se pasan los parámetros como props 
        // 5) finalmente, con react2angular, se monta el react component, el cual recibe todos estos props pues se definen en PropTypes 
        .state('cumulos.registro', {
            url: '/registro?modo&origen&entityId&subEntityId&url',
            controller: ['$stateParams', function ($stateParams) {
                this.modo = $stateParams.modo;
                this.origen = $stateParams.origen;
                this.entityId = $stateParams.entityId;
                this.subEntityId = $stateParams.subEntityId;
                this.url = $stateParams.url; 
            }],
            controllerAs: 'ctrl',
            params: { modo: null, origen: null, entityId: "", subEntityId: "", url: "" },
            template: '<registro-cumulos modo="ctrl.modo" origen="ctrl.origen" entity-id="ctrl.entityId" sub-entity-id="ctrl.subEntityId" url="ctrl.url" />',
            parent: 'cumulos'
        })

        // ----------------------------------------------------------------
        // cierre
        // ----------------------------------------------------------------
        .state('cierre', {
            url: '/cierre',
            templateUrl: 'client/cierre/cierre.html',
            controller: 'Cierre_Controller'
        })
        .state('cierre.cierre', {
            url: '/cierre',
            templateUrl: 'client/cierre/cierre/cierre.html',
            controller: 'Cierre.Cierre.Controller', 
            parent:'cierre',
        })
        .state('cierre.registro', {
            url: '/registro',
            templateUrl: 'client/cierre/registro/cierreRegistro.html',
            controller: 'Cierre.Registro.Controller', 
            parent:'cierre',
        })
        .state('cierre.consulta', {
            url: '/consulta',
            templateUrl: 'client/cierre/consulta/cierreConsulta.html',
            controller: 'Cierre.Consulta.Controller', 
            parent:'cierre',
        })
        .state('cierre.periodosDeCierre', {
            url: '/periodosDeCierre',
            templateUrl: 'client/cierre/periodosDeCierre/periodosDeCierre.html',
            controller: 'Cierre.periodosDeCierre.Controller', 
            parent:'cierre',
        })

        // ----------------------------------------------------------------
        // utilitarios
        // ----------------------------------------------------------------
        .state('utilitarios', {
            url: '/utilitarios',
            templateUrl: 'client/imports/utilitarios/utilitarios.html',
            controller: 'Utilitarios_Controller'
        })

        // tabla de números de referencia
        .state('utilitarios_tablaNumerosReferencia', {
            url: '/utilitarios/tablaNumerosReferencia',
            templateUrl: 'client/utilitarios/tablaNumerosReferencia/tablaNumerosReferencia.html',
            controller: 'Utilitarios_TablaNumerosReferencia_Controller'
        })
        .state('utilitarios_reconversion', {
            url: '/utilitarios/reconversion',
            templateUrl: 'client/utilitarios/reconversion/reconversion.html',
            controller: 'Utilitarios_Reconversion_Controller'
        })
        .state('utilitarios_reconversion_riesgos', {
            url: '/utilitarios/reconversionRiesgos',
            templateUrl: 'client/utilitarios/reconversionRiesgos/reconversion.html',
            controller: 'Utilitarios_Reconversion_Riesgos_Controller'
        })

        .state('utilitarios.pruebaEnviarEmail', {
            url: '/pruebaEnviarEmail',
            templateUrl: 'client/imports/utilitarios/pruebaEnviarEmail/pruebaEnviarEmail.html',
            controller: 'Prueba_EnviarEmail_Controller', 
            parent: 'utilitarios',
        })

        // ----------------------------------------------------------------
        // administración (funciones para el administrador)
        // ---------------------------------------------------------------- 
        .state('usuarioRoles', {
            url: '/administracion/usuariosYRoles',
            templateUrl: 'client/imports/administracion/usuariosRoles/usuariosRoles.html',
            controller: 'UsuariosRolesController'
        })
        .state('usuarios', {
            url: '/administracion/usuarios',
            templateUrl: 'client/imports/administracion/usuarios/usuarios.html',
            controller: 'UsuariosDatosPersonalesController'
        })
        .state('usuariosEmpresas', {
            url: '/administracion/usuariosEmpresas',
            template: '<usuarios-empresas />'
        })
        .state('usuariosLogin', {
            url: '/administracion/usuariosLogin',
            template: '<usuarios-login />'
        })

        // ----------------------------------------------------------------
        // notas de crédito/débito 
        // ----------------------------------------------------------------
        .state('notasDebitoCredito', {
            url: '/notasDebitoCredito?origen',
            templateUrl: 'client/html/notasDebitoCredito/notasDebitoCredito.html', 
            controller: 'NotasDebitoCredito_Controller', 
            params: { 'origen': null }
        })
        
        $urlRouterProvider.otherwise("/");
  }
]);
