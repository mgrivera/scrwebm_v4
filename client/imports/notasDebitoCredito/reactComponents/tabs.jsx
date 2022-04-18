
import React, { useState } from 'react'
import { Tab } from 'semantic-ui-react'

import Filtro from './filtro';
import Lista from './lista';
import Detalles from './detalles';

const Tabs = () => {
    
    const [activeIndex, setActiveIndex ] = useState(0); 

    const panes = [
        {
            menuItem: 'Filtro',
            render: function tab1() {
                return (<Tab.Pane ><Filtro changeTabIndex={changeTabIndex} /></Tab.Pane>)
            },
        },
        {
            menuItem: 'Lista',
            render: function tab2() {
                return (<Tab.Pane ><Lista /></Tab.Pane>)
            },
        },
        {
            menuItem: 'Detalles',
            render: function tab3() {
                return (<Tab.Pane ><Detalles /></Tab.Pane>)
            },
        },
    ]

    const changeTabIndex = (idx) => { 
        setActiveIndex(idx);
    }

    const handleTabChange = (e, { activeIndex }) => {
        setActiveIndex(activeIndex);
    }

    return (
        <Tab panes={panes} activeIndex={activeIndex} onTabChange={handleTabChange} />
    )
}

export default Tabs; 