
import React from 'react';
import PropTypes from 'prop-types';

import { Navbar, Nav, NavItem } from 'react-bootstrap';

import FixedDataTable2 from './Table';
import './styles.css';

const Lista = ({ setCurrentTab, pageData, leerItems, refreshItems, handleClickedRow, setCuotas, setCurrentItem }) => {

    const refresh = () => {
        // leemos, *nuevamente*, lo que habíamos leído hasta el momento 
        refreshItems(); 
    }

    const masRegistros = () => {
        if (pageData.page < pageData.cantPages) {
            const page = pageData.page + 1;
            const leerResto = false;
            leerItems(page, leerResto); 
        }
    }

    const leerResto = () => {
        if (pageData.page < pageData.cantPages) {
            const page = pageData.page + 1;
            const leerResto = true;
            leerItems(page, leerResto); 
        }
    }

    const nuevo = () => {
        setCuotas([]);        
        setCurrentItem({});              // item seleccionado en la lista; nuevo: vacío 
        setCurrentTab(3);
    }

    const regresar = () => {
        // regresamos al filtro - Tab #1 
        setCurrentTab(1);
    }

    const pagingText = `(${pageData.items.length} de ${pageData.recordCount} - pag ${pageData.page} de ${pageData.cantPages})`;

    return (

        <>
            <Navbar collapseOnSelect fluid className="toolBar">

                <Nav>
                    <NavItem eventKey={1} href="#" onClick={nuevo}>
                        Nuevo
                    </NavItem>
                </Nav>

                <Nav pullRight>
                    <NavItem eventKey={2} href="#" onClick={masRegistros}>Más</NavItem>
                    <NavItem eventKey={3} href="#" onClick={leerResto}>Todo</NavItem>
                    <NavItem eventKey={4} href="#" onClick={refresh}>Refresh</NavItem>
                    <NavItem eventKey={5} href="#" onClick={regresar}><b><em>Regresar</em></b></NavItem>
                </Nav>

                <Navbar.Text pullRight>
                    {pagingText}&nbsp;&nbsp;
                </Navbar.Text>

            </Navbar>

            <FixedDataTable2 data={pageData.items} 
                             setCurrentTab={setCurrentTab} 
                             handleClickedRow={handleClickedRow} />
        </>
    )
}

Lista.propTypes = {
    setCurrentTab: PropTypes.func.isRequired, 
    setLoaders: PropTypes.func.isRequired, 
    pageData: PropTypes.object.isRequired, 
    setPageData: PropTypes.func.isRequired, 
    leerItems: PropTypes.func.isRequired, 
    refreshItems: PropTypes.func.isRequired, 
    handleClickedRow: PropTypes.func.isRequired, 
    setCuotas: PropTypes.func.isRequired, 
    setCurrentItem: PropTypes.func.isRequired
};

export default Lista; 