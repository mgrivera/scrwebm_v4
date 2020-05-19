
import { Meteor } from 'meteor/meteor';
import React from 'react';

import moment from 'moment'; 
import numeral from 'numeral'; 

import { ReactiveVar } from 'meteor/reactive-var'; 
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';

import { Grid, Menu, Loader, Message, Table, Icon, Modal } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css'

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada';
import { Temp_consulta_riesgosEmitidosReaseguradores } from '/imports/collections/consultas/temp_consulta_riesgosEmitidos_reaseguradores'; 

import ObtenerReportModal from './ObtenerReporteModal';

// definimos una variable global al módulo, para recibir el subscription; la idea es hacer un stop cuando el usuario deje 
// el react component 
let subscription; 

// inicializamos nuestra variable para la página; reactive-var 
let currentPage = new ReactiveVar(1);

const PageMenu = ({ obtenerReporte, leerMas, leerTodo }) => {
    return (
        <Menu color="grey" inverted key="1">
            <Menu.Item header>Primas emitidas / Facultativo / Reaseguradores</Menu.Item>

            <Menu.Item onClick={() => obtenerReporte()}>Reporte&nbsp;&nbsp;<Icon name='print' /></Menu.Item>

            <Menu.Menu position='right'>
                <Menu.Item onClick={() => leerMas()}>Más</Menu.Item>
                <Menu.Item onClick={() => leerTodo()}>Todo</Menu.Item>

                <Menu.Item href='consultas/primasEmitidas/reaseguradores'>
                    <span style={{ fontStyle: 'italic' }}>Regresar</span>
                </Menu.Item>
            </Menu.Menu> 
        </Menu>
    );
}

PageMenu.propTypes = {
    obtenerReporte: PropTypes.func.isRequired,
    leerMas: PropTypes.func.isRequired,
    leerTodo: PropTypes.func.isRequired,
};

const TableRow = ({ row }) => {

    let costos = 0; 
    
    costos += row.comision ? row.comision : 0; 
    costos += row.impuesto ? row.impuesto : 0; 
    costos += row.corretaje ? row.corretaje : 0; 
    costos += row.impuestoSobrePN ? row.impuestoSobrePN : 0; 

    return (
        <Table.Row>
            <Table.Cell>{row.numero}</Table.Cell>
            <Table.Cell>{row.moneda.simbolo}</Table.Cell>
            <Table.Cell>{row.compania.abreviatura}</Table.Cell>
            <Table.Cell>{row.cedente.abreviatura}</Table.Cell>
            <Table.Cell>{row.ramo.abreviatura}</Table.Cell>
            <Table.Cell>{row.asegurado.abreviatura}</Table.Cell>
            <Table.Cell>{row.estado}</Table.Cell>
            <Table.Cell>{row.movimiento}</Table.Cell>
            <Table.Cell style={{ whiteSpace: 'nowrap' }}>{moment(row.fechaEmision).format("DD-MMM-YY")}</Table.Cell>
            <Table.Cell style={{ whiteSpace: 'nowrap' }}>{moment(row.desde).format("DD-MMM-YY")}</Table.Cell>
            <Table.Cell style={{ whiteSpace: 'nowrap' }}>{moment(row.hasta).format("DD-MMM-YY")}</Table.Cell>

            <Table.Cell>{numeral(row.sumaAsegurada).format('0,0.0')}</Table.Cell>
            <Table.Cell>{numeral(row.prima).format('0,0.0')}</Table.Cell>
            <Table.Cell>{numeral(row.ordenPorc).format('0.000')}</Table.Cell>
            <Table.Cell>{numeral(row.sumaReasegurada).format('0,0.0')}</Table.Cell>
            <Table.Cell>{numeral(row.primaBruta).format('0,0.0')}</Table.Cell>
            <Table.Cell>{numeral(costos).format('0,0.0')}</Table.Cell>
            <Table.Cell>{numeral(row.primaNeta).format('0,0.0')}</Table.Cell>
        </Table.Row>
    )
}

TableRow.propTypes = {
    row: PropTypes.object.isRequired,
};

