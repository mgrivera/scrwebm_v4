
let mostrarHelp = (currentStateName) => {

    // abrimos un página, en un tab separado, que muestra un help para el state actual.
    // NOta: normalmente, el help para cada state será un post en el blog que mantenemos para contab ...
    switch (currentStateName) {
        case 'catalogos.companias':
            window.open('https://scrwebm.wordpress.com/2016/06/20/companias/', '_blank');
            break;
        case 'catalogos.contrProp_configuracion.contrProp_configuracion_lista':
        case 'catalogos.contrProp_configuracion.contratosListaProp_configuracion_tabla':
            window.open('https://scrwebm.wordpress.com/2016/12/10/contratos-proporcionales-configuracion/', '_blank');
            break;
        case 'registrarImagenes':
            window.open('https://scrwebm.wordpress.com/2016/04/26/logos-en-notas-impresas/', '_blank');
            break;
        case 'pendientesCobro_vencimientos_consulta':
        case 'pendientesCobro_vencimientos_consulta_filter':
        case 'pendientesCobro_vencimientos_consulta_list':
            window.open('https://sites.google.com/view/scrwebm/consultas/montos-pendientes-de-cobro-vencimientos', '_blank');
            break;

        case 'pendientesPago_vencimientos_consulta':
        case 'pendientesPago_vencimientos_consulta_filter':
        case 'pendientesPago_vencimientos_consulta_list':
            window.open('https://sites.google.com/view/scrwebm/consultas/montos-pendientes-de-pago-vencimientos', '_blank');
            break;

        case 'usuarios':
            window.open('https://scrwebm.wordpress.com/2016/06/21/usuarios/', '_blank');
            break;
        case 'catalogos.cuentasBancarias':
            window.open('https://scrwebm.wordpress.com/2016/06/21/cuentas-bancarias/', '_blank');
            break;
        default:
    };
};

ClientGlobal_Methods.mostrarHelp = mostrarHelp;
