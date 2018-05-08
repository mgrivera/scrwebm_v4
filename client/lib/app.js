


// este archivo es el que se carga primero en el cliente ... meteor carga el contenido de client/lib antes
// que cualquier otro archivo que exista en cualquier otro directorio (en el cliente) ...

// la idea es que el módulo (angular) 'scrwebM', que representa nuestra angular app, se inicialize de primero
// y esté disponible a lo largo de cualquier código en la aplicación

import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';

import 'angular-ui-grid';

// nótese que importamos los assets de npm packages ...
import 'angular-ui-grid/ui-grid.css';
// import 'angular-ui-grid/ui-grid.woff';
// import 'angular-ui-grid/ui-grid.ttf';

import 'angular-utils-pagination';              // angularUtils.directives.dirPagination

angular.module("scrwebM", [ angularMeteor, uiRouter, 'ui.bootstrap',
                            'angularUtils.directives.dirPagination', 'accounts.ui',
                            'ui.grid', 'ui.grid.edit', 'ui.grid.cellNav',
                            'ui.grid.resizeColumns', 'ui.grid.selection',
                            'ui.grid.pinning', 'ui.grid.grouping'
                            ]);

