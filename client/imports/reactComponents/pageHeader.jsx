

import React from "react";

import { Grid } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

import { EmpresasUsuarias } from '/imports/collections/catalogos/empresasUsuarias'; 
import { CompaniaSeleccionada } from '/imports/collections/catalogos/companiaSeleccionada'; 

export default class PageHeader extends React.Component {

    // regresamos un grid.row con el título de la función, ej: Notas de crédito / Riesgos / etc., y la compañía seleccionada 
    // Esta es, normalmente, la 1ra. linea de la página, cuando el usuario selecciona una opción en el menú: Riesgos / Contratos / ...

    render() {

    const companiaSeleccionadaStyle = { color: 'dodgerblue', fontStyle: 'italic', }; 

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    const companiaSeleccionadaID = CompaniaSeleccionada.findOne({ userID: Meteor.userId() }, { fields: { companiaID: 1, }});
    let companiaSeleccionada = null; 

    if (companiaSeleccionadaID) { 
      companiaSeleccionada = EmpresasUsuarias.findOne(companiaSeleccionadaID.companiaID, { fields: { nombreCorto: 1 } });
    }
    // ------------------------------------------------------------------------------------------------

    const companiaSeleccionadaNombre = companiaSeleccionada && companiaSeleccionada.nombreCorto ? companiaSeleccionada.nombreCorto : 'Indefinida';
      
      return (
        <Grid.Row columns={2}>
            <Grid.Column textAlign='left'>
                <h3>{ this.props.pageTitle }</h3>
            </Grid.Column>
            <Grid.Column textAlign='right'>
                <span style={companiaSeleccionadaStyle}>{companiaSeleccionadaNombre}</span>
            </Grid.Column>
        </Grid.Row>
      );
    }
  }