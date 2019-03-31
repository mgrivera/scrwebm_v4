

import React, { Component } from 'react'; 
import { Message } from 'semantic-ui-react'; 
import 'semantic-ui-css/semantic.min.css';

export default class SemanticUiMessage extends Component {

    constructor(props) { 
        super(props); 
        this.state = { visible: props.visible }

        this.handleDismiss = this.handleDismiss.bind(this); 
    }
    
    handleDismiss = () => {
      this.setState({ visible: false })
    }
  
    render() {
      if (this.state.visible) {
        return (
          <Message 
            onDismiss={this.handleDismiss}>
            <Message.Header>
              <p dangerouslySetInnerHTML={{ __html: this.props.header }} />
            </Message.Header>
              <p dangerouslySetInnerHTML={{ __html: this.props.content }} />
          </Message>
        )
      } else { 
        return <span />
      }
    }
  }