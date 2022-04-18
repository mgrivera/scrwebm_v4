
import React from 'react';
import PropTypes from 'prop-types';

import Modal from 'react-modal';
import { Grid, Button, Header, Message, Segment, } from 'semantic-ui-react'; 

import 'semantic-ui-css/semantic.min.css';

import Form from "react-jsonschema-form";
import LayoutGridField from "react-jsonschema-form-layout-grid"; 

import { Filtros } from '/imports/collections/otros/filtros'; 

import SemanticUiMessage from '/client/imports/reactComponents/semanticUi_message'; 
import SemanticUiLoader from '/client/imports/reactComponents/semanticUi_loader'; 

import { getRandomInt } from '/client/imports/generales/funcionesMatematicasGenericas'; 

const reactModalCustomStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)', 
  }
}

// definimos el schema para el filtro y luego la forma 
const json_schema = {
    title: "Remesas - Reporte - Opciones",
    description: "Opciones para obtener el reporte de remesas",
    type: "object",
    required: [ "subTituloReporte", "mostrarColores", ],

    properties: {
        subTituloReporte: { title: "Sub título", type: "string", },
        mostrarColores: { title: "Mostrar colores", type: "boolean", },
    },
}

const fields = {
    layout_grid: LayoutGridField
} 

const ui_schema = {
    'ui:field': 'layout_grid',
    'ui:layout_grid': {
        'ui:row': [
            {
                'ui:col': {
                    md: 12, children: [
                        {
                            'ui:row': [
                                { 'ui:col': { md: 2, children: [ { name: 'filler', render: (props) => { return null; }} ] } },
                                { 'ui:col': { md: 8, children: ['subTituloReporte'] } },
                            ]
                        },
                        {
                            'ui:row': [
                                { 'ui:col': { md: 2, children: [ { name: 'filler', render: (props) => { return null; }} ] } },
                                { 'ui:col': { md: 4, children: ['mostrarColores'] } },
                            ]
                        },
                    ]
                }
            },
        ],
    },
    'subTituloReporte': {
        'ui:widget': 'textarea', 
        "ui:autofocus": true, 
    },
    'mostrarColores': {
        "ui:options": {
            inline: true, 
        }, 
    },
}

// construimos el url que se debe usar para obtener el reporte (sql server reporting services - desde el programa asp.net)
let scrwebm_net_app_address = Meteor.settings.public.scrwebm_net_app_address;
    
let reportLink_url = "#";
if (scrwebm_net_app_address) {
    reportLink_url = `${scrwebm_net_app_address}/reports/remesas/report.aspx?user=${Meteor.userId()}&report=list`;
}

