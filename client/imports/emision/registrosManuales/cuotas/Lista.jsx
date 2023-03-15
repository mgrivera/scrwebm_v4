
import React from 'react';
import PropTypes from 'prop-types';

import { Navbar } from 'react-bootstrap';

import FixedDataTable2 from './Table';
import '../styles.css';

const Lista = ({ data }) => {

    const pagingText = `(<b>${data.length.toString()}</b> cuotas han sido construidas y registradas para el <em>registro manual</em>)`;

    return (
        <>
            <Navbar collapseOnSelect fluid className="toolBar">

                <Navbar.Text pullRight>
                    <div style={{ textAlign: 'left' }} dangerouslySetInnerHTML={outputHtmlMarkup(pagingText)} />
                </Navbar.Text>

            </Navbar>

            <div style={{ textAlign: 'center' }}>
                <FixedDataTable2 data={data} />
            </div>
        </>
    )
}

Lista.propTypes = {
    data: PropTypes.array.isRequired
};

export default Lista; 

function outputHtmlMarkup(text) {
    return { __html: text };
}