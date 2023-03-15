
import React from 'react';
import PropTypes from 'prop-types';

import { Navbar, Nav, NavItem } from 'react-bootstrap';

import FixedDataTable2 from './Table';
import '../styles.css';

const Lista = ({ data, setCurrentTab, setClickedRow }) => {

    const nuevo = () => { 
        const item = {
            _id: "",
            compania: "",
            ordenPorc: "",
            monto: "",
        }; 

        setClickedRow(item); 
        setCurrentTab(2);
    }

    const pagingText = `(${data.length.toString()} compañías componen la distribución del monto)`;

    return (
        <>
            <Navbar collapseOnSelect fluid className="toolBar">

                <Nav>
                    <NavItem eventKey={1} href="#" onClick={nuevo}>
                        Nuevo
                    </NavItem>
                </Nav>

                <Navbar.Text pullRight>
                    {pagingText}&nbsp;&nbsp;
                </Navbar.Text>

            </Navbar>

            <div style={{ textAlign: 'center' }}>
                <FixedDataTable2 data={data}
                                 setCurrentTab={setCurrentTab}
                                 setClickedRow={setClickedRow} />
            </div>
        </>
    )
}

Lista.propTypes = {
    data: PropTypes.array.isRequired,
    setCurrentTab: PropTypes.func.isRequired, 
    setClickedRow: PropTypes.func.isRequired
};

export default Lista; 