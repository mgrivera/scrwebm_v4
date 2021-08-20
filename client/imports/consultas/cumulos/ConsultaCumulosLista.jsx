
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import ToolBar from './ToolBar';
import Spinner from '/client/imports/reactComponents/Spinner';
import Alerts from '/client/imports/reactComponents/Alerts';
import ConsultaCumulosLista_Table from './ConsultaCumulosLista_Table'; 
import { ReportPrintModal } from './ReportPrintModal'; 

import Papa from 'papaparse';
import saveAs from 'save-as'; 

import moment from 'moment';
import lodash from 'lodash'; 

import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';
import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { Temp_consulta_cumulos } from '/imports/collections/consultas/temp_consulta_cumulos'; 

function ConsultaCumulosLista({ recordCount }) {

    const [companiaSeleccionada, setCompaniaSeleccionada] = useState({});
    // style: // danger / warning / success / info
    const [alert, setAlert] = useState({ show: false, style: "", title: "", message: "" });
    const [page, setPage] = useState(1); 
    const [ reportPrintModalShow, setReportPrintModalShow ] = useState(false); 

    const recsPerPage = 25; 
    let cantPaginas = Math.floor(recordCount / recsPerPage);
    cantPaginas = (recordCount % recsPerPage) ? cantPaginas + 1 : cantPaginas; // si hay un resto, agregamos 1 página 

    useEffect(() => {
        // leemos la compañía seleccionada y actualizamos el state 
        const companiaSeleccionadaID = CompaniaSeleccionada.findOne({ userID: Meteor.userId() }, { fields: { companiaID: 1 } });
        let companiaSeleccionada = {};

        if (companiaSeleccionadaID) {
            companiaSeleccionada = EmpresasUsuarias.findOne(companiaSeleccionadaID.companiaID, { fields: { nombre: 1 } });
        } else {
            companiaSeleccionada = { _id: "999", nombre: "No hay una compañía seleccionada ..." };
        }

        setCompaniaSeleccionada(companiaSeleccionada)
    }, []);

    const handleAlertsDismiss = () => {
        setAlert(state => ({ ...state, show: false }))
    }

    const tempCollectionLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('consulta.cumulos.tempCollection.paging', page, recsPerPage, recordCount);

        return !handle.ready();
    }, [page]);

    const tempItems = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const tempItems = Temp_consulta_cumulos.find({ user: Meteor.userId() }, {
            sort: { 'monedas.simbolo': 1, 'companias.abreviatura': 1, 'ramos.abreviatura': 1, 'cumulos.origen': 1, numero: 1 }
        }).fetch();

        return tempItems;
    }, [page]);

    const leerMas = (page, setPage, cantPaginas) => {

        // siempre evitamos pasar la máx cantidad de páginas 
        if ((page + 1) > cantPaginas) {
            return;
        }

        // guardamos el número de la página en el state para mostrarla al usuario (pag 1 de 15 ...) 
        setPage(page + 1);
    }

    const leerTodo = (page, setPage, cantPaginas) => {

        // siempre evitamos pasar la máx cantidad de páginas 
        if ((page + 1) > cantPaginas) {
            return;
        }

        setPage(cantPaginas);
    }

    const exportToTextFile = () => { 

        try {
            // para tener un clone del array 
            const items = lodash.cloneDeep(tempItems);

            // eliminamos algunas propiedades que no queremos en el txt (csv) 
            items.forEach(x => {
                delete x._id;

                x.ramo = x.ramos.abreviatura;
                x.asegurado = x.asegurados?.abreviatura ? x.asegurados.abreviatura : "";
                x.cedenteOriginal = x.cedentesOriginales.abreviatura;
                x.compania = x.companias.abreviatura;
                x.tipoCumulo = x.cumulos.abreviatura;
                x.moneda = x.monedas.simbolo;
                x.zona = x.zonas.abreviatura;

                x.desde = moment(x.desde).format('DD-MM-YYYY');
                x.hasta = moment(x.hasta).format('DD-MM-YYYY');
                x.cumulosAl = moment(x.cumulosAl).format('DD-MM-YYYY');

                delete x.ramos;
                delete x.asegurados;
                delete x.cedentesOriginales;
                delete x.companias;
                delete x.cumulos;
                delete x.monedas;
                delete x.zonas;

                delete x.cia; 
                delete x.entityId; 
                delete x.subEntityId; 
                delete x.ingreso;
                delete x.usuario;
                delete x.user;
            });

            // papaparse: convertimos el array json a un string csv ...
            const config = {
                // quotes: true,
                // quoteChar: "'",
                delimiter: "\t",
                header: true
            };

            let csvString = Papa.unparse(items, config);

            // cambiamos los headers por textos más apropiados (pareciera que ésto no se puede hacer desde el config)
            csvString = csvString.replace("ano", "lapso");
            csvString = csvString.replace("compania", "empresa");

            var blob = new Blob([csvString], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "cumulos registro");

            const message = `Ok, los registros han sido exportados a un archivo de texto en forma exitosa. <br /> 
                             En total, se han exportado <b>${items.length.toString()}</b> lineas. 
                     `

            setAlert({ show: true, style: "success", title: "Registros de cúmulo - Exportar a archivo de texto", message });
        }
        catch (err) {
            const message = err.message ? err.message : err.toString();
            setAlert({ show: true, style: "danger", title: "Registros de cúmulo - Exportar a archivo de texto", message });
        }
    }

    return (
            <div className="ui-viewBorder-left-aligned">

                {
                    reportPrintModalShow && 
                    <ReportPrintModal reportPrintModalShow={reportPrintModalShow} 
                                      setReportPrintModalShow={setReportPrintModalShow} 
                                      companiaSeleccionada={companiaSeleccionada} /> 
                }

                <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                    <span style={{ color: 'dodgerblue' }}>{companiaSeleccionada.nombre}</span>
                </div >

                <ToolBar title="Cúmulos / Consulta / Lista" 
                         url="consultas/cumulos/filtro" 
                         leerMas={() => leerMas(page, setPage, cantPaginas)} 
                         leerTodo={() => leerTodo(page, setPage, cantPaginas)} 
                         exportToTextFile={exportToTextFile} />

                {
                    tempCollectionLoading &&
                    <div style={{ marginTop: '5px', marginBottom: '5px' }}>
                        <Spinner />
                    </div>
                }

                <div style={{ textAlign: 'right', marginTop: "-15px" }}>
                    <span>
                        <p>
                            {`(${tempItems.length} de ${recordCount} - pag ${page} de ${cantPaginas})`}
                        </p>
                    </span>
                </div>

                {
                    alert.show &&
                    <div style={{ marginTop: '10px' }}>
                        <Alerts style={alert.style} title={alert.title} message={alert.message} onDismiss={handleAlertsDismiss} />
                    </div>
                }

                <div className="ui-viewBorder-left-aligned">
                    <ConsultaCumulosLista_Table items={tempItems} />
                </div>

            </div>
    )
}

ConsultaCumulosLista.propTypes = {
    recordCount: PropTypes.number.isRequired,
};

export default ConsultaCumulosLista; 