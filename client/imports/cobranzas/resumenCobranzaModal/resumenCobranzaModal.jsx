
import React from 'react'
import PropTypes from 'prop-types';
import Popup from 'reactjs-popup'
import numeral from 'numeral'; 
import lodash from 'lodash'; 
import './styles.css'; 

const Card = (props) => { 

    let montosAplicados = null; 

    let montoTotalSeleccionado = 0; 
    let cantidadCuotasSeleccionadas = 0; 
    let montoPorAplicar = 0; 

    // obtenemos cada valor que viene en props 
    const { remesaNumero, remesaMiSu, remesaMonedaId, remesaSimboloMoneda, 
            remesaMonto, remesaFactorCambio, resumenCuotasAplicadas } = props['props-pop-up']; 

    if (resumenCuotasAplicadas && Array.isArray(resumenCuotasAplicadas) && resumenCuotasAplicadas.length) { 

            // calculamos el monto convertido 
            montosAplicados = []; 

            montosAplicados = resumenCuotasAplicadas.map(x => {
                
                // si las monedas de la cuota y remesa son iguales, no convertimos ... 
                if (x.monedaID === remesaMonedaId) { 
                    x.montoConvertido = x.monto; 
                } else { 
                    // las monedas son diferentes; si la moneda del monto es default, dividimos; de otra forma, multiplicamos 
                    if (x.monedaDefecto) { 
                        x.montoConvertido = x.monto / remesaFactorCambio; 
                    } else { 
                        x.montoConvertido = x.monto * remesaFactorCambio;  
                    }
                }

                montoTotalSeleccionado += x.montoConvertido; 
                cantidadCuotasSeleccionadas++; 

                return (<tr key={x.id}>
                            <td>{x.origen}</td>
                            <td>{x.simboloMoneda} {numeral(x.monto).format("#,##0.000")}</td>
                            <td>{remesaSimboloMoneda} {numeral(x.montoConvertido).format("#,##0.000")}</td>
                        </tr>
                ); 
            })
    } else { 
            montosAplicados = (
                <tr>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                </tr>
            ); 
    }

    // finalmente, calculamos el monto que resta por aplicar
    if (remesaMonto) { 
        if (lodash.isFinite(montoTotalSeleccionado)) { 
            if (remesaMiSu === "MI") { 
                // la remesa es un pago nuestro; normalmente, se seleccionarán montos positivos que cancelan a los negativos
                // que debemos (créditos). 
                // si el montoPorAplicar queda negativo, debe indicar que el monto de la remesa se ha excedido 
                montoPorAplicar = remesaMonto - montoTotalSeleccionado; 
            } else { 
                // la remesa es un cobro; normalmente seleccionamos montos negativos que cancelan montos positivos (que nos 
                // deben). Convertimos el total aplicado a positivo. Si el monto que queda por aplicar es negaivo, debe ser 
                // que el usuario ha excedido el monto de la reemsa 
                montoPorAplicar = remesaMonto - Math.abs(montoTotalSeleccionado); 
            }
        }
    }

    const cantidadCuotasSeleccionadas2 = `${cantidadCuotasSeleccionadas.toString()}`;
    const montoRemesa2 = `${remesaSimboloMoneda} ${numeral(remesaMonto).format("0,0.00")}`;
    const montoTotalSeleccionado2 = `${remesaSimboloMoneda} ${numeral(montoTotalSeleccionado).format("0,0.00")}`;
    const montoPorAplicar2 = `${remesaSimboloMoneda} ${numeral(montoPorAplicar).format("0,0.00")}`;

    const fixedHeightContainer = {
        height: '300px', 
        width:'500px', 
        padding:'3px', 
        background: 'lightgray',
    }; 

    const content = {
        height: '275px',
        overflow: 'auto',
        background: '#fff',
    }

    return (
        <div style={fixedHeightContainer}>
            <div style={{ textAlign: 'left', }}><em>Resumen de las operaciones aplicadas a la remesa</em></div>
            <div style={content}>
                <table className="operaciones center">
                    <thead>
                        <tr>
                            <th>Remesa</th>
                            <th>Mi/Su</th>
                            <th>Monto</th>
                            <th>Factor cambio</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{remesaNumero}</td>
                            <td>{remesaMiSu}</td>
                            <td>{remesaSimboloMoneda} {numeral(remesaMonto).format("#,###0.000")}</td>
                            <td>{numeral(remesaFactorCambio).format("#,##0.000000")}</td>
                        </tr>
                    </tbody>
                </table>

                <table className="operaciones center">
                    <thead>
                        <tr>
                            <th>Origen</th>
                            <th>Monto original</th>
                            <th>Monto convertido</th>
                        </tr>
                    </thead>
                    <tbody>
                        {montosAplicados}
                    </tbody>
                </table>

                <table className="operaciones center">
                    <thead>
                        <tr>
                            <th>Cant</th>
                            <th>Remesa</th>
                            <th>Aplicado</th>
                            <th>Resta</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{cantidadCuotasSeleccionadas2}</td>
                            <td>{montoRemesa2}</td>
                            <td>{montoTotalSeleccionado2}</td>
                            <td>{montoPorAplicar2}</td>
                        </tr>
                    </tbody>
                </table>
                <br /> 
            </div>
        </div>
)}

const ResumenCobranzaModal = class extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        const overlayStyle = { width: '300px', }; 
        return (
            <div>
                <Popup
                    trigger={<button className="btn btn-default btn-sm"> Mostrar resumen de montos aplicados ... </button>}
                    overlayStyle={overlayStyle}
                    position="right bottom"
                    on="hover">
                    <Card props-pop-up={this.props} />
                </Popup>
            </div>
        );
    }
}

ResumenCobranzaModal.propTypes = {
    remesaNumero: PropTypes.number,
    remesaMiSu: PropTypes.string, 
    remesaMonedaId: PropTypes.string, 
    remesaSimboloMoneda: PropTypes.string,
    remesaMonto: PropTypes.number,
    remesaFactorCambio: PropTypes.number,
    resumenCuotasAplicadas: PropTypes.array, 
}

export default ResumenCobranzaModal; 


















<table style="font-size: x-small; ">
                <thead>
                    <tr>
                        <th style={{ textAlign: 'center' }}></th>
                        <th style={{ textAlign: 'center' }}></th>
                        <th style={{ textAlign: 'center' }}></th>
                        <th style={{ textAlign: 'center' }}></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ textAlign: 'center' }}></td>
                        <td style={{ textAlign: 'center' }}></td>
                        <td style={{ textAlign: 'center' }}></td>
                        <td style={{ textAlign: 'center' }}></td>
                    </tr>
                </tbody>
            </table>