
// notas para la función que construye las cuotas de cobro y pago de primas 

const modalInfoText = () => (
    `<h3>Contratos - Download </h3>
La opción <i>Download </i>convierte un contrato a un <i>archivo de
texto</i>, y luego hace un <i>download </i>del mismo en el disco
duro de su PC. <br>
La idea de esta opción es permitir duplicar el contrato original en un
contrato nuevo, para que el usuario pueda usarlo como base para
registrar un nuevo contrato. <br>
<br>
<b>Notas: </b><br>
<ul>
<li>Para importar el contrato desde el archivo de texto, Ud. debe
usar la opción <i>Importar </i>e indicar la ubicación del
archivo de texto que creo con la opción <i>Download</i>. <br>
</li>
<li>El contrato debe ser siempre importado en un contrato nuevo. Ud.
debe hacer <i>click </i>en <i>Nuevo</i>, para crear un nuevo
contrato; luego usar la opción <i>Importar </i>para copiar los
datos desde el archivo de texto que contiene el contrato original.
<br>
</li>
<li>El contrato original puede ser importado en la misma <i>empresa
usuaria</i>, o en una diferente. <br>
</li>
<li>El nuevo contrato solo tendrá un número cuando Ud. lo revise y
haga un <i>click </i>en <i>Grabar</i>, como lo haría con
cualquier contrato registrado en forma normal. <br>
</li>
<li>El nuevo contrato no tendrá cuotas; Ud. debe registrarlas en la
misma forma que lo hace para cualquier contrato. <br>
</li>
<li>Si el contrato original es copiado en una <i>compañía usuaria</i>
diferente, la compañía usuaria, es decir <i>Nosotros</i>, en el
contrato, será cambiada por la que ahora se haya seleccionada. Esto ocurre, normalmente, en
partes del registro donde se indica nuestra aceptación u orden<br>
</li>
</ul>
<br>`
)

export default modalInfoText; 