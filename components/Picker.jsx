import React from 'react';
import Label from './Label';

export default class Picker extends React.Component {

  render() {

    const { targets, colors, hovering, pivot, selected, hoveringStart, hoveringEnd, selectTarget } = this.props;

    if (!targets) {
      return <h1>"Empty Picker"</h1>;
    }

    const labels = targets.map(target => {
      return <Label hoveringStart={ hoveringStart }
                    hoveringEnd={ hoveringEnd }
                    selectTarget={ selectTarget }
                    target={ target }
                    pivot={ pivot }
                    colors={ colors }
                    selected={ selected }
                    hovering={ hovering } />
    });

    const key = Array.from(selected)
      .map(sel =>
        <li key={ sel }
            className="list-unstyled">
          <span style={ {color: colors.get(pivot)} }>{ pivot }</span>
          <span> &rarr; </span>
          <span style={ {color: colors.get(sel)} }>{ sel }</span>
        </li>
      )

    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <span>Target</span>
          <button type="button"
                  className="btn btn-default btn-xs pull-right"
                  onClick={ selectTarget.bind(this, undefined) } >Clear</button>
        </div>
        <div>
          { labels }
        </div>
        <p>
          <ul>
            { key }
          </ul>
        </p>
      </div>
    );
  }

}
