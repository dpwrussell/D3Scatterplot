import React from 'react';
import Scatter from './Scatter';
import d3 from 'd3';
// import '../../client/assets/app.css';

export default class ScatterManager extends React.Component {

  constructor() {
    super();
    this.state = {
      data: undefined
    }
  }

  componentDidMount() {
    d3.tsv('data/scatterplot_data.tsv', (error, data) => {

      // Add static colors for each of the targets

      const mult = 360;
      const start = 2/3;
      const step = Math.sqrt(5) - 2;

      let index = 0;
      function nextColor() {
        const color = d3.hsl(mult * ((start + index * step) % 1), 0.6, 0.6).toString();
        index += 1;
        return color;
      };

      let colors = new Map(Array.from(new Set(data.map(d => [d.target, nextColor()]))));

      this.setState({
        data:data,
        colors:colors
      });
    });
  }

  render() {
    return (
      <div className="container">
        <div className="header clearfix">
          <h3 className="text-muted">Scatter Manager for Testing</h3>
        </div>

        <div>
          <Scatter data={ this.state.data } targets={ this.state.colors } colors={ this.state.colors } />
        </div>

        <footer className="footer">
          <p>© 2016 Douglas P.W. Russell</p>
        </footer>

      </div>
    );
  }
}
