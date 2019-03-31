

import React from 'react'; 

import { Tab } from 'semantic-ui-react'; 
import 'semantic-ui-css/semantic.min.css';

import Filtro from './filtro'; 
import Lista from './lista'; 
import Detalles from './detalles'; 

export default class Tabs extends React.Component {
  state = { activeIndex: 0 }    // siempre mostramos primero el primer tab (filtro) 

  handleTabChange = (e, { activeIndex }) => this.setState({ activeIndex })
  changeTabIndex = idx => this.setState({ activeIndex: idx })

  panes = [
    { menuItem: 'Filtro', render: () => <Tab.Pane attached={false}><Filtro changeTabIndex={this.changeTabIndex} /></Tab.Pane> },
    { menuItem: 'Lista', render: () => <Tab.Pane attached={false}><Lista /></Tab.Pane> },
    { menuItem: 'Detalles', render: () => <Tab.Pane attached={false}><Detalles /></Tab.Pane> },
  ]

  render() {
    const { activeIndex } = this.state

    return (
      <div>
        <Tab menu={{ pointing: true }} panes={this.panes} activeIndex={activeIndex} onTabChange={this.handleTabChange} />
      </div>
    )
  }
}