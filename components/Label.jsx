import React from 'react';

export default class Label extends React.Component {

  render() {
    const { hoveringStart, hoveringEnd, selectTarget, target, pivot, colors, selected, hovering } = this.props;

    let labelClass = 'no-select label label-default';
    let color;

    if (target === pivot) {
      labelClass += ' label-pivot';
      color = colors.get(target);
    } else if (selected.has(target)) {
      color = colors.get(target);
    } else if (target === hovering) {
      color = colors.get(target);
    }

    const style = {
      display: 'inline-block',
      backgroundColor: color
    };

    return (
      <span key={ target }
            className={ labelClass }
            style={ style }
            onMouseOver={ this.handleOver }
            onMouseEnter={ hoveringStart.bind(this, target) }
            onMouseLeave={ hoveringEnd }
            onClick={ selectTarget.bind(this, target) }>{ target }</span>
    );
  }

}
