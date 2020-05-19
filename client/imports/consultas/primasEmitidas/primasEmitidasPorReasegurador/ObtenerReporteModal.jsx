
import React, { Component } from 'react'

import { Button, Header, Modal, Grid, Form, Loader, Input, Message, Checkbox, Icon } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

import PropTypes from 'prop-types';
import { Filtros } from '/imports/collections/otros/filtros';

class ObtenerReportModal extends Component {

    // just a private fields 
    #_reportLink; 

    constructor(props) { 
        super(props); 

        this.state = {
            loader: false,
            showReportLink: false, 

            message: {
                type: '', 
                visible: false, 
                message: ''
            },

            values: {
                subTitulo: '',
                mostrarColores: false, 
                formatoExcel: false
            }, 
        }

        // construimos el url que se debe usar para obtener el reporte (sql server reporting services - asp.net)
        const scrwebm_net_app_address = Meteor.settings.public.scrwebm_net_app_address;

        this.#_reportLink = "#"; 

        if (scrwebm_net_app_address) {
            this.#_reportLink = `${scrwebm_net_app_address}/reports/primasEmitidas/facultativo/reaseguradores/report.aspx?user=${Meteor.userId()}&report=primasEmitidasReaseguradores`;
        }
    }

    componentDidMount() { 
        // ------------------------------------------------------------------------------------------------------
        // si hay un filtro anterior, lo usamos
        // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
        let filtroAnterior = Filtros.findOne(
            {
                nombre: 'consultas.primasEmitidas.reaseguradores.opcionesReport',
                userId: Meteor.userId(),
            });

        if (!filtroAnterior || !filtroAnterior.filtro) {
            filtroAnterior = { filtro: {} };
        }

        // si hay valores en guardados, sustituimos los iniciales 
        const values = { ...this.state.values, ...filtroAnterior.filtro };
        // ------------------------------------------------------------------------------------------------------

        this.setState({ values: { ...values } }); 
    }

    handleMessageDismiss = () => {
        this.setState({ message: { visible: false } })
    }

    onInputChange = (e) => {
        const { values } = this.state;
        const name = e.target.name;
        const value = e.target.value;
        this.setState({ values: { ...values, [name]: value } });
    } 

    onCheckBoxChange = (name) => {
        const { values } = this.state;
        // simplemente cambiamos de false a true y viceversa 
        const value = !this.state.values[name];
        this.setState({ values: { ...values, [name]: value } });
    } 

    onReportModalSave = () => { 

        this.setState(() => ({ loader: true })); 
        guardarFiltro(this.state.values);   // para guardar, en Filtros, el filtro que acaba de indicar el usuairo 

        Meteor.call('primasEmitidas.reaseguradores.grabarOpcionesReporte', this.state.values, 
                                                                           this.props.companiaSeleccionada, 
                                                                           (err, result) => {

            if (err) { 
                const message = { type: 'error', visible: true, message: err.message }; 
                this.setState(() => ({ loader: false, message: message })); 

                return; 
            }

            if (result.error) { 
                const message = { type: 'error', visible: true, message: result.message };
                this.setState(() => ({ loader: false, message: message }));

                return; 
            }

            const message = { type: 'info', visible: true, message: result.message };
            this.setState(() => ({ loader: false, showReportLink: true, message: message }));

            return; 
        })
    }

