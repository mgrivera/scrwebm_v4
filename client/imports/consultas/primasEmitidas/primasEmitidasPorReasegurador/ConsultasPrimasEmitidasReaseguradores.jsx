
import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';
import React from 'react'; 
import AsyncSelect from 'react-select/async';
import lodash from 'lodash'; 

import { Grid, Menu, Loader, Tab, Form, Input, Message, Table, Icon, Checkbox } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css'

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias';
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 
import { Filtros } from '/imports/collections/otros/filtros';
import { Monedas } from '/imports/collections/catalogos/monedas'; 
import { Companias } from '/imports/collections/catalogos/companias'; 
import { Ramos } from '/imports/collections/catalogos/ramos'; 
import { Asegurados } from '/imports/collections/catalogos/asegurados'; 

const PageMenu = () => {
    return (
        <Menu color="grey" inverted key="1">
            <Menu.Item header>Primas emitidas / Facultativo / Reaseguradores</Menu.Item>
        </Menu>
    );
}

PageMenu.propTypes = {
};

// ------------ monedas ------------------------------------------
const monedasFilter = (inputValue) => {
    return Monedas.find({ descripcion: new RegExp(inputValue, 'i') })
        .fetch()
        .map(x => ({ value: x._id, label: x.descripcion }));
};

let subscriptionMonedas = {};

const monedasSearch = inputValue =>
    new Promise(resolve => {
        subscriptionMonedas = Meteor.subscribe('search.monedas', inputValue, () => {
            resolve(monedasFilter(inputValue));
        });
    });

// ------------ companias ------------------------------------------
const companiasFilter = (inputValue) => {
    return Companias.find({ nombre: new RegExp(inputValue, 'i') })
        .fetch()
        .map(x => ({ value: x._id, label: x.nombre }));
};

let subscriptionCompanias = {};

const companiasSearch = inputValue =>
    new Promise(resolve => {
        subscriptionCompanias = Meteor.subscribe('search.companias', inputValue, () => {
            resolve(companiasFilter(inputValue));
        });
    });

// ------------ ramos ------------------------------------------
const ramosFilter = (inputValue) => {
    return Ramos.find({ descripcion: new RegExp(inputValue, 'i') })
        .fetch()
        .map(x => ({ value: x._id, label: x.descripcion }));
};

let subscriptionRamos = {};

const ramosSearch = inputValue =>
    new Promise(resolve => {
        subscriptionRamos = Meteor.subscribe('search.ramos', inputValue, () => {
            resolve(ramosFilter(inputValue));
        });
    });

// ------------ asegurados ------------------------------------------
const aseguradosFilter = (inputValue) => {
    return Asegurados.find({ nombre: new RegExp(inputValue, 'i') })
        .fetch()
        .map(x => ({ value: x._id, label: x.nombre }));
};

let subscriptionAsegurados = {};

const aseguradosSearch = inputValue =>
    new Promise(resolve => {
        subscriptionAsegurados = Meteor.subscribe('search.asegurados', inputValue, () => {
            resolve(aseguradosFilter(inputValue));
        });
    });

const tableStyle = { height: '150px', overflow: 'auto' }; 

export default class ConsultasPrimasEmitidasReaseguradores extends React.Component { 

    _tabPanes = []; 

