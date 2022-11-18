
// este archivo es el que se carga primero en el cliente ... meteor carga el contenido de client/lib antes
// que cualquier otro archivo que exista en cualquier otro directorio (en el cliente) ...

// la idea es que el módulo (angular) 'scrwebM', que representa nuestra angular app, se inicialize de primero
// y esté disponible a lo largo de cualquier código en la aplicación

import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';

import 'angular-ui-grid';
import 'angular-ui-bootstrap'; 

import "/node_modules/angular-ui-bootstrap/dist/ui-bootstrap-csp.css"; 

// nótese que importamos los assets de npm packages ...
import "/node_modules/angular-ui-grid/ui-grid.css";  
// import 'angular-ui-grid/ui-grid.css';

// import '../../node_modules/angular-ui-grid/fonts/ui-grid.woff';
// import '../../node_modules/angular-ui-grid/fonts/ui-grid.ttf';

import 'angular-utils-pagination';              // angularUtils.directives.dirPagination
import ngSanitize from "angular-sanitize";

import uiSelect from "ui-select"; 
import 'ui-select/dist/select.css';

// hacemos un import de los módulos (angular modules) que están en /client/imports, y los pasamos en DI (angular dependency injection) 
import Generales from '/client/imports/generales/generalesAngularModule';
import Catalogos from '/client/imports/catalogos/angularModule';
import Riesgos from '/client/imports/riesgos/riesgosAngularModule'; 
import Contratos from '/client/contratos/contratos'; 
import Remesas from '/client/imports/remesas/remesasAngularModule'; 
import NotasDebitoCredito from '/client/imports/notasDebitoCredito/notasDebitoCreditoModule'; 
import Cobranzas from '/client/imports/cobranzas/cobranzasModule'; 
import Administracion from '/client/imports/administracion/angularModule'; 
import Consultas from '/client/imports/consultas/angularModule'; 

// ---------------------------------------------------------------------------------------------------------------
// NOTA: cuando pasamos a la versión 1.10, no pudimos mantener la ultima versión de angular-templates (1.0.9) 
// tuvimos que hacer un downgrade de este package a la versión 1.0.3. Todos los imports de codigo html comenzó 
// a fallar (???). Por eso lo pusimos aquí ... Pero debemos mantenerlo en su código de origen, pues tenerlo aquí 
// no es elegante ... 

// import '/client/imports/riesgos/infoRamo/editarInfoRamoModal.html'; 
// import '/client/imports/riesgos/reportes/opcionesReportModal.html'; 
// import '/client/imports/riesgos/filtro.html'; 
// import '/client/imports/riesgos/lista.html';
// import '/client/imports/riesgos/riesgo.html';
// import '/client/imports/riesgos/riesgo.generales.html';
// import '/client/imports/riesgos/riesgo.movimientos.html'; 
// import '/client/imports/riesgos/riesgo.infoRamo_autos.html'; 
// import '/client/imports/riesgos/riesgo.productores.html'; 
// import '/client/imports/riesgos/riesgo.cuotas.html'; 
// import '/client/imports/riesgos/imprimirNotasModal.html'; 
// import '/client/imports/riesgos/renovarRiesgo/renovarRiesgoModal.html'; 
// import '/client/imports/riesgos/notasDebito/notasDebito.html';
// import '/client/imports/riesgos/prorratearPrimasModal.html'; 

// import '/client/imports/remesas/remesa.generales.html'; 
// import '/client/imports/remesas/remesa.detalle.html'; 
// import '/client/imports/remesas/remesa.cuadre.html'; 
// import '/client/imports/remesas/exportarExcelModal/remesaCuadreExportarExcel_Modal.html'; 
// import '/client/imports/remesas/obtenerCuadreRemesaModal/obtenerCuadreRemesa_Modal.html';
// import '/client/imports/remesas/asientoContable/asientoContable_Modal.html';
// import '/client/imports/remesas/filtro.html'; 
// import '/client/imports/remesas/lista.html';
// import '/client/imports/remesas/remesa.html';

// import '/client/imports/notasDebitoCredito/notasDebitoCredito.html';

// import '/client/imports/cobranzas/cobranzas.html'; 
// import '/client/imports/cobranzas/cobranzas.seleccionRemesa.html'; 
// import '/client/imports/cobranzas/cobranzas.aplicarPagos.html';
// import '/client/imports/cobranzas/cobranzas.resultados.html'; 

// import '/client/imports/generales/mostrarPagosCuotaModal.html';

// import "client/imports/administracion/usuarios/usuarios.html"; 
// import "client/imports/administracion/usuariosRoles/usuariosRoles.html"; 
 
// import '../imports/catalogos/tiposObjetoAsegurado/tiposObjetoAsegurado.html';
// import '../imports/catalogos/cumulos/cumulos.html';

// import 'client/imports/generales/cumulos/registro/registroCumulos.html'; 

import Utilitarios from '/client/imports/utilitarios/angular.module'; 
import MeteorLogin from '/client/imports/generales/meteor.login/angular.module'; 

angular.module("scrwebm", [ angularMeteor, uiRouter, 'ui.bootstrap',
                            'angularUtils.directives.dirPagination', 
                            // 'accounts.ui',
                            'ui.grid', 'ui.grid.edit', 'ui.grid.cellNav',
                            'ui.grid.resizeColumns', 'ui.grid.selection',
                            'ui.grid.pinning', 'ui.grid.grouping', 
                            ngSanitize, uiSelect, 
                            // pasamos los modules (angular modules) que están directamente bajo éste ... 
                            Generales.name, Catalogos.name, Contratos.name, 
                            Riesgos.name, Remesas.name, NotasDebitoCredito.name, Cobranzas.name, 
                            Administracion.name, Consultas.name, Utilitarios.name, MeteorLogin.name
                          ])