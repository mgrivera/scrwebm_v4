
// notas para la función que construye las cuotas de cobro y pago de primas 

const modalInfoText = () => (
    `<h3>Riesgos - Download </h3>
La opción <i>Download </i>convierte un riesgo a un <i>archivo de
texto</i>, y luego hace un <i>download </i>del mismo en el disco
duro de su PC. <br>
La idea de esta opción es permitir duplicar el riesgo original en un
riesgo nuevo, para que el usuario pueda usarlo como base para
registrar un nuevo riesgo. <br>
<br>
<b>Notas: </b><br>
<ul>
<li>Para importar el riesgo desde el archivo de texto, Ud. debe
usar la opción <i>Importar </i>e indicar la ubicación del
archivo de texto que creo con la opción <i>Download</i>. <br>
</li>
<li>El riesgo debe ser siempre importado en un riesgo nuevo. Ud.
debe hacer <i>click </i>en <i>Nuevo</i>, para crear un nuevo
riesgo; luego usar la opción <i>Importar </i>para copiar los
datos desde el archivo de texto que contiene el riesgo original.
<br>
</li>
<li>El riesgo original puede ser importado en la misma <i>empresa
usuaria</i>, o en una diferente. <br>
</li>
<li>El nuevo riesgo solo tendrá un número cuando Ud. lo revise y
haga un <i>click </i>en <i>Grabar</i>, como lo haría con
cualquier riesgo registrado en forma normal. <br>
</li>
<li>El nuevo riesgo no tendrá cuotas; Ud. debe registrarlas en la
misma forma que lo hace para cualquier riesgo. <br>
</li>
<li>Si el riesgo original es copiado en una <i>compañía usuaria</i>
diferente, la compañía usuaria, es decir <i>Nosotros</i>, en el
riesgo, será cambiada por la ahora seleccionada. Esto ocurre en
la sección Movimientos, en las listas de: compañías, coberturas
por compañía, primas, etc. <br>
</li>
</ul>
<br>`
)

export default modalInfoText; 