class ConsultasPrimasEmitidasReaseguradoresLista extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            totalRecCount: props.recordCount, 
            page: 1, 
            recsPerPage: 25, 

            loader: false,
            reportModalIsOpen: false, 

            message: {
                visible: false
            },

            companiaSeleccionada: {}, 
            primasEmitidasReaseguradores: []
        }
    }

    componentDidMount() {
        // leemos la compañía seleccionada y la agregamos al state 
        const companiaSeleccionadaID = CompaniaSeleccionada.findOne({ userID: Meteor.userId() }, { fields: { companiaID: 1 } });
        let companiaSeleccionada = {};

        if (companiaSeleccionadaID) {
            companiaSeleccionada = EmpresasUsuarias.findOne(companiaSeleccionadaID.companiaID, { fields: { nombre: 1 } });
        } else {
            companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
        }

        this.setState(
            { 
                companiaSeleccionada: companiaSeleccionada, 
            });
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.ready && this.props.ready && this.state.loader) { 
            this.setState(() => ({ loader: false })); 
        }
    }

    static getDerivedStateFromProps(props, state) {
        return { primasEmitidasReaseguradores: props.primasEmitidasReaseguradores };
    }

    handleMessageDismiss = () => {
        this.setState({ message: { visible: false } })
    }

    obtenerReporte = () => { 
        this.setState({ reportModalIsOpen: true })
    } 
    
    leerMas = () => { 
        // siempre evitamos pasar la máx cantidad de páginas 
        let page = currentPage.get(); 
        page++; 

        if (page > this.props.cantPaginas) { 
            return; 
        }

        // guardamos el número de la página en el state para mostrarla al usuario (pag 1 de 15 ...) 
        this.setState((prevState) => ({ page: prevState.page + 1, loader: true })); 
        currentPage.set(page);
    }
    
    leerTodo = () => { 
        // siempre evitamos pasar la máx cantidad de páginas 
        let page = currentPage.get();
        page++;

        if (page > this.props.cantPaginas) {
            return;
        }

        this.setState(() => ({ page: this.props.cantPaginas, loader: true })); 
        currentPage.set(this.props.cantPaginas);
    }

    onReportModalClose = () => {
        this.setState({ reportModalIsOpen: false })
    }

    /** If the subscription(s) have been received, render the page, otherwise show a loading icon. */
    render() {

        if (this.state.page === 1) { 
            return (this.props.ready) ? this.renderPage() : <Loader active>Leyendo los registros seleccionados ...</Loader>;
        } else { 
            return this.renderPage(); 
        }
    }

    renderPage() {

        const tableStyle = { height: '350px', overflow: 'auto' }; 
        const modalStyle = { maxHeight: '150px' }

        return (
            <div className="ui-viewBorder-left-aligned">
                <Grid container>

                    <Grid.Row style={{ paddingBottom: '0' }}>
                        <Grid.Column>
                            <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                                <span style={{ color: 'dodgerblue' }}>{this.state.companiaSeleccionada.nombre}</span>
                            </div>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row style={{ paddingTop: '0', paddingBottom: '0' }}>
                        <Grid.Column>
                            <PageMenu obtenerReporte={this.obtenerReporte} 
                                      leerMas={this.leerMas} 
                                      leerTodo={this.leerTodo} />
                        </Grid.Column>
                    </Grid.Row>                 

                    <Grid.Row style={{ paddingTop: '0', paddingBottom: '0' }}>
                        <Grid.Column>
                            <ObtenerReportModal open={this.state.reportModalIsOpen}
                                companiaSeleccionada={this.state.companiaSeleccionada}
                                onReportModalClose={this.onReportModalClose} /> 
                        </Grid.Column>
                    </Grid.Row>  
                    
                    {this.state.message.visible
                        ? (
                            <Grid.Row>
                                <Grid.Column>
                                    <Message
                                        error
                                        {...this.state.message}
                                        onDismiss={this.handleMessageDismiss}
                                        size='tiny'
                                    />
                                </Grid.Column>
                            </Grid.Row>
                        )
                        : null
                    }

                    <Grid.Row columns={3} style={{ paddingBottom: '0', paddingTop: '0' }}>
                        <Grid.Column>
                            
                        </Grid.Column>
                        <Grid.Column>
                            {this.state.loader
                                ? <Loader active size='small' inline='centered' />
                                : null
                            }
                            
                        </Grid.Column>
                        <Grid.Column>
                            <div style={{ textAlign: 'right' }}>
                                <span>
                                    <p>
                                        {`(${this.props.primasEmitidasReaseguradores.length} de 
                                           ${this.state.totalRecCount} - 
                                           pag ${this.state.page} de ${this.props.cantPaginas})`}
                                    </p>
                                </span>
                            </div>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row style={{ paddingTop: '0' }}>
                        <Grid.Column> 
                            <div style={tableStyle}>
                                <Table striped compact size='small'>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>Riesgo</Table.HeaderCell>
                                            <Table.HeaderCell>Moneda</Table.HeaderCell>
                                            <Table.HeaderCell>Compañía</Table.HeaderCell>
                                            <Table.HeaderCell>Cedente</Table.HeaderCell>
                                            <Table.HeaderCell>Ramo</Table.HeaderCell>
                                            <Table.HeaderCell>Asegurado</Table.HeaderCell>
                                            <Table.HeaderCell>Estado</Table.HeaderCell>
                                            <Table.HeaderCell>Movimiento</Table.HeaderCell>
                                            <Table.HeaderCell>F emisión</Table.HeaderCell>
                                            <Table.HeaderCell>Desde</Table.HeaderCell>
                                            <Table.HeaderCell>Hasta</Table.HeaderCell>

                                            <Table.HeaderCell>Suma asegurada</Table.HeaderCell>
                                            <Table.HeaderCell>Prima</Table.HeaderCell>
                                            <Table.HeaderCell>Orden (%)</Table.HeaderCell>
                                            <Table.HeaderCell>Suma reasegurada</Table.HeaderCell>
                                            <Table.HeaderCell>Prima bruta</Table.HeaderCell>
                                            <Table.HeaderCell>Costos</Table.HeaderCell>
                                            <Table.HeaderCell>Prima neta</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>

                                    <Table.Body>
                                        {this.state.primasEmitidasReaseguradores.map(p => (
                                            <TableRow key={p._id} row={p} />
                                        ))}
                                    </Table.Body>

                                    <Table.Footer>
                                        <Table.Row>
                                            <Table.HeaderCell colSpan='18'></Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Footer>
                                </Table>
                            </div>
                        </Grid.Column>
                    </Grid.Row>

                </Grid>
            </div>
        )
    }

    componentWillUnmount() {
        // ponemos la página en 1 
        // (porqué? al salír de la página se mantiene el reactive var???!!!) 
        currentPage.set(1);

        // detememos el publication 
        if (subscription && subscription.stop) { 
            subscription.stop();
        }
    }
}

