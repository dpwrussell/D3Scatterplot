import React from 'react';

export default class Picker extends React.Component {

  // render() {
  //
  //   let { targets, hovering, hoveringStart, hoveringEnd } = this.props;
  //
  //   if (!targets) {
  //     return <h1>"Empty Picker"</h1>;
  //   }
  //
  //   let tds = targets.map(target => {
  //     if (target === hovering) {
  //       return (
  //         <td key={ target } >
  //           <span className="label label-primary"
  //                 onMouseEnter={ hoveringStart.bind(this, target) }
  //                 onMouseLeave={ hoveringEnd }>{ target }</span>
  //         </td>
  //       );
  //     }
  //     return (
  //       <td key={ target } >
  //         <span className="label label-default"
  //               onMouseOver={ this.handleOver }
  //               onMouseEnter={ hoveringStart.bind(this, target) }
  //               onMouseLeave={ hoveringEnd }>{ target }</span>
  //       </td>
  //     );
  //   });
  //
  //   const chunk = 3;
  //   let trs = [];
  //   for (let i=0, len=tds.length; i<len; i+=chunk) {
  //       trs.push(<tr key={ i }>{ tds.slice(i,i+chunk) }</tr>);
  //   }
  //
  //   return (
  //     <div className="panel panel-default">
  //       <div className="panel-heading">Target</div>
  //       <table className="table">
  //         <tbody>
  //           { trs }
  //         </tbody>
  //       </table>
  //     </div>
  //   );
  // }

  render() {

    const { targets, hovering, pivot, selected, hoveringStart, hoveringEnd, selectTarget } = this.props;

    if (!targets) {
      return <h1>"Empty Picker"</h1>;
    }

    const labels = targets.map(target => {

      let labelClass = 'label';
      if (target === pivot) {
        labelClass += ' label-primary';
      } else if (selected.has(target)) {
        labelClass += ' label-info';
      } else if (target === hovering) {
        labelClass += ' label-success';
      } else {
        labelClass += ' label-default';
      }

      return (
        <span key={ target }
              className={ labelClass }
              style={ {display: 'inline-block', marginLeft: '5px'} }
              onMouseOver={ this.handleOver }
              onMouseEnter={ hoveringStart.bind(this, target) }
              onMouseLeave={ hoveringEnd }
              onClick={ selectTarget.bind(this, target) }>{ target }</span>
      );
    });

    return (
      <div className="panel panel-default">
        <div className="panel-heading">Target</div>
        <div>
          { labels }
        </div>
      </div>
    );
  }

}
