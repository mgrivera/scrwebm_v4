

import React from 'react'
import { Loader, Segment } from 'semantic-ui-react'

const SemanticUiLoader = (props) => {

    if (props.active) { 
        return (
            <div>
                <Segment>
                    <Loader active size='tiny' />
                </Segment>
            </div>
        )
    } else { 
        return <span /> 
    }
}

export default SemanticUiLoader