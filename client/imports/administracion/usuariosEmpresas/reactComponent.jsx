
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

import React from "react";
import PropTypes from 'prop-types';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import "./styles.css"; 

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import { Alert } from 'react-bootstrap'; 

import NavBar from './toolBar'; 

// import Button from 'react-bootstrap/lib/Button';
// import Modal from 'react-bootstrap/lib/Modal';
// import Table from 'react-bootstrap/lib/Table';      
// import Panel from 'react-bootstrap/lib/Panel'; 

const DelTableRow = ({handleDeleteTableRow, itemID}) => { 
    return (
        <span onClick={e => { e.preventDefault(); handleDeleteTableRow(itemID); }} style={{ color: 'red', fontWeight: 'bold'}}>x</span>
    )
}

DelTableRow.propTypes = {
    handleDeleteTableRow: PropTypes.func.isRequired,
    itemID: PropTypes.string.isRequired,
}

export default class UsuariosEmpresas extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            showAlert: false,
            alertType: "info",
            alertText: "",

            loading: true,

            empresas: [],
            usuariosEmpresas: [], 
            usuarios: [],

            usuarioSeleccionado: null, 
        };

        this.handleAlertDismiss = this.handleAlertDismiss.bind(this); 
        this.grabar = this.grabar.bind(this);           
        this.handleDeleteTableRow = this.handleDeleteTableRow.bind(this);
    }
    
    handleAlertDismiss() {

        this.setState({ 
            alertType: "", 
            alertText: "",            
            showAlert: false, 
        });
    }

    async grabar() { 

        this.setState({ 
            loading: true,  
        });
        
        // los items por grabar están marcados: docState: 1 
        const items = this.state.usuariosEmpresas; 
        const itemsEditados = items.filter(x => x.docState); 

        if (!itemsEditados.length) { 

            this.setState({ 
                alertType: "danger",
                alertText: `Aparentemente, no se han efectuado cambios en los datos. No hay nada que grabar!`,
                showAlert: true,

                loading: false, 
            });
            
            return; 
        }

        let result1; 
        let result2; 

        try { 
            result1 = await grabarInfoUsuariosEmpresas(itemsEditados); 

            if (result1.error) { 
                this.setState({ 
                    alertType: "danger",
                    alertText: `Ha ocurrido un error al intentar ejecutar esta operación: <br />${result1.message}`,
                    showAlert: true,
                    loading: false, 
                });

                return; 
            }

            result2 = await leerInfoUsuariosEmpresas(); 

            if (result2.error) { 
                this.setState({ 
                    alertType: "danger",
                    alertText: `Ha ocurrido un error al intentar ejecutar esta operación: <br />${result2.message}`,
                    showAlert: true,
                    loading: false, 
                });

                return; 
            }

            this.setState({ 
                alertType: "info",
                alertText: `${result1.message}`,
                showAlert: true,

                usuarios: result2.users, 
                empresas: result2.empresasUsuarias, 
                usuariosEmpresas: result2.empresasUsuariasUsuarios, 

                usuarioSeleccionado: null, 

                loading: false, 
            });

        } catch(error) { 
            this.setState({ 
                alertType: "danger",
                alertText: `Ha ocurrido un error al intentar ejecutar esta operación: <br />${error.message}`,
                showAlert: true,
                loading: false, 
            });
        }
    }

    handleDeleteTableRow(itemID) { 
        // en itemID viene el id del item en la lista: UsuariosEmpresas. Lo marcamos como eliminado!
        const usuariosEmpresas = this.state.usuariosEmpresas; 
        const idx = usuariosEmpresas.findIndex(x => x._id === itemID); 

        if (idx >= 0) { 
            usuariosEmpresas[idx].docState = 3; 
            this.setState({ usuariosEmpresas: usuariosEmpresas }); 
        }
    }


    componentDidMount() {
        // leemos los usuarios y las empresas, para mostrarlos en tablas y que el usuario pueda asignar 
        // empresas a usuarios 
        leerInfoUsuariosEmpresas()
            .then((result) => {

                if (result.error) { 
                    this.setState({ 
                        alertType: "danger",
                        alertText: `Ha ocurrido un error al intentar leer usuarios y empresas: <br />${result.message}`,
                        showAlert: true,
                        loading: false 
                    });
                }

                this.setState({ 
                    usuarios: result.users, 
                    empresas: result.empresasUsuarias, 
                    usuariosEmpresas: result.empresasUsuariasUsuarios, 
                    loading: false 
                });
            })
            .catch((error) => {

                this.setState({ 
                    alertType: "danger",
                    alertText: `Ha ocurrido un error al intentar leer usuarios y empresas: <br />${error.message}`,
                    showAlert: true,
                    loading: false 
                });
            })
    }

    render() {

        const columns_usuarios = [
            { 
                Header: () => (<div>Nombre / E-mail</div>),  
                getHeaderProps: () => {       // getHeaderProps: (state, rowInfo, column) =>    no usamos los parÃ¡metros aquÃ­ ... 
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'left', 
                      }
                    }
                }, 
                id: "userName",
                accessor: d => d.userName,
                className: "fontXSmall alignLeft"
            }, 
        ]; 

        const columns_empresas = [
            { 
                Header: () => (<div>Nombre</div>),  
                getHeaderProps: () => {       // getHeaderProps: (state, rowInfo, column) =>    no usamos los parÃ¡metros aquÃ­ ... 
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'left', 
                      }
                    }
                }, 
                id: "nombreCorto",
                accessor: d => d.nombreCorto,
                className: "fontXSmall alignLeft"
            }, 
        ]; 

        const columns_usuariosEmpresas = [
            { 
                Header: () => (<div></div>),  
                getHeaderProps: () => {       // getHeaderProps: (state, rowInfo, column) =>    no usamos los parÃ¡metros aquÃ­ ... 
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'left', 
                      }
                    }
                }, 
                id: "docState",
                accessor: d => d.docState === 1 ? '*' : (d.docState === 3 ? 'x' : null), 
                className: "fontSmall alignCenter", 
                width: 35, 
            }, 
            { 
                Header: () => (<div>Empresa</div>),  
                getHeaderProps: () => {       // getHeaderProps: (state, rowInfo, column) =>    no usamos los parÃ¡metros aquÃ­ ... 
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'left', 
                      }
                    }
                }, 
                id: "empresaUsuariaID",
                accessor: d => { 
                    const empresas = this.state.empresas; 
                    const empresa = empresas.find(x => x._id === d.empresaUsuariaID); 

                    return empresa && empresa.nombreCorto ? empresa.nombreCorto : 'Indefinida (??)'; 
                }, 
                className: "fontXSmall alignLeft"
            }, 
            { 
                Header: () => (<div></div>),  
                getHeaderProps: () => {       // getHeaderProps: (state, rowInfo, column) =>    no usamos los parÃ¡metros aquÃ­ ... 
                    return {
                      style: {
                        background: '#ECECEC', 
                        color: '#6B6B6B', 
                        textAlign: 'left', 
                      }
                    }
                }, 
                id: "delRow",
                Cell: props => <DelTableRow handleDeleteTableRow={this.handleDeleteTableRow} itemID={props.original._id} />, 
                className: "fontSmall alignCenter", 
                width: 35, 
            }, 
        ]; 

        // para pasar al toolbar; debe mostrar 'Grabar (*)' si el usuario ha editado algún registro 
        const usuarioHaEditado = this.state.usuariosEmpresas.some(x => x.docState); 

        return (<Grid fluid={true}>
            <Row>
                <Col sm={2} smOffset={5} style={{ textAlign: 'center' }}>
                    {
                        this.state.loading &&
                        <i style={{ color: 'lightgray' }} className="fa fa-circle-o-notch fa-spin fa-2x"></i>
                    }
                </Col>
            </Row>
            <Row>
                <Col sm={12} style={{ textAlign: "left", }}>
                    {
                        this.state.showAlert &&
                        (
                            <Alert bsStyle={this.state.alertType} onDismiss={this.handleAlertDismiss}>
                                <div dangerouslySetInnerHTML={{ __html: this.state.alertText }} />
                            </Alert>
                        )
                    }
                </Col>
            </Row>

            <Row style={{ marginTop: "5px" }}>
                <Col sm={12} smOffset={0}>
                    <NavBar grabar={this.grabar} usuarioHaEditado={usuarioHaEditado} />
                </Col>
            </Row>


            <Row style={{ marginTop: "15px" }}>

                <Col sm={4} smOffset={0}>
                    <h4>Usuarios</h4>
                    <ReactTable data={this.state.usuarios}
                        columns={columns_usuarios}
                        showPagination={false}
                        style={{
                            // This will force the table body to overflow and scroll, since there is not enough room
                            height: "300px"
                        }}
                        className="-striped -highlight"

                        getTrProps={(state, rowInfo) => {
                            return {
                                onClick: (e, handleOriginal) => {
                                    const item = this.state.usuarios[rowInfo.index];

                                    // establecemos el usuario seleccionado 
                                    this.setState({ usuarioSeleccionado: item._id, }); 

                                    // IMPORTANT! React-Table uses onClick internally to trigger
                                    // events like expanding SubComponents and pivots.
                                    // By default a custom 'onClick' handler will override this functionality.
                                    // If you want to fire the original onClick handler, call the
                                    // 'handleOriginal' function.
                                    if (handleOriginal) {
                                        handleOriginal();
                                    }
                                }
                            };
                        }}
                    />
                </Col>

                <Col sm={4} smOffset={0}>
                    <h4>Usuarios/empresas</h4>
                    {/* nótese que mostramos solo las empresas que *corresponden* al usuario seleccionado en la lista */}
                    <ReactTable data={this.state.usuariosEmpresas.filter(x => x.usuarioID === this.state.usuarioSeleccionado)}
                        columns={columns_usuariosEmpresas}
                        showPagination={false}
                        style={{
                            // This will force the table body to overflow and scroll, since there is not enough room
                            height: "300px"
                        }}
                        className="-striped -highlight"
                    />
                </Col>

                <Col sm={4} smOffset={0}>
                    <h4>Empresas</h4>
                    <ReactTable data={this.state.empresas}
                        columns={columns_empresas}
                        showPagination={false}
                        style={{
                            // This will force the table body to overflow and scroll, since there is not enough room
                            height: "300px"
                        }}
                        className="-striped -highlight"

                        getTrProps={(state, rowInfo) => {
                            return {
                                onClick: (e, handleOriginal) => {
                                    const item = this.state.empresas[rowInfo.index];

                                    // cuando el usuario selecciona una empresa, la agregamos a las empresas para el 
                                    // usuario seleccionado 
                                    const usuarioSeleccionado = this.state.usuarioSeleccionado; 

                                    if (usuarioSeleccionado) { 

                                        const usuarioEmpresa = { 
                                            _id: new Mongo.ObjectID()._str,
                                            usuarioID: usuarioSeleccionado, 
                                            empresaUsuariaID: item._id, 
                                            // para saber que este item debe es nuevo y debe ser agregado usando el meteor method
                                            docState: 1,        
                                        }

                                        // TODO: agregar el item a usuariosEmpresas en el state ... 
                                        const usuariosEmpresas = this.state.usuariosEmpresas; 

                                        const empresa = usuariosEmpresas.find(x => x.usuarioID === usuarioSeleccionado && x.empresaUsuariaID === item._id); 

                                        if (!empresa) { 
                                            // Ok, el usuario no tiene la empresa; la agregamos 
                                            usuariosEmpresas.push(usuarioEmpresa); 
                                            this.setState({ usuariosEmpresas: usuariosEmpresas }); 
                                        }
                                    }

                                    // IMPORTANT! React-Table uses onClick internally to trigger
                                    // events like expanding SubComponents and pivots.
                                    // By default a custom 'onClick' handler will override this functionality.
                                    // If you want to fire the original onClick handler, call the
                                    // 'handleOriginal' function.
                                    if (handleOriginal) {
                                        handleOriginal();
                                    }
                                }
                            };
                        }}
                    />
                </Col>
            </Row>
        </Grid>)
    }
}

// meteor method para usuario y empresas
const leerInfoUsuariosEmpresas = () => { 
    return new Promise((resolve, reject) => { 

        Meteor.call('leerInfoUsuariosEmpresas', (err, result) => {

            if (err) {
                reject(err); 
                return; 
            }
    
            if (result.error) { 
                reject(result); 
                return; 
            }
    
            resolve(result)
        })
    })
}


// meteor method para grabar usuario y empresas
const grabarInfoUsuariosEmpresas = (items) => { 
    return new Promise((resolve, reject) => { 

        Meteor.call('grabarInfoUsuariosEmpresas', items, (err, result) => {

            if (err) {
                reject(err); 
                return; 
            }
    
            if (result.error) { 
                reject(result); 
                return; 
            }
    
            resolve(result)
        })
    })
}