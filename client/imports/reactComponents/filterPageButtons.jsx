

import React from "react";

import { Grid, Button } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

export default class FilterPageButtons extends React.Component {

    // regresamos un grid.row con los tres botones del filter page: Limpiar filtro / Nuevo / Aplicar filtro 

    constructor(props) {
        super(props);

        this.handleLimpiarFiltro = this.handleLimpiarFiltro.bind(this);
        this.handleNuevo = this.handleNuevo.bind(this);
        this.handleNuevo = this.handleNuevo.bind(this);
    }

    handleLimpiarFiltro = (e) => {
        this.props.limpiarFiltro(e);
    }

    handleNuevo = (e) => {
        this.props.nuevo(e);
    }

    handleAplicarFiltro = (e) => {
        this.props.aplicarFiltro(e);
    }

    render() {

        const style = { whiteSpace: "nowrap", }; 

        return (
            <Grid.Row columns={3}>
                <Grid.Column floated='left' width={1}>
                    <Button basic content='Limpiar filtro' style={style} onClick={this.handleLimpiarFiltro} /> 
                </Grid.Column>
                <Grid.Column floated='left' width={1}>
                    <Button basic content='Nuevo' style={style} onClick={this.handleNuevo} /> 
                </Grid.Column>
                <Grid.Column floated='right' width={1}>
                    <Button primary content='Aplicar filtro' style={style} onClick={this.handleAplicarFiltro} /> 
                </Grid.Column>
            </Grid.Row>
        );
    }
  }