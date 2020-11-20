
import React from 'react'
import PropTypes from 'prop-types';

import { Navbar } from 'react-bootstrap';

import FixedDataTable2 from './Table';

import './styles.css';

const TableToolBar = ({ data }) => {

    const pagingText = `(${data.items.length} registros)`;

    return (
        <>
            <Navbar collapseOnSelect fluid className="toolBar">
                <Navbar.Text pullRight>
                    {pagingText}&nbsp;&nbsp;
                </Navbar.Text>
            </Navbar>
        </>
    )
}

TableToolBar.propTypes = {
    data: PropTypes.object.isRequired
};

const Lista = ({ data, setCurrentTab, setClickedRow }) => {

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ display: "inline-block" }}>
                    <div style={{ width: '850px' }}>
                        {/* el fixed-data-table tiene un width fijo; intentamos que el toolbar sea igual ... */}
                        <TableToolBar data={data} />
                    </div>

                    <FixedDataTable2 data={data.items} setCurrentTab={setCurrentTab} setClickedRow={setClickedRow} />
                </div>
            </div>
        </div>
    )
}

Lista.propTypes = {
    data: PropTypes.object.isRequired,
    setCurrentTab: PropTypes.func.isRequired,
    setClickedRow: PropTypes.func.isRequired
};

export default Lista; 