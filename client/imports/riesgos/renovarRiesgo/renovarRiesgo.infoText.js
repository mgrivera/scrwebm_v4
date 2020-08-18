
// notas para la función que construye las cuotas de cobro y pago de primas 

const modalInfoText = () => (
    `<h3>Riesgos / Renovación </h3>
Esta función lee un riesgo y registra uno nuevo, prácticamente igual
al original, que sirve como su renovación. <br>
<br>
<b>Notas: </b><br>
<ul>
<li>La vigencia que Ud. indica será la vigencia del nuevo riesgo.
También será la vigencia del movimiento asignado al mismo. </li>
<li>El proceso lee el <i>último </i>movimiento del riesgo
original, y lo asigna como <i>primer </i>(y único) movimiento
del nuevo riesgo. Es decir, si el riesgo original tiene más de
un movimiento, el último de ellos será usado como primero del
nuevo riesgo. </li>
<li>El tipo del nuevo riesgo será <i>Renovación</i>; el tipo del
riesgo original pasará a ser <i>Renovado</i>. Además, cada uno
apuntará al otro en la sección <i>Renovación</i>. </li>
<li>El proceso determina y asigna un <i>referencia </i>nueva
para el nuevo riesgo. Es decir, no copiará la del riesgo
original, sino que determinará y asignará una nueva. </li>
<li>El nuevo riesgo no tendrá cuotas. La idea es que el usuario
revise y haga las modificaciones necesarias al nuevo riesgo; lo
grabe y luego determine sus cuotas, como lo haría con cualquier
movimiento normal que esté registrando. </li>
<li>El nuevo riesgo tendrá como número el consecutivo que
corresponde a un nuevo riesgo. </li>
</ul> <br>`
)

export default modalInfoText; 