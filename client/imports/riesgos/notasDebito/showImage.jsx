

import React from 'react';
import PropTypes from 'prop-types';

export default class RenderImage extends React.Component {

  render() {

    const imageUrl = this.props.imageUrl;
    const imageDescripcion = this.props.imageDescripcion;
    const simpleStringValue = this.props.simpleStringValue;

    return (
      <div>
        <img src={imageUrl} alt={simpleStringValue} />
        <p>{imageDescripcion} - {simpleStringValue}</p>
      </div>
    );
  }
}

// nota: con propTypes no tenemos que definir los props desde el componente angular
// ejemplo: .component('renderImage', react2angular(RenderImage, [ 'prop1', 'prop2', ..., ]));
RenderImage.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  imageDescripcion: PropTypes.string.isRequired,
  simpleStringValue: PropTypes.string.isRequired,
};
