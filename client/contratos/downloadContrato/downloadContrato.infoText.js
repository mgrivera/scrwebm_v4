
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
<li>El contrato debe será <b>siempre</b> importado en un contrato nuevo. No
importa desde cual contrato Ud. importe los datos del contrato que se han 
exportado, el contrato será siempre importado en un contrato <b>nuevo</b> 
que será agregado por el programa. 
<br>
</li>
<li>El contrato original puede ser importado en la misma <i>empresa
usuaria</i>, o en una diferente. <br>
</li>
<li>El nuevo contrato tendrá un nuevo número, que será calculado por el programa 
cuando Ud. importe los datos del contrato que se ha exportado. <br> 
El número asignado al nuevo contrato será indicado claramente por el proceso que 
permite <em>importar</em> el contrato.  
<br>
</li>
<li>El nuevo contrato no tendrá cuotas; Ud. debe registrarlas en la
misma forma que lo haría para cualquier contrato. <br>
</li>
<li>Si el contrato original es copiado en una <i>compañía usuaria</i>
diferente, la compañía usuaria, es decir <i>Nosotros</i>, en el
contrato, será cambiada por la que ahora se haya seleccionado. 
Esto ocurre, normalmente, en
partes del registro donde se indica nuestra aceptación u orden<br>
</li>
</ul>
<br>`
)

export default modalInfoText; 