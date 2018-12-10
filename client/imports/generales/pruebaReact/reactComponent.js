

import { Component } from 'react'
import ReactDOM from 'react-dom';

export default class MyReactComponent extends Component {
  render() {
    return <div>
      <p>FooBar: {this.props.fooBar}</p>
      <p>Baz: {this.props.baz}</p>
    </div>
  }
}