/** Require an array of Stuff documents in the props. */
ConsultasPrimasEmitidasReaseguradoresLista.propTypes = {
    primasEmitidasReaseguradores: PropTypes.array.isRequired,
    ready: PropTypes.bool.isRequired,
    recordCount: PropTypes.number.isRequired,
    cantPaginas: PropTypes.number.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
const MyMeteorReactDataComponent = withTracker(({ recordCount }) => {
    // Get access to Stuff documents.
    const page = currentPage.get();             // reactive-var 
    const recsPerPage = 25; 

    // calculamos la cantidad máxima de páginas y pasamos como un prop 
    let cantPaginas = Math.floor(recordCount / recsPerPage); 
    cantPaginas = (recordCount % recsPerPage) ? cantPaginas + 1 : cantPaginas; // si hay un resto, agregamos 1 página 

    subscription = Meteor.subscribe('primasEmitidas.reaseguradores.consulta', page, recsPerPage, recordCount);
    return {
        primasEmitidasReaseguradores: Temp_consulta_riesgosEmitidosReaseguradores.find({ user: Meteor.userId() }, 
                                                                                       { sort: { numero: 1, movimiento: 1 }})
                                                                                 .fetch(),
        ready: subscription.ready(),
        recordCount: recordCount, 
        cantPaginas 
    };
})(ConsultasPrimasEmitidasReaseguradoresLista);

MyMeteorReactDataComponent.propTypes = {
    recordCount: PropTypes.number.isRequired,
};

export default MyMeteorReactDataComponent; 