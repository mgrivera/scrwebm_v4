


angular.module("scrwebM").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
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
            templateUrl: 'client/catalogos/catalogos.html'
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
            templateUrl: 'client/catalogos/companias/companias.html',
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
            templateUrl: 'client/catalogos/empresasUsuarias.html',
            controller: 'EmpresasUsuarias_Controller'
        })
        .state('catalogos.coberturas', {
            url: '/coberturas',
            templateUrl: 'client/catalogos/coberturas.html',
            controller: 'CoberturasController'
        })
        .state('catalogos.ramos', {
            url: '/ramos',
            templateUrl: 'client/catalogos/ramos.html',
            controller: 'RamosController'
        })
        .state('catalogos.indoles', {
            url: '/indoles',
            templateUrl: 'client/catalogos/indoles.html',
            controller: 'IndolesController'
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
            templateUrl: 'client/seleccionarCompania/seleccionarCompania.html',
            controller: 'SeleccionarCompaniaController'
        })
        // registrar archivos (logos, plantillas, ...)
        .state('registrarArchivos', {
            url: '/generales/registrarArchivos',
            templateUrl: 'client/generales/registroArchivos/registroArchivos.html',
            controller: 'RegistroArchivosController'
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
            templateUrl: 'client/riesgos/filtro.html',
            controller: 'RiesgosFiltroController',
            params: { 'origen': null, },
        })
        .state('riesgosLista', {
            url: '/riesgos/lista?origen&limit',
            templateUrl: 'client/riesgos/lista.html',
            controller: 'RiesgosListaController',
            params: { 'origen': null, 'limit': null, },
        })
        .state('riesgo', {
            url: '/riesgos/riesgo?origen&id&limit&vieneDeAfuera',
            templateUrl: 'client/riesgos/riesgo.html',
            controller: 'RiesgoController',
            params: { 'origen': null, 'id': null, 'limit': null, 'vieneDeAfuera': null },
        })
        .state('riesgo.generales', {
            templateUrl: 'client/riesgos/riesgo.generales.html',
            parent: 'riesgo'
        })
        .state('riesgo.movimientos', {
            templateUrl: 'client/riesgos/riesgo.movimientos.html',
            parent: 'riesgo'
        })
        .state('riesgo.productores', {
            templateUrl: 'client/riesgos/riesgo.productores.html',
            parent: 'riesgo'
        })
        .state('riesgo.cuotas', {
            templateUrl: 'client/riesgos/riesgo.cuotas.html',
            parent: 'riesgo'
        })
        // ----------------------------------------------------------------
        // remesas
        // ----------------------------------------------------------------
        .state('remesasFiltro', {
            url: '/remesas/filtro?origen',
            templateUrl: 'client/remesas/filtro.html',
            controller: 'RemesasFiltroController'
        })
        .state('remesasLista', {
            url: '/remesas/lista?origen&pageNumber',
            templateUrl: 'client/remesas/lista.html',
            controller: 'RemesasListaController',
            params: { 'origen': null, 'pageNumber': null }
        })
        .state('remesa', {
            url: '/remesas/remesa?origen&id&pageNumber&vieneDeAfuera',
            templateUrl: 'client/remesas/remesa.html',
            controller: 'RemesaController',
            params: { 'origen': null, 'id': null, 'pageNumber': null, 'vieneDeAfuera': null }
        })
        .state('remesa.generales', {
            templateUrl: 'client/remesas/remesa.generales.html',
            parent: 'remesa'
        })
        .state('remesa.detalle', {
            templateUrl: 'client/remesas/remesa.detalle.html',
            parent: 'remesa'
        })
        .state('remesa.cuadre', {
            templateUrl: 'client/remesas/remesa.cuadre.html',
            parent: 'remesa'
        })

        // ----------------------------------------------------------------
        // cobranzas
        // ----------------------------------------------------------------
        .state('cobranzas', {
            url: '/cobranzas',
            templateUrl: 'client/cobranzas/cobranzas.html',
            controller: 'CobranzasController'
        })
        .state('cobranzas.seleccionRemesa', {
            url: '/cobranzas/seleccionRemesa',
            templateUrl: 'client/cobranzas/cobranzas.seleccionRemesa.html',
            controller: 'CobranzasSeleccionRemesaController'
        })
        .state('cobranzas.aplicarPagos', {
            url: '/cobranzas/aplicarPagos?remesaPK',
            templateUrl: 'client/cobranzas/cobranzas.aplicarPagos.html',
            controller: 'CobranzasAplicarPagosController',
            params: { 'remesaPK': null }
        })
        .state('cobranzas.resultados', {
            url: '/cobranzas/resultados?remesaID&cantPagos',
            templateUrl: 'client/cobranzas/cobranzas.resultados.html',
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

        .state('pendientesCobro_vencimientos_consulta', {
            url: '/consultas/pendientesCobro_vencimientos',
            templateUrl: 'client/consultas/pendientesCobro_vencimientos/main.html',
            controller: 'ConsultasMontosPendientesCobroVencimientos_Controller'
        })
        .state('pendientesCobro_vencimientos_consulta_filter', {
            url: '/filter',
            templateUrl: 'client/consultas/pendientesCobro_vencimientos/filtro.html',
            controller: 'ConsultasMontosPendientesCobroVencimientos_Filtro_Controller',
            parent:'pendientesCobro_vencimientos_consulta',
        })
        .state('pendientesCobro_vencimientos_consulta_list', {
            url: '/list?companiaSeleccionada&parametrosReporte',
            templateUrl: 'client/consultas/pendientesCobro_vencimientos/list.html',
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
        // tabla de números de referencia
        .state('utilitarios_tablaNumerosReferencia', {
            url: '/utilitarios/tablaNumerosReferencia',
            templateUrl: 'client/utilitarios/tablaNumerosReferencia/tablaNumerosReferencia.html',
            controller: 'Utilitarios_TablaNumerosReferencia_Controller'
        })
        // ----------------------------------------------------------------
        // administración (funciones para el administrador)
        // ---------------------------------------------------------------- /consultas/pendientesCobroVencimientos/filtro
        .state('usuarioRoles', {
            url: '/administracion/usuariosYRoles',
            templateUrl: 'client/administracion/usuariosRoles/usuariosRoles.html',
            controller: 'UsuariosRolesController'
        })
        .state('usuarios', {
            url: '/administracion/usuarios',
            templateUrl: 'client/administracion/usuarios/usuarios.html',
            controller: 'UsuariosDatosPersonalesController'
        })

        $urlRouterProvider.otherwise("/");
  }
]);