const ReportFromList = class extends React.Component {

    _reactJsonSchemaForm; 
    _opcionesReport; 

    constructor(props) {
        super(props);

        this.state = {
            modalIsOpen: false, 
            loaderIsActive: false, 
            mostrarLink: false, 
            semanticUiMessage: { 
                show: false, 
                header: '', 
                content: '', 
                type: '', 
            }, 
        };

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.grabarOpcionesReporte = this.grabarOpcionesReporte.bind(this); 
        this.onFormSubmit = this.onFormSubmit.bind(this); 

        this._reactJsonSchemaForm = null; 
        this._opcionesReport = {};
    }

    componentDidMount() {
        // ------------------------------------------------------------------------------------------------------
        // intentamos leer las opciones usadas antes por el usuario, para mostrarlas en el diálogo ... 
        const filtroAnterior = Filtros.findOne({ nombre: 'remesas.consulta.fromList.opcionesReport', userId: Meteor.userId() });

        if (filtroAnterior) { 
            this._opcionesReport = filtroAnterior.filtro;
            this.setState({ formData: this._opcionesReport, }); 
        }
        // ------------------------------------------------------------------------------------------------------
      }

    openModal() {
        this.setState({ modalIsOpen: true });
    }

    afterOpenModal() {
        // references are now sync'd and can be accessed.
        this.subtitle.style.color = 'white';
    }

    closeModal() {
        this.setState({
            modalIsOpen: false, 
            loaderIsActive: false, 
            mostrarLink: false, 
            semanticUiMessage: { 
                show: false, 
            }, 
        }); 
    }

    grabarOpcionesReporte() {  
        if (this._reactJsonSchemaForm && this._reactJsonSchemaForm.submit) { 
            this._reactJsonSchemaForm.submit(); 
        }
    }

    onFormSubmit({formData}) { 
        // mostramos el loader pero mantenemos el message hidden 
        this.setState({
            loaderIsActive: true, 
            mostrarLink: false, 
            semanticUiMessage: { 
                show: false, 
            },
            formData: formData 
        }); 

        // guardamos las opciones indicadas por el usuario, para que estén disponibles la próxima vez 
        // ------------------------------------------------------------------------------------------------------
        // guardamos el filtro indicado por el usuario
        if (Filtros.findOne({ nombre: 'remesas.consulta.fromList.opcionesReport', userId: Meteor.userId() })) { 
            // el filtro existía antes; lo actualizamos
            // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
            Filtros.update(Filtros.findOne({ nombre: 'remesas.consulta.fromList.opcionesReport', userId: Meteor.userId() })._id,
                    { $set: { filtro: formData } },
                    { validate: false });
        }
        else { 
            Filtros.insert({
                _id: new Mongo.ObjectID()._str,
                userId: Meteor.userId(),
                nombre: 'remesas.consulta.fromList.opcionesReport',
                filtro: formData
            });
        }
    
        grabarOpciones_serverDB(formData, this.props.companiaSeleccionadaId).then((result) => { 
            this.setState({
                loaderIsActive: false, 
                mostrarLink: true, 
                semanticUiMessage: { 
                    show: true, 
                    header: 'Ok, el proceso se ha ejecutado en forma satisfactoria', 
                    content: `${result.message}`, 
                    type: 'info', 
                }, 
            }); 
        }).catch((err) => { 
            this.setState({
                loaderIsActive: false, 
                semanticUiMessage: { 
                    show: true, 
                    mostrarLink: false, 
                    header: 'Error: hemos obtenido un error al intentar ejecutar esta función', 
                    content: `${err.name ? err.name : ''} - ${err.message ? err.message : ''}`, 
                    type: 'negative', 
                }, 
            });   
        })
    }

    render() {

        const formStyle = { textAlign: 'left', 
                            // border: 'solid 1px lightgray', 
                            // padding: '15px', 
                          }; 

        // para mostrar o el message (o no ...)
        const componentKey = getRandomInt(0, 1000000); 
        const message = <SemanticUiMessage visible={this.state.semanticUiMessage.show}
                                        type={this.state.semanticUiMessage.type} 
                                        header={this.state.semanticUiMessage.header} 
                                        content={this.state.semanticUiMessage.content}
                                        key={componentKey} />;     // key: when changed, react re renders the component 

        let reportLink; 
        if (this.state.mostrarLink) {
            reportLink = <Segment>
                            <a href={reportLink_url} target="_blank">Obtener reporte ...&nbsp;&nbsp;<span className="fa fa-print"></span></a>
                        </Segment>; 
        } else { 
            reportLink = <span />; 
        }

        return (
            <div>
                <a href="#" className="toolBarLink" onClick={this.openModal}>Reporte&nbsp;&nbsp;<span className="fa fa-print"></span></a>

                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.afterOpenModal}
                    onRequestClose={this.closeModal}
                    style={reactModalCustomStyles}
                    contentLabel="Example Modal">

                    <div>
                        <div>

                            <div style={{ minWidth: '500px', 
                                          backgroundColor: '#0480BE', 
                                          marginBottom: '15px', 
                                          padding: '15px', }}>
                                <h4 ref={subtitle => this.subtitle = subtitle}>Remesas - Reporte - Opciones</h4>
                            </div>

                            <SemanticUiLoader active={this.state.loaderIsActive} />

                            <div style={{ marginBottom: '15px' }}>
                                {message}
                            </div>

                            <Segment>
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column width={15} textAlign='right'>
                                            <span style={{ color: 'dodgerblue', fontStyle: 'italic' }}>
                                                {this.props.companiaSeleccionadaNombre}
                                            </span>
                                        </Grid.Column>
                                        <Grid.Column width={1} />
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column width={16}>
                                            <div style={formStyle}>
                                                <Form schema={json_schema}
                                                    uiSchema={ui_schema}
                                                    formData={this.state.formData}
                                                    fields={fields}
                                                    onSubmit={this.onFormSubmit} ref={(form) => { this._reactJsonSchemaForm = form; }}
                                                    noHtml5Validate={true}>
                                                    <button hidden type="submit">Submit (my own ...)</button>
                                                </Form>
                                            </div>
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>
                            </Segment>

                            {reportLink}

                            <Segment>
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column width={4}>
                                        </Grid.Column>
                                        <Grid.Column width={4}>
                                        </Grid.Column>
                                        <Grid.Column width={4} textAlign='right'>
                                            <Button color='blue' size='small' onClick={this.grabarOpcionesReporte}>Grabar</Button>
                                        </Grid.Column>
                                        <Grid.Column width={4} textAlign='right' >
                                            <Button color='orange' size='small' onClick={this.closeModal} >Cerrar</Button>
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>
                            </Segment> 
                        </div>
                    </div>
 
                </Modal>
            </div>
        )
    }
}

ReportFromList.propTypes = {
    companiaSeleccionadaId: PropTypes.string, 
    companiaSeleccionadaNombre: PropTypes.string, 
}

export default ReportFromList; 

function grabarOpciones_serverDB(formData, companiaSeleccionadaId) { 
    return new Promise((resolve, reject) => { 
        Meteor.call('remesas.reporte.list.grabarAMongoOpcionesReporte', formData, companiaSeleccionadaId, (err, result) => {

            if (err) { reject(err); }
            if (result.error) { reject(result); }
            resolve(result); 
        })
    })
}