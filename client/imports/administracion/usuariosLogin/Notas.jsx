
import React from 'react';

function Notas() {

    const htmlFormattedText = `
    <h2>Usuarios - Consulta y modificación </h2>
<h3>Introducción </h3>
Esta función del programa permite consultar las cuentas de usuario
que se han registrado en el programa. <br>
<br>
Normalmente, cada usuario crea y graba su propia cuenta de usuario.
Luego, un administrador debe asignar un <i>perfil de roles</i> al
usuario, para que la cuenta pueda ser usada en el programa. Una
cuenta de usuario sin roles asignados por un administrador, no será
capaz de hacer nada en el programa. Aunque si podrá conectarse y
abrir una sesión. <br>
<br>
<b>Nota:</b> esta función solo está disponible para usuarios del
tipo Administrador. <br>
<h3>Consulta de usuarios </h3>
Mediante esta consulta podemos ver, en una lista, los datos más
importantes de cada cuenta de usuario que se ha registrado en el
programa; a saber: <br>
<ul>
<li>el nombre del usuario </li>
<li>su dirección de correo asociada </li>
<li>la fecha cuando fue creada la cuenta </li>
</ul>
<h3>Modificación de usuarios </h3>
Si se hace un <i>click </i>a alguno de los usuarios en la lista,
el programa muestra el usuario en particular en una página que
permite hacer las siguientes modificaciones: <br>
<ul>
<li>Cambiar el nombre del usuario </li>
<li>Cambiar la dirección de correo que se ha asociado al usuario <br>
</li>
<li>Cambiar el password </li>
</ul>
<h3>Cambiar el nombre del usuario </h3>
Para cambiar el nombre del usuario, tan solo basta con que
indiquemos el nuevo nombre y hagamos un <i>click </i>en <i>Grabar</i>.
<br>
<h3>Cambiar la dirección de correo que se ha asociado al usuario </h3>
Para cambiar la dirección de correo basta con indicar la nueva y
hacer un <i>click </i>en <i>Grabar</i>. <br>
<br>
<b>Notas: </b><br>
<ul>
<li>La dirección que se indique no debe haber sido asociada a una
cuenta de usuario diferente. </li>
<li>La dirección que se indique debe representar una dirección de
corro válida; es decir, tener la forma: email@servidor. </li>
<li>La nueva dirección de correo debe ser validada por el usuario
a quien se ha asociado, para saber que éste tiene, en verdad,
acceso a la misma. </li>
</ul>
<h3>Cambiar el password</h3>
Para cambiar el password por uno nuevo, debemos, simplemente,
indicarlo y luego confirmarlo (escribirlo igual al lado). Luego se
debe hacer un <i>click </i>en <i>Grabar</i>. <br>
<br>
<b>Nota: </b>cuando cambiamos por esta vía el password a un
usuario, el mismo será desconectado (<i>sign out</i>) si acaso
tuviese una sesión en algun otro PC. <br>
<h3>Eliminar un usuario </h3>
Para eliminar un usuario en el programa, basta con seleccionarlo en
la lista y hacer un <i>click </i>en <i>Eliminar</i>. <br>
<br>
<b>Nota:</b> el usuario será totalmente eliminado de la base de
datos y no existirá más. Si se desea que el usuario permanezca, pero
que, de alguna forma, sea desactivado, podemos hacer lo siguiente: <br>
<ol>
<li>Cambiar su password </li>
<li>Cambiar su e-mail (para que el usuario no pueda usar la
función <i>Olvidó su password </i>para recuperarlo) </li>
</ol>
<br>
<hr width="100%" size="2"><br>
    `;

    return (
        <div style={{ textAlign: 'left', padding: '35px' }} dangerouslySetInnerHTML={outputHtmlMarkup(htmlFormattedText)} />
    )
}

export default Notas;

function outputHtmlMarkup(text) {
    return { __html: text };
}