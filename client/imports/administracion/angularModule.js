

import angular from 'angular';

import Usuarios from './usuarios/usuarios'; 
import UsuariosRoles from './usuariosRoles/usuariosRoles'; 
import UsuariosEmpresas from './usuariosEmpresas/angularModule'; 
import UsuariosLogin from './usuariosLogin/angular.module'; 

export default angular.module("scrwebm.administracion", [ Usuarios.name, UsuariosRoles.name, UsuariosEmpresas.name, UsuariosLogin.name ] )