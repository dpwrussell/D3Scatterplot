import React from 'react';
import d3 from 'd3';
import Faux from 'react-faux-dom';

const CIRCLE = 'M0,5.5A5.5,5.5 0 1,1 0,-5.5A5.5,5.5 0 1,1 0,5.5Z';
const SQUARE = 'M-4.874248089990169,-4.874248089990169L4.874248089990169,-4.874248089990169 4.874248089990169,4.874248089990169 -4.874248089990169,4.874248089990169Z';
const TRIANGLE = 'M0,-5.118326725061547L5.910134625029481,5.118326725061547 -5.910134625029481,5.118326725061547Z';

export default class Plot extends React.Component {


  render() {

    const { data, colors, hovering, pivot, selected } = this.props;

    if (!data) {
      return (
        <p>No data</p>
      )
    }

    // Create new virtual dom which d3 can manipulate
    const faux = new Faux.Element('div');

    const margin = {top: 0, right: 0, bottom: 30, left: 30};
    const width = 300 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create the canvas
    const svg = d3.select(faux).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const plot_g = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Draw a rectangle to represent the edges/axis of the plot
    plot_g.append('rect')
      .attr('class', 'frame')
      .attr('width', width)
      .attr('height', height);

    const domain = [-5, 1];
    const x_scaler = d3.scale.linear()
      .range([0, width])
      .domain(domain);
    const y_scaler = d3.scale.linear()
      .range([height, 0])
      .domain(domain);

    const xaxis_g = plot_g.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')');

    const size = Math.min(width, height);
    const yaxis_g = plot_g.append('g')
      .attr('class', 'y axis');

    const xaxis = d3.svg.axis()
      .scale(x_scaler)
      .orient('bottom')
      .ticks(4);

    const yaxis = d3.svg.axis()
      .scale(y_scaler)
      .orient('left')
      .ticks(4);

    xaxis_g.call(xaxis);
    yaxis_g.call(yaxis);

    plot_g.append('path')
            .attr('class', 'diagonal')
            .attr('d', 'M0,' + size + 'L' + size + ',0');

    const points_g = plot_g.append('g')
     .attr('class', 'points');

    //  TODO Refactor drawing of points

    //  If a target is hovered, render that
    if (hovering && !pivot) {

      const points = data.filter(d => d.target === hovering).filter(d => d.basal_level !== 'NaN');
      const color = 'grey';
      points.forEach(d => {

          const x = x_scaler(d.basal_level);
          const y = y_scaler(d.basal_level);

          const shape = points_g.append('g')
            .attr('class', 'scatterplot-marker')
            .attr('transform', 'translate(' + x + ',' + y + ')')
            .append('path')
            .attr('class', 'marker')
            .attr({fill: color, stroke: color});

          if (d.type === 'TNBC') {
            shape.attr('d', CIRCLE);
          } else if (d.type === 'HER2amp') {
            shape.attr('d', TRIANGLE);
          } else if (d.type === 'HR+') {
            shape.attr('d', SQUARE);
          }
      });
    }

    // If there is a pivot and a target is hovered, render those
    // TODO Unless it is the pivot or already selected. Perhaps emphasise in that case
    if (pivot && hovering && selected.indexOf(hovering) === -1) {
      const pivotPoints = data
        .filter(d => d.target === pivot)
        .sort( (d1, d2) => {
          if (d1.cell_line < d2.cell_line) return -1;
          else if (d1.cell_line > d2.cell_line) return 1;
          else return 0;
        });

      const selectedPoints = data
        .filter(d => d.target === hovering)
        .sort( (d1, d2) => {
          if (d1.cell_line < d2.cell_line) return -1;
          else if (d1.cell_line > d2.cell_line) return 1;
          else return 0;
        });
      const color = colors.get(hovering);

      for (let i=0; i<pivotPoints.length; i++) {
        const pivotPoint = pivotPoints[i];
        const selectedPoint = selectedPoints[i];

        if (pivotPoint.basal_level !== 'NaN' && selectedPoint.basal_level !== 'NaN') {
          const x = x_scaler(pivotPoint.basal_level);
          const y = y_scaler(selectedPoint.basal_level);

          const shape = points_g.append('g')
            .attr('class', 'scatterplot-marker')
            .attr('transform', 'translate(' + x + ',' + y + ')')
            .append('path')
            .attr('class', 'marker')
            .attr({fill: color, stroke: color});

          if (pivotPoint.type === 'TNBC') {
            shape.attr('d', CIRCLE);
          } else if (pivotPoint.type === 'HER2amp') {
            shape.attr('d', TRIANGLE);
          } else if (pivotPoint.type === 'HR+') {
            shape.attr('d', SQUARE);
          }
        }
      }


    }

    // If there are selections, render those
    if (pivot && selected.length > 0) {
      const pivotPoints = data
        .filter(d => d.target === pivot)
        .sort( (d1, d2) => {
          if (d1.cell_line < d2.cell_line) return -1;
          else if (d1.cell_line > d2.cell_line) return 1;
          else return 0;
        });

      selected.forEach(sel => {
        const selectedPoints = data
          .filter(d => d.target === sel)
          .sort( (d1, d2) => {
            if (d1.cell_line < d2.cell_line) return -1;
            else if (d1.cell_line > d2.cell_line) return 1;
            else return 0;
          });
        const color = colors.get(sel);

        for (let i=0; i<pivotPoints.length; i++) {
          const pivotPoint = pivotPoints[i];
          const selectedPoint = selectedPoints[i];

          if (pivotPoint.basal_level !== 'NaN' && selectedPoint.basal_level !== 'NaN') {
            const x = x_scaler(pivotPoint.basal_level);
            const y = y_scaler(selectedPoint.basal_level);

            const shape = points_g.append('g')
              .attr('class', 'scatterplot-marker')
              .attr('transform', 'translate(' + x + ',' + y + ')')
              .append('path')
              .attr('class', 'marker')
              .attr({fill: color, stroke: color});

            if (pivotPoint.type === 'TNBC') {
              shape.attr('d', CIRCLE);
            } else if (pivotPoint.type === 'HER2amp') {
              shape.attr('d', TRIANGLE);
            } else if (pivotPoint.type === 'HR+') {
              shape.attr('d', SQUARE);
            }
          }
        }

      })

    }


    return faux.toReact();
  }
}
