import React from 'react';
import Picker from './Picker';
import Plot from './Plot';

export default class Scatter extends React.Component {

  constructor() {
    super();

    this.state = {
      hovering: undefined,
      pivot: undefined,
      selected: new Set([])
    };

    this.hoveringStart = this.hoveringStart.bind(this);
    this.hoveringEnd = this.hoveringEnd.bind(this);
    this.selectTarget = this.selectTarget.bind(this);
  }


  hoveringStart(target) {
    this.setState({
      hovering: target
    });
  }

  hoveringEnd() {
    this.setState({
      hovering: undefined
    });
  }

  selectTarget(target) {
    // If there is no pivot, make this the pivot
    if (!this.state.pivot) {
      this.setState({
        pivot: target
      });

    // If the pivot is already selected and this was it, unset the pivot
    // and all plots
    } else if (this.state.pivot && this.state.pivot === target) {
      this.setState({
        pivot: undefined,
        selected: new Set()
      });

    // Otherwise there is a current pivot and this was not it. If this target
    // is already selected, remove it, otherwise add it
    } else {
      const selected = new Set(this.state.selected);
      if (selected.has(target)) {
        selected.delete(target);
      } else {
        selected.add(target);
      }

      this.setState({
        selected: selected
      });

    }
  }

  render() {

    let { data, colors } = this.props;
    let { hovering, pivot, selected } = this.state;

    // Probably this data would be separate from the data file and then referenced by index in that
    // so there would be no need to compute this list here
    let targets = data ?
      Array.from(
        new Set(
          data
            .map(datapoint => datapoint.target)
            .sort()
        )
      ) :
      undefined;

    return (
      <div>
        <h1>Scatter Component</h1>

          <div className="row">
            <div className="col-md-4">
              <Picker targets={ targets }
                      color={ colors }
                      hovering={ hovering }
                      pivot={ pivot }
                      selected={ selected }
                      hoveringStart={ this.hoveringStart }
                      hoveringEnd={ this.hoveringEnd }
                      selectTarget={ this.selectTarget } />
            </div>
            <div className="col-md-8">
              <Plot data={ data }
                    colors={ colors }
                    hovering={ hovering }
                    pivot={ pivot }
                    selected={ Array.from(selected) } />
            </div>
          </div>


      </div>
    );
  }
}
