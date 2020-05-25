
import React from 'react'
import PropTypes from 'prop-types';

import Alert from 'react-bootstrap/lib/Alert';

function Message({ type, message, handleMessageDismiss }) { 

    return (
        <Alert bsStyle={type} onDismiss={() => handleMessageDismiss()}>
            <p>{message}</p>
        </Alert>
    )
}

Message.propTypes = {
    type: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    handleMessageDismiss: PropTypes.func.isRequired
};

export default Message; 