

import React from "react";

import { Grid } from 'semantic-ui-react'; 
import 'semantic-ui-css/semantic.min.css';

// este 'main' react component representa la página html en react; sobre éste component se montarán todos lo demás, 
// necesarios para formar la funcionalidad de la página 

import Tabs from './tabs'; 
import PageHeader from '../../reactComponents/pageHeader'; 

export default class NotasDebitoCreditoMainReactComponent extends React.Component {

  render() {

    return (
    //   <Grid>
    //     <PageHeader pageTitle="Notas de débito/crédito" /> 

    //       <Grid.Column>
            <Tabs />
    //       </Grid.Column> 

    //   </Grid>
    );
  }
}