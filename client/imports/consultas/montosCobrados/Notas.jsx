
import React from "react"; 

const Notas = () => { 

    return (
        <div style={{ padding: "25px", height: '250px', overflow: 'auto' }}>
            <h3>Montos cobrados / Consulta </h3>
            <b>Notas: </b><br />
            <ul>
                <li>Ud. debe indicar un perídodo al <i>filtro</i>. El programa
buscará y leerá los montos cobrados en ese período. </li>
                <li>También puede delimitar por moneda y compañía, usando el <i>filtro</i>.
</li>
                <li>Una vez que se indique una moneda o compañía en el <i>filtro</i>,
estas permanecerán. Para eliminar estos valores de las listas,
basta con hacer un <i>click </i>sobre ellos. </li>
                <li>El programa va mostrando registros en <i>páginas </i>de 25.
Ud. puede hacer un <i>click </i>en <i>Más </i>o <i>Todo</i>,
para leer otra página o leer el resto de los registros. Cada
registro corresponde a un monto cobrado. </li>
                <li>Para obtener el reporte, se debe hacer un <i>click </i>en <i>Reporte</i>,
luego indicar valores para las <i>opciones </i>y hacer un <i>click
</i>en <i>Grabar opciones del reporte</i>. Luego, se debe hacer
un <i>click </i>en el <i>link </i>que se produce y muestra.
<br />
                </li>
                <li>El reporte se producirá en una página diferente del navegador.
<br />
                </li>
                <li>Al obtener el reporte, la opción <i>Excel </i>no produce un
documento <i>Microsoft Excel</i>, pero produce un reporte super
adecuado para convertirlo y obtenerlo en este formato. <br />
                </li>
                <li>Al obtener el reporte, puede marcar la opción <i>Resumen</i>,
para eliminar el detalle del reporte y solo mostrar sus totales.
Esta opción, sin embargo, solo aplica cuando <b>no </b>marcamos
la opción <i>Excel</i>. <br />
                </li>
                <li>Si desmarcamos la opción <i>Mostrar colores</i> obtendremos
el reporte <b>sin </b>colores, con el objetivo de usar menos
tinta al imprimirlo. Si el resporte no va a ser impreso, tal vez
esta opción no tiene mucho sentido; es decir, el reporte siempre
debe ser obtenido con sus colores, pues resulta mucho más fácil
de usar así. <br />
                </li>
            </ul>
        </div>
    )
}

export { Notas }; 