    constructor(props) { 
        super(props); 

        this.state = { 
            loader: false, 

            message: {
                type: '',
                visible: false,
                message: ''
            }, 

            values: { 
                numeroRiesgoDesde: '', 
                numeroRiesgoHasta: '', 
                fEmisionDesde: '', 
                fEmisionHasta: '', 
                vigInicialDesde: '',
                vigInicialHasta: '',
                vigFinalDesde: '',
                vigFinalHasta: '', 
                monedas: [], 
                companias: [],
                cedentes: [],
                asegurados: [], 
                ramos: [], 
                estados: []
            }, 

            companiaSeleccionada: {}
        }

        this._tabPanes = [
            {
                menuItem: 'Generales',
                // eslint-disable-next-line react/display-name
                render: () => (<Tab.Pane>

                    <Grid container>

                        <Grid.Row style={{ paddingBottom: '0' }}>
                            {/* dentro del tab, el 'left gutter' no se construye en forma correcta (???)  */}
                            <Grid.Column width={1} />

                            <Grid.Column width={6}>
                                <Form.Group widths='equal'>
                                    <Form.Field>
                                        <label>Número de riesgo</label>
                                        <Input
                                            name="numeroRiesgoDesde"
                                            value={this.state.values.numeroRiesgoDesde}
                                            placeholder='Número riesgo (desde)'
                                            control='input'
                                            type='number'
                                            size='mini'
                                            onChange={(e) => this.onInputChange(e)} />
                                    </Form.Field>
                                    <Form.Field>
                                        <label>&nbsp;&nbsp;</label>
                                        <Input
                                            name="numeroRiesgoHasta"
                                            value={this.state.values.numeroRiesgoHasta}
                                            placeholder='Número riesgo (hasta)'
                                            control='input'
                                            type='number'
                                            size='mini'
                                            onChange={(e) => this.onInputChange(e)} />
                                    </Form.Field>
                                </Form.Group>
                            </Grid.Column>

                            <Grid.Column width={3} />
                            <Grid.Column width={6}>

                                <Checkbox
                                    label='Cotizado'
                                    onChange={(e) => this.onCheckBoxEstadoChange(e, "CO")}
                                    checked={this.state.values.estados.some(x => x === 'CO')}
                                />
                                &nbsp;&nbsp;
                                <Checkbox
                                    label='Aceptado'
                                    onChange={(e) => this.onCheckBoxEstadoChange(e, "AC")}
                                    checked={this.state.values.estados.some(x => x === 'AC')}
                                />
                                &nbsp;&nbsp;
                                <Checkbox
                                    label='Emitido'
                                    onChange={(e) => this.onCheckBoxEstadoChange(e, "EM")}
                                    checked={this.state.values.estados.some(x => x === 'EM')}
                                />
                                &nbsp;&nbsp;
                                <Checkbox
                                    label='Renovado'
                                    onChange={(e) => this.onCheckBoxEstadoChange(e, "RV")}
                                    checked={this.state.values.estados.some(x => x === 'RV')}
                                />
                                <br /> 
                                <Checkbox
                                    label='Renovación'
                                    onChange={(e) => this.onCheckBoxEstadoChange(e, "RE")}
                                    checked={this.state.values.estados.some(x => x === 'RE')}
                                />
                                &nbsp;&nbsp;
                                <Checkbox
                                    label='Anulado'
                                    onChange={(e) => this.onCheckBoxEstadoChange(e, "AN")}
                                    checked={this.state.values.estados.some(x => x === 'AN')}
                                />
                                &nbsp;&nbsp;
                                <Checkbox
                                    label='Declinado'
                                    onChange={(e) => this.onCheckBoxEstadoChange(e, "DE")}
                                    checked={this.state.values.estados.some(x => x === 'DE')}
                                />

                            </Grid.Column>
                        </Grid.Row>

                        <Grid.Row style={{ paddingBottom: '0' }}>
                            {/* dentro del tab, el 'left gutter' no se construye en forma correcta (???)  */}
                            <Grid.Column width={1} />

                            <Grid.Column width={6}>
                                <Form.Group widths='equal'>
                                    <Form.Field>
                                        <label>F emisión</label>
                                        <Input
                                            name="fEmisionDesde"
                                            value={this.state.values.fEmisionDesde}
                                            placeholder='Fecha emisión (desde)'
                                            control='input'
                                            type='date'
                                            size='mini'
                                            onChange={(e) => this.onInputChange(e)} />
                                    </Form.Field>
                                    <Form.Field>
                                        <label>&nbsp;&nbsp;</label>
                                        <Input
                                            name="fEmisionHasta"
                                            value={this.state.values.fEmisionHasta}
                                            placeholder='Fecha emisión (hasta)'
                                            control='input'
                                            type='date'
                                            size='mini'
                                            onChange={(e) => this.onInputChange(e)} />  
                                    </Form.Field>
                                </Form.Group>
                            </Grid.Column>

                            <Grid.Column width={3} />
                            <Grid.Column width={6}>
                            </Grid.Column> 
                        </Grid.Row>

                        <Grid.Row style={{ paddingBottom: '0' }}>
                            {/* dentro del tab, el 'left gutter' no se construye en forma correcta (???)  */}
                            <Grid.Column width={1} />

                            <Grid.Column width={6}>
                                <Form.Group widths='equal'>
                                    <Form.Field> 
                                        <label>Vigencia - inicio</label>
                                        <Input 
                                            name="vigInicialDesde"
                                            value={this.state.values.vigInicialDesde}
                                            placeholder='Inicio (desde)'
                                            control='input'
                                            type='date'
                                            size='mini'
                                            onChange={(e) => this.onInputChange(e)} />
                                    </Form.Field>
                                    <Form.Field>
                                        <label>&nbsp;&nbsp;</label>
                                        <Input 
                                            name="vigInicialHasta"
                                            value={this.state.values.vigInicialHasta}
                                            placeholder='Inicio (hasta)'
                                            control='input'
                                            type='date'
                                            size='mini'
                                            onChange={(e) => this.onInputChange(e)} />
                                    </Form.Field>
                                </Form.Group>
                            </Grid.Column>

                            <Grid.Column width={3} />

                            <Grid.Column width={6}>
                                <Form.Group widths='equal'>
                                    <Form.Field>
                                        <label>Vigencia - final</label>
                                        <Input 
                                            name="vigFinalDesde"
                                            value={this.state.values.vigFinalDesde}
                                            placeholder='Final (desde)'
                                            control='input'
                                            type='date'
                                            size='mini'
                                            onChange={(e) => this.onInputChange(e)} /> 
                                    </Form.Field> 
                                    <Form.Field>
                                        <label>&nbsp;&nbsp;</label>
                                        <Input 
                                            name="vigFinalHasta"
                                            value={this.state.values.vigFinalHasta}
                                            placeholder='Final (hasta)'
                                            control='input'
                                            type='date'
                                            size='mini'
                                            onChange={(e) => this.onInputChange(e)} />
                                    </Form.Field>
                                </Form.Group>
                            </Grid.Column>
                        </Grid.Row>

                    </Grid>

                </Tab.Pane>)
            },
            {
                menuItem: 'Listas',
                // eslint-disable-next-line react/display-name
                render: () => (<Tab.Pane>

                    <Grid container>

                        <Grid.Row columns={5} style={{ paddingBottom: '0' }}>

                            <Grid.Column>
                                <AsyncSelect cacheOptions
                                    loadOptions={monedasSearch}
                                    value={null}
                                    placeholder={"Monedas"}
                                    onChange={option => this.monedasHandleChange(option)} />
                            </Grid.Column>

                            <Grid.Column>
                                <AsyncSelect cacheOptions
                                    loadOptions={companiasSearch}
                                    value={null}
                                    placeholder={"Compañías"}
                                    onChange={option => this.companiasHandleChange(option)} />
                            </Grid.Column>

                            <Grid.Column>
                                <AsyncSelect cacheOptions
                                    loadOptions={companiasSearch}
                                    value={null}
                                    placeholder={"Cedentes"}
                                    onChange={option => this.cedentesHandleChange(option)} />
                            </Grid.Column>

                            <Grid.Column>
                                <AsyncSelect cacheOptions
                                    loadOptions={ramosSearch}
                                    value={null}
                                    placeholder={"Ramos"}
                                    onChange={option => this.ramosHandleChange(option)} />
                            </Grid.Column>

                            <Grid.Column>
                                <AsyncSelect cacheOptions
                                    loadOptions={aseguradosSearch}
                                    value={null}
                                    placeholder={"Asegurados"}
                                    onChange={option => this.aseguradosHandleChange(option)} />
                            </Grid.Column>

                        </Grid.Row>

                        <Grid.Row columns={5}>

                            <Grid.Column>
                                <div style={tableStyle}>
                                    <Table compact size='small'>
                                        <Table.Body>
                                            {this.state.values.monedas.map(item => (
                                                <Table.Row key={item.value}>
                                                    <Table.Cell>{item.label}</Table.Cell>
                                                    <Table.Cell textAlign='right'>
                                                        <Icon name='remove'
                                                            onClick={() => this.monedasHandleDeleteFromList(item.value)} />
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table>
                                </div>
                            </Grid.Column>       

                            <Grid.Column>
                                <div style={tableStyle}>
                                    <Table compact size='small'>
                                        <Table.Body>
                                            {this.state.values.companias.map(item => (
                                                <Table.Row key={item.value}>
                                                    <Table.Cell>{item.label}</Table.Cell>
                                                    <Table.Cell textAlign='right'>
                                                        <Icon name='remove'
                                                            onClick={() => this.companiasHandleDeleteFromList(item.value)} />
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table>
                                </div>
                            </Grid.Column>       

                            <Grid.Column>
                                <div style={tableStyle}>
                                    <Table compact size='small'>
                                        <Table.Body>
                                            {this.state.values.cedentes.map(item => (
                                                <Table.Row key={item.value}>
                                                    <Table.Cell>{item.label}</Table.Cell>
                                                    <Table.Cell textAlign='right'>
                                                        <Icon name='remove'
                                                            onClick={() => this.cedentesHandleDeleteFromList(item.value)} />
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table>
                                </div>
                            </Grid.Column>          

                            <Grid.Column>
                                <div style={tableStyle}>
                                    <Table compact size='small'>
                                        <Table.Body>
                                            {this.state.values.ramos.map(item => (
                                                <Table.Row key={item.value}>
                                                    <Table.Cell>{item.label}</Table.Cell>
                                                    <Table.Cell textAlign='right'>
                                                        <Icon name='remove'
                                                            onClick={() => this.ramosHandleDeleteFromList(item.value)} />
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table>
                                </div>
                            </Grid.Column>

                            <Grid.Column>
                                <div style={tableStyle}>
                                    <Table compact size='small'>
                                        <Table.Body>
                                            {this.state.values.asegurados.map(item => (
                                                <Table.Row key={item.value}>
                                                    <Table.Cell>{item.label}</Table.Cell>
                                                    <Table.Cell textAlign='right'>
                                                        <Icon name='remove'
                                                            onClick={() => this.aseguradosHandleDeleteFromList(item.value)} />
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table>
                                </div>
                            </Grid.Column>
                        </Grid.Row>

                    </Grid>

                </Tab.Pane>)
            },
            {
                menuItem: 'Notas',
                // eslint-disable-next-line react/display-name
                render: () => <Tab.Pane>
                    <p>
                        Al menos por ahora, esta consulta solo muestra primas de negocio facultativo; no contratos. 
                    </p>
                    <p>
                        Aunque esta consulta se llama <em>Primas Emitidas Reaseguradores</em> también muestra las primas emitidas
                        de nuestra propia empresa (<em>nuestra orden</em>). Si, por ejemplo, usamos algún filtro y seleccionamos 
                        nuestra compañía en la lista, veremos sus primas emitidas. Si no seleccionamos nuestra empresa en la lista, 
                        veremos, para cada riesgo, las primas de nuestra empresa y, también, las de reaseguradores.
                    </p>
                    <p>
                        Normalmente, veremos que las primas de nuestra orden son montos positivos; las de reaseguradorse, montos 
                        negativos. La razón es que nuestras primas son a nuestro favor, pues serán cobradas. Las de reaseguradores 
                        son en contra, pues deben ser pagadas. Por supuesto que esta situación es al contrario para movimientos 
                        de devolución. 
                    </p>
                    <p>
                        El _filtro_ le permite delimitar por fecha de emisión de las primas (desde/hasta). Además, permite 
                        delimitar por fechas de: inicio y fin del riesgo. Por ejemplo: para leer solo los riesgos que se iniciaron en 
                        un período, se debe indicar este período en los campos: _Vigencia inicio_. Para leer solo los riesgos 
                        que terminan en un período determinado, debemos delimitarlo usando los campos: _Vigencia final_. 
                    </p>
                </Tab.Pane>
            },
        ]
    }

    componentDidMount() {
        // leemos la compañía seleccionada y la agregamos al state 
        const companiaSeleccionadaID = CompaniaSeleccionada.findOne({ userID: Meteor.userId() }, { fields: { companiaID: 1 }});
        let companiaSeleccionada = {};

        if (companiaSeleccionadaID) {
            companiaSeleccionada = EmpresasUsuarias.findOne(companiaSeleccionadaID.companiaID, { fields: { nombre: 1 } });
        } else {
            companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
        }

        // ------------------------------------------------------------------------------------------------------
        // si hay un filtro anterior, lo usamos
        // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
        let filtroAnterior = Filtros.findOne(
            {
                nombre: 'consultas.primasEmitidas.reaseguradores',
                userId: Meteor.userId(),
            });

        // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
        if (!filtroAnterior || !filtroAnterior.filtro) {
            filtroAnterior = { filtro: {} }; 
        }

        // si hay valores en guardados, sustituimos los iniciales 
        const values = { ...this.state.values, ...filtroAnterior.filtro }; 
        // ------------------------------------------------------------------------------------------------------

        this.setState({ companiaSeleccionada: companiaSeleccionada, values: { ...values } }); 
    }

    handleFormSubmit = (e) => { 
        const { values } = this.state;
        e.preventDefault(); 
    }

    onInputChange = (e) => {
        const { values } = this.state;
        const name = e.target.name;
        const value = e.target.value;
        this.setState({ values: { ...values, [name]: value } });
    } 

    onCheckBoxEstadoChange = (e, value) => {
        const state = this.state; 
        let { estados } = state.values; 

        // value: CO, AC, EM, RV, RE, AN, DE
        const checked = estados.some(x => x === value);         // consideramos checked si el valor existía 

        // simplemente, si existía lo eliminamos; si no, lo agregamos  
        if (!checked) { 
            estados.push(value); 
        } else { 
            estados = estados.filter(val => val !== value);
        }

        state.values.estados = estados; 
        this.setState(state);
    } 

    limpiarFiltro() { 
        const values = {
            vigInicialDesde: '',
            vigInicialHasta: '',
            vigFinalDesde: '',
            vigFinalHasta: '', 
            monedas: [],
            companias: [],
            asegurados: [],
            ramos: []
        }; 
        this.setState({ values: values }) 
    }

    handleMessageDismiss = () => { 
        this.setState({ message: { visible: false }})
    }

    aplicarFiltro(values) { 

        this.setState({ loader: true }); 

        try { 
            // las fechas que indique el usuario vienen como strings; convertimos a dates antes de ejecutar el meteor method 
            const values2 = {...values}; 
            const values3 = convertToDates(values2); 

            aplicarFiltro(values3).then((result) => {

                guardarFiltro(this.state.values);   // para guardar, en Filtros, el filtro que acaba de indicar el usuairo 
                this.setState({ loader: false }); 

                if (result.error) { 
                    const message = { type: 'error', visible: true, message: result.message };
                    this.setState(() => ({ loader: false, message: message }));

                    return; 
                }

                // simulamos un click a un link a la página que lee el resultado y lo muestra en la lista ... 
                this.linkElement.click()
            })
        } catch(error) { 
            const message = { type: 'error', visible: true, message: error.message };
            this.setState(() => ({ loader: false, message: message }));

            return; 
        }
    }

    // estos métodos que siguen son para manejar las listas que se usan para filtrar por catálogos: monedas, ramos, asegurados y
    // compañías. Agregamos los items que el usuario selecciona en el state. Además, permitimos al usuario eliminar items de 
    // cada lista (luego que se han seleccionado items)

    // -------------- Monedas ----------------------------------------------------
    monedasHandleChange = option => {
        const monedas = this.state.values.monedas;
        const existe = monedas.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        monedas.push(option);
        const monedas2 = lodash.sortBy(monedas, ['label']);
        this.setState((prevState) => ({ values: { ...prevState.values, monedas: monedas2 } }));
    }

    monedasHandleDeleteFromList = (item) => {
        const monedas = this.state.values.monedas.filter(x => {
            return (x.value != item);
        });
        this.setState((prevState) => ({ values: { ...prevState.values, monedas: monedas } }));
    }

    // -------------- Asegurados ----------------------------------------------------
    aseguradosHandleChange = option => {
        const asegurados = this.state.values.asegurados;
        const existe = asegurados.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        asegurados.push(option);
        const asegurados2 = lodash.sortBy(asegurados, ['label']);
        this.setState((prevState) => ({ values: { ...prevState.values, asegurados: asegurados2 } }));
    }

    aseguradosHandleDeleteFromList = (item) => {
        const asegurados = this.state.values.asegurados.filter(x => {
            return (x.value != item);
        });
        this.setState((prevState) => ({ values: { ...prevState.values, asegurados: asegurados } }));
    }

    // -------------- Companias ----------------------------------------------------
    companiasHandleChange = option => {
        const companias = this.state.values.companias;
        const existe = companias.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        companias.push(option);
        const companias2 = lodash.sortBy(companias, ['label']);
        this.setState((prevState) => ({ values: { ...prevState.values, companias: companias2 } }));
    }

    companiasHandleDeleteFromList = (item) => {
        const companias = this.state.values.companias.filter(x => {
            return (x.value != item);
        });
        this.setState((prevState) => ({ values: { ...prevState.values, companias: companias } }));
    }

    // -------------- Cedentes ----------------------------------------------------
    cedentesHandleChange = option => {
        const cedentes = this.state.values.cedentes;
        const existe = cedentes.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        cedentes.push(option);
        const cedentes2 = lodash.sortBy(cedentes, ['label']);
        this.setState((prevState) => ({ values: { ...prevState.values, cedentes: cedentes2 } }));
    }

    cedentesHandleDeleteFromList = (item) => {
        const cedentes = this.state.values.cedentes.filter(x => {
            return (x.value != item);
        });
        this.setState((prevState) => ({ values: { ...prevState.values, cedentes: cedentes } }));
    }

    // -------------- Ramos ----------------------------------------------------
    ramosHandleChange = option => {
        const ramos = this.state.values.ramos;
        const existe = ramos.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        ramos.push(option);
        const ramos2 = lodash.sortBy(ramos, ['label']);
        this.setState((prevState) => ({ values: { ...prevState.values, ramos: ramos2 } }));
    }

    ramosHandleDeleteFromList = (item) => {
        const ramos = this.state.values.ramos.filter(x => {
            return (x.value != item);
        });
        this.setState((prevState) => ({ values: { ...prevState.values, ramos: ramos } }));
    }

    render() { 
        const message = this.state.message && this.state.message.message ? this.state.message.message : ""; 
        return (
            <div className="ui-viewBorder-left-aligned"> 
                <Grid container>

                    <Grid.Row style={{ paddingBottom: '0' }}>
                        <Grid.Column width="8">
                            <div style={{ textAlign: 'left' }}>
                                {/* el siguiente link es hidden; para ir a la otra página (list) */}
                                <a href={`consultas/primasEmitidas/reaseguradores-lista?`}
                                   ref={a => this.linkElement = a} 
                                   hidden>
                                       go to list page ...
                                </a>
                            </div>
                        </Grid.Column>
                        <Grid.Column width="8">
                            <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
                                <span style={{ color: 'dodgerblue' }}>{this.state.companiaSeleccionada.nombre}</span>
                            </div>
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Row style={{ paddingTop: '0' }}>
                        <Grid.Column>
                            <PageMenu />
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
                                            <Tab panes={this._tabPanes} />
                                        </Grid.Column>
                                    </Grid.Row>

                                    <Grid.Row>
                                        <Grid.Column width={1} />
                                        <Grid.Column width={7}>
                                            <Form.Button size='tiny' 
                                                         onClick={() => this.limpiarFiltro()}>
                                                Limpiar filtro
                                            </Form.Button>
                                        </Grid.Column>
                                        <Grid.Column width={7} textAlign='right'>
                                            <Form.Button type="submit" 
                                                         primary 
                                                         onClick={() => this.aplicarFiltro(this.state.values)}
                                                         size='tiny'>
                                                             Aplicar filtro
                                            </Form.Button>
                                        </Grid.Column>
                                        <Grid.Column width={1} />
                                    </Grid.Row> 
                                </Grid>

                            </Form>
                        </Grid.Column>
                    </Grid.Row>

                </Grid>
            </div>
        )
    }

    componentWillUnmount() {
        // detememos el publication 
        if (subscriptionMonedas && subscriptionMonedas.stop) { subscriptionMonedas.stop(); }
        if (subscriptionCompanias && subscriptionCompanias.stop) { subscriptionCompanias.stop(); }
        if (subscriptionRamos && subscriptionRamos.stop) { subscriptionRamos.stop(); }
        if (subscriptionAsegurados && subscriptionAsegurados.stop) { subscriptionAsegurados.stop(); }
    }
}

function aplicarFiltro(values) { 
    return new Promise((resolve, reject) => { 
        Meteor.call('consultas.primasEmitidas.reaseguradores', values, (err, result) => {

            if (err) {
                reject(err);
            }

            resolve(result); 
        })
    })
}

function guardarFiltro(values) { 
    // guardamos el filtro indicado por el usuario
    const filtro = Filtros.findOne({ nombre: 'consultas.primasEmitidas.reaseguradores', userId: Meteor.userId() }, { fields: { _id: 1 }}); 
    if (filtro) {
        // el filtro existía antes; lo actualizamos
        // validate false: como el filtro puede ser vacío (ie: {}), simple-schema no permitiría eso; por eso saltamos la validación
        Filtros.update(filtro._id, { $set: { filtro: values } }, { validate: false });
    }
    else {
        Filtros.insert({
            _id: new Mongo.ObjectID()._str,
            userId: Meteor.userId(),
            nombre: 'consultas.primasEmitidas.reaseguradores',
            filtro: values
        })
    }
}

function convertToDates(v) { 

    if (v.vigInicialDesde) v.vigInicialDesde = new Date(v.vigInicialDesde); 
    if (v.vigInicialHasta) v.vigInicialHasta = new Date(v.vigInicialHasta); 
    if (v.vigFinalDesde) v.vigFinalDesde = new Date(v.vigFinalDesde); 
    if (v.vigFinalHasta) v.vigFinalHasta = new Date(v.vigFinalHasta); 

    if (v.fEmisionDesde) v.fEmisionDesde = new Date(v.fEmisionDesde); 
    if (v.fEmisionHasta) v.fEmisionHasta = new Date(v.fEmisionHasta); 

    return v; 
}

function outputHtmlMarkup(text) {
    return { __html: text };
}