
import React from 'react'; 

const Notas = () => { 

    const divStyle = { 
        padding: '20px'
    }

    return (
        <div style={ divStyle }>
            <p>Para obtener correos para <em>montos pendientes de cobro</em>, Ud. debe hacer lo siguiente:</p>
            <h4>Cuotas:&nbsp;</h4>
            <ul>
                <li>Seleccionar las cuotas para las cuales desea construir y enviar los correos&nbsp;</li>
                <li>Puede marcar el cuadro (checkbox) arriba en el encabezado, para seleccionar <strong>todas</strong> las cuotas que se muestran en la lista&nbsp;</li>
            </ul>
            <h4>Plantillas:&nbsp;</h4>
            <ul>
                <li>Debe seleccionar una plantilla en la lista.&nbsp;</li>
                <li>Si la lista de plantillas est&aacute; vac&iacute;a, debe construir al menos una y subirla al directorio apropiado en el <em>DropBox</em> de la aplicaci&oacute;n.&nbsp;</li>
            </ul>
            <h4>Configuraci&oacute;n:&nbsp;</h4>
            <ul>
                <li>Luego debe revisar la <em>configuraci&oacute;n</em> para asegurarse que los valores son apropiados.&nbsp;</li>
                <li>Puede hacer cambios en los valores y hacer un <em>click</em> en <span style={{ color: '#333399' }}><em>Grabar modificaciones</em></span>, para que los valores se graben para una pr&oacute;xima vez.&nbsp;</li>
                <li>Note que, si lo desea, puede enviar copias de cada correo a <strong>dos</strong> direcciones diferentes: el suyo y uno diferente (que Ud. indique).</li>
                <li>Puede, tambi&eacute;n, <strong>no enviar</strong> el correo a las compa&ntilde;&iacute;as, y solo enviar las copias a una o dos direcciones de correo. La idea de hacer esto es revisar el contenido de los correos antes de enviarlos de forma definitiva.&nbsp;</li>
                <li>Los datos del usuario, t&iacute;tulo, nombre y cargo, son usados para <em>firmar</em> el correo. Tambi&eacute;n el nombre de la compa&ntilde;&iacute;a seleccionada.&nbsp;</li>
                <li>Note que Ud. puede indicar un <em>asunto</em> para el correo. Aunque siempre se muestra un asunto de manera inicial, Ud. puede cambiarlo por el que desee.&nbsp;</li>
                <li><em><span style={{ color: '#333399' }}>Restablecer valores</span>:</em> si hace un <em>click</em> en este <em>link</em>, se mostrar&aacute;n los datos iniciales de configuraci&oacute;n. Es decir, se restablecer&aacute;n los valores iniciales y se cambiar&aacute;n los valores que Ud. haya modificado y guardado.&nbsp;</li>
                <li>Luego de hacer un <em>click</em> en <em><span style={{ color: '#333399' }}>Restablecer valores</span>,</em> debe hacer un <em>click</em> en <em><span style={{ color: '#333399' }}>Grabar modificaciones</span>,</em> para que estos valores se mantengan para una pr&oacute;xima vez.&nbsp;</li>
            </ul>
        </div>
    )
}

export default Notas; 