    render() {

        const { open, onReportModalClose } = this.props; 
        const message = this.state.message && this.state.message.message ? this.state.message.message : ""; 

        // para corregir un cierto bug que muestra el modal; se extiende más allá de la altura de la página disponile. 
        // nótese que, probablemente, ésto ocurre pues nuestro proyecto incluye una versión de bootstrap 3 ... 
        const style =  { height: 'auto',  top: 'auto', left: 'auto', bottom: 'auto', right: 'auto' }; 

        return (
            <div>
                <Modal size='small' 
                       open={open} 
                       onClose={() => onReportModalClose()} style={style} 
                       dimmer='inverted'
                       closeIcon={{ style: { top: '1.0535rem', right: '1rem' }, color: 'black', name: 'close' }}>
                    <Header content='Primas emitidas - facultativo - reaseguradores' 
                            style={{ backgroundColor: '#0480BE', color: 'white' }} />
                    <Modal.Content>
                        
                        <Grid container>

                            <Grid.Row style={{ paddingBottom: '0' }}>
                                <Grid.Column width="8">
                                </Grid.Column>
                                <Grid.Column width="8">
                                    <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                                        <span style={{ color: 'dodgerblue' }}>{this.props.companiaSeleccionada.nombre}</span>
                                    </div>
                                </Grid.Column>
                            </Grid.Row>

                            {this.state.loader
                                ? (
                                    <Grid.Row style={{ paddingBottom: '0', paddingTop: '0' }}>
                                        <Grid.Column>
                                            <Loader active size='small' inline='centered' />
                                        </Grid.Column>
                                    </Grid.Row>
                                )
                                : null
                            }

                            {this.state.message.visible
                                ? this.state.message.type === 'info' 
                                    ? (
                                        <Grid.Row style={{ paddingBottom: '0', paddingTop: '0' }}>
                                            <Grid.Column>
                                                <Message info
                                                         onDismiss={this.handleMessageDismiss}
                                                         size='tiny'>
                                                    <div dangerouslySetInnerHTML={outputHtmlMarkup(message)} />
                                                </Message>
                                            </Grid.Column>
                                        </Grid.Row>
                                    ) 
                                    : (
                                        <Grid.Row style={{ paddingBottom: '0', paddingTop: '0' }}>
                                            <Grid.Column>
                                                <Message negative
                                                         onDismiss={this.handleMessageDismiss}
                                                         size='tiny'>
                                                    <div dangerouslySetInnerHTML={outputHtmlMarkup(message)} />
                                                </Message>
                                            </Grid.Column>
                                        </Grid.Row>
                                    )
                                : null
                            }

                            <Grid.Row>
                                <Grid.Column>
                                    <Form onSubmit={(e) => this.handleFormSubmit(e)}>

                                        <Grid container>
                                            <Grid.Row>
                                                <Grid.Column>
                                                    <Form.Field>
                                                        <label>Sub título</label>
                                                        <Input
                                                            name="subTitulo"
                                                            value={this.state.values.subTitulo}
                                                            placeholder='Indique un sub-título para el reporte'
                                                            control='input'
                                                            type='text'
                                                            size='mini'
                                                            onChange={(e) => this.onInputChange(e)} />
                                                    </Form.Field> 
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Column width={8}>
                                                    <Checkbox label='Mostrar colores'
                                                              name="mostrarColores" 
                                                              onChange={() => this.onCheckBoxChange("mostrarColores")} 
                                                              checked={this.state.values.mostrarColores} />
                                                </Grid.Column>
                                                <Grid.Column width={8}>
                                                    <Checkbox label='Formato Excel'
                                                              name="formatoExcel"
                                                              onChange={() => this.onCheckBoxChange("formatoExcel")}
                                                              checked={this.state.values.formatoExcel} />
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>

                                    </Form>
                                </Grid.Column>
                            </Grid.Row>

                            { this.state.showReportLink 
                            ? (
                                <Grid.Row>
                                    <Grid.Column>
                                        <a href={this.#_reportLink} target="_blank">
                                            Obtener reporte ...&nbsp;&nbsp;<Icon name='print' />
                                        </a>
                                    </Grid.Column>
                                </Grid.Row>
                            )
                            : null }

                        </Grid>

                    </Modal.Content>

                    <Modal.Actions>
                        <Button primary size='small' onClick={() => this.onReportModalSave()}>
                            Grabar opciones reporte
                        </Button>
                    </Modal.Actions>
                </Modal>
            </div>
        )
    }
}

ObtenerReportModal.propTypes = {
    open: PropTypes.bool.isRequired,
    companiaSeleccionada: PropTypes.object.isRequired, 
    onReportModalClose: PropTypes.func.isRequired,
};

export default ObtenerReportModal

function outputHtmlMarkup(text) { 
    return { __html: text }; 
}

function guardarFiltro(values) {
    // guardamos el filtro indicado por el usuario
    const filtro = Filtros.findOne({ nombre: 'consultas.primasEmitidas.reaseguradores.opcionesReport', 
                                     userId: Meteor.userId() }, 
                                   { fields: { _id: 1 } });
    if (filtro) {
        // el filtro existía antes; lo actualizamos
        // validate false: como el filtro puede ser vacío (ie: {}), simple-schema no permitiría eso; por eso saltamos la validación
        Filtros.update(filtro._id, { $set: { filtro: values } }, { validate: false });
    }
    else {
        Filtros.insert({
            _id: new Mongo.ObjectID()._str,
            userId: Meteor.userId(),
            nombre: 'consultas.primasEmitidas.reaseguradores.opcionesReport',
            filtro: values
        })
    }
}