
// notas para la función que construye las cuotas de cobro y pago de primas 

const construirCuotasInfoText = () => (
    `<h3>Riesgos / Movimientos / Construir cuotas </h3>
Esta función le permite al usuario construir y registrar las cuotas
de cobro y pago de prima que corresponden al movimiento del riesgo.
<br>
<br>
        Normalmente, las cuotas se generan de esta forma: <br><br>
            <ul>
                <li>una cuota de prima por cobrar a la compañía cedente </li>
                <li>una cuota de prima por pagar para cada reasegurador </li>
            </ul>
            <br>
El usuario puede indicar la <em>cantidad de cuotas</em> y las fechas de
<em>inicio</em> y de <em>vencimiento</em> de las mismas. <br>
                <br>
                    <b>Nota: </b>cuando la cuota que corresponde a la compañía <i>nosotros</i>
                    contiene un monto de corretaje, esta función le permite al usuario
generar una cuota por pagar a la compañía cedente y por este
monto. Si se indica al programa que debe agregar esta cuota (de
corretaje), el monto de prima por cobrar vendrá full, <b>y no</b>
neto de corretaje. <br>`
)

export default construirCuotasInfoText; 