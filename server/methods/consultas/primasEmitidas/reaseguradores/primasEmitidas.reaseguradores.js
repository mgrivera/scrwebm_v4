
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo'; 
import { check } from 'meteor/check';
import moment from 'moment';

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Riesgos } from '/imports/collections/principales/riesgos';  

import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 

import { Temp_consulta_riesgosEmitidosReaseguradores } from '/imports/collections/consultas/temp_consulta_riesgosEmitidos_reaseguradores'; 

Meteor.methods(
{
    'consultas.primasEmitidas.reaseguradores': function (filtro) {

        check(filtro, Object);

        // leemos el id de la compañía seleccionada 
        const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() }, { fields: { companiaID: 1 }});
        let companiaSeleccionadaID;

        if (companiaSeleccionada) {
            companiaSeleccionadaID = companiaSeleccionada.companiaID;
        } else {
            return { 
                error: true, 
                message: `Error inesperado: no hemos podido leer la compañía seleccionada en la base de datos.`
            }
        }

        Temp_consulta_riesgosEmitidosReaseguradores.remove({ user: Meteor.userId() })

        // preparamos el filtro para aplicar a la tabla de riesgos 
        const filtroRiesgos = prepararFiltro(filtro, companiaSeleccionadaID); 

        const riesgos = Riesgos.find(filtroRiesgos).fetch(); 

        const monedas = Monedas.find({}, { fields: { simbolo: 1, descripcion: 1 }}).fetch(); 
        const companias = Companias.find({}, { fields: { abreviatura: 1, nombre: 1 }}).fetch(); 
        const ramos = Ramos.find({}, { fields: { abreviatura: 1, descripcion: 1 }}).fetch(); 
        const asegurados = Asegurados.find({}, { fields: { abreviatura: 1, nombre: 1 }}).fetch(); 

        // separamos aquí el filtro por compañías, si existe, para aplicarlo más abajo cuando prepraramos los 
        // registros para la consulta 
        const filtroCompanias = filtro.companias ? filtro.companias.map(x => x.value) : []; 

        let recordCount = 0; 

        for (const r of riesgos) { 
            
            const { _id, numero, estado, cia } = r; 

            const moneda = monedas.find(x => x._id === r.moneda); 
            const asegurado = asegurados.find(x => x._id === r.asegurado); 
            const ramo = ramos.find(x => x._id === r.ramo); 
            const cedente = companias.find(x => x._id === r.compania); 

            const infoRiesgo = { 
                _id, 
                numero, 
                estado, 
                moneda, 
                cedente, 
                asegurado, 
                ramo, 
                cia
            }

            for (const m of r.movimientos) { 

                const infoMovimiento = { 
                    numero: m.numero, 
                    fechaEmision: m.fechaEmision, 
                    desde: m.desde, 
                    hasta: m.hasta, 
                }

                for (const c of m.companias) { 

                    // el movimiento puede tener muchas compañías asociadas; entre ellas, por supuesto, siempre 'nosotros';  
                    // si el usuario agregó la compañía al filtro, debemos aplicarlo aquí, pues el filtro que se aplicó a 
                    // nivel general trae los riesgos donde *participa* la compañía, pero no *solo* esa compañía 
                    if (filtroCompanias.length && !filtroCompanias.some(x => x === c.compania)) { 
                        continue; 
                    }

                    // la compañía es la que está en el array de compañías, en cada movimiento 
                    const compania = companias.find(x => x._id === c.compania); 

                    const infoCompania = { 
                        compania
                    }

                    // calcular las cifras será muy laborioso (y tardará mucho?) ... 
                    let valorARiesgo = 0; 
                    let sumaAsegurada = 0; 
                    let prima = 0; 
                    let sumaReasegurada = 0; 
                    let ordenPorc = 0; 

                    valorARiesgo = m.coberturasCompanias.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.valorARiesgo), 0); 
                    sumaAsegurada = m.coberturasCompanias.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.sumaAsegurada), 0); 
                    prima = m.coberturasCompanias.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.prima), 0); 
                    sumaReasegurada = m.coberturasCompanias.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.sumaReasegurada), 0); 

                    if (sumaAsegurada && sumaReasegurada && sumaAsegurada != 0) { 
                        ordenPorc = sumaReasegurada * 100 / sumaAsegurada; 
                    }

                    let primaBruta = 0; 
                    let comision = 0; 
                    let impuesto = 0; 
                    let corretaje = 0; 
                    let impuestoSobrePN = 0; 
                    let primaNeta = 0; 

                    primaBruta = m.primas.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.primaBruta), 0); 
                    comision = m.primas.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.comision), 0); 
                    impuesto = m.primas.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.impuesto), 0); 
                    corretaje = m.primas.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.corretaje), 0); 
                    impuestoSobrePN = m.primas.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.impuestoSobrePN), 0); 
                    primaNeta = m.primas.filter(x => x.compania == c.compania).reduce((accum, item) => (accum + item.primaNeta), 0); 

                    // finalmente, nos aeguramos de no tener undefined, NaN, etc. 
                    valorARiesgo = valorARiesgo ? valorARiesgo : 0; 
                    sumaAsegurada = sumaAsegurada ? sumaAsegurada : 0; 
                    prima = prima ? prima : 0; 
                    sumaReasegurada = sumaReasegurada ? sumaReasegurada : 0; 
                    primaBruta = primaBruta ? primaBruta : 0; 
                    comision = comision ? comision : 0; 
                    impuesto = impuesto ? impuesto : 0; 
                    corretaje = corretaje ? corretaje : 0; 
                    impuestoSobrePN = impuestoSobrePN ? impuestoSobrePN : 0; 
                    primaNeta = primaNeta ? primaNeta : 0; 


                    const reportItem = { 
                        _id: new Mongo.ObjectID()._str,
                        riesgoId: infoRiesgo._id,
                        numero: infoRiesgo.numero,
                        moneda: infoRiesgo.moneda, 
                        cedente: infoRiesgo.cedente, 
                        compania: infoCompania.compania, 
                        ramo: infoRiesgo.ramo, 
                        asegurado: infoRiesgo.asegurado, 
                        estado: estado, 
                        movimiento: infoMovimiento.numero,
                        fechaEmision: infoMovimiento.fechaEmision, 
                        desde: infoMovimiento.desde,
                        hasta: infoMovimiento.hasta,

                        valorARiesgo, 
                        sumaAsegurada, 
                        prima,
                        ordenPorc, 
                        sumaReasegurada,
                        primaBruta,
                        comision,
                        impuesto,
                        corretaje,
                        impuestoSobrePN,
                        primaNeta,

                        cia: infoRiesgo.cia, 
                        user: Meteor.userId()
                    }

                    try { 
                        Temp_consulta_riesgosEmitidosReaseguradores.insert(reportItem); 
                        recordCount++;          
                    } catch(err) {
                        return { 
                            error: true, 
                            recordCount: recordCount, 
                            message: `<b>Error:</b> ha ocurrido un error en la ejecución de este proceso: <br />${err.message}`
                        }
                    }  
                }
            }
        }
        
        return { 
            error: false, 
            recordCount: recordCount, 
            message: `Ok, el método se ha ejecutado en forma satisfactoria !!!`
        }
    }, 


    'consultas.primasEmitidas.reaseguradores.getRecCount': function (userId) {

        check(userId, String);

        const recordCount = Temp_consulta_riesgosEmitidosReaseguradores.find({ user: userId }).count(); 

        return { 
            error: false, 
            recordCount
        }
    }
})

function prepararFiltro(f, ciaSeleccionadaID) { 

    const numeroRiesgoDesde = f.numeroRiesgoDesde ? parseInt(f.numeroRiesgoDesde) : null;  
    const numeroRiesgoHasta = f.numeroRiesgoHasta ? parseInt(f.numeroRiesgoHasta) : null; 

    const fEmisionDesde = f.fEmisionDesde && moment(f.fEmisionDesde).isValid() ? moment(f.fEmisionDesde).toDate() : null; 
    const fEmisionHasta = f.fEmisionHasta && moment(f.fEmisionHasta).isValid() ? moment(f.fEmisionHasta).toDate() : null; 

    const vigInicialDesde = f.vigInicialDesde && moment(f.vigInicialDesde).isValid() ? moment(f.vigInicialDesde).toDate() : null; 
    const vigInicialHasta = f.vigInicialHasta && moment(f.vigInicialHasta).isValid() ? moment(f.vigInicialHasta).toDate() : null; 
    const vigFinalDesde = f.vigFinalDesde && moment(f.vigFinalDesde).isValid() ? moment(f.vigFinalDesde).toDate() : null; 
    const vigFinalHasta = f.vigFinalHasta && moment(f.vigFinalHasta).isValid() ? moment(f.vigFinalHasta).toDate() : null; 

    const filtro = {}; 

    if (numeroRiesgoDesde) { 
        if (numeroRiesgoHasta) { 
            filtro.numero = { $gte: numeroRiesgoDesde, $lte: numeroRiesgoHasta }
        } else { 
            filtro.numero = { $eq: numeroRiesgoDesde }
        }  
    } else { 
        if (numeroRiesgoHasta) { 
            filtro.numero = { $lte: numeroRiesgoHasta }
        }
    }

    if (fEmisionDesde) { 
        if (fEmisionHasta) { 
            filtro['movimientos.fechaEmision'] = { $gte: fEmisionDesde, $lte: fEmisionHasta }
        } else { 
            filtro['movimientos.fechaEmision'] = { $gte: fEmisionDesde }
        }  
    } else { 
        if (fEmisionHasta) { 
            filtro['movimientos.fechaEmision'] = { $lte: fEmisionHasta }
        }
    }

    if (vigInicialDesde) { 
        if (vigInicialHasta) { 
            filtro['movimientos.desde'] = { $gte: vigInicialDesde, $lte: vigInicialHasta }
        } else { 
            filtro['movimientos.desde'] = { $gte: vigInicialDesde }
        }  
    } else { 
        if (vigInicialHasta) { 
            filtro['movimientos.desde'] = { $lte: vigInicialHasta }
        }
    }

    if (vigFinalDesde) { 
        if (vigFinalHasta) { 
            filtro['movimientos.hasta'] = { $gte: vigFinalDesde, $lte: vigFinalHasta }
        } else { 
            filtro['movimientos.hasta'] = { $gte: vigFinalDesde }
        }  
    } else { 
        if (vigFinalHasta) { 
            filtro['movimientos.hasta'] = { $lte: vigFinalHasta }
        }
    }

    if (f.monedas && Array.isArray(f.monedas) && f.monedas.length) { 
        const array = f.monedas.map(x => x.value); 
        filtro.moneda = { $in: array }; 
    }

    if (f.companias && Array.isArray(f.companias) && f.companias.length) { 
        const array = f.companias.map(x => x.value); 
        filtro['movimientos.companias.compania'] = { $in: array }; 
    }

    if (f.cedentes && Array.isArray(f.cedentes) && f.cedentes.length) { 
        const array = f.cedentes.map(x => x.value); 
        filtro.compania = { $in: array }; 
    }

    if (f.ramos && Array.isArray(f.ramos) && f.ramos.length) { 
        const array = f.ramos.map(x => x.value); 
        filtro.ramo = { $in: array }; 
    }

    if (f.asegurados && Array.isArray(f.asegurados) && f.asegurados.length) { 
        const array = f.asegurados.map(x => x.value); 
        filtro.asegurado = { $in: array }; 
    }

    filtro.cia = { $eq: ciaSeleccionadaID }

    return filtro; 
}