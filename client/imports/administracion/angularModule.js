

import angular from 'angular';

import Usuarios from './usuarios/usuarios'; 
import UsuariosRoles from './usuariosRoles/usuariosRoles'; 
import UsuariosEmpresas from './usuariosEmpresas/angularModule'; 

export default angular.module("scrwebm.administracion", [ Usuarios.name, UsuariosRoles.name, UsuariosEmpresas.name, ] )