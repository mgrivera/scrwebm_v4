
import React from 'react'; 
import PropTypes from 'prop-types';

import Alert from 'react-bootstrap/lib/Alert';

const Alerts = ({ style, title, message, onDismiss }) => { 

    return (
        <Alert bsStyle={style} onDismiss={onDismiss}>
            <h4><div dangerouslySetInnerHTML={outputHtmlMarkup(title)} /></h4>
            <div dangerouslySetInnerHTML={outputHtmlMarkup(message)} />
        </Alert>
    )
}

Alerts.propTypes = {
    style: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired
};

function outputHtmlMarkup(text) {
    return { __html: text };
}

export default Alerts; 