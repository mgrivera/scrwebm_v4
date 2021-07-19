
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check'

import lodash from 'lodash'; 

import { Contratos } from '/imports/collections/principales/contratos';
import { Riesgos } from '/imports/collections/principales/riesgos';

Meteor.methods(
    {
        'cumulos_registro.inicialirNewItem': function (defaults) {

            check(defaults, {
                entityId: String,
                subEntityId: String,
                origen: String
            });

            const { entityId, subEntityId, origen } = defaults; 

            let values = {}; 

            switch (origen) { 

                case 'fac': {

                    const riesgo = Riesgos.findOne(entityId); 

                    if (!riesgo) { 
                        return {
                            error: true,
                            message: `Error inesperado: no hemos podido leer el riesgo que da origen a esta cúmulo. `
                        }
                    }

                    const { numero, asegurado, codigo, referencia, moneda, compania, cedenteOriginal, ramo, cia } = riesgo; 

                    const movimiento = riesgo.movimientos.find(x => x._id === subEntityId); 

                    if (!movimiento) {
                        return {
                            error: true,
                            message: `Error inesperado: no hemos podido leer el movimiento, en el riesgo, que da origen a esta cúmulo.<br />
                                      Cuando la base del cúmulo es un riesgo, siempre debe existir un movimiento que corresponda al 
                                      registro del cúmulo. 
                            `
                        }
                    }

                    const { desde, hasta } = movimiento; 
                    const subNumero = movimiento.numero; 

                    // para calcular los valores al 100%, los tomamos del array de coberturas en el array movimientos 
                    const coberturas = movimiento?.coberturas ? movimiento.coberturas : []; 

                    const valorARiesgo = coberturas.reduce((acum, current) => acum + current.valorARiesgo, 0); 
                    const sumaAsegurada = coberturas.reduce((acum, current) => acum + current.sumaAsegurada, 0);
                    const primaSeguro = coberturas.reduce((acum, current) => acum + current.prima, 0);

                    // montos al facultativo 
                    const coberturasCompanias = movimiento?.coberturasCompanias ? movimiento.coberturasCompanias : [];

                    const monto_fac = coberturasCompanias.filter(x => x.nosotros).reduce((acum, current) => acum + current.sumaAsegurada, 0);
                    const prima_fac = coberturasCompanias.filter(x => x.nosotros).reduce((acum, current) => acum + current.prima, 0);
                    
                    const nuestraOrdenMonto_fac = coberturasCompanias.filter(x => x.nosotros).reduce((acum, current) => acum + current.sumaReasegurada, 0);
                    // const nuestraOrdenPrima_fac = coberturasCompanias.filter(x => x.nosotros).reduce((acum, current) => acum + current.primaBrutaAntesProrrata, 0);

                    const nuestraOrdenPorc_fac = monto_fac ? lodash.round((nuestraOrdenMonto_fac / monto_fac) * 100, 2) : 0;
                    
                    values = { 
                        origen, 
                        numero, 
                        subNumero, 
                        asegurado, 
                        codigo, 
                        referencia, 
                        moneda, 
                        compania, 
                        cedenteOriginal, 
                        ramo, 
                        desde, 
                        hasta, 
                        cumulosAl: desde, 

                        valorARiesgo,
                        sumaAsegurada,
                        primaSeguro,
                        limiteCesion: 0,

                        // cesión al CP 
                        monto_cp: 0,
                        prima_cp: 0,
                        nuestraOrdenPorc_cp: 0,
                        nuestraOrdenMonto_cp: 0,
                        nuestraOrdenPrima_cp: 0,

                        // cesión al excedente  
                        monto_ex: 0,
                        prima_ex: 0,
                        nuestraOrdenPorc_ex: 0,
                        nuestraOrdenMonto_ex: 0,
                        nuestraOrdenPrima_ex: 0,

                        // cesión al no prop  
                        monto_noProp: 0,
                        prima_noProp: 0,
                        nuestraOrdenPorc_noProp: 0,
                        nuestraOrdenMonto_noProp: 0,
                        nuestraOrdenPrima_noProp: 0,

                        // cesión al fac  
                        monto_fac,
                        prima_fac,
                        nuestraOrdenPorc_fac,
                        nuestraOrdenMonto_fac: 0,
                        nuestraOrdenPrima_fac: 0,

                        // cesión al retrocesionario 
                        monto_ret: 0,
                        prima_ret: 0,

                        // (finalmente) monto de nuestro cúmulo 
                        cumulo: 0,
                        primaCumulo: 0,

                        cia
                    }

                    break;
                }

                case 'prop': {















                    const contrato = Contratos.findOne(entityId);

                    if (!contrato) {
                        return {
                            error: true,
                            message: `Error inesperado: no hemos podido leer el contrato que da origen a esta cúmulo. `
                        }
                    }

                    const { numero, codigo, referencia, compania, cedenteOriginal, ramo, desde, hasta, cia } = contrato;

                    // el contrato es proporcional, tiene cuentas técnicas; leemos la definición de estas para tomar la 
                    // moneda y luego continuar y leer las cifras 
                    const cuentasTecnicas_definicion = contrato.cuentasTecnicas_definicion;

                    if (!Array.isArray(cuentasTecnicas_definicion) || !cuentasTecnicas_definicion.length) {
                        return {
                            error: true,
                            message: `Error: aparentemente, el contrato de tipo 'prop' no tiene 
                                      definición de cuentas técnicas registradas. <br /> 
                                      Por favor edite el contrato y agregue su información de cuentas, para que esta opción 
                                      pueda determinar las cifras del contrato proporcional.  
                                     `
                        }
                    }

                    // tomamos la moneda de la 1ra cuenta técnica  
                    const moneda = cuentasTecnicas_definicion[0].moneda;
                    // const primaSeguro = capas.reduce((acum, current) => acum + current.pmd, 0);

                    // const prima_noProp = capas.reduce((acum, current) => acum + current.pmd, 0);
                    // const nuestraOrdenPrima_noProp = capas.reduce((acum, current) => acum + (current.pmd * current.nuestraOrdenPorc / 100), 0);
                    // const nuestraOrdenPorc_noProp = prima_noProp ? lodash.round((nuestraOrdenPrima_noProp / prima_noProp) * 100, 2) : 0;

                    values = {
                        origen,
                        numero,
                        subNumero: 0,
                        codigo,
                        referencia,
                        moneda,
                        compania,
                        cedenteOriginal,
                        ramo,
                        desde,
                        hasta,
                        cumulosAl: desde,

                        // valorARiesgo,            // al menos por ahora, los contratos no prop no contienen este valor en su registro
                        // sumaAsegurada,           // al menos por ahora, los contratos no prop no contienen este valor en su registro
                        // primaSeguro,
                        // limiteCesion,            // al menos por ahora, los contratos no prop no contienen este valor en su registro

                        // cesión al CP 
                        monto_cp: 0,
                        prima_cp: 0,
                        nuestraOrdenPorc_cp: 0,
                        nuestraOrdenMonto_cp: 0,
                        nuestraOrdenPrima_cp: 0,

                        // cesión al excedente  
                        monto_ex: 0,
                        prima_ex: 0,
                        nuestraOrdenPorc_ex: 0,
                        nuestraOrdenMonto_ex: 0,
                        nuestraOrdenPrima_ex: 0,

                        // cesión al no prop  
                        monto_noProp: 0,             // al menos por ahora, los contratos no prop no contienen este valor en su registro
                        prima_noProp: 0,
                        nuestraOrdenPorc_noProp: 0,
                        nuestraOrdenMonto_noProp: 0,    // al menos por ahora, los contratos no prop no contienen este valor en su registro
                        nuestraOrdenPrima_noProp: 0,

                        // cesión al fac  
                        monto_fac: 0,
                        prima_fac: 0,
                        nuestraOrdenPorc_fac: 0,
                        nuestraOrdenMonto_fac: 0,
                        nuestraOrdenPrima_fac: 0,

                        // cesión al retrocesionario 
                        monto_ret: 0,
                        prima_ret: 0,

                        // (finalmente) monto de nuestro cúmulo 
                        cumulo: 0,
                        primaCumulo: 0,

                        cia
                    }

                    break;
                }

                case 'noProp': {

                    const contrato = Contratos.findOne(entityId);

                    if (!contrato) {
                        return {
                            error: true,
                            message: `Error inesperado: no hemos podido leer el contrato que da origen a esta cúmulo. `
                        }
                    }

                    const { numero, codigo, referencia, compania, cedenteOriginal, ramo, desde, hasta, cia } = contrato;

                    const capas = contrato.capas; 

                    if (!Array.isArray(capas) || !capas.length) { 
                        return {
                            error: true,
                            message: `Error: aparentemente, el contrato de tipo 'noProp' no tiene capas registradas. <br /> 
                                      Por favor edite el contrato y agregue su información de capas, para que esta opción 
                                      pueda determinar las cifras del contrato no proporcional.  
                                     `
                        }
                    }

                    // usamos la moneda de la 1ra capa 
                    const moneda = capas[0].moneda; 
                    const primaSeguro = capas.reduce((acum, current) => acum + current.pmd, 0); 

                    const prima_noProp = capas.reduce((acum, current) => acum + current.pmd, 0);
                    const nuestraOrdenPrima_noProp = capas.reduce((acum, current) => acum + (current.pmd * current.nuestraOrdenPorc / 100), 0);
                    const nuestraOrdenPorc_noProp = prima_noProp ? lodash.round((nuestraOrdenPrima_noProp / prima_noProp) * 100, 2) : 0; 
                    
                    values = {
                        origen,
                        numero,
                        subNumero: 0,
                        codigo,
                        referencia,
                        moneda,
                        compania,
                        cedenteOriginal,
                        ramo,
                        desde,
                        hasta,
                        cumulosAl: desde,

                        // valorARiesgo,            // al menos por ahora, los contratos no prop no contienen este valor en su registro
                        // sumaAsegurada,           // al menos por ahora, los contratos no prop no contienen este valor en su registro
                        primaSeguro,
                        // limiteCesion,            // al menos por ahora, los contratos no prop no contienen este valor en su registro

                        // cesión al CP 
                        monto_cp: 0,
                        prima_cp: 0,
                        nuestraOrdenPorc_cp: 0,
                        nuestraOrdenMonto_cp: 0,
                        nuestraOrdenPrima_cp: 0,

                        // cesión al excedente  
                        monto_ex: 0,
                        prima_ex: 0,
                        nuestraOrdenPorc_ex: 0,
                        nuestraOrdenMonto_ex: 0,
                        nuestraOrdenPrima_ex: 0,

                        // cesión al no prop  
                        // monto_noProp,                // al menos por ahora, los contratos no prop no contienen este valor en su registro
                        prima_noProp,
                        nuestraOrdenPorc_noProp,
                        // nuestraOrdenMonto_noProp,    // al menos por ahora, los contratos no prop no contienen este valor en su registro
                        nuestraOrdenPrima_noProp: 0,

                        // cesión al fac  
                        monto_fac: 0,
                        prima_fac: 0,
                        nuestraOrdenPorc_fac: 0,
                        nuestraOrdenMonto_fac: 0,
                        nuestraOrdenPrima_fac: 0,

                        // cesión al retrocesionario 
                        monto_ret: 0,
                        prima_ret: 0,

                        // (finalmente) monto de nuestro cúmulo 
                        cumulo: 0,
                        primaCumulo: 0,

                        cia
                    }

                    break;
                }

                default: { 
                    return {
                        error: true,
                        message: `Error: el parámetro 'origen' pasado a esta función no es correcto: <em>${origen}</em>.<br /> 
                                  Los valores permitidos son: prop, noProp y fac. 
                                 `
                            }
                }
            }

            const tipoNegocio = origen === "fac" ? "riesgo" : "contrato"; 

            const message = `Ok, el registro de cúmulos ha sido inicializado con los valores que corresponden  
                             al <em><b>${tipoNegocio} ${values.numero.toString()} (${origen})</b></em> que le dió origen. <br /><br />
                             Ahora Ud. debe completar el registro, hacer un <em>click</em> en <em>Calcular</em>
                             y, finalmente, <em>Grabar</em> a la bas de datos. 
                            `

            return {
                error: false,
                message, 
                values
            }
        }
    })             