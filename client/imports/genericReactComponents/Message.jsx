
import React from 'react'
import PropTypes from 'prop-types';

import { Alert } from 'react-bootstrap';

function Message({ message, setMessage }) {

    return (
        <Alert bsStyle={message.type} onDismiss={() => setMessage(state => ({ ...state, show: false }))}>
            <div style={{ textAlign: 'left' }} dangerouslySetInnerHTML={outputHtmlMarkup(message.message)} />
        </Alert>
    )
}

Message.propTypes = {
    message: PropTypes.object.isRequired,
    setMessage: PropTypes.func.isRequired
};

export default Message;

function outputHtmlMarkup(text) {
    return { __html: